import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Location, Trip, Violation } from "@/lib/models";

interface LocationCluster {
	latitude: number;
	longitude: number;
	count: number;
	avgTimeOfDay: number; // 0-23 hours
	timeRange: { earliest: number; latest: number };
	visits: Array<{ date: Date; duration: number }>;
}

interface UserProfile {
	userId: string;

	// Inferred locations
	likelyHome: {
		latitude: number;
		longitude: number;
		confidence: number;
		reasoning: string;
	} | null;

	likelyWork: {
		latitude: number;
		longitude: number;
		confidence: number;
		reasoning: string;
	} | null;

	frequentPlaces: Array<{
		latitude: number;
		longitude: number;
		visitCount: number;
		avgTimeOfDay: string;
		category: string; // "morning_stop", "evening_stop", "weekend_spot", etc.
	}>;

	// Driving behavior
	drivingBehavior: {
		style: "aggressive" | "moderate" | "careful";
		avgSpeed: number;
		maxSpeed: number;
		violationRate: number; // violations per trip
		totalViolations: number;
		riskScore: number; // 0-100
	};

	// Schedule patterns
	schedule: {
		typicalDepartureTime: string;
		typicalArrivalTime: string;
		mostActiveDay: string;
		mostActiveHour: number;
		weekdayVsWeekend: { weekday: number; weekend: number };
	};

	// Stats
	stats: {
		totalTrips: number;
		totalDistance: number;
		totalDrivingTime: number;
		firstSeen: Date;
		lastSeen: Date;
		daysActive: number;
	};
}

// Calculate distance between two points (Haversine formula)
function getDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number {
	const R = 6371; // Earth's radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

// Cluster nearby locations
function clusterLocations(
	locations: Array<{
		latitude: number;
		longitude: number;
		timestamp: Date;
		speed?: number;
	}>
): LocationCluster[] {
	const clusters: LocationCluster[] = [];
	const CLUSTER_RADIUS = 0.2; // 200 meters

	// Filter to stationary points (speed < 5 km/h or no speed data)
	const stationaryPoints = locations.filter(
		(loc) => !loc.speed || loc.speed < 5
	);

	for (const point of stationaryPoints) {
		let foundCluster = false;

		for (const cluster of clusters) {
			const distance = getDistance(
				point.latitude,
				point.longitude,
				cluster.latitude,
				cluster.longitude
			);
			if (distance < CLUSTER_RADIUS) {
				// Add to existing cluster
				cluster.count++;
				const hour = new Date(point.timestamp).getHours();
				cluster.avgTimeOfDay =
					(cluster.avgTimeOfDay * (cluster.count - 1) + hour) / cluster.count;
				cluster.timeRange.earliest = Math.min(cluster.timeRange.earliest, hour);
				cluster.timeRange.latest = Math.max(cluster.timeRange.latest, hour);
				// Update cluster center
				cluster.latitude =
					(cluster.latitude * (cluster.count - 1) + point.latitude) /
					cluster.count;
				cluster.longitude =
					(cluster.longitude * (cluster.count - 1) + point.longitude) /
					cluster.count;
				foundCluster = true;
				break;
			}
		}

		if (!foundCluster) {
			const hour = new Date(point.timestamp).getHours();
			clusters.push({
				latitude: point.latitude,
				longitude: point.longitude,
				count: 1,
				avgTimeOfDay: hour,
				timeRange: { earliest: hour, latest: hour },
				visits: [],
			});
		}
	}

	return clusters.filter((c) => c.count >= 2); // At least 2 visits
}

// Analyze time patterns
function getTimeCategory(hour: number): string {
	if (hour >= 5 && hour < 9) return "morning_commute";
	if (hour >= 9 && hour < 12) return "morning_activity";
	if (hour >= 12 && hour < 14) return "lunch";
	if (hour >= 14 && hour < 17) return "afternoon_activity";
	if (hour >= 17 && hour < 20) return "evening_commute";
	if (hour >= 20 && hour < 23) return "evening_activity";
	return "night";
}

function getDayName(dayIndex: number): string {
	const days = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	return days[dayIndex];
}

function formatHour(hour: number): string {
	const ampm = hour >= 12 ? "PM" : "AM";
	const h = hour % 12 || 12;
	return `${h}:00 ${ampm}`;
}

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const userId = searchParams.get("userId");

		if (!userId) {
			return NextResponse.json({ error: "userId required" }, { status: 400 });
		}

		await connectDB();

		// Fetch all user data
		const [locations, trips, violations] = await Promise.all([
			Location.find({ userId }).sort({ timestamp: 1 }).lean(),
			Trip.find({ userId }).sort({ startTime: -1 }).lean(),
			Violation.find({ userId }).sort({ timestamp: -1 }).lean(),
		]);

		if (locations.length === 0) {
			return NextResponse.json({
				error: "No location data found for user",
				profile: null,
			});
		}

		// === ANALYZE LOCATIONS ===
		const clusters = clusterLocations(
			locations.map((loc) => ({
				latitude: loc.latitude,
				longitude: loc.longitude,
				timestamp: loc.timestamp,
				speed: loc.speed,
			}))
		);

		// Sort clusters by visit count
		clusters.sort((a, b) => b.count - a.count);

		// === INFER HOME LOCATION ===
		// Home = most visited location during night hours (10 PM - 7 AM)
		const nightClusters = clusters.filter(
			(c) => c.avgTimeOfDay >= 22 || c.avgTimeOfDay <= 7
		);

		let likelyHome = null;
		if (nightClusters.length > 0) {
			const home = nightClusters[0];
			likelyHome = {
				latitude: home.latitude,
				longitude: home.longitude,
				confidence: Math.min(95, 50 + home.count * 5),
				reasoning: `Location visited ${
					home.count
				} times, primarily between ${formatHour(
					home.timeRange.earliest
				)} and ${formatHour(home.timeRange.latest)}`,
			};
		}

		// === INFER WORK LOCATION ===
		// Work = most visited location during work hours (8 AM - 6 PM) on weekdays
		const workClusters = clusters.filter(
			(c) => c.avgTimeOfDay >= 8 && c.avgTimeOfDay <= 18
		);

		// Exclude home from work candidates
		const workCandidates = workClusters.filter((c) => {
			if (!likelyHome) return true;
			return (
				getDistance(
					c.latitude,
					c.longitude,
					likelyHome.latitude,
					likelyHome.longitude
				) > 0.5
			);
		});

		let likelyWork = null;
		if (workCandidates.length > 0) {
			const work = workCandidates[0];
			likelyWork = {
				latitude: work.latitude,
				longitude: work.longitude,
				confidence: Math.min(90, 40 + work.count * 5),
				reasoning: `Location visited ${
					work.count
				} times during work hours (avg ${formatHour(
					Math.round(work.avgTimeOfDay)
				)})`,
			};
		}

		// === FREQUENT PLACES ===
		const frequentPlaces = clusters.slice(0, 10).map((c) => ({
			latitude: c.latitude,
			longitude: c.longitude,
			visitCount: c.count,
			avgTimeOfDay: formatHour(Math.round(c.avgTimeOfDay)),
			category: getTimeCategory(c.avgTimeOfDay),
		}));

		// === DRIVING BEHAVIOR ===
		const speeds = locations
			.filter((l) => l.speed && l.speed > 0)
			.map((l) => l.speed as number);
		const avgSpeed =
			speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
		const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

		const violationRate =
			trips.length > 0 ? violations.length / trips.length : 0;

		// Risk score calculation
		let riskScore = 0;
		if (avgSpeed > 50) riskScore += 20;
		if (avgSpeed > 80) riskScore += 20;
		if (maxSpeed > 100) riskScore += 20;
		if (maxSpeed > 150) riskScore += 20;
		if (violationRate > 0.5) riskScore += 10;
		if (violationRate > 1) riskScore += 10;
		riskScore = Math.min(100, riskScore);

		let drivingStyle: "aggressive" | "moderate" | "careful" = "moderate";
		if (riskScore >= 60) drivingStyle = "aggressive";
		else if (riskScore <= 20) drivingStyle = "careful";

		const drivingBehavior = {
			style: drivingStyle,
			avgSpeed: Math.round(avgSpeed * 10) / 10,
			maxSpeed: Math.round(maxSpeed * 10) / 10,
			violationRate: Math.round(violationRate * 100) / 100,
			totalViolations: violations.length,
			riskScore,
		};

		// === SCHEDULE PATTERNS ===
		const tripHours = trips.map((t) => new Date(t.startTime).getHours());
		const tripDays = trips.map((t) => new Date(t.startTime).getDay());

		// Count occurrences
		const hourCounts: Record<number, number> = {};
		const dayCounts: Record<number, number> = {};

		tripHours.forEach((h) => (hourCounts[h] = (hourCounts[h] || 0) + 1));
		tripDays.forEach((d) => (dayCounts[d] = (dayCounts[d] || 0) + 1));

		const mostActiveHour = Object.entries(hourCounts).sort(
			(a, b) => b[1] - a[1]
		)[0];
		const mostActiveDay = Object.entries(dayCounts).sort(
			(a, b) => b[1] - a[1]
		)[0];

		// Weekday vs weekend
		const weekdayTrips = tripDays.filter((d) => d >= 1 && d <= 5).length;
		const weekendTrips = tripDays.filter((d) => d === 0 || d === 6).length;

		// Typical departure (morning trips)
		const morningTrips = trips.filter((t) => {
			const hour = new Date(t.startTime).getHours();
			return hour >= 5 && hour <= 10;
		});
		const avgDepartureHour =
			morningTrips.length > 0
				? morningTrips.reduce(
						(sum, t) => sum + new Date(t.startTime).getHours(),
						0
				  ) / morningTrips.length
				: 8;

		// Typical arrival (evening trips)
		const eveningTrips = trips.filter((t) => {
			const hour = new Date(t.startTime).getHours();
			return hour >= 16 && hour <= 20;
		});
		const avgArrivalHour =
			eveningTrips.length > 0
				? eveningTrips.reduce(
						(sum, t) => sum + new Date(t.startTime).getHours(),
						0
				  ) / eveningTrips.length
				: 18;

		const schedule = {
			typicalDepartureTime: formatHour(Math.round(avgDepartureHour)),
			typicalArrivalTime: formatHour(Math.round(avgArrivalHour)),
			mostActiveDay: mostActiveDay
				? getDayName(parseInt(mostActiveDay[0]))
				: "Unknown",
			mostActiveHour: mostActiveHour ? parseInt(mostActiveHour[0]) : 0,
			weekdayVsWeekend: { weekday: weekdayTrips, weekend: weekendTrips },
		};

		// === STATS ===
		const timestamps = locations.map((l) => new Date(l.timestamp).getTime());
		const uniqueDays = new Set(
			locations.map((l) => new Date(l.timestamp).toDateString())
		).size;

		const totalDistance = trips.reduce(
			(sum, t) => sum + (t.totalDistance || 0),
			0
		);
		const totalDrivingTime = trips.reduce((sum, t) => {
			if (t.startTime && t.endTime) {
				return (
					sum +
					(new Date(t.endTime).getTime() - new Date(t.startTime).getTime()) /
						1000 /
						60
				);
			}
			return sum;
		}, 0);

		const stats = {
			totalTrips: trips.length,
			totalDistance: Math.round(totalDistance * 10) / 10,
			totalDrivingTime: Math.round(totalDrivingTime),
			firstSeen: new Date(Math.min(...timestamps)),
			lastSeen: new Date(Math.max(...timestamps)),
			daysActive: uniqueDays,
		};

		// === BUILD PROFILE ===
		const profile: UserProfile = {
			userId,
			likelyHome,
			likelyWork,
			frequentPlaces,
			drivingBehavior,
			schedule,
			stats,
		};

		return NextResponse.json({ profile });
	} catch (error) {
		console.error("Profile analysis error:", error);
		return NextResponse.json(
			{ error: "Failed to analyze profile" },
			{ status: 500 }
		);
	}
}
