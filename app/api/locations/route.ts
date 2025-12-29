// API route to store location data
import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { LocationPoint } from "@/types/location";

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

		// Create location point
		const locationPoint: LocationPoint = {
			id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
			userId,
			latitude,
			longitude,
			timestamp: Date.now(),
			speed,
			accuracy,
			heading,
		};

		// Store the location
		storage.addLocation(locationPoint);

		return NextResponse.json({
			success: true,
			location: locationPoint,
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
			const locations = storage.getUserLocations(userId);
			return NextResponse.json({ locations });
		}

		// Get recent locations for all users (limit to prevent huge response)
		const recentLocations = storage.getRecentLocations(100);
		return NextResponse.json({ locations: recentLocations });
	} catch (error) {
		console.error("Error fetching locations:", error);
		return NextResponse.json(
			{ error: "Failed to fetch locations" },
			{ status: 500 }
		);
	}
}
