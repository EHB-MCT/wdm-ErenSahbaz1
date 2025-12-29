import mongoose from "mongoose";

const MONGODB_URI =
	process.env.MONGODB_URI || "mongodb://localhost:27017/drivetracker";

if (!MONGODB_URI) {
	throw new Error("Please define the MONGODB_URI environment variable");
}

// Global mongoose instance for development hot reload
const globalForMongoose = globalThis as unknown as {
	mongoose: {
		conn: typeof mongoose | null;
		promise: Promise<typeof mongoose> | null;
	};
};

let cached = globalForMongoose.mongoose;

if (!cached) {
	cached = globalForMongoose.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: false,
		};

		cached.promise = mongoose.connect(MONGODB_URI, opts);
	}

	try {
		cached.conn = await cached.promise;
	} catch (e) {
		cached.promise = null;
		throw e;
	}

	return cached.conn;
}
