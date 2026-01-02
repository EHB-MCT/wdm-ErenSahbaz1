import mongoose, { Schema, Document } from "mongoose";

// User document interface
export interface IUser extends Document {
	email: string;
	password: string;
	name: string;
	isAdmin: boolean;
	createdAt: Date;
}

// User schema
const UserSchema = new Schema<IUser>({
	email: { type: String, required: true, unique: true, lowercase: true },
	password: { type: String, required: true },
	name: { type: String, required: true },
	isAdmin: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
});

// Location document interface
export interface ILocation extends Document {
	userId: string;
	latitude: number;
	longitude: number;
	timestamp: Date;
	speed?: number;
	accuracy?: number;
	heading?: number;
	tripId?: string;
}

// Location schema
const LocationSchema = new Schema<ILocation>({
	userId: { type: String, required: true, index: true },
	latitude: { type: Number, required: true },
	longitude: { type: Number, required: true },
	timestamp: { type: Date, default: Date.now, index: true },
	speed: { type: Number },
	accuracy: { type: Number },
	heading: { type: Number },
	tripId: { type: String, index: true },
});

// Violation document interface
export interface IViolation extends Document {
	userId: string;
	latitude: number;
	longitude: number;
	timestamp: Date;
	actualSpeed: number;
	speedLimit: number;
	excess: number;
}

// Violation schema
const ViolationSchema = new Schema<IViolation>({
	userId: { type: String, required: true, index: true },
	latitude: { type: Number, required: true },
	longitude: { type: Number, required: true },
	timestamp: { type: Date, default: Date.now, index: true },
	actualSpeed: { type: Number, required: true },
	speedLimit: { type: Number, required: true },
	excess: { type: Number, required: true },
});

// Trip document interface
export interface ITrip extends Document {
	userId: string;
	startTime: Date;
	endTime?: Date;
	startLocation: { latitude: number; longitude: number };
	endLocation?: { latitude: number; longitude: number };
	totalDistance: number;
	averageSpeed: number;
	maxSpeed: number;
	violationsCount: number;
	isActive: boolean;
}

// Trip schema
const TripSchema = new Schema<ITrip>({
	userId: { type: String, required: true, index: true },
	startTime: { type: Date, required: true },
	endTime: { type: Date },
	startLocation: {
		latitude: { type: Number, required: true },
		longitude: { type: Number, required: true },
	},
	endLocation: {
		latitude: { type: Number },
		longitude: { type: Number },
	},
	totalDistance: { type: Number, default: 0 },
	averageSpeed: { type: Number, default: 0 },
	maxSpeed: { type: Number, default: 0 },
	violationsCount: { type: Number, default: 0 },
	isActive: { type: Boolean, default: true },
});

// Export models (use existing model if already compiled)
export const User =
	mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const Location =
	mongoose.models.Location ||
	mongoose.model<ILocation>("Location", LocationSchema);
export const Violation =
	mongoose.models.Violation ||
	mongoose.model<IViolation>("Violation", ViolationSchema);
export const Trip =
	mongoose.models.Trip || mongoose.model<ITrip>("Trip", TripSchema);
