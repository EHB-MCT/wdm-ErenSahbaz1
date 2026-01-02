import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";

export async function GET() {
	try {
		console.log("Testing login flow...");
		await connectDB();

		// Test with the known user
		const testEmail = "admin@admin.com";
		const user = await User.findOne({ email: testEmail });

		if (!user) {
			return NextResponse.json({
				success: false,
				error: "User not found",
				testEmail,
			});
		}

		return NextResponse.json({
			success: true,
			message: "User found!",
			user: {
				id: user._id.toString(),
				email: user.email,
				name: user.name,
				isAdmin: user.isAdmin,
				hasPassword: !!user.password,
				passwordLength: user.password?.length,
			},
		});
	} catch (error) {
		console.error("Test login error:", error);
		return NextResponse.json(
			{
				success: false,
				error: String(error),
			},
			{ status: 500 }
		);
	}
}
