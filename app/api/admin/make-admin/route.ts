import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";

// This endpoint allows making a user an admin
// In production, you'd want to protect this or remove it
export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json();

		if (!email) {
			return NextResponse.json({ error: "Email required" }, { status: 400 });
		}

		await connectDB();

		const user = await User.findOneAndUpdate(
			{ email },
			{ isAdmin: true },
			{ new: true }
		);

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			message: `User ${email} is now an admin`,
			user: {
				id: user._id.toString(),
				email: user.email,
				name: user.name,
				isAdmin: user.isAdmin,
			},
		});
	} catch (error) {
		console.error("Make admin error:", error);
		return NextResponse.json(
			{ error: "Failed to update user" },
			{ status: 500 }
		);
	}
}

export async function GET() {
	try {
		await connectDB();
		const users = await User.find().select("email name isAdmin").lean();
		return NextResponse.json({ users });
	} catch (error) {
		console.error("Get users error:", error);
		return NextResponse.json({ error: "Failed to get users" }, { status: 500 });
	}
}
