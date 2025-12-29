// API route to store speed violations
import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { SpeedViolation } from "@/types/location";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		const { userId, latitude, longitude, actualSpeed, speedLimit } = body;

		// Validate required fields
		if (
			!userId ||
			latitude === undefined ||
			longitude === undefined ||
			actualSpeed === undefined ||
			speedLimit === undefined
		) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Create violation
		const violation: SpeedViolation = {
			id: `viol_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
			userId,
			latitude,
			longitude,
			timestamp: Date.now(),
			actualSpeed,
			speedLimit,
			excess: actualSpeed - speedLimit,
		};

		// Store the violation
		storage.addViolation(violation);

		return NextResponse.json({
			success: true,
			violation,
		});
	} catch (error) {
		console.error("Error storing violation:", error);
		return NextResponse.json(
			{ error: "Failed to store violation" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const userId = searchParams.get("userId");

		if (userId) {
			// Get violations for specific user
			const violations = storage.getUserViolations(userId);
			return NextResponse.json({ violations });
		}

		// Get all violations (admin use)
		const allViolations = storage.getAllViolations();
		return NextResponse.json({ violations: allViolations });
	} catch (error) {
		console.error("Error fetching violations:", error);
		return NextResponse.json(
			{ error: "Failed to fetch violations" },
			{ status: 500 }
		);
	}
}
