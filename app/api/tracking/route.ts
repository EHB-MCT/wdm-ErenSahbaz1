import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { TrackingEvent, UserProfile } from "@/lib/models/tracking";

// Validate and clean the tracking data
function cleanTrackingData(data: Record<string, unknown>) {
	const cleaned: Record<string, unknown> = {};

	// Only allow specific fields to prevent injection
	const allowedFields = [
		"elementId",
		"elementClass",
		"elementText",
		"x",
		"y",
		"scrollY",
		"scrollPercent",
		"positions",
		"duration",
		"key",
		"value",
		"action",
	];

	for (const field of allowedFields) {
		if (data[field] !== undefined) {
			// Sanitize strings
			if (typeof data[field] === "string") {
				cleaned[field] = data[field].toString().slice(0, 500); // Limit length
			} else {
				cleaned[field] = data[field];
			}
		}
	}

	return cleaned;
}

// Get client IP
function getClientIP(request: NextRequest): string {
	const forwarded = request.headers.get("x-forwarded-for");
	const realIP = request.headers.get("x-real-ip");
	return forwarded?.split(",")[0] || realIP || "unknown";
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Validate required fields
		if (!body.userId || !body.sessionId || !body.eventType) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		await connectDB();

		// Clean and validate the data
		const trackingEvent = new TrackingEvent({
			userId: String(body.userId).slice(0, 100),
			sessionId: String(body.sessionId).slice(0, 100),
			eventType: String(body.eventType).slice(0, 50),
			timestamp: new Date(),
			page: String(body.page || "/").slice(0, 500),
			referrer: body.referrer ? String(body.referrer).slice(0, 500) : undefined,
			data: cleanTrackingData(body.data || {}),
			device: {
				userAgent: String(body.device?.userAgent || "").slice(0, 500),
				language: String(body.device?.language || "").slice(0, 20),
				platform: String(body.device?.platform || "").slice(0, 50),
				screenWidth: Number(body.device?.screenWidth) || 0,
				screenHeight: Number(body.device?.screenHeight) || 0,
				windowWidth: Number(body.device?.windowWidth) || 0,
				windowHeight: Number(body.device?.windowHeight) || 0,
				colorDepth: Number(body.device?.colorDepth) || 0,
				pixelRatio: Number(body.device?.pixelRatio) || 1,
				touchSupport: Boolean(body.device?.touchSupport),
				cookiesEnabled: Boolean(body.device?.cookiesEnabled),
				timezone: String(body.device?.timezone || "").slice(0, 50),
				connection: String(body.device?.connection || "").slice(0, 20),
			},
			location: {
				ip: getClientIP(request),
			},
		});

		await trackingEvent.save();

		// Update user profile asynchronously (don't wait for it)
		updateUserProfile(body.userId, body.eventType).catch(console.error);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Tracking error:", error);
		return NextResponse.json(
			{ error: "Failed to track event" },
			{ status: 500 }
		);
	}
}

// Update user profile based on new events
async function updateUserProfile(userId: string, eventType: string) {
	try {
		const updates: Record<string, unknown> = {
			lastSeen: new Date(),
		};

		const increments: Record<string, number> = {};

		if (eventType === "pageview") {
			increments.totalPageViews = 1;
		} else if (eventType === "click") {
			increments.totalClicks = 1;
		} else if (eventType === "session_start") {
			increments.totalSessions = 1;
		}

		await UserProfile.findOneAndUpdate(
			{ userId },
			{
				$set: updates,
				$inc: increments,
				$setOnInsert: { firstSeen: new Date() },
			},
			{ upsert: true, new: true }
		);
	} catch (error) {
		console.error("Profile update error:", error);
	}
}

// GET endpoint to retrieve tracking data (for admin)
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const userId = searchParams.get("userId");
		const eventType = searchParams.get("eventType");
		const limit = parseInt(searchParams.get("limit") || "100");
		const page = parseInt(searchParams.get("page") || "1");

		await connectDB();

		const query: Record<string, unknown> = {};
		if (userId) query.userId = userId;
		if (eventType) query.eventType = eventType;

		const events = await TrackingEvent.find(query)
			.sort({ timestamp: -1 })
			.skip((page - 1) * limit)
			.limit(limit)
			.lean();

		const total = await TrackingEvent.countDocuments(query);

		return NextResponse.json({
			events,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Tracking fetch error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch tracking data" },
			{ status: 500 }
		);
	}
}
