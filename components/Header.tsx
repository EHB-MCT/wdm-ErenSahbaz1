import Link from "next/link";

export default function Header() {
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
					<nav className="flex space-x-4">
						<Link
							href="/"
							className="px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
						>
							Home
						</Link>
						<Link
							href="/admin"
							className="px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
						>
							Admin Dashboard
						</Link>
					</nav>
				</div>
			</div>
		</header>
	);
}
