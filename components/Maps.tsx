"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useGoogleMaps } from "./GoogleMapsProvider";
import {
	calculateSpeed,
	estimateSpeedLimit,
	isSpeedViolation,
} from "@/lib/utils";
import { LocationPoint } from "@/types/location";

const containerStyle = {
	width: "100%",
	height: "100%",
	minHeight: "400px",
};

// Default to Brussels, Belgium
const defaultCenter = {
	lat: 50.8503,
	lng: 4.3517,
};

// Keep track of recent speeds for better road type estimation
const MAX_RECENT_SPEEDS = 10;

export default function Maps() {
	const { isLoaded, loadError } = useGoogleMaps();
	const { data: session } = useSession();
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentSpeed, setCurrentSpeed] = useState<number>(0);
	const [isTracking, setIsTracking] = useState(true);
	const [locationHistory, setLocationHistory] = useState<LocationPoint[]>([]);
	const [usingDefaultLocation, setUsingDefaultLocation] = useState(false);
	const [currentSpeedLimit, setCurrentSpeedLimit] = useState<number>(50);
	const [roadType, setRoadType] = useState<string>("Urban Road");
	const [limitConfidence, setLimitConfidence] = useState<number>(50);

	const watchIdRef = useRef<number | null>(null);
	const lastLocationRef = useRef<LocationPoint | null>(null);
	const recentSpeedsRef = useRef<number[]>([]);

	const userId = session?.user?.id;

	// Use default location when geolocation fails
	const useDefaultLocation = () => {
		setUserLocation(defaultCenter);
		setUsingDefaultLocation(true);
		setError(null);
		setLoading(false);
		setIsTracking(false);
	};

	// Function to send location to server
	const sendLocationToServer = async (location: LocationPoint) => {
		try {
			await fetch("/api/locations", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: location.userId,
					latitude: location.latitude,
					longitude: location.longitude,
					speed: location.speed,
					accuracy: location.accuracy,
					heading: location.heading,
				}),
			});
		} catch (error) {
			console.error("Failed to send location to server:", error);
		}
	};

	/**
	 * Check for speed violations using smart speed limit estimation
	 *
	 * This function estimates the speed limit based on:
	 * - Current driving speed
	 * - Recent speed history (to determine road type)
	 * - Time of day (rush hour, school hours, night)
	 *
	 * Note: This estimation can be wrong, which is a key point
	 * of the "Weapon of Math Destruction" concept - algorithms
	 * make decisions that affect users based on imperfect data.
	 */
	const checkSpeedViolation = async (
		speed: number,
		location: LocationPoint
	) => {
		// Update recent speeds buffer for better estimation
		recentSpeedsRef.current.push(speed);
		if (recentSpeedsRef.current.length > MAX_RECENT_SPEEDS) {
			recentSpeedsRef.current.shift();
		}

		// Estimate speed limit based on driving patterns
		const estimate = estimateSpeedLimit(
			speed,
			recentSpeedsRef.current,
			new Date().getHours()
		);

		// Update UI with current estimate
		setCurrentSpeedLimit(estimate.limit);
		setRoadType(estimate.roadType);
		setLimitConfidence(estimate.confidence);

		// Check if this is a violation (with 5 km/h tolerance for GPS error)
		if (isSpeedViolation(speed, estimate.limit, 5)) {
			try {
				await fetch("/api/violations", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						userId: location.userId,
						latitude: location.latitude,
						longitude: location.longitude,
						actualSpeed: speed,
						speedLimit: estimate.limit,
						roadType: estimate.roadType,
						confidence: estimate.confidence,
					}),
				});
				console.warn(
					`Speed violation detected: ${speed.toFixed(1)} km/h in estimated ${
						estimate.limit
					} km/h zone (${estimate.roadType})`
				);
			} catch (error) {
				console.error("Failed to report violation:", error);
			}
		}
	};

	// Start continuous location tracking
	useEffect(() => {
		if (!navigator.geolocation) {
			setError("Geolocation is not supported by this browser");
			setLoading(false);
			return;
		}

		// Wait for user ID to be fetched
		if (!userId) {
			return;
		}

		if (isTracking) {
			// Watch position continuously
			watchIdRef.current = navigator.geolocation.watchPosition(
				(position) => {
					const newLocation: LocationPoint = {
						id: `loc_${Date.now()}_${Math.random()
							.toString(36)
							.substring(2, 9)}`,
						userId: userId,
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						timestamp: Date.now(),
						speed: position.coords.speed
							? position.coords.speed * 3.6
							: undefined, // Convert m/s to km/h
						accuracy: position.coords.accuracy,
						heading: position.coords.heading || undefined,
					};

					// Update map position
					setUserLocation({
						lat: newLocation.latitude,
						lng: newLocation.longitude,
					});

					// Calculate speed if we have a previous location
					if (lastLocationRef.current) {
						const calculatedSpeed = calculateSpeed(
							lastLocationRef.current,
							newLocation
						);

						// Use GPS speed if available, otherwise use calculated speed
						const speed = newLocation.speed || calculatedSpeed;
						setCurrentSpeed(speed);
						newLocation.speed = speed;

						// Check for speed violations
						checkSpeedViolation(speed, newLocation);
					}

					// Save location to history
					setLocationHistory((prev) => [...prev.slice(-49), newLocation]); // Keep last 50 points

					// Send to server
					sendLocationToServer(newLocation);

					// Update reference
					lastLocationRef.current = newLocation;
					setLoading(false);
				},
				(error) => {
					console.error("Error getting location:", error);
					let errorMessage = "Unable to get your location";

					switch (error.code) {
						case error.PERMISSION_DENIED:
							errorMessage =
								"Location permission denied. Please allow location access in your browser settings.";
							break;
						case error.POSITION_UNAVAILABLE:
							errorMessage =
								"Location information is unavailable. Make sure location services are enabled.";
							break;
						case error.TIMEOUT:
							errorMessage =
								"Location request timed out. Retrying with lower accuracy...";
							// Try again with lower accuracy settings
							navigator.geolocation.getCurrentPosition(
								(position) => {
									setUserLocation({
										lat: position.coords.latitude,
										lng: position.coords.longitude,
									});
									setError(null);
									setLoading(false);
								},
								() => {
									setError(
										"Could not get location. Please check your location settings."
									);
									setLoading(false);
								},
								{ enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
							);
							return;
					}

					setError(errorMessage);
					setLoading(false);
				},
				{
					enableHighAccuracy: true,
					timeout: 15000,
					maximumAge: 5000, // Allow slightly cached location
				}
			);
		}

		// Cleanup function
		return () => {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
		};
	}, [isTracking, userId]);

	const mapCenter = userLocation || defaultCenter;

	// Toggle tracking
	const toggleTracking = () => {
		setIsTracking(!isTracking);
	};

	return (
		<div className="relative w-full h-[calc(100vh-200px)] min-h-[400px] sm:h-[500px] md:h-[600px]">
			{/* Control Panel - Responsive positioning */}
			<div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-auto z-10 bg-white p-3 sm:p-4 rounded-lg shadow-lg sm:max-w-xs">
				<h2 className="text-base sm:text-lg font-bold mb-2">
					Location Tracker
				</h2>

				{loading && (
					<p className="text-gray-600 text-sm">Getting location...</p>
				)}
				{error && (
					<div className="space-y-2">
						<p className="text-red-600 text-xs sm:text-sm">{error}</p>
						<button
							onClick={useDefaultLocation}
							className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm"
						>
							Use Default Location (Brussels)
						</button>
					</div>
				)}

				{usingDefaultLocation && (
					<p className="text-yellow-600 text-xs sm:text-sm mb-2">
						Using default location (demo mode)
					</p>
				)}

				{userLocation && (
					<div className="space-y-2">
						<div className="grid grid-cols-2 gap-2 sm:block sm:space-y-2">
							<p className="text-xs sm:text-sm">
								<strong>Lat:</strong> {userLocation.lat.toFixed(4)}
							</p>
							<p className="text-xs sm:text-sm">
								<strong>Lng:</strong> {userLocation.lng.toFixed(4)}
							</p>
						</div>
						<p className="text-sm sm:text-base font-semibold">
							<strong>Speed:</strong> {currentSpeed.toFixed(1)} km/h
						</p>

						{/* Dynamic Speed Limit Display */}
						<div className="bg-gray-100 rounded p-2 text-xs sm:text-sm">
							<div className="flex justify-between items-center">
								<span className="font-medium">Limit:</span>
								<span
									className={`font-bold ${
										currentSpeed > currentSpeedLimit
											? "text-red-600"
											: "text-green-600"
									}`}
								>
									{currentSpeedLimit} km/h
								</span>
							</div>
							<p className="text-gray-600 text-xs mt-1">{roadType}</p>
							<div className="flex items-center gap-1 mt-1">
								<span className="text-xs text-gray-500">Confidence:</span>
								<div className="flex-1 bg-gray-300 rounded-full h-1.5">
									<div
										className={`h-1.5 rounded-full ${
											limitConfidence > 70
												? "bg-green-500"
												: limitConfidence > 50
												? "bg-yellow-500"
												: "bg-red-500"
										}`}
										style={{ width: `${limitConfidence}%` }}
									></div>
								</div>
								<span className="text-xs text-gray-500">
									{limitConfidence}%
								</span>
							</div>
						</div>

						{currentSpeed > currentSpeedLimit && (
							<p className="text-red-600 font-bold text-xs sm:text-sm animate-pulse">
								⚠️ Speed limit exceeded! (+
								{(currentSpeed - currentSpeedLimit).toFixed(0)} km/h)
							</p>
						)}
						<button
							onClick={toggleTracking}
							className={`w-full px-3 sm:px-4 py-2 rounded text-white font-medium text-sm ${
								isTracking
									? "bg-red-500 hover:bg-red-600"
									: "bg-green-500 hover:bg-green-600"
							}`}
						>
							{isTracking ? "Stop Tracking" : "Start Tracking"}
						</button>
						<p className="text-xs text-gray-500">
							Points: {locationHistory.length}
						</p>
					</div>
				)}
			</div>

			{loadError && (
				<div className="h-full flex items-center justify-center bg-gray-100">
					<p className="text-red-600">Error loading maps</p>
				</div>
			)}

			{!isLoaded && !loadError && (
				<div className="h-full flex items-center justify-center bg-gray-100">
					<p className="text-gray-600">Loading map...</p>
				</div>
			)}

			{isLoaded && (
				<GoogleMap
					mapContainerStyle={containerStyle}
					center={mapCenter}
					zoom={userLocation ? 15 : 10}
				>
					{userLocation && (
						<Marker position={userLocation} title="Your Location" />
					)}

					{locationHistory.length > 1 && (
						<Polyline
							path={locationHistory.map((loc) => ({
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
				</GoogleMap>
			)}
		</div>
	);
}
