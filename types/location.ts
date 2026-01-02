// Type definitions for location tracking

export interface LocationPoint {
	id: string;
	userId: string;
	latitude: number;
	longitude: number;
	timestamp: number;
	speed?: number;
	accuracy?: number;
	heading?: number;
	tripId?: string;
}

export interface SpeedViolation {
	id: string;
	userId: string;
	latitude: number;
	longitude: number;
	timestamp: number;
	actualSpeed: number;
	speedLimit: number;
	excess: number;
}

export interface UserRoute {
	points: LocationPoint[];
	totalDistance: number;
	averageSpeed: number;
	violations: SpeedViolation[];
}
