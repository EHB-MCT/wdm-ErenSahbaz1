import { connectDB } from "./mongodb";
import { Trip, Location } from "./models";
import { calculateDistance } from "./utils";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MIN_DISTANCE_KM = 0.05; // 50 meters minimum movement
const MIN_SPEED_KMH = 3; // Minimum speed to be considered moving

interface LocationData {
	latitude: number;
	longitude: number;
	timestamp: Date;
	speed?: number;
}

/**
 * Detect and manage trips automatically
 * Returns the tripId if a trip is active
 */
export async function detectAndManageTrip(
	userId: string,
	location: LocationData
): Promise<string | null> {
	await connectDB();

	// Find active trip for user
	const activeTrip = await Trip.findOne({ userId, isActive: true });

	if (activeTrip) {
		// Check if we should end the trip (idle for too long)
		const lastLocation = await Location.findOne({
			userId,
			tripId: activeTrip._id.toString(),
		}).sort({ timestamp: -1 });

		if (lastLocation) {
			const timeSinceLastLocation =
				location.timestamp.getTime() -
				new Date(lastLocation.timestamp).getTime();

			// End trip if idle for too long
			if (timeSinceLastLocation > IDLE_TIMEOUT_MS) {
				await endTrip(activeTrip._id.toString(), userId);

				// Start a new trip if user is moving
				if (location.speed && location.speed > MIN_SPEED_KMH) {
					return await startNewTrip(userId, location);
				}
				return null;
			}
		}

		// Update trip stats
		await updateTripStats(activeTrip._id.toString(), location);
		return activeTrip._id.toString();
	} else {
		// No active trip - start one if user is moving
		if (location.speed && location.speed > MIN_SPEED_KMH) {
			return await startNewTrip(userId, location);
		}
	}

	return null;
}

/**
 * Start a new trip
 */
export async function startNewTrip(
	userId: string,
	location: LocationData
): Promise<string> {
	await connectDB();

	const trip = await Trip.create({
		userId,
		startTime: location.timestamp,
		startLocation: {
			latitude: location.latitude,
			longitude: location.longitude,
		},
		isActive: true,
	});

	return trip._id.toString();
}

/**
 * End an active trip
 */
export async function endTrip(tripId: string, userId: string): Promise<void> {
	await connectDB();

	// Get last location for this trip
	const lastLocation = await Location.findOne({ tripId }).sort({
		timestamp: -1,
	});

	// Calculate final stats
	const stats = await calculateTripStats(tripId);

	await Trip.findByIdAndUpdate(tripId, {
		isActive: false,
		endTime: lastLocation?.timestamp || new Date(),
		endLocation: lastLocation
			? { latitude: lastLocation.latitude, longitude: lastLocation.longitude }
			: undefined,
		...stats,
	});
}

/**
 * Update trip statistics with new location
 */
async function updateTripStats(
	tripId: string,
	location: LocationData
): Promise<void> {
	const trip = await Trip.findById(tripId);
	if (!trip) return;

	// Update max speed if current speed is higher
	if (location.speed && location.speed > trip.maxSpeed) {
		await Trip.findByIdAndUpdate(tripId, { maxSpeed: location.speed });
	}
}

/**
 * Calculate trip statistics
 */
async function calculateTripStats(tripId: string): Promise<{
	totalDistance: number;
	averageSpeed: number;
	maxSpeed: number;
}> {
	const locations = await Location.find({ tripId }).sort({ timestamp: 1 });

	if (locations.length < 2) {
		return { totalDistance: 0, averageSpeed: 0, maxSpeed: 0 };
	}

	let totalDistance = 0;
	let totalSpeed = 0;
	let maxSpeed = 0;
	let speedCount = 0;

	for (let i = 1; i < locations.length; i++) {
		const prev = locations[i - 1];
		const curr = locations[i];

		totalDistance += calculateDistance(
			prev.latitude,
			prev.longitude,
			curr.latitude,
			curr.longitude
		);

		if (curr.speed) {
			totalSpeed += curr.speed;
			speedCount++;
			maxSpeed = Math.max(maxSpeed, curr.speed);
		}
	}

	return {
		totalDistance,
		averageSpeed: speedCount > 0 ? totalSpeed / speedCount : 0,
		maxSpeed,
	};
}

/**
 * Increment violation count for a trip
 */
export async function incrementTripViolations(tripId: string): Promise<void> {
	await Trip.findByIdAndUpdate(tripId, { $inc: { violationsCount: 1 } });
}
