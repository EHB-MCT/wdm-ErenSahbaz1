"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/GoogleMapsProvider";

const containerStyle = {
	width: "100%",
	height: "100%",
	minHeight: "300px",
};

const defaultCenter = {
	lat: 50.8503,
	lng: 4.3517,
};

interface Trip {
	id: string;
	startTime: string;
	endTime?: string;
	startLocation: { latitude: number; longitude: number };
	endLocation?: { latitude: number; longitude: number };
	totalDistance: number;
	averageSpeed: number;
	maxSpeed: number;
	violationsCount: number;
	isActive: boolean;
}

interface Location {
	id: string;
	latitude: number;
	longitude: number;
	timestamp: number;
	speed?: number;
	tripId?: string;
}

interface Violation {
	id: string;
	latitude: number;
	longitude: number;
	timestamp: number;
	actualSpeed: number;
	speedLimit: number;
	excess: number;
}

interface UserStats {
	totalTrips: number;
	totalDistance: number;
	averageSpeed: number;
	maxSpeed: number;
	totalViolations: number;
}

export default function UserDashboard() {
	const { isLoaded } = useGoogleMaps();
	const { data: session } = useSession();
	const [trips, setTrips] = useState<Trip[]>([]);
	const [violations, setViolations] = useState<Violation[]>([]);
	const [stats, setStats] = useState<UserStats | null>(null);
	const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
	const [tripLocations, setTripLocations] = useState<Location[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadUserData = async () => {
			if (!session?.user?.id) return;

			try {
				const userId = session.user.id;

				// Load user's data
				const [tripsRes, violationsRes] = await Promise.all([
					fetch(`/api/trips?userId=${userId}`),
					fetch(`/api/violations?userId=${userId}`),
				]);

				const tripsData = await tripsRes.json();
				const violationsData = await violationsRes.json();

				const userTrips = tripsData.trips || [];
				const userViolations = violationsData.violations || [];

				setTrips(userTrips);
				setViolations(userViolations);

				// Calculate stats
				const totalDistance = userTrips.reduce(
					(sum: number, t: Trip) => sum + (t.totalDistance || 0),
					0
				);
				const speeds = userTrips
					.filter((t: Trip) => t.averageSpeed > 0)
					.map((t: Trip) => t.averageSpeed);
				const avgSpeed =
					speeds.length > 0
						? speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length
						: 0;
				const maxSpeed = userTrips.reduce(
					(max: number, t: Trip) => Math.max(max, t.maxSpeed || 0),
					0
				);

				setStats({
					totalTrips: userTrips.length,
					totalDistance,
					averageSpeed: avgSpeed,
					maxSpeed,
					totalViolations: userViolations.length,
				});

				setLoading(false);
			} catch (error) {
				console.error("Failed to load user data:", error);
				setLoading(false);
			}
		};

		if (session?.user?.id) {
			loadUserData();
		}
	}, [session]);

	const loadTripLocations = async (tripId: string) => {
		try {
			const res = await fetch(`/api/locations?tripId=${tripId}`);
			const data = await res.json();
			setTripLocations(data.locations || []);
		} catch (error) {
			console.error("Failed to load trip locations:", error);
		}
	};

	const selectTrip = (trip: Trip) => {
		setSelectedTrip(trip);
		loadTripLocations(trip.id);
	};

	const formatDuration = (start: string, end?: string) => {
		if (!end) return "In progress";
		const duration = new Date(end).getTime() - new Date(start).getTime();
		const minutes = Math.floor(duration / 60000);
		const hours = Math.floor(minutes / 60);
		if (hours > 0) {
			return `${hours}h ${minutes % 60}m`;
		}
		return `${minutes}m`;
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-100 p-4 sm:p-8">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-2xl sm:text-3xl font-bold mb-8">My Dashboard</h1>
					<div className="text-center py-8">Loading your data...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100 p-4 sm:p-8">
			<div className="max-w-7xl mx-auto">
				<h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
					My Dashboard
				</h1>
				<p className="text-gray-600 mb-4 sm:mb-8 text-sm sm:text-base">
					Welcome back, {session?.user?.name}!
				</p>

				{/* Stats Cards - Responsive Grid */}
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-8">
					<div className="bg-white rounded-lg shadow p-3 sm:p-6">
						<h3 className="text-xs sm:text-sm font-medium text-gray-500">
							Total Trips
						</h3>
						<p className="text-xl sm:text-3xl font-bold text-blue-600">
							{stats?.totalTrips || 0}
						</p>
					</div>
					<div className="bg-white rounded-lg shadow p-3 sm:p-6">
						<h3 className="text-xs sm:text-sm font-medium text-gray-500">
							Distance
						</h3>
						<p className="text-xl sm:text-3xl font-bold text-green-600">
							{stats?.totalDistance.toFixed(1) || 0}
							<span className="text-sm sm:text-lg"> km</span>
						</p>
					</div>
					<div className="bg-white rounded-lg shadow p-3 sm:p-6">
						<h3 className="text-xs sm:text-sm font-medium text-gray-500">
							Avg Speed
						</h3>
						<p className="text-xl sm:text-3xl font-bold text-purple-600">
							{stats?.averageSpeed.toFixed(0) || 0}
							<span className="text-sm sm:text-lg"> km/h</span>
						</p>
					</div>
					<div className="bg-white rounded-lg shadow p-3 sm:p-6">
						<h3 className="text-xs sm:text-sm font-medium text-gray-500">
							Max Speed
						</h3>
						<p className="text-xl sm:text-3xl font-bold text-orange-600">
							{stats?.maxSpeed.toFixed(0) || 0}
							<span className="text-sm sm:text-lg"> km/h</span>
						</p>
					</div>
					<div className="bg-white rounded-lg shadow p-3 sm:p-6 col-span-2 sm:col-span-1">
						<h3 className="text-xs sm:text-sm font-medium text-gray-500">
							Violations
						</h3>
						<p
							className={`text-xl sm:text-3xl font-bold ${
								(stats?.totalViolations || 0) > 0
									? "text-red-600"
									: "text-green-600"
							}`}
						>
							{stats?.totalViolations || 0}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
					{/* Trips List */}
					<div className="bg-white rounded-lg shadow">
						<div className="p-3 sm:p-4 border-b">
							<h2 className="text-lg sm:text-xl font-semibold">My Trips</h2>
						</div>
						<div className="max-h-[350px] sm:max-h-[500px] overflow-y-auto">
							{trips.length === 0 ? (
								<p className="p-4 text-gray-500 text-sm sm:text-base">
									No trips recorded yet. Start tracking to see your trips!
								</p>
							) : (
								<ul className="divide-y">
									{trips.map((trip) => (
										<li
											key={trip.id}
											className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 ${
												selectedTrip?.id === trip.id ? "bg-blue-50" : ""
											}`}
											onClick={() => selectTrip(trip)}
										>
											<div className="flex justify-between items-start gap-2">
												<div className="min-w-0 flex-1">
													<p className="font-medium text-sm sm:text-base truncate">
														{new Date(trip.startTime).toLocaleDateString()} at{" "}
														{new Date(trip.startTime).toLocaleTimeString([], {
															hour: "2-digit",
															minute: "2-digit",
														})}
													</p>
													<p className="text-xs sm:text-sm text-gray-500">
														{formatDuration(trip.startTime, trip.endTime)}
													</p>
													<p className="text-xs sm:text-sm text-gray-500">
														{trip.totalDistance.toFixed(1)} km •{" "}
														{trip.averageSpeed.toFixed(0)} km/h
													</p>
												</div>
												<div className="text-right flex-shrink-0 flex flex-col gap-1">
													{trip.isActive && (
														<span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
															Active
														</span>
													)}
													{trip.violationsCount > 0 && (
														<span className="inline-block px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
															{trip.violationsCount}
														</span>
													)}
												</div>
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
					</div>

					{/* Trip Map */}
					<div className="bg-white rounded-lg shadow">
						<div className="p-3 sm:p-4 border-b">
							<h2 className="text-lg sm:text-xl font-semibold">
								{selectedTrip ? "Trip Route" : "Select a trip"}
							</h2>
						</div>
						<div className="p-2 sm:p-4 h-[300px] sm:h-[400px]">
							{!isLoaded ? (
								<div className="h-[400px] flex items-center justify-center bg-gray-100 rounded">
									<p className="text-gray-600">Loading map...</p>
								</div>
							) : (
								<GoogleMap
									mapContainerStyle={containerStyle}
									center={
										tripLocations.length > 0
											? {
													lat: tripLocations[0].latitude,
													lng: tripLocations[0].longitude,
											  }
											: selectedTrip?.startLocation
											? {
													lat: selectedTrip.startLocation.latitude,
													lng: selectedTrip.startLocation.longitude,
											  }
											: defaultCenter
									}
									zoom={14}
								>
									{/* Trip path */}
									{tripLocations.length > 1 && (
										<Polyline
											path={tripLocations.map((loc) => ({
												lat: loc.latitude,
												lng: loc.longitude,
											}))}
											options={{
												strokeColor: "#4285F4",
												strokeOpacity: 0.8,
												strokeWeight: 4,
											}}
										/>
									)}
									{/* Start marker */}
									{selectedTrip?.startLocation && (
										<Marker
											position={{
												lat: selectedTrip.startLocation.latitude,
												lng: selectedTrip.startLocation.longitude,
											}}
											label="A"
											title="Trip Start"
										/>
									)}
									{/* End marker */}
									{selectedTrip?.endLocation && (
										<Marker
											position={{
												lat: selectedTrip.endLocation.latitude,
												lng: selectedTrip.endLocation.longitude,
											}}
											label="B"
											title="Trip End"
										/>
									)}
								</GoogleMap>
							)}
						</div>
					</div>
				</div>

				{/* Recent Violations */}
				{violations.length > 0 && (
					<div className="mt-4 sm:mt-8 bg-white rounded-lg shadow">
						<div className="p-3 sm:p-4 border-b">
							<h2 className="text-lg sm:text-xl font-semibold text-red-600">
								Recent Violations
							</h2>
						</div>
						{/* Mobile card view */}
						<div className="sm:hidden divide-y">
							{violations.slice(0, 10).map((v) => (
								<div key={v.id} className="p-3">
									<p className="text-sm text-gray-900">
										{new Date(v.timestamp).toLocaleString()}
									</p>
									<div className="flex justify-between mt-1">
										<span className="text-red-600 font-medium">
											{v.actualSpeed.toFixed(0)} km/h
										</span>
										<span className="text-gray-500">
											Limit: {v.speedLimit} km/h
										</span>
										<span className="text-red-600">
											+{v.excess.toFixed(0)} km/h
										</span>
									</div>
								</div>
							))}
						</div>
						{/* Desktop table view */}
						<div className="hidden sm:block overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200">
								<thead className="bg-gray-50">
									<tr>
										<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											Date & Time
										</th>
										<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											Speed
										</th>
										<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											Limit
										</th>
										<th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
											Excess
										</th>
									</tr>
								</thead>
								<tbody className="bg-white divide-y divide-gray-200">
									{violations.slice(0, 10).map((v) => (
										<tr key={v.id}>
											<td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{new Date(v.timestamp).toLocaleString()}
											</td>
											<td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
												{v.actualSpeed.toFixed(1)} km/h
											</td>
											<td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{v.speedLimit} km/h
											</td>
											<td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-red-600">
												+{v.excess.toFixed(1)} km/h
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
