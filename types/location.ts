// Types for location tracking system

export interface LocationPoint {
	id: string;
	userId: string;
	latitude: number;
	longitude: number;
	timestamp: number;
	speed?: number; // km/h
	accuracy?: number; // meters
	heading?: number; // degrees
}

export interface SpeedViolation {
	id: string;
	userId: string;
	latitude: number;
	longitude: number;
	timestamp: number;
	actualSpeed: number; // km/h
	speedLimit: number; // km/h
	excess: number; // km/h over limit
}

export interface UserRoute {
	userId: string;
	startTime: number;
	endTime: number;
	locations: LocationPoint[];
	totalDistance: number; // km
	averageSpeed: number; // km/h
	maxSpeed: number; // km/h
	violations: SpeedViolation[];
}

export interface UserAnalytics {
	userId: string;
	totalTrips: number;
	totalDistance: number;
	averageSpeed: number;
	commonLocations: {
		type: "home" | "work" | "frequent";
		latitude: number;
		longitude: number;
		visitCount: number;
	}[];
	violationsCount: number;
}
