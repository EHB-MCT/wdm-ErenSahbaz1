import mongoose, { Schema, Document } from "mongoose";

// Location document interface
export interface ILocation extends Document {
	userId: string;
	latitude: number;
	longitude: number;
	timestamp: Date;
	speed?: number;
	accuracy?: number;
	heading?: number;
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

// Export models (use existing model if already compiled)
export const Location =
	mongoose.models.Location ||
	mongoose.model<ILocation>("Location", LocationSchema);
export const Violation =
	mongoose.models.Violation ||
	mongoose.model<IViolation>("Violation", ViolationSchema);
