"use client";

import React, { useEffect, useState } from "react";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api";

const containerStyle = {
	width: "100%",
	height: "600px",
};

const defaultCenter = {
	lat: 40.7128,
	lng: -74.006,
};

export default function Maps() {
	const [userLocation, setUserLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isTracking, setIsTracking] = useState(false);

	useEffect(() => {
		let watchId: number | null = null; // This will remember our tracking ID
		if (navigator.geolocation) {
			setIsTracking(true);
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    console.log("new location detected")
                }
            )
		} else {
			setError("Geolocation is not supported by this browser");
			setLoading(false);
		}
	}, []);

	const mapCenter = userLocation || defaultCenter;

	return (
		<>
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
						<Marker
							position={userLocation} // Put the pin exactly where the user is
							title="Your Location" // When they hover over the pin, show this text
						/>
					)}
				</GoogleMap>
			</LoadScript>
		</>
	);
}
