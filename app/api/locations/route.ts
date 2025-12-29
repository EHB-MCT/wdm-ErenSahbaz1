// API route to store location data
import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { LocationPoint } from "@/types/location";
import { detectAndManageTrip } from "@/lib/tripDetection";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const { userId, latitude, longitude, speed, accuracy, heading } = body;

		// Validate required fields
		if (!userId || latitude === undefined || longitude === undefined) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const timestamp = Date.now();

		// Detect or manage trip
		const tripId = await detectAndManageTrip(userId, {
			latitude,
			longitude,
			timestamp: new Date(timestamp),
			speed,
		});

		// Create location point
		const locationPoint: LocationPoint = {
			id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
			userId,
			latitude,
			longitude,
			timestamp,
			speed,
			accuracy,
			heading,
			tripId: tripId || undefined,
		};

		// Store the location
		await storage.addLocation(locationPoint);

		return NextResponse.json({
			success: true,
			location: locationPoint,
			tripId,
		});
	} catch (error) {
		console.error("Error storing location:", error);
		return NextResponse.json(
			{ error: "Failed to store location" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const userId = searchParams.get("userId");

		if (userId) {
			// Get locations for specific user
			const locations = await storage.getUserLocations(userId);
			return NextResponse.json({ locations });
		}

		// Get recent locations for all users (limit to prevent huge response)
		const recentLocations = await storage.getRecentLocations(100);
		return NextResponse.json({ locations: recentLocations });
	} catch (error) {
		console.error("Error fetching locations:", error);
		return NextResponse.json(
			{ error: "Failed to fetch locations" },
			{ status: 500 }
		);
	}
}
