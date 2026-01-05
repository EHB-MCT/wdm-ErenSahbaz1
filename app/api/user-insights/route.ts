import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectDB } from "@/lib/mongodb";
import { Location, Violation, Trip } from "@/lib/models";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		await connectDB();
		const userId = session.user.id;

		// Fetch user's data
		const [locations, violations, trips] = await Promise.all([
			Location.find({ userId }).sort({ timestamp: -1 }).limit(1000).lean(),
			Violation.find({ userId }).lean(),
			Trip.find({ userId }).lean(),
		]);

		// Calculate insights
		let drivingStyle: "aggressive" | "moderate" | "careful" | "unknown" =
			"unknown";
		let riskScore = 0;
		let averageSpeed = 0;
		let mostActiveHour = 8;

		if (locations.length > 0) {
			// Calculate average speed
			const speeds = locations
				.map((l: (typeof locations)[0]) => l.speed || 0)
				.filter((s) => s > 0);
			averageSpeed =
				speeds.length > 0
					? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length)
					: 0;

			// Calculate most active hour
			const hourCounts: Record<number, number> = {};
			locations.forEach((loc: (typeof locations)[0]) => {
				const hour = new Date(loc.timestamp).getHours();
				hourCounts[hour] = (hourCounts[hour] || 0) + 1;
			});
			mostActiveHour = parseInt(
				Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "8"
			);

			// Calculate risk score based on violations and speed patterns
			const violationRate =
				trips.length > 0 ? violations.length / trips.length : 0;
			const highSpeedCount = speeds.filter((s) => s > 100).length;
			const highSpeedRate =
				speeds.length > 0 ? highSpeedCount / speeds.length : 0;

			riskScore = Math.min(
				100,
				Math.round(
					violationRate * 30 + // 30% weight for violation rate
						highSpeedRate * 100 * 40 + // 40% weight for high speed rate
						(averageSpeed > 80 ? 30 : averageSpeed > 60 ? 15 : 0) // 30% weight for avg speed
				)
			);

			// Determine driving style
			if (riskScore > 50 || averageSpeed > 80 || violationRate > 0.5) {
				drivingStyle = "aggressive";
			} else if (riskScore > 25 || averageSpeed > 60 || violationRate > 0.2) {
				drivingStyle = "moderate";
			} else if (trips.length >= 3) {
				drivingStyle = "careful";
			}
		}

		return NextResponse.json({
			insights: {
				drivingStyle,
				riskScore,
				averageSpeed,
				violationsCount: violations.length,
				totalTrips: trips.length,
				mostActiveHour,
			},
		});
	} catch (error) {
		console.error("User insights error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch insights" },
			{ status: 500 }
		);
	}
}
