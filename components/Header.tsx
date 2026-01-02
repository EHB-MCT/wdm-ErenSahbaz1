"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
	const { data: session, status } = useSession();
	const loading = status === "loading";
	const user = session?.user;

	const handleLogout = () => {
		signOut({ callbackUrl: "/login" });
	};

	return (
		<header className="bg-blue-600 text-white shadow-lg">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold">Drive Tracker</h1>
						<p className="text-sm text-blue-100">
							Location & Speed Monitoring System
						</p>
					</div>
					<nav className="flex items-center space-x-4">
						{loading ? (
							<span className="text-blue-200">Loading...</span>
						) : user ? (
							<>
								<Link
									href="/"
									className="px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
								>
									Track
								</Link>
								<Link
									href="/dashboard"
									className="px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
								>
									My Dashboard
								</Link>
								{user.isAdmin && (
									<Link
										href="/admin"
										className="px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
									>
										Admin
									</Link>
								)}
								<span className="text-blue-100 text-sm px-2">{user.name}</span>
								<button
									onClick={handleLogout}
									className="px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors"
								>
									Logout
								</button>
							</>
						) : (
							<>
								<Link
									href="/login"
									className="px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
								>
									Login
								</Link>
								<Link
									href="/register"
									className="px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors"
								>
									Register
								</Link>
							</>
						)}
					</nav>
				</div>
			</div>
		</header>
	);
}
