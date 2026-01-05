"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { createContext, useContext, ReactNode } from "react";

interface GoogleMapsContextType {
	isLoaded: boolean;
	loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
	isLoaded: false,
	loadError: undefined,
});

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
	const { isLoaded, loadError } = useJsApiLoader({
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API || "",
	});

	return (
		<GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
			{children}
		</GoogleMapsContext.Provider>
	);
}

export function useGoogleMaps() {
	return useContext(GoogleMapsContext);
}
