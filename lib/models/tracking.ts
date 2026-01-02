import mongoose, { Schema, Document } from "mongoose";

// Track every user action
export interface ITrackingEvent extends Document {
	userId: string;
	sessionId: string;
	eventType: string; // click, mousemove, scroll, pageview, etc.
	timestamp: Date;

	// Page info
	page: string;
	referrer?: string;

	// Event specific data
	data: {
		// For clicks
		elementId?: string;
		elementClass?: string;
		elementText?: string;
		x?: number;
		y?: number;

		// For scroll
		scrollY?: number;
		scrollPercent?: number;

		// For mouse position (aggregated)
		positions?: Array<{ x: number; y: number; t: number }>;

		// For page views
		duration?: number;

		// Custom data
		[key: string]: unknown;
	};

	// Device & browser info
	device: {
		userAgent: string;
		language: string;
		platform: string;
		screenWidth: number;
		screenHeight: number;
		windowWidth: number;
		windowHeight: number;
		colorDepth?: number;
		pixelRatio?: number;
		touchSupport?: boolean;
		cookiesEnabled?: boolean;
		timezone?: string;
		connection?: string; // wifi, 4g, etc.
	};

	// Location (if available from IP or GPS)
	location?: {
		ip?: string;
		latitude?: number;
		longitude?: number;
		city?: string;
		country?: string;
	};
}

const TrackingEventSchema = new Schema<ITrackingEvent>(
	{
		userId: { type: String, required: true, index: true },
		sessionId: { type: String, required: true, index: true },
		eventType: { type: String, required: true, index: true },
		timestamp: { type: Date, default: Date.now, index: true },
		page: { type: String, required: true },
		referrer: { type: String },
		data: { type: Schema.Types.Mixed, default: {} },
		device: {
			userAgent: String,
			language: String,
			platform: String,
			screenWidth: Number,
			screenHeight: Number,
			windowWidth: Number,
			windowHeight: Number,
			colorDepth: Number,
			pixelRatio: Number,
			touchSupport: Boolean,
			cookiesEnabled: Boolean,
			timezone: String,
			connection: String,
		},
		location: {
			ip: String,
			latitude: Number,
			longitude: Number,
			city: String,
			country: String,
		},
	},
	{ timestamps: true }
);

// Compound indexes for efficient queries
TrackingEventSchema.index({ userId: 1, timestamp: -1 });
TrackingEventSchema.index({ userId: 1, eventType: 1 });
TrackingEventSchema.index({ sessionId: 1, timestamp: 1 });

export const TrackingEvent =
	mongoose.models.TrackingEvent ||
	mongoose.model<ITrackingEvent>("TrackingEvent", TrackingEventSchema);

// User profile built from tracking data
export interface IUserProfile extends Document {
	userId: string;

	// Aggregated stats
	totalSessions: number;
	totalPageViews: number;
	totalClicks: number;
	totalTimeSpent: number; // in seconds

	// Behavior patterns
	mostVisitedPages: Array<{ page: string; count: number }>;
	averageSessionDuration: number;
	preferredTimeOfDay: string; // morning, afternoon, evening, night

	// Device preferences
	primaryDevice: string; // mobile, tablet, desktop
	primaryBrowser: string;
	primaryOS: string;

	// Engagement score (0-100)
	engagementScore: number;

	// Risk score for speed violations
	riskScore: number;

	// Last activity
	lastSeen: Date;
	firstSeen: Date;

	// Tags for targeting
	tags: string[];
}

const UserProfileSchema = new Schema<IUserProfile>(
	{
		userId: { type: String, required: true, unique: true },
		totalSessions: { type: Number, default: 0 },
		totalPageViews: { type: Number, default: 0 },
		totalClicks: { type: Number, default: 0 },
		totalTimeSpent: { type: Number, default: 0 },
		mostVisitedPages: [{ page: String, count: Number }],
		averageSessionDuration: { type: Number, default: 0 },
		preferredTimeOfDay: { type: String, default: "unknown" },
		primaryDevice: { type: String, default: "unknown" },
		primaryBrowser: { type: String, default: "unknown" },
		primaryOS: { type: String, default: "unknown" },
		engagementScore: { type: Number, default: 0 },
		riskScore: { type: Number, default: 0 },
		lastSeen: { type: Date, default: Date.now },
		firstSeen: { type: Date, default: Date.now },
		tags: [{ type: String }],
	},
	{ timestamps: true }
);

export const UserProfile =
	mongoose.models.UserProfile ||
	mongoose.model<IUserProfile>("UserProfile", UserProfileSchema);
