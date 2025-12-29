// Database storage using Mongoose
import { connectDB } from "@/lib/mongodb";
import { Location, Violation, ILocation, IViolation } from "@/lib/models";
import { LocationPoint, SpeedViolation } from "@/types/location";
import { Types } from "mongoose";

class DataStorage {
	// Add a location point
	async addLocation(location: LocationPoint): Promise<void> {
		await connectDB();
		await Location.create({
			userId: location.userId,
			latitude: location.latitude,
			longitude: location.longitude,
			timestamp: new Date(location.timestamp),
			speed: location.speed,
			accuracy: location.accuracy,
			heading: location.heading,
		});
	}

	// Get all locations for a user
	async getUserLocations(userId: string): Promise<LocationPoint[]> {
		await connectDB();
		const locations = await Location.find({ userId })
			.sort({ timestamp: 1 })
			.lean<Array<ILocation & { _id: Types.ObjectId }>>();

		return locations.map((loc) => ({
			id: loc._id.toString(),
			userId: loc.userId,
			latitude: loc.latitude,
			longitude: loc.longitude,
			timestamp: loc.timestamp.getTime(),
			speed: loc.speed ?? undefined,
			accuracy: loc.accuracy ?? undefined,
			heading: loc.heading ?? undefined,
		}));
	}

	// Get all locations (admin use)
	async getAllLocations(): Promise<LocationPoint[]> {
		await connectDB();
		const locations = await Location.find()
			.sort({ timestamp: -1 })
			.limit(1000)
			.lean<Array<ILocation & { _id: Types.ObjectId }>>();

		return locations.map((loc) => ({
			id: loc._id.toString(),
			userId: loc.userId,
			latitude: loc.latitude,
			longitude: loc.longitude,
			timestamp: loc.timestamp.getTime(),
			speed: loc.speed ?? undefined,
			accuracy: loc.accuracy ?? undefined,
			heading: loc.heading ?? undefined,
		}));
	}

	// Add a speed violation
	async addViolation(violation: SpeedViolation): Promise<void> {
		await connectDB();
		await Violation.create({
			userId: violation.userId,
			latitude: violation.latitude,
			longitude: violation.longitude,
			timestamp: new Date(violation.timestamp),
			actualSpeed: violation.actualSpeed,
			speedLimit: violation.speedLimit,
			excess: violation.excess,
		});
	}

	// Get violations for a user
	async getUserViolations(userId: string): Promise<SpeedViolation[]> {
		await connectDB();
		const violations = await Violation.find({ userId })
			.sort({ timestamp: -1 })
			.lean<Array<IViolation & { _id: Types.ObjectId }>>();

		return violations.map((v) => ({
			id: v._id.toString(),
			userId: v.userId,
			latitude: v.latitude,
			longitude: v.longitude,
			timestamp: v.timestamp.getTime(),
			actualSpeed: v.actualSpeed,
			speedLimit: v.speedLimit,
			excess: v.excess,
		}));
	}

	// Get all violations (admin use)
	async getAllViolations(): Promise<SpeedViolation[]> {
		await connectDB();
		const violations = await Violation.find()
			.sort({ timestamp: -1 })
			.lean<Array<IViolation & { _id: Types.ObjectId }>>();

		return violations.map((v) => ({
			id: v._id.toString(),
			userId: v.userId,
			latitude: v.latitude,
			longitude: v.longitude,
			timestamp: v.timestamp.getTime(),
			actualSpeed: v.actualSpeed,
			speedLimit: v.speedLimit,
			excess: v.excess,
		}));
	}

	// Get recent locations (last N locations)
	async getRecentLocations(limit: number = 100): Promise<LocationPoint[]> {
		await connectDB();
		const locations = await Location.find()
			.sort({ timestamp: -1 })
			.limit(limit)
			.lean<Array<ILocation & { _id: Types.ObjectId }>>();

		return locations.map((loc) => ({
			id: loc._id.toString(),
			userId: loc.userId,
			latitude: loc.latitude,
			longitude: loc.longitude,
			timestamp: loc.timestamp.getTime(),
			speed: loc.speed ?? undefined,
			accuracy: loc.accuracy ?? undefined,
			heading: loc.heading ?? undefined,
		}));
	}

	// Get unique users
	async getUniqueUsers(): Promise<string[]> {
		await connectDB();
		const users = await Location.distinct("userId");
		return users;
	}
}

// Singleton instance
export const storage = new DataStorage();
