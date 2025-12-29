"use client";

import { useEffect, useState } from "react";
import {
	LoadScript,
	GoogleMap,
	Marker,
	InfoWindow,
} from "@react-google-maps/api";
import { LocationPoint, SpeedViolation } from "@/types/location";

const containerStyle = {
	width: "100%",
	height: "600px",
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

export default function AdminDashboard() {
	const [allLocations, setAllLocations] = useState<LocationPoint[]>([]);
	const [allViolations, setAllViolations] = useState<SpeedViolation[]>([]);
	const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedUser, setSelectedUser] = useState<string | null>(null);
	const [selectedMarker, setSelectedMarker] = useState<LocationPoint | null>(
		null
	);
	const [view, setView] = useState<"map" | "analytics" | "violations">(
		"analytics"
	);

	useEffect(() => {
		loadData();
		// Refresh data every 10 seconds
		const interval = setInterval(loadData, 10000);
		return () => clearInterval(interval);
	}, []);

	const loadData = async () => {
		try {
			// Load all data in parallel
			const [locationsRes, violationsRes, analyticsRes] = await Promise.all([
				fetch("/api/locations"),
				fetch("/api/violations"),
				fetch("/api/analytics"),
			]);

			const locationsData = await locationsRes.json();
			const violationsData = await violationsRes.json();
			const analyticsData = await analyticsRes.json();

			setAllLocations(locationsData.locations || []);
			setAllViolations(violationsData.violations || []);
			setAnalytics(analyticsData.analytics || []);
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
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
					<h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
					<p className="text-sm text-gray-600 mt-1">
						Real-time monitoring and analytics
					</p>
				</div>
			</div>

			{/* Navigation */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<div className="flex space-x-4 mb-6">
					<button
						onClick={() => setView("analytics")}
						className={`px-4 py-2 rounded-md font-medium ${
							view === "analytics"
								? "bg-blue-600 text-white"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						Analytics
					</button>
					<button
						onClick={() => setView("map")}
						className={`px-4 py-2 rounded-md font-medium ${
							view === "map"
								? "bg-blue-600 text-white"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						Live Map
					</button>
					<button
						onClick={() => setView("violations")}
						className={`px-4 py-2 rounded-md font-medium ${
							view === "violations"
								? "bg-blue-600 text-white"
								: "bg-white text-gray-700 hover:bg-gray-100"
						}`}
					>
						Violations ({allViolations.length})
					</button>
				</div>

				{/* Analytics View */}
				{view === "analytics" && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{/* Summary Cards */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-sm font-medium text-gray-500">Total Users</h3>
							<p className="text-3xl font-bold text-gray-900 mt-2">
								{uniqueUsers.length}
							</p>
						</div>
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-sm font-medium text-gray-500">
								Total Locations
							</h3>
							<p className="text-3xl font-bold text-gray-900 mt-2">
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
						<LoadScript
							googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API!}
						>
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
						</LoadScript>
					</div>
				)}

				{/* Violations View */}
				{view === "violations" && (
					<div className="bg-white rounded-lg shadow overflow-hidden">
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
				)}
			</div>
		</div>
	);
}
