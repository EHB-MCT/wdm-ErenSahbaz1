// Utility functions for location tracking

import { LocationPoint } from "@/types/location";

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number
): number {
	const R = 6371; // Earth's radius in km
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) *
			Math.cos(toRad(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function toRad(degrees: number): number {
	return degrees * (Math.PI / 180);
}

/**
 * Calculate speed between two location points
 * @param point1 - First location point
 * @param point2 - Second location point
 * @returns Speed in km/h
 */
export function calculateSpeed(
	point1: LocationPoint,
	point2: LocationPoint
): number {
	const distance = calculateDistance(
		point1.latitude,
		point1.longitude,
		point2.latitude,
		point2.longitude
	);
	const timeInHours = (point2.timestamp - point1.timestamp) / (1000 * 60 * 60);

	if (timeInHours === 0) return 0;
	return distance / timeInHours;
}

/**
 * Generate a simple user ID (in production, use proper authentication)
 */
export function getUserId(): string {
	// Check if user already has an ID in localStorage
	if (typeof window !== "undefined") {
		let userId = localStorage.getItem("userId");
		if (!userId) {
			userId = "user_" + Math.random().toString(36).substring(2, 15);
			localStorage.setItem("userId", userId);
		}
		return userId;
	}
	return "anonymous";
}

/**
 * Determine if location is likely home (most frequent location during night hours)
 * @param locations - Array of user locations
 * @returns Coordinates of likely home location
 */
export function detectHomeLocation(locations: LocationPoint[]): {
	lat: number;
	lng: number;
} | null {
	// Filter for locations between 11 PM and 6 AM
	const nightLocations = locations.filter((loc) => {
		const hour = new Date(loc.timestamp).getHours();
		return hour >= 23 || hour <= 6;
	});

	if (nightLocations.length === 0) return null;

	// Cluster locations within 100m radius
	// Simple clustering: find most common area
	const clusters = new Map<string, number>();

	nightLocations.forEach((loc) => {
		const key = `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`;
		clusters.set(key, (clusters.get(key) || 0) + 1);
	});

	// Find most frequent cluster
	let maxCount = 0;
	let homeKey = "";
	clusters.forEach((count, key) => {
		if (count > maxCount) {
			maxCount = count;
			homeKey = key;
		}
	});

	if (!homeKey) return null;

	const [lat, lng] = homeKey.split(",").map(Number);
	return { lat, lng };
}

/**
 * Detect work location (most frequent location during work hours)
 */
export function detectWorkLocation(locations: LocationPoint[]): {
	lat: number;
	lng: number;
} | null {
	// Filter for locations between 9 AM and 5 PM on weekdays
	const workLocations = locations.filter((loc) => {
		const date = new Date(loc.timestamp);
		const hour = date.getHours();
		const day = date.getDay();
		return hour >= 9 && hour <= 17 && day >= 1 && day <= 5;
	});

	if (workLocations.length === 0) return null;

	const clusters = new Map<string, number>();

	workLocations.forEach((loc) => {
		const key = `${loc.latitude.toFixed(3)},${loc.longitude.toFixed(3)}`;
		clusters.set(key, (clusters.get(key) || 0) + 1);
	});

	let maxCount = 0;
	let workKey = "";
	clusters.forEach((count, key) => {
		if (count > maxCount) {
			maxCount = count;
			workKey = key;
		}
	});

	if (!workKey) return null;

	const [lat, lng] = workKey.split(",").map(Number);
	return { lat, lng };
}
