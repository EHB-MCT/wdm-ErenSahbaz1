// Utility functions for location tracking

import { LocationPoint } from "@/types/location";

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number {
	const R = 6371; // Earth's radius in km
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) *
			Math.cos(toRad(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function toRad(degrees: number): number {
	return degrees * (Math.PI / 180);
}

/**
 * Calculate speed between two location points
 * @param point1 - First location point
 * @param point2 - Second location point
 * @returns Speed in km/h
 */
export function calculateSpeed(
	point1: LocationPoint,
	point2: LocationPoint
): number {
	const distance = calculateDistance(
		point1.latitude,
		point1.longitude,
		point2.latitude,
		point2.longitude
	);
	const timeInHours = (point2.timestamp - point1.timestamp) / (1000 * 60 * 60);

	if (timeInHours === 0) return 0;
	return distance / timeInHours;
}

/**
 * SPEED LIMIT ESTIMATION
 *
 * Since we cannot access real road speed limit data (Google Roads API requires
 * special access), we estimate speed limits based on driving patterns.
 *
 */

interface SpeedLimitEstimate {
	limit: number;
	roadType: string;
	confidence: number; // 0-100, how confident we are in this estimate
}

/**
 * Estimate speed limit based on current speed and recent driving patterns
 *
 * Algorithm:
 * 1. Look at current speed to guess road type
 * 2. Consider time of day (rush hour = likely urban)
 * 3. Consider recent speed history for context
 *
 * @param currentSpeed - Current speed in km/h
 * @param recentSpeeds - Array of recent speed readings for context
 * @param timeOfDay - Hour of day (0-23)
 * @returns Estimated speed limit and road type
 */
export function estimateSpeedLimit(
	currentSpeed: number,
	recentSpeeds: number[] = [],
	timeOfDay: number = new Date().getHours()
): SpeedLimitEstimate {
	// Calculate average recent speed for context
	const avgRecentSpeed =
		recentSpeeds.length > 0
			? recentSpeeds.reduce((a, b) => a + b, 0) / recentSpeeds.length
			: currentSpeed;

	// Use the higher of current or average for road type detection
	// This prevents stop-and-go traffic from lowering the limit unfairly
	const referenceSpeed = Math.max(currentSpeed, avgRecentSpeed);

	// Rush hour adjustment (7-9 AM, 5-7 PM)
	const isRushHour =
		(timeOfDay >= 7 && timeOfDay <= 9) || (timeOfDay >= 17 && timeOfDay <= 19);

	// Night time (might be highway even at lower speeds due to less traffic)
	const isNightTime = timeOfDay >= 22 || timeOfDay <= 5;

	// Determine road type and speed limit
	if (referenceSpeed > 100) {
		// Definitely highway
		return {
			limit: 120,
			roadType: "Highway (Autosnelweg)",
			confidence: 90,
		};
	} else if (referenceSpeed > 75) {
		// Regional road or slow highway
		return {
			limit: 90,
			roadType: "Regional Road (Gewestweg)",
			confidence: 70,
		};
	} else if (referenceSpeed > 55) {
		// Could be regional road or fast urban
		if (isRushHour) {
			// Rush hour = probably urban road with flowing traffic
			return {
				limit: 50,
				roadType: "Urban Road (rush hour)",
				confidence: 60,
			};
		}
		return {
			limit: 70,
			roadType: "Secondary Road",
			confidence: 65,
		};
	} else if (referenceSpeed > 35) {
		// Urban road
		return {
			limit: 50,
			roadType: "Urban Road (Bebouwde kom)",
			confidence: 75,
		};
	} else if (referenceSpeed > 20) {
		// Residential or school zone
		const isSchoolHours = timeOfDay >= 8 && timeOfDay <= 16;
		return {
			limit: isSchoolHours ? 30 : 50,
			roadType: isSchoolHours ? "School Zone" : "Residential Area",
			confidence: isSchoolHours ? 50 : 55,
		};
	} else {
		// Very slow - parking, traffic jam, or 30 zone
		return {
			limit: 30,
			roadType: "Residential/Zone 30",
			confidence: 40, // Low confidence - could be anywhere with slow traffic
		};
	}
}

/**
 * Check if a speed is a violation given the estimated limit
 * Includes a small tolerance (5 km/h) to account for GPS inaccuracy
 */
export function isSpeedViolation(
	currentSpeed: number,
	estimatedLimit: number,
	tolerance: number = 5
): boolean {
	return currentSpeed > estimatedLimit + tolerance;
}

/**
 * Calculate how severe a speed violation is
 * Used for risk scoring
 */
export function getViolationSeverity(
	actualSpeed: number,
	speedLimit: number
): "minor" | "moderate" | "severe" | "extreme" {
	const excess = actualSpeed - speedLimit;
	const percentOver = (excess / speedLimit) * 100;

	if (percentOver > 50) return "extreme"; // 50%+ over limit
	if (percentOver > 30) return "severe"; // 30-50% over
	if (percentOver > 15) return "moderate"; // 15-30% over
	return "minor"; // <15% over
}

/**
 * Determine if location is likely home (most frequent location during night hours)
 * @param locations - Array of user locations
 * @returns Coordinates of likely home location
 */
export function detectHomeLocation(locations: LocationPoint[]): {
	lat: number;
	lng: number;
} | null {
	// Filter for locations between 11 PM and 6 AM
	const nightLocations = locations.filter((loc) => {
		const hour = new Date(loc.timestamp).getHours();
		return hour >= 23 || hour <= 6;
	});

	if (nightLocations.length === 0) return null;

	// Cluster locations within 100m radius
	// Simple clustering: find most common area
	const clusters = new Map<string, number>();

	nightLocations.forEach((loc) => {
		const key = `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`;
		clusters.set(key, (clusters.get(key) || 0) + 1);
	});

	// Find most frequent cluster
	let maxCount = 0;
	let homeKey = "";
	clusters.forEach((count, key) => {
		if (count > maxCount) {
			maxCount = count;
			homeKey = key;
		}
	});

	if (!homeKey) return null;

	const [lat, lng] = homeKey.split(",").map(Number);
	return { lat, lng };
}

/**
 * Detect work location (most frequent location during work hours)
 */
export function detectWorkLocation(locations: LocationPoint[]): {
	lat: number;
	lng: number;
} | null {
	// Filter for locations between 9 AM and 5 PM on weekdays
	const workLocations = locations.filter((loc) => {
		const date = new Date(loc.timestamp);
		const hour = date.getHours();
		const day = date.getDay();
		return hour >= 9 && hour <= 17 && day >= 1 && day <= 5;
	});

	if (workLocations.length === 0) return null;

	const clusters = new Map<string, number>();

	workLocations.forEach((loc) => {
		const key = `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`;
		clusters.set(key, (clusters.get(key) || 0) + 1);
	});

	let maxCount = 0;
	let workKey = "";
	clusters.forEach((count, key) => {
		if (count > maxCount) {
			maxCount = count;
			workKey = key;
		}
	});

	if (!workKey) return null;

	const [lat, lng] = workKey.split(",").map(Number);
	return { lat, lng };
}
