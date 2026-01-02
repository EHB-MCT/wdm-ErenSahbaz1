"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GoogleMap, Marker, Circle } from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/GoogleMapsProvider";

interface UserProfile {
	userId: string;
	likelyHome: {
		latitude: number;
		longitude: number;
		confidence: number;
		reasoning: string;
	} | null;
	likelyWork: {
		latitude: number;
		longitude: number;
		confidence: number;
		reasoning: string;
	} | null;
	frequentPlaces: Array<{
		latitude: number;
		longitude: number;
		visitCount: number;
		avgTimeOfDay: string;
		category: string;
	}>;
	drivingBehavior: {
		style: "aggressive" | "moderate" | "careful";
		avgSpeed: number;
		maxSpeed: number;
		violationRate: number;
		totalViolations: number;
		riskScore: number;
	};
	schedule: {
		typicalDepartureTime: string;
		typicalArrivalTime: string;
		mostActiveDay: string;
		mostActiveHour: number;
		weekdayVsWeekend: { weekday: number; weekend: number };
	};
	stats: {
		totalTrips: number;
		totalDistance: number;
		totalDrivingTime: number;
		firstSeen: string;
		lastSeen: string;
		daysActive: number;
	};
}

interface User {
	_id: string;
	email: string;
	name: string;
	isAdmin: boolean;
}

const mapContainerStyle = {
	width: "100%",
	height: "100%",
	minHeight: "300px",
};

export default function UserProfilesPage() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const { isLoaded } = useGoogleMaps();

	const [users, setUsers] = useState<User[]>([]);
	const [selectedUser, setSelectedUser] = useState<string | null>(null);
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Check admin access
	useEffect(() => {
		if (status === "authenticated" && !session?.user?.isAdmin) {
			router.push("/");
		}
	}, [session, status, router]);

	// Fetch users list
	useEffect(() => {
		async function fetchUsers() {
			try {
				const res = await fetch("/api/admin/make-admin");
				const data = await res.json();
				setUsers(data.users || []);
			} catch (err) {
				console.error("Failed to fetch users:", err);
			}
		}
		fetchUsers();
	}, []);

	// Fetch user profile when selected
	useEffect(() => {
		if (!selectedUser) {
			setProfile(null);
			return;
		}

		async function fetchProfile() {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(
					`/api/admin/user-profile?userId=${selectedUser}`
				);
				const data = await res.json();
				if (data.error) {
					setError(data.error);
					setProfile(null);
				} else {
					setProfile(data.profile);
				}
			} catch (err) {
				setError("Failed to fetch profile");
				console.error(err);
			} finally {
				setLoading(false);
			}
		}
		fetchProfile();
	}, [selectedUser]);

	if (status === "loading") {
		return <div className="p-8">Loading...</div>;
	}

	if (!session?.user?.isAdmin) {
		return <div className="p-8">Access denied</div>;
	}

	const mapCenter = profile?.likelyHome
		? { lat: profile.likelyHome.latitude, lng: profile.likelyHome.longitude }
		: profile?.frequentPlaces?.[0]
		? {
				lat: profile.frequentPlaces[0].latitude,
				lng: profile.frequentPlaces[0].longitude,
		  }
		: { lat: 50.8503, lng: 4.3517 };

	return (
		<div className="min-h-screen bg-gray-100 p-3 sm:p-8">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
					<div>
						<h1 className="text-xl sm:text-3xl font-bold">🔍 User Profiles</h1>
						<p className="text-sm sm:text-base text-gray-600">
							Analyze user behavior and patterns
						</p>
					</div>
					<a
						href="/admin"
						className="px-3 sm:px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm sm:text-base w-fit"
					>
						← Back
					</a>
				</div>

				{/* User Selection */}
				<div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
					<h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
						Select User to Analyze
					</h2>
					<div className="flex flex-wrap gap-2">
						{users.map((user) => (
							<button
								key={user._id}
								onClick={() => setSelectedUser(user._id)}
								className={`px-3 sm:px-4 py-2 rounded-lg border transition-colors text-xs sm:text-sm ${
									selectedUser === user._id
										? "bg-blue-600 text-white border-blue-600"
										: "bg-white hover:bg-gray-50 border-gray-300"
								}`}
							>
								<span className="hidden sm:inline">
									{user.name} ({user.email})
								</span>
								<span className="sm:hidden">{user.name}</span>
							</button>
						))}
					</div>
				</div>

				{loading && (
					<div className="bg-white rounded-lg shadow p-8 text-center">
						<div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
						<p>Analyzing user data...</p>
					</div>
				)}

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8">
						{error}
					</div>
				)}

				{profile && (
					<div className="space-y-4 sm:space-y-8">
						{/* Inferred Locations */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
							{/* Home */}
							<div className="bg-white rounded-lg shadow p-4 sm:p-6">
								<h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
									🏠 Likely Home
								</h3>
								{profile.likelyHome ? (
									<div className="space-y-2">
										<p className="text-sm text-gray-600">
											<strong>Coordinates:</strong>{" "}
											{profile.likelyHome.latitude.toFixed(4)},{" "}
											{profile.likelyHome.longitude.toFixed(4)}
										</p>
										<p className="text-sm text-gray-600">
											<strong>Confidence:</strong>{" "}
											<span
												className={`font-bold ${
													profile.likelyHome.confidence > 80
														? "text-green-600"
														: profile.likelyHome.confidence > 50
														? "text-yellow-600"
														: "text-red-600"
												}`}
											>
												{profile.likelyHome.confidence}%
											</span>
										</p>
										<p className="text-sm text-gray-500 italic">
											{profile.likelyHome.reasoning}
										</p>
									</div>
								) : (
									<p className="text-gray-500">Not enough data to determine</p>
								)}
							</div>

							{/* Work */}
							<div className="bg-white rounded-lg shadow p-4 sm:p-6">
								<h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
									🏢 Likely Work
								</h3>
								{profile.likelyWork ? (
									<div className="space-y-2">
										<p className="text-sm text-gray-600">
											<strong>Coordinates:</strong>{" "}
											{profile.likelyWork.latitude.toFixed(4)},{" "}
											{profile.likelyWork.longitude.toFixed(4)}
										</p>
										<p className="text-sm text-gray-600">
											<strong>Confidence:</strong>{" "}
											<span
												className={`font-bold ${
													profile.likelyWork.confidence > 80
														? "text-green-600"
														: profile.likelyWork.confidence > 50
														? "text-yellow-600"
														: "text-red-600"
												}`}
											>
												{profile.likelyWork.confidence}%
											</span>
										</p>
										<p className="text-sm text-gray-500 italic">
											{profile.likelyWork.reasoning}
										</p>
									</div>
								) : (
									<p className="text-gray-500">Not enough data to determine</p>
								)}
							</div>
						</div>

						{/* Map with locations */}
						{isLoaded && (
							<div className="bg-white rounded-lg shadow p-6">
								<h3 className="text-lg font-semibold mb-4">📍 Location Map</h3>
								<GoogleMap
									mapContainerStyle={mapContainerStyle}
									center={mapCenter}
									zoom={12}
								>
									{/* Home marker */}
									{profile.likelyHome && (
										<>
											<Marker
												position={{
													lat: profile.likelyHome.latitude,
													lng: profile.likelyHome.longitude,
												}}
												label="H"
												title="Likely Home"
											/>
											<Circle
												center={{
													lat: profile.likelyHome.latitude,
													lng: profile.likelyHome.longitude,
												}}
												radius={200}
												options={{
													fillColor: "#22c55e",
													fillOpacity: 0.2,
													strokeColor: "#22c55e",
													strokeOpacity: 0.8,
													strokeWeight: 2,
												}}
											/>
										</>
									)}

									{/* Work marker */}
									{profile.likelyWork && (
										<>
											<Marker
												position={{
													lat: profile.likelyWork.latitude,
													lng: profile.likelyWork.longitude,
												}}
												label="W"
												title="Likely Work"
											/>
											<Circle
												center={{
													lat: profile.likelyWork.latitude,
													lng: profile.likelyWork.longitude,
												}}
												radius={200}
												options={{
													fillColor: "#3b82f6",
													fillOpacity: 0.2,
													strokeColor: "#3b82f6",
													strokeOpacity: 0.8,
													strokeWeight: 2,
												}}
											/>
										</>
									)}

									{/* Frequent places */}
									{profile.frequentPlaces.slice(0, 5).map((place, idx) => (
										<Marker
											key={idx}
											position={{
												lat: place.latitude,
												lng: place.longitude,
											}}
											label={String(idx + 1)}
											title={`${place.category} - ${place.visitCount} visits`}
											opacity={0.7}
										/>
									))}
								</GoogleMap>
								<div className="mt-4 flex gap-4 text-sm">
									<span className="flex items-center gap-1">
										<span className="w-4 h-4 bg-green-500 rounded-full"></span>{" "}
										Home
									</span>
									<span className="flex items-center gap-1">
										<span className="w-4 h-4 bg-blue-500 rounded-full"></span>{" "}
										Work
									</span>
									<span className="flex items-center gap-1">
										<span className="w-4 h-4 bg-gray-400 rounded-full"></span>{" "}
										Frequent Places
									</span>
								</div>
							</div>
						)}

						{/* Driving Behavior */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold mb-4">
								🚗 Driving Behavior
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-2xl font-bold">
										<span
											className={`${
												profile.drivingBehavior.style === "aggressive"
													? "text-red-600"
													: profile.drivingBehavior.style === "careful"
													? "text-green-600"
													: "text-yellow-600"
											}`}
										>
											{profile.drivingBehavior.style.toUpperCase()}
										</span>
									</p>
									<p className="text-sm text-gray-600">Driving Style</p>
								</div>
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-2xl font-bold">
										{profile.drivingBehavior.avgSpeed}
									</p>
									<p className="text-sm text-gray-600">Avg Speed (km/h)</p>
								</div>
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-2xl font-bold">
										{profile.drivingBehavior.maxSpeed}
									</p>
									<p className="text-sm text-gray-600">Max Speed (km/h)</p>
								</div>
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-2xl font-bold">
										{profile.drivingBehavior.totalViolations}
									</p>
									<p className="text-sm text-gray-600">Total Violations</p>
								</div>
							</div>

							{/* Risk Score Bar */}
							<div className="mt-6">
								<div className="flex justify-between mb-2">
									<span className="text-sm font-medium">Risk Score</span>
									<span className="text-sm font-bold">
										{profile.drivingBehavior.riskScore}/100
									</span>
								</div>
								<div className="w-full bg-gray-200 rounded-full h-4">
									<div
										className={`h-4 rounded-full transition-all ${
											profile.drivingBehavior.riskScore > 60
												? "bg-red-500"
												: profile.drivingBehavior.riskScore > 30
												? "bg-yellow-500"
												: "bg-green-500"
										}`}
										style={{ width: `${profile.drivingBehavior.riskScore}%` }}
									></div>
								</div>
							</div>
						</div>

						{/* Schedule */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold mb-4">⏰ Daily Schedule</h3>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-xl font-bold">
										{profile.schedule.typicalDepartureTime}
									</p>
									<p className="text-sm text-gray-600">Typical Departure</p>
								</div>
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-xl font-bold">
										{profile.schedule.typicalArrivalTime}
									</p>
									<p className="text-sm text-gray-600">Typical Return</p>
								</div>
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-xl font-bold">
										{profile.schedule.mostActiveDay}
									</p>
									<p className="text-sm text-gray-600">Most Active Day</p>
								</div>
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-xl font-bold">
										{profile.schedule.weekdayVsWeekend.weekday} /{" "}
										{profile.schedule.weekdayVsWeekend.weekend}
									</p>
									<p className="text-sm text-gray-600">
										Weekday / Weekend Trips
									</p>
								</div>
							</div>
						</div>

						{/* Frequent Places */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold mb-4">
								📍 Frequently Visited Places
							</h3>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-4 py-2 text-left">#</th>
											<th className="px-4 py-2 text-left">Location</th>
											<th className="px-4 py-2 text-left">Visits</th>
											<th className="px-4 py-2 text-left">Avg Time</th>
											<th className="px-4 py-2 text-left">Category</th>
										</tr>
									</thead>
									<tbody>
										{profile.frequentPlaces.map((place, idx) => (
											<tr key={idx} className="border-b">
												<td className="px-4 py-2">{idx + 1}</td>
												<td className="px-4 py-2">
													{place.latitude.toFixed(4)},{" "}
													{place.longitude.toFixed(4)}
												</td>
												<td className="px-4 py-2">{place.visitCount}</td>
												<td className="px-4 py-2">{place.avgTimeOfDay}</td>
												<td className="px-4 py-2">
													<span
														className={`px-2 py-1 rounded text-xs ${
															place.category.includes("commute")
																? "bg-blue-100 text-blue-800"
																: place.category.includes("night")
																? "bg-purple-100 text-purple-800"
																: "bg-gray-100 text-gray-800"
														}`}
													>
														{place.category.replace("_", " ")}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						{/* Stats */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold mb-4">
								📊 Overall Statistics
							</h3>
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-2xl font-bold">
										{profile.stats.totalTrips}
									</p>
									<p className="text-sm text-gray-600">Total Trips</p>
								</div>
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-2xl font-bold">
										{profile.stats.totalDistance} km
									</p>
									<p className="text-sm text-gray-600">Total Distance</p>
								</div>
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-2xl font-bold">
										{profile.stats.totalDrivingTime} min
									</p>
									<p className="text-sm text-gray-600">Driving Time</p>
								</div>
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-2xl font-bold">
										{profile.stats.daysActive}
									</p>
									<p className="text-sm text-gray-600">Days Active</p>
								</div>
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-lg font-bold">
										{new Date(profile.stats.firstSeen).toLocaleDateString()}
									</p>
									<p className="text-sm text-gray-600">First Seen</p>
								</div>
								<div className="text-center p-4 bg-gray-50 rounded-lg">
									<p className="text-lg font-bold">
										{new Date(profile.stats.lastSeen).toLocaleDateString()}
									</p>
									<p className="text-sm text-gray-600">Last Seen</p>
								</div>
							</div>
						</div>

						{/* Privacy Warning */}
						<div className="bg-yellow-50 border border-yellow-400 rounded-lg p-6">
							<h3 className="text-lg font-semibold text-yellow-800 mb-2">
								⚠️ Privacy Implications
							</h3>
							<p className="text-yellow-700 text-sm">
								This analysis demonstrates how location data can reveal
								sensitive personal information. From simple GPS coordinates, we
								can infer where someone lives, works, their daily routine, and
								their driving behavior. This is an example of a &quot;Weapon of
								Math Destruction&quot; - using data analysis to build detailed
								profiles that could be used to influence, discriminate, or
								target individuals.
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
