"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	AreaChart,
	Area,
} from "recharts";

interface Trip {
	_id: string;
	userId: string;
	startTime: string;
	endTime?: string;
	totalDistance: number;
	averageSpeed: number;
	maxSpeed: number;
	violationsCount: number;
	isActive: boolean;
}

interface Location {
	_id: string;
	userId: string;
	latitude: number;
	longitude: number;
	speed: number;
	timestamp: string;
}

interface Violation {
	_id: string;
	userId: string;
	speed: number;
	speedLimit: number;
	timestamp: string;
}

interface ChartData {
	tripsPerDay: Array<{ date: string; trips: number; distance: number }>;
	speedDistribution: Array<{ range: string; count: number }>;
	violationsByUser: Array<{ userId: string; violations: number }>;
	activityByHour: Array<{ hour: string; activity: number }>;
	tripsDuration: Array<{ range: string; count: number; color: string }>;
}

export default function ChartsPage() {
	const { data: session, status } = useSession();
	const router = useRouter();

	const [trips, setTrips] = useState<Trip[]>([]);
	const [locations, setLocations] = useState<Location[]>([]);
	const [violations, setViolations] = useState<Violation[]>([]);
	const [chartData, setChartData] = useState<ChartData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (status === "authenticated" && !session?.user?.isAdmin) {
			router.push("/");
		}
	}, [session, status, router]);

	useEffect(() => {
		async function fetchData() {
			try {
				const [tripsRes, locationsRes, violationsRes] = await Promise.all([
					fetch("/api/trips"),
					fetch("/api/locations"),
					fetch("/api/violations"),
				]);

				const tripsData = await tripsRes.json();
				const locationsData = await locationsRes.json();
				const violationsData = await violationsRes.json();

				setTrips(tripsData.trips || []);
				setLocations(locationsData.locations || []);
				setViolations(violationsData.violations || []);
				setLoading(false);
			} catch (err) {
				console.error("Failed to fetch data:", err);
				setLoading(false);
			}
		}
		fetchData();
	}, []);

	// Process data for charts
	useEffect(() => {
		if (!trips.length && !locations.length) return;

		// Trips per day
		const tripsByDay: Record<string, { trips: number; distance: number }> = {};
		trips.forEach((trip) => {
			const date = new Date(trip.startTime).toLocaleDateString();
			if (!tripsByDay[date]) {
				tripsByDay[date] = { trips: 0, distance: 0 };
			}
			tripsByDay[date].trips++;
			tripsByDay[date].distance += trip.totalDistance || 0;
		});
		const tripsPerDay = Object.entries(tripsByDay)
			.map(([date, data]) => ({
				date,
				trips: data.trips,
				distance: Math.round(data.distance * 100) / 100,
			}))
			.slice(-7);

		// Speed distribution
		const speedRanges = [
			{ min: 0, max: 30, label: "0-30" },
			{ min: 30, max: 50, label: "30-50" },
			{ min: 50, max: 70, label: "50-70" },
			{ min: 70, max: 90, label: "70-90" },
			{ min: 90, max: 120, label: "90-120" },
			{ min: 120, max: Infinity, label: "120+" },
		];
		const speedDistribution = speedRanges.map((range) => ({
			range: range.label,
			count: locations.filter(
				(loc) => loc.speed >= range.min && loc.speed < range.max
			).length,
		}));

		// Violations by user
		const violationsByUserMap: Record<string, number> = {};
		violations.forEach((v) => {
			violationsByUserMap[v.userId] = (violationsByUserMap[v.userId] || 0) + 1;
		});
		const violationsByUser = Object.entries(violationsByUserMap).map(
			([userId, count]) => ({
				userId: userId.slice(-6),
				violations: count,
			})
		);

		// Activity by hour
		const activityByHourMap: Record<number, number> = {};
		locations.forEach((loc) => {
			const hour = new Date(loc.timestamp).getHours();
			activityByHourMap[hour] = (activityByHourMap[hour] || 0) + 1;
		});
		const activityByHour = Array.from({ length: 24 }, (_, i) => ({
			hour: `${i}:00`,
			activity: activityByHourMap[i] || 0,
		}));

		// Trip duration distribution
		const durationRanges = [
			{ min: 0, max: 5, label: "<5 min", color: "#22c55e" },
			{ min: 5, max: 15, label: "5-15 min", color: "#84cc16" },
			{ min: 15, max: 30, label: "15-30 min", color: "#eab308" },
			{ min: 30, max: 60, label: "30-60 min", color: "#f97316" },
			{ min: 60, max: Infinity, label: ">60 min", color: "#ef4444" },
		];
		const tripsDuration = durationRanges.map((range) => ({
			range: range.label,
			count: trips.filter((trip) => {
				if (!trip.endTime) return false;
				const duration =
					(new Date(trip.endTime).getTime() -
						new Date(trip.startTime).getTime()) /
					60000;
				return duration >= range.min && duration < range.max;
			}).length,
			color: range.color,
		}));

		setChartData({
			tripsPerDay,
			speedDistribution,
			violationsByUser,
			activityByHour,
			tripsDuration,
		});
	}, [trips, locations, violations]);

	if (status === "loading" || loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-xl">Loading charts...</div>
			</div>
		);
	}

	if (!session?.user?.isAdmin) {
		return <div className="p-8">Access denied</div>;
	}

	return (
		<div className="min-h-screen bg-gray-100 p-3 sm:p-8">
			<div className="max-w-7xl mx-auto">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
					<div>
						<h1 className="text-xl sm:text-3xl font-bold">
							📊 Data Visualization
						</h1>
						<p className="text-sm sm:text-base text-gray-600">
							Charts and analytics from collected data
						</p>
					</div>
					<a
						href="/admin"
						className="px-3 sm:px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm sm:text-base w-fit"
					>
						← Back
					</a>
				</div>

				{/* Stats Summary */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
					<div className="bg-white rounded-lg shadow p-3 sm:p-6 text-center">
						<p className="text-xl sm:text-3xl font-bold text-blue-600">
							{trips.length}
						</p>
						<p className="text-xs sm:text-base text-gray-600">Trips</p>
					</div>
					<div className="bg-white rounded-lg shadow p-3 sm:p-6 text-center">
						<p className="text-xl sm:text-3xl font-bold text-green-600">
							{locations.length}
						</p>
						<p className="text-xs sm:text-base text-gray-600">Data Points</p>
					</div>
					<div className="bg-white rounded-lg shadow p-3 sm:p-6 text-center">
						<p className="text-xl sm:text-3xl font-bold text-red-600">
							{violations.length}
						</p>
						<p className="text-xs sm:text-base text-gray-600">Violations</p>
					</div>
					<div className="bg-white rounded-lg shadow p-3 sm:p-6 text-center">
						<p className="text-xl sm:text-3xl font-bold text-purple-600">
							{new Set(trips.map((t) => t.userId)).size}
						</p>
						<p className="text-xs sm:text-base text-gray-600">Users</p>
					</div>
				</div>

				{chartData && (
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
						{/* Trips Over Time */}
						<div className="bg-white rounded-lg shadow p-3 sm:p-6">
							<h3 className="text-sm sm:text-lg font-semibold mb-3 sm:mb-4">
								📅 Trips Over Time
							</h3>
							<ResponsiveContainer width="100%" height={250}>
								<AreaChart data={chartData.tripsPerDay}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Tooltip />
									<Legend />
									<Area
										type="monotone"
										dataKey="trips"
										stroke="#8884d8"
										fill="#8884d8"
										fillOpacity={0.3}
										name="Number of Trips"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>

						{/* Distance Over Time */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold mb-4">
								🛣️ Distance Over Time (km)
							</h3>
							<ResponsiveContainer width="100%" height={300}>
								<LineChart data={chartData.tripsPerDay}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Tooltip />
									<Legend />
									<Line
										type="monotone"
										dataKey="distance"
										stroke="#82ca9d"
										strokeWidth={2}
										name="Distance (km)"
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>

						{/* Speed Distribution */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold mb-4">
								🚀 Speed Distribution (km/h)
							</h3>
							<ResponsiveContainer width="100%" height={300}>
								<BarChart data={chartData.speedDistribution}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="range" />
									<YAxis />
									<Tooltip />
									<Legend />
									<Bar dataKey="count" fill="#FF8042" name="Data Points" />
								</BarChart>
							</ResponsiveContainer>
						</div>

						{/* Activity by Hour */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold mb-4">
								⏰ Activity by Hour of Day
							</h3>
							<ResponsiveContainer width="100%" height={300}>
								<AreaChart data={chartData.activityByHour}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="hour" />
									<YAxis />
									<Tooltip />
									<Area
										type="monotone"
										dataKey="activity"
										stroke="#0088FE"
										fill="#0088FE"
										fillOpacity={0.3}
										name="Activity"
									/>
								</AreaChart>
							</ResponsiveContainer>
						</div>

						{/* Trip Duration Distribution */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold mb-4">
								⏱️ Trip Duration Distribution
							</h3>
							<ResponsiveContainer width="100%" height={300}>
								<PieChart>
									<Pie
										data={chartData.tripsDuration}
										cx="50%"
										cy="50%"
										labelLine={false}
										label={(entry) => {
											const data = entry as unknown as {
												range: string;
												count: number;
											};
											return data.count > 0
												? `${data.range}: ${data.count}`
												: "";
										}}
										outerRadius={100}
										fill="#8884d8"
										dataKey="count"
									>
										{chartData.tripsDuration.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						</div>

						{/* Violations by User */}
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-semibold mb-4">
								⚠️ Violations by User
							</h3>
							{chartData.violationsByUser.length > 0 ? (
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={chartData.violationsByUser} layout="vertical">
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis type="number" />
										<YAxis dataKey="userId" type="category" width={80} />
										<Tooltip />
										<Legend />
										<Bar
											dataKey="violations"
											fill="#EF4444"
											name="Violations"
										/>
									</BarChart>
								</ResponsiveContainer>
							) : (
								<div className="h-[300px] flex items-center justify-center text-gray-500">
									No violations recorded
								</div>
							)}
						</div>
					</div>
				)}

				{/* Weapon of Math Destruction Warning */}
				<div className="mt-8 bg-red-50 border border-red-400 rounded-lg p-6">
					<h3 className="text-lg font-semibold text-red-800 mb-2">
						🎯 Weapon of Math Destruction Analysis
					</h3>
					<p className="text-red-700 text-sm mb-4">
						This data visualization demonstrates how collected data can be used
						to profile users. The patterns revealed here can determine:
					</p>
					<ul className="list-disc list-inside text-red-700 text-sm space-y-1">
						<li>
							<strong>Activity patterns</strong> reveal when users are most
							active (work schedule inference)
						</li>
						<li>
							<strong>Speed distributions</strong> indicate driving behavior and
							risk profiles
						</li>
						<li>
							<strong>Trip durations</strong> suggest commute patterns and daily
							routines
						</li>
						<li>
							<strong>Violation data</strong> could be used for insurance
							discrimination
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
