// API route for analytics
import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import {
	calculateDistance,
	detectHomeLocation,
	detectWorkLocation,
} from "@/lib/utils";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const userId = searchParams.get("userId");

		if (!userId) {
			// Get analytics for all users
			const users = storage.getUniqueUsers();
			const analytics = users.map((uid) => getUserAnalytics(uid));
			return NextResponse.json({ analytics });
		}

		// Get analytics for specific user
		const userAnalytics = getUserAnalytics(userId);
		return NextResponse.json(userAnalytics);
	} catch (error) {
		console.error("Error generating analytics:", error);
		return NextResponse.json(
			{ error: "Failed to generate analytics" },
			{ status: 500 }
		);
	}
}

function getUserAnalytics(userId: string) {
	const locations = storage.getUserLocations(userId);
	const violations = storage.getUserViolations(userId);

	// Calculate total distance
	let totalDistance = 0;
	let totalSpeed = 0;
	let maxSpeed = 0;

	for (let i = 1; i < locations.length; i++) {
		const prev = locations[i - 1];
		const curr = locations[i];
		const distance = calculateDistance(
			prev.latitude,
			prev.longitude,
			curr.latitude,
			curr.longitude
		);
		totalDistance += distance;

		if (curr.speed) {
			totalSpeed += curr.speed;
			maxSpeed = Math.max(maxSpeed, curr.speed);
		}
	}

	const averageSpeed = locations.length > 0 ? totalSpeed / locations.length : 0;

	// Detect common locations
	const home = detectHomeLocation(locations);
	const work = detectWorkLocation(locations);

	const commonLocations = [];
	if (home) {
		commonLocations.push({
			type: "home" as const,
			latitude: home.lat,
			longitude: home.lng,
			visitCount: 0, // Could calculate this more precisely
		});
	}
	if (work) {
		commonLocations.push({
			type: "work" as const,
			latitude: work.lat,
			longitude: work.lng,
			visitCount: 0,
		});
	}

	return {
		userId,
		totalTrips: 1, // Could implement trip detection
		totalDistance: Math.round(totalDistance * 100) / 100,
		averageSpeed: Math.round(averageSpeed * 100) / 100,
		maxSpeed: Math.round(maxSpeed * 100) / 100,
		commonLocations,
		violationsCount: violations.length,
	};
}
