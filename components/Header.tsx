"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
	const { data: session, status } = useSession();
	const loading = status === "loading";
	const user = session?.user;
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const handleLogout = () => {
		signOut({ callbackUrl: "/login" });
	};

	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setMobileMenuOpen(false);
	};

	return (
		<header className="bg-blue-600 text-white shadow-lg">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
				<div className="flex justify-between items-center">
					{/* Logo */}
					<div className="flex-shrink-0">
						<Link href="/" onClick={closeMobileMenu}>
							<h1 className="text-xl sm:text-2xl font-bold">Drive Tracker</h1>
							<p className="text-xs sm:text-sm text-blue-100 hidden sm:block">
								Location & Speed Monitoring System
							</p>
						</Link>
					</div>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
						{loading ? (
							<span className="text-blue-200">Loading...</span>
						) : user ? (
							<>
								<Link
									href="/"
									className="px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm lg:text-base"
								>
									Track
								</Link>
								<Link
									href="/dashboard"
									className="px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm lg:text-base"
								>
									Dashboard
								</Link>
								{user.isAdmin && (
									<Link
										href="/admin"
										className="px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm lg:text-base"
									>
										Admin
									</Link>
								)}
								<span className="text-blue-100 text-sm px-2 hidden lg:inline">
									{user.name}
								</span>
								<button
									onClick={handleLogout}
									className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors text-sm lg:text-base"
								>
									Logout
								</button>
							</>
						) : (
							<>
								<Link
									href="/login"
									className="px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
								>
									Login
								</Link>
								<Link
									href="/register"
									className="px-3 py-2 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors"
								>
									Register
								</Link>
							</>
						)}
					</nav>

					{/* Mobile menu button */}
					<button
						onClick={toggleMobileMenu}
						className="md:hidden p-2 rounded-md hover:bg-blue-700 transition-colors"
						aria-label="Toggle menu"
					>
						{mobileMenuOpen ? (
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						) : (
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
						)}
					</button>
				</div>

				{/* Mobile Navigation */}
				{mobileMenuOpen && (
					<nav className="md:hidden mt-4 pt-4 border-t border-blue-500">
						{loading ? (
							<span className="text-blue-200 block py-2">Loading...</span>
						) : user ? (
							<div className="space-y-2">
								<p className="text-blue-100 text-sm py-2 border-b border-blue-500 mb-2">
									Signed in as {user.name}
								</p>
								<Link
									href="/"
									onClick={closeMobileMenu}
									className="block px-3 py-3 rounded-md hover:bg-blue-700 transition-colors"
								>
									🗺️ Track Location
								</Link>
								<Link
									href="/dashboard"
									onClick={closeMobileMenu}
									className="block px-3 py-3 rounded-md hover:bg-blue-700 transition-colors"
								>
									📊 My Dashboard
								</Link>
								{user.isAdmin && (
									<Link
										href="/admin"
										onClick={closeMobileMenu}
										className="block px-3 py-3 rounded-md hover:bg-blue-700 transition-colors"
									>
										⚙️ Admin Panel
									</Link>
								)}
								<button
									onClick={() => {
										closeMobileMenu();
										handleLogout();
									}}
									className="w-full text-left px-3 py-3 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors mt-2"
								>
									🚪 Logout
								</button>
							</div>
						) : (
							<div className="space-y-2">
								<Link
									href="/login"
									onClick={closeMobileMenu}
									className="block px-3 py-3 rounded-md hover:bg-blue-700 transition-colors"
								>
									Login
								</Link>
								<Link
									href="/register"
									onClick={closeMobileMenu}
									className="block px-3 py-3 rounded-md bg-blue-700 hover:bg-blue-800 transition-colors"
								>
									Register
								</Link>
							</div>
						)}
					</nav>
				)}
			</div>
		</header>
	);
}
