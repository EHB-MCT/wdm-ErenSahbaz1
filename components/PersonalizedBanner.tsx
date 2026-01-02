"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface UserInsights {
	drivingStyle: "aggressive" | "moderate" | "careful" | "unknown";
	riskScore: number;
	averageSpeed: number;
	violationsCount: number;
	mostActiveHour: number;
	totalTrips: number;
}

interface PersonalizedContent {
	greeting: string;
	tip: string;
	alertLevel: "success" | "warning" | "danger" | "info";
	message: string;
	speedWarning?: string;
}

export default function PersonalizedBanner() {
	const { data: session } = useSession();
	const [insights, setInsights] = useState<UserInsights | null>(null);
	const [content, setContent] = useState<PersonalizedContent | null>(null);
	const [loading, setLoading] = useState(true);
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		if (!session?.user?.id) {
			setLoading(false);
			return;
		}

		async function fetchInsights() {
			try {
				const res = await fetch(`/api/user-insights`);
				if (res.ok) {
					const data = await res.json();
					setInsights(data.insights);
				}
			} catch (err) {
				console.error("Failed to fetch insights:", err);
			} finally {
				setLoading(false);
			}
		}
		fetchInsights();
	}, [session]);

	// Generate personalized content based on insights
	useEffect(() => {
		if (!insights) {
			// Default content for new users
			setContent({
				greeting: "Welcome!",
				tip: "Start tracking your drives to see personalized insights.",
				alertLevel: "info",
				message: "Track your first trip to get started.",
			});
			return;
		}

		const hour = new Date().getHours();
		let greeting = "Hello!";

		// Time-based greeting
		if (hour >= 5 && hour < 12) greeting = "Good morning!";
		else if (hour >= 12 && hour < 17) greeting = "Good afternoon!";
		else if (hour >= 17 && hour < 21) greeting = "Good evening!";
		else greeting = "Working late?";

		// Personalize based on most active hour
		if (
			insights.mostActiveHour &&
			Math.abs(hour - insights.mostActiveHour) <= 1
		) {
			greeting = "Right on schedule! This is usually when you drive.";
		}

		let tip = "";
		let alertLevel: "success" | "warning" | "danger" | "info" = "info";
		let message = "";
		let speedWarning = undefined;

		// Driving style based personalization
		if (insights.drivingStyle === "aggressive") {
			alertLevel = "danger";
			message =
				"🚨 Your driving data suggests a faster-than-average driving style.";
			tip = "Consider reducing speed by 10% to lower accident risk by 30%.";

			if (insights.riskScore > 60) {
				speedWarning = `Your risk score is ${insights.riskScore}/100. Insurance companies use this data to adjust premiums.`;
			}
		} else if (insights.drivingStyle === "moderate") {
			alertLevel = "warning";
			message =
				"⚡ You drive at moderate speeds with occasional faster moments.";
			tip =
				"You're doing well! A few adjustments could make you a safer driver.";
		} else if (insights.drivingStyle === "careful") {
			alertLevel = "success";
			message =
				"✅ You're a careful driver! Great job maintaining safe speeds.";
			tip =
				"Keep up the good driving habits. This could save you money on insurance.";
		} else {
			alertLevel = "info";
			message = "📊 We're still learning your driving patterns.";
			tip = "Complete a few more trips for personalized insights.";
		}

		// Add violation-based messaging
		if (insights.violationsCount > 10) {
			speedWarning = `⚠️ You have ${insights.violationsCount} speed violations on record. This data could affect your insurance rates.`;
		}

		setContent({
			greeting,
			tip,
			alertLevel,
			message,
			speedWarning,
		});
	}, [insights]);

	if (loading || !content || dismissed) {
		return null;
	}

	const bgColors = {
		success: "bg-green-50 border-green-400",
		warning: "bg-yellow-50 border-yellow-400",
		danger: "bg-red-50 border-red-400",
		info: "bg-blue-50 border-blue-400",
	};

	const textColors = {
		success: "text-green-800",
		warning: "text-yellow-800",
		danger: "text-red-800",
		info: "text-blue-800",
	};

	return (
		<div
			className={`${bgColors[content.alertLevel]} border-l-4 p-4 mb-6 relative`}
		>
			<button
				onClick={() => setDismissed(true)}
				className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
			>
				✕
			</button>
			<div className={textColors[content.alertLevel]}>
				<p className="font-semibold">{content.greeting}</p>
				<p className="text-sm mt-1">{content.message}</p>
				<p className="text-sm mt-1 opacity-80">💡 Tip: {content.tip}</p>
				{content.speedWarning && (
					<p className="text-sm mt-2 font-medium">{content.speedWarning}</p>
				)}
			</div>

			{/* Hidden insight data (demonstrating what data we have) */}
			<details className="mt-3">
				<summary
					className={`text-xs ${
						textColors[content.alertLevel]
					} cursor-pointer opacity-60`}
				>
					View what we know about you
				</summary>
				<div className="mt-2 text-xs space-y-1">
					{insights ? (
						<>
							<p>• Driving style: {insights.drivingStyle}</p>
							<p>• Risk score: {insights.riskScore}/100</p>
							<p>• Average speed: {insights.averageSpeed} km/h</p>
							<p>• Total violations: {insights.violationsCount}</p>
							<p>• Total trips: {insights.totalTrips}</p>
							<p>• Most active hour: {insights.mostActiveHour}:00</p>
						</>
					) : (
						<p>No data collected yet</p>
					)}
				</div>
			</details>
		</div>
	);
}
