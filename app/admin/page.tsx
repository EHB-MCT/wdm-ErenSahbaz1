"use client";

import { useEffect, useState } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/GoogleMapsProvider";
import { LocationPoint, SpeedViolation } from "@/types/location";

const containerStyle = {
	width: "100%",
	height: "100%",
	minHeight: "400px",
};

const defaultCenter = {
	lat: 50.8503, // Brussels, Belgium
	lng: 4.3517,
};

interface UserAnalytics {
	userId: string;
	totalTrips: number;
	totalDistance: number;
	averageSpeed: number;
	maxSpeed: number;
	violationsCount: number;
	commonLocations: Array<{
		type: "home" | "work" | "frequent";
		latitude: number;
		longitude: number;
	}>;
}

interface Trip {
	id: string;
	userId: string;
	startTime: string;
	endTime?: string;
	startLocation: { latitude: number; longitude: number };
	endLocation?: { latitude: number; longitude: number };
	totalDistance: number;
	averageSpeed: number;
	maxSpeed: number;
	violationsCount: number;
	isActive: boolean;
	duration: number | null;
}

export default function AdminDashboard() {
	const { isLoaded, loadError } = useGoogleMaps();
	const [allLocations, setAllLocations] = useState<LocationPoint[]>([]);
	const [allViolations, setAllViolations] = useState<SpeedViolation[]>([]);
	const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
	const [allTrips, setAllTrips] = useState<Trip[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedUser, setSelectedUser] = useState<string | null>(null);
	const [selectedMarker, setSelectedMarker] = useState<LocationPoint | null>(
		null
	);
	const [view, setView] = useState<
		"map" | "analytics" | "violations" | "trips"
	>("trips");

	useEffect(() => {
		loadData();
		// Refresh data every 10 seconds
		const interval = setInterval(loadData, 10000);
		return () => clearInterval(interval);
	}, []);

	const loadData = async () => {
		try {
			// Load all data in parallel
			const [locationsRes, violationsRes, analyticsRes, tripsRes] =
				await Promise.all([
					fetch("/api/locations"),
					fetch("/api/violations"),
					fetch("/api/analytics"),
					fetch("/api/trips"),
				]);

			const locationsData = await locationsRes.json();
			const violationsData = await violationsRes.json();
			const analyticsData = await analyticsRes.json();
			const tripsData = await tripsRes.json();

			setAllLocations(locationsData.locations || []);
			setAllViolations(violationsData.violations || []);
			setAnalytics(analyticsData.analytics || []);
			setAllTrips(tripsData.trips || []);
			setLoading(false);
		} catch (error) {
			console.error("Failed to load admin data:", error);
			setLoading(false);
		}
	};

	const uniqueUsers = [...new Set(allLocations.map((loc) => loc.userId))];

	const filteredLocations = selectedUser
		? allLocations.filter((loc) => loc.userId === selectedUser)
		: allLocations;

	const getMarkerColor = (location: LocationPoint) => {
		if (location.speed && location.speed > 70) {
			return "http://maps.google.com/mapfiles/ms/icons/red-dot.png"; // Violation
		}
		return "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"; // Normal
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<div className="text-xl">Loading admin dashboard...</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<div className="bg-white shadow">
				<div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
					<h1 className="text-xl sm:text-3xl font-bold text-gray-900">
						Admin Dashboard
					</h1>
					<p className="text-xs sm:text-sm text-gray-600 mt-1">
						Real-time monitoring and analytics
					</p>
				</div>
			</div>

			{/* Navigation */}
			<div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
				<div className="flex flex-wrap gap-2 sm:gap-4 mb-4 sm:mb-6">
					<button
						onClick={() => setView("trips")}
						className={`px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-medium ${
							view === "trips"
								? "bg-blue-600 text-white"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						<span className="hidden sm:inline">Trips</span>
						<span className="sm:hidden">🚗</span> ({allTrips.length})
					</button>
					<button
						onClick={() => setView("analytics")}
						className={`px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-medium ${
							view === "analytics"
								? "bg-blue-600 text-white"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						<span className="hidden sm:inline">Analytics</span>
						<span className="sm:hidden">📈</span>
					</button>
					<button
						onClick={() => setView("map")}
						className={`px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-medium ${
							view === "map"
								? "bg-blue-600 text-white"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						<span className="hidden sm:inline">Live Map</span>
						<span className="sm:hidden">🗺️</span>
					</button>
					<button
						onClick={() => setView("violations")}
						className={`px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-medium ${
							view === "violations"
								? "bg-blue-600 text-white"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						<span className="hidden sm:inline">Violations</span>
						<span className="sm:hidden">⚠️</span> ({allViolations.length})
					</button>
					<a
						href="/admin/profiles"
						className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-medium bg-purple-600 text-white hover:bg-purple-700"
					>
						🔍 <span className="hidden sm:inline">Profiles</span>
					</a>
					<a
						href="/admin/charts"
						className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-medium bg-green-600 text-white hover:bg-green-700"
					>
						📊 <span className="hidden sm:inline">Charts</span>
					</a>
				</div>

				{/* Trips View */}
				{view === "trips" && (
					<div className="bg-white rounded-lg shadow overflow-hidden">
						<div className="px-4 sm:px-6 py-3 sm:py-4 border-b">
							<h2 className="text-base sm:text-lg font-semibold">All Trips</h2>
							<p className="text-xs sm:text-sm text-gray-600">
								{allTrips.filter((t) => t.isActive).length} active trips
							</p>
						</div>
						{/* Mobile Card View */}
						<div className="sm:hidden divide-y divide-gray-200">
							{allTrips.map((trip) => (
								<div key={trip.id} className="p-4 space-y-2">
									<div className="flex justify-between items-center">
										<span className="text-xs font-mono text-gray-500 truncate max-w-[120px]">
											{trip.userId}
										</span>
										{trip.isActive ? (
											<span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
												Active
											</span>
										) : (
											<span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
												Done
											</span>
										)}
									</div>
									<div className="grid grid-cols-2 gap-2 text-xs">
										<div>
											<span className="text-gray-500">Distance:</span>{" "}
											{trip.totalDistance.toFixed(2)} km
										</div>
										<div>
											<span className="text-gray-500">Avg:</span>{" "}
											{trip.averageSpeed.toFixed(0)} km/h
										</div>
										<div>
											<span className="text-gray-500">Max:</span>{" "}
											{trip.maxSpeed.toFixed(0)} km/h
										</div>
										<div>
											<span className="text-gray-500">Violations:</span>{" "}
											<span
												className={
													trip.violationsCount > 0
														? "text-red-600 font-semibold"
														: "text-green-600"
												}
											>
												{trip.violationsCount}
											</span>
										</div>
									</div>
									<div className="text-xs text-gray-500">
										{new Date(trip.startTime).toLocaleString()}
									</div>
								</div>
							))}
							{allTrips.length === 0 && (
								<div className="p-4 text-center text-sm text-gray-500">
									No trips recorded yet
								</div>
							)}
						</div>
						{/* Desktop Table View */}
						<div className="hidden sm:block overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											Status
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											User ID
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											Start Time
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											Duration
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											Distance
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											Avg Speed
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											Max Speed
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											Violations
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{allTrips.map((trip) => (
										<tr key={trip.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap">
												{trip.isActive ? (
													<span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
														Active
													</span>
												) : (
													<span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
														Completed
													</span>
												)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{trip.userId}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{new Date(trip.startTime).toLocaleString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{trip.duration
													? `${Math.round(trip.duration)} min`
													: "In progress"}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{trip.totalDistance.toFixed(2)} km
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{trip.averageSpeed.toFixed(1)} km/h
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
												{trip.maxSpeed.toFixed(1)} km/h
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm">
												{trip.violationsCount > 0 ? (
													<span className="text-red-600 font-semibold">
														{trip.violationsCount}
													</span>
												) : (
													<span className="text-green-600">0</span>
												)}
											</td>
										</tr>
									))}
									{allTrips.length === 0 && (
										<tr>
											<td
												colSpan={8}
												className="px-6 py-4 text-center text-sm text-gray-500"
											>
												No trips recorded yet
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				)}

				{/* Analytics View */}
				{view === "analytics" && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
						{/* Summary Cards */}
						<div className="bg-white rounded-lg shadow p-4 sm:p-6">
							<h3 className="text-xs sm:text-sm font-medium text-gray-500">
								Total Users
							</h3>
							<p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
								{uniqueUsers.length}
							</p>
						</div>
						<div className="bg-white rounded-lg shadow p-4 sm:p-6">
							<h3 className="text-xs sm:text-sm font-medium text-gray-500">
								Total Locations
							</h3>
							<p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
								{allLocations.length}
							</p>
						</div>
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-sm font-medium text-gray-500">
								Total Violations
							</h3>
							<p className="text-3xl font-bold text-red-600 mt-2">
								{allViolations.length}
							</p>
						</div>

						{/* User Analytics */}
						{analytics.map((userAnalytics) => (
							<div
								key={userAnalytics.userId}
								className="bg-white rounded-lg shadow p-6 col-span-full"
							>
								<h3 className="text-lg font-semibold mb-4">
									{userAnalytics.userId}
								</h3>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div>
										<p className="text-sm text-gray-500">Distance Traveled</p>
										<p className="text-xl font-bold">
											{userAnalytics.totalDistance.toFixed(2)} km
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-500">Average Speed</p>
										<p className="text-xl font-bold">
											{userAnalytics.averageSpeed.toFixed(1)} km/h
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-500">Max Speed</p>
										<p className="text-xl font-bold">
											{userAnalytics.maxSpeed.toFixed(1)} km/h
										</p>
									</div>
									<div>
										<p className="text-sm text-gray-500">Violations</p>
										<p className="text-xl font-bold text-red-600">
											{userAnalytics.violationsCount}
										</p>
									</div>
								</div>
								{userAnalytics.commonLocations.length > 0 && (
									<div className="mt-4">
										<p className="text-sm text-gray-500 mb-2">
											Detected Locations:
										</p>
										<div className="flex flex-wrap gap-2">
											{userAnalytics.commonLocations.map((loc, idx) => (
												<span
													key={idx}
													className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
												>
													{loc.type === "home" ? "🏠" : "💼"} {loc.type}
												</span>
											))}
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				)}

				{/* Map View */}
				{view === "map" && (
					<div className="bg-white rounded-lg shadow">
						<div className="p-4 border-b">
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Filter by User:
							</label>
							<select
								value={selectedUser || ""}
								onChange={(e) => setSelectedUser(e.target.value || null)}
								className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md"
							>
								<option value="">All Users</option>
								{uniqueUsers.map((userId) => (
									<option key={userId} value={userId}>
										{userId}
									</option>
								))}
							</select>
							<p className="text-sm text-gray-600 mt-2">
								Showing {filteredLocations.length} locations
							</p>
						</div>
						{loadError && (
							<div className="h-[600px] flex items-center justify-center bg-gray-100">
								<p className="text-red-600">Error loading maps</p>
							</div>
						)}
						{!isLoaded && !loadError && (
							<div className="h-[600px] flex items-center justify-center bg-gray-100">
								<p className="text-gray-600">Loading map...</p>
							</div>
						)}
						{isLoaded && (
							<GoogleMap
								mapContainerStyle={containerStyle}
								center={
									filteredLocations[0]
										? {
												lat: filteredLocations[0].latitude,
												lng: filteredLocations[0].longitude,
										  }
										: defaultCenter
								}
								zoom={12}
							>
								{filteredLocations.map((location) => (
									<Marker
										key={location.id}
										position={{
											lat: location.latitude,
											lng: location.longitude,
										}}
										icon={getMarkerColor(location)}
										onClick={() => setSelectedMarker(location)}
									/>
								))}
								{selectedMarker && (
									<InfoWindow
										position={{
											lat: selectedMarker.latitude,
											lng: selectedMarker.longitude,
										}}
										onCloseClick={() => setSelectedMarker(null)}
									>
										<div className="p-2">
											<p className="font-semibold">{selectedMarker.userId}</p>
											<p className="text-sm">
												Speed: {selectedMarker.speed?.toFixed(1) || "N/A"} km/h
											</p>
											<p className="text-sm">
												Time:{" "}
												{new Date(selectedMarker.timestamp).toLocaleString()}
											</p>
										</div>
									</InfoWindow>
								)}
							</GoogleMap>
						)}
					</div>
				)}

				{/* Violations View */}
				{view === "violations" && (
					<div className="bg-white rounded-lg shadow overflow-hidden">
						{/* Mobile Card View */}
						<div className="sm:hidden divide-y divide-gray-200">
							{allViolations.map((violation) => (
								<div key={violation.id} className="p-4 space-y-2">
									<div className="flex justify-between items-start">
										<span className="text-xs font-mono text-gray-500 truncate max-w-[120px]">
											{violation.userId}
										</span>
										<span className="text-red-600 font-bold text-sm">
											+{violation.excess.toFixed(0)} km/h
										</span>
									</div>
									<div className="flex justify-between text-sm">
										<span className="text-red-600 font-semibold">
											{violation.actualSpeed.toFixed(0)} km/h
										</span>
										<span className="text-gray-500">
											Limit: {violation.speedLimit} km/h
										</span>
									</div>
									<div className="text-xs text-gray-500">
										{new Date(violation.timestamp).toLocaleString()}
									</div>
								</div>
							))}
							{allViolations.length === 0 && (
								<div className="p-4 text-center text-sm text-gray-500">
									No violations recorded yet
								</div>
							)}
						</div>
						{/* Desktop Table View */}
						<div className="hidden sm:block">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											User ID
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Time
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Location
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Actual Speed
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Speed Limit
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Excess
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{allViolations.map((violation) => (
										<tr key={violation.id} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
												{violation.userId}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{new Date(violation.timestamp).toLocaleString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{violation.latitude.toFixed(4)},{" "}
												{violation.longitude.toFixed(4)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
												{violation.actualSpeed.toFixed(1)} km/h
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{violation.speedLimit} km/h
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
												+{violation.excess.toFixed(1)} km/h
											</td>
										</tr>
									))}
									{allViolations.length === 0 && (
										<tr>
											<td
												colSpan={6}
												className="px-6 py-4 text-center text-sm text-gray-500"
											>
												No violations recorded yet
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
