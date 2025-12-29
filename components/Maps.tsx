"use client";

import React, { useEffect, useState, useRef } from "react";
import {
	LoadScript,
	GoogleMap,
	Marker,
	Polyline,
} from "@react-google-maps/api";
import { getUserId, calculateSpeed } from "@/lib/utils";
import { LocationPoint } from "@/types/location";

const containerStyle = {
	width: "100%",
	height: "600px",
};

const defaultCenter = {
	lat: 40.7128,
	lng: -74.006,
};

// Speed limit for testing (km/h) - in real app, this would come from road data
const DEFAULT_SPEED_LIMIT = 70;

export default function Maps() {
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentSpeed, setCurrentSpeed] = useState<number>(0);
	const [isTracking, setIsTracking] = useState(true);
	const [locationHistory, setLocationHistory] = useState<LocationPoint[]>([]);

	const watchIdRef = useRef<number | null>(null);
	const lastLocationRef = useRef<LocationPoint | null>(null);
	const userIdRef = useRef<string>(getUserId());

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

	// Function to check speed violations
	const checkSpeedViolation = async (
		speed: number,
		location: LocationPoint
	) => {
		if (speed > DEFAULT_SPEED_LIMIT) {
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
						speedLimit: DEFAULT_SPEED_LIMIT,
					}),
				});
				console.warn(
					`Speed violation detected: ${speed.toFixed(
						1
					)} km/h in ${DEFAULT_SPEED_LIMIT} km/h zone`
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

		if (isTracking) {
			// Watch position continuously
			watchIdRef.current = navigator.geolocation.watchPosition(
				(position) => {
					const newLocation: LocationPoint = {
						id: `loc_${Date.now()}_${Math.random()
							.toString(36)
							.substring(2, 9)}`,
						userId: userIdRef.current,
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
					setError("Unable to get your location");
					setLoading(false);
				},
				{
					enableHighAccuracy: true,
					timeout: 5000,
					maximumAge: 0, // Always get fresh location
				}
			);
		}

		// Cleanup function
		return () => {
			if (watchIdRef.current !== null) {
				navigator.geolocation.clearWatch(watchIdRef.current);
			}
		};
	}, [isTracking]);

	const mapCenter = userLocation || defaultCenter;

	// Toggle tracking
	const toggleTracking = () => {
		setIsTracking(!isTracking);
	};

	return (
		<div className="relative w-full">
			{/* Control Panel */}
			<div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-lg">
				<h2 className="text-lg font-bold mb-2">Location Tracker</h2>

				{loading && <p className="text-gray-600">Getting location...</p>}
				{error && <p className="text-red-600">{error}</p>}

				{userLocation && (
					<div className="space-y-2">
						<p className="text-sm">
							<strong>Lat:</strong> {userLocation.lat.toFixed(6)}
						</p>
						<p className="text-sm">
							<strong>Lng:</strong> {userLocation.lng.toFixed(6)}
						</p>
						<p className="text-sm">
							<strong>Speed:</strong> {currentSpeed.toFixed(1)} km/h
						</p>
						{currentSpeed > DEFAULT_SPEED_LIMIT && (
							<p className="text-red-600 font-bold text-sm">
								⚠️ Speed limit exceeded!
							</p>
						)}
						<button
							onClick={toggleTracking}
							className={`w-full px-4 py-2 rounded text-white font-medium ${
								isTracking
									? "bg-red-500 hover:bg-red-600"
									: "bg-green-500 hover:bg-green-600"
							}`}
						>
							{isTracking ? "Stop Tracking" : "Start Tracking"}
						</button>
						<p className="text-xs text-gray-500">
							Points recorded: {locationHistory.length}
						</p>
					</div>
				)}
			</div>

			{/* LoadScript loads all the Google Maps code from Google's servers */}
			<LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API!}>
				{/* This creates the actual map on the screen */}
				<GoogleMap
					mapContainerStyle={containerStyle}
					center={mapCenter}
					zoom={userLocation ? 15 : 10}
				>
					{/* Only show a marker (red pin) if we found the user's location */}
					{userLocation && (
						<Marker position={userLocation} title="Your Location" />
					)}

					{/* Draw the path the user has traveled */}
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
			</LoadScript>
		</div>
	);
}
