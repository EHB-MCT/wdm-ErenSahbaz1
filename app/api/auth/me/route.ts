import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";

export async function GET(request: NextRequest) {
	try {
		const userData = getUserFromRequest(request);

		if (!userData) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		await connectDB();

		// Get fresh user data from database
		const user = await User.findById(userData.userId);
		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({
			user: {
				id: user._id.toString(),
				email: user.email,
				name: user.name,
				isAdmin: user.isAdmin,
			},
		});
	} catch (error) {
		console.error("Auth me error:", error);
		return NextResponse.json(
			{ error: "Failed to get user data" },
			{ status: 500 }
		);
	}
}
