import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

export function createToken(userId: string, email: string, isAdmin: boolean) {
	const token = jwt.sign({ userId, email, isAdmin }, JWT_SECRET, {
		expiresIn: "7d",
	});
	return token;
}

export function verifyToken(token: string) {
	try {
		const verified = jwt.verify(token, JWT_SECRET) as {
			userId: string;
			email: string;
			isAdmin: boolean;
		};
		return verified;
	} catch {
		return null;
	}
}

export function getUserFromRequest(request: NextRequest) {
	const token = request.cookies.get("token")?.value;

	if (!token) return null;

	return verifyToken(token);
}

export function createAuthResponse(response: NextResponse, token: string) {
	response.cookies.set("token", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 7, // 7 days
	});

	return response;
}
