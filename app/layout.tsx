import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { GoogleMapsProvider } from "@/components/GoogleMapsProvider";
import AuthProvider from "@/components/AuthProvider";
import UserTracker from "@/components/UserTracker";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Drive Tracker - Location & Speed Monitoring",
	description: "Real-time location tracking and speed monitoring system",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
				suppressHydrationWarning
			>
				<AuthProvider>
					<GoogleMapsProvider>
						<UserTracker />
						<Header />
						{children}
					</GoogleMapsProvider>
				</AuthProvider>
			</body>
		</html>
	);
}
