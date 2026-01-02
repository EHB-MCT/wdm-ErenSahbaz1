import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models";

export async function GET() {
	try {
		console.log("Testing DB connection...");
		await connectDB();
		console.log("DB connected!");

		const userCount = await User.countDocuments();
		console.log("User count:", userCount);

		const users = await User.find().select("email name isAdmin").lean();

		return NextResponse.json({
			success: true,
			message: "Database connected!",
			userCount,
			users,
		});
	} catch (error) {
		console.error("DB test error:", error);
		return NextResponse.json(
			{
				success: false,
				error: String(error),
			},
			{ status: 500 }
		);
	}
}
