import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";
import { createToken, createAuthResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Missing email or password" },
				{ status: 400 }
			);
		}

		// Add timeout for database connection
		const connectPromise = connectDB();
		const timeoutPromise = new Promise((_, reject) =>
			setTimeout(() => reject(new Error("Database connection timeout")), 10000)
		);

		try {
			await Promise.race([connectPromise, timeoutPromise]);
		} catch (dbError) {
			console.error("Database connection error:", dbError);
			return NextResponse.json(
				{ error: "Unable to connect to database. Please try again." },
				{ status: 503 }
			);
		}

		// Find user
		const user = await User.findOne({ email });
		if (!user) {
			return NextResponse.json(
				{ error: "Invalid credentials" },
				{ status: 401 }
			);
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			return NextResponse.json(
				{ error: "Invalid credentials" },
				{ status: 401 }
			);
		}

		// Create token
		const token = createToken(user._id.toString(), user.email, user.isAdmin);

		// Create response with user data
		const response = NextResponse.json({
			success: true,
			user: {
				id: user._id.toString(),
				email: user.email,
				name: user.name,
				isAdmin: user.isAdmin,
			},
		});

		// Set cookie
		return createAuthResponse(response, token);
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json({ error: "Failed to login" }, { status: 500 });
	}
}
