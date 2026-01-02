import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
	const token = await getToken({ req: request });
	const pathname = request.nextUrl.pathname;

	// Public routes that don't require authentication
	const publicRoutes = ["/login", "/register"];
	const isPublicRoute = publicRoutes.some((route) =>
		pathname.startsWith(route)
	);

	// API routes that should be accessible (except protected ones)
	const isApiRoute = pathname.startsWith("/api/");
	const isAuthRoute = pathname.startsWith("/api/auth/");

	// Allow API auth routes and public API routes
	if (isAuthRoute) {
		return NextResponse.next();
	}

	// If it's a public route, allow access
	if (isPublicRoute) {
		// If user is logged in and trying to access login/register, redirect to home
		if (token) {
			return NextResponse.redirect(new URL("/", request.url));
		}
		return NextResponse.next();
	}

	// Allow API routes (they handle their own auth)
	if (isApiRoute) {
		return NextResponse.next();
	}

	// For all other routes, require authentication
	if (!token) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// Check admin routes
	if (pathname.startsWith("/admin")) {
		if (!token.isAdmin) {
			// Not an admin, redirect to home
			return NextResponse.redirect(new URL("/", request.url));
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public files (public folder)
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
	],
};
