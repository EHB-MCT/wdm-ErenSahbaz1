import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Trip, ITrip } from "@/lib/models";
import { Types } from "mongoose";

export async function GET(request: NextRequest) {
	try {
		await connectDB();

		const searchParams = request.nextUrl.searchParams;
		const userId = searchParams.get("userId");
		const activeOnly = searchParams.get("activeOnly") === "true";

		const query: Record<string, unknown> = {};

		if (userId) {
			query.userId = userId;
		}

		if (activeOnly) {
			query.isActive = true;
		}

		const trips = await Trip.find(query)
			.sort({ startTime: -1 })
			.lean<(ITrip & { _id: Types.ObjectId })[]>();

		const formattedTrips = trips.map((trip) => ({
			id: trip._id.toString(),
			userId: trip.userId,
			startTime: trip.startTime,
			endTime: trip.endTime,
			startLocation: trip.startLocation,
			endLocation: trip.endLocation,
			totalDistance: trip.totalDistance,
			averageSpeed: trip.averageSpeed,
			maxSpeed: trip.maxSpeed,
			violationsCount: trip.violationsCount,
			isActive: trip.isActive,
		}));

		return NextResponse.json({ trips: formattedTrips });
	} catch (error) {
		console.error("Error fetching trips:", error);
		return NextResponse.json(
			{ error: "Failed to fetch trips" },
			{ status: 500 }
		);
	}
}
