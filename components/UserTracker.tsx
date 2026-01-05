"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

// Generate a unique session ID
function generateSessionId(): string {
	return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get or create session ID from sessionStorage
function getSessionId(): string {
	if (typeof window === "undefined") return "";

	let sessionId = sessionStorage.getItem("tracking_session_id");
	if (!sessionId) {
		sessionId = generateSessionId();
		sessionStorage.setItem("tracking_session_id", sessionId);
	}
	return sessionId;
}

// Get device info
function getDeviceInfo() {
	if (typeof window === "undefined") return {};

	const nav = navigator as Navigator & {
		connection?: { effectiveType?: string };
		userAgentData?: { platform?: string };
	};

	return {
		userAgent: navigator.userAgent,
		language: navigator.language,
		platform: nav.userAgentData?.platform || navigator.platform,
		screenWidth: screen.width,
		screenHeight: screen.height,
		windowWidth: window.innerWidth,
		windowHeight: window.innerHeight,
		colorDepth: screen.colorDepth,
		pixelRatio: window.devicePixelRatio,
		touchSupport: "ontouchstart" in window,
		cookiesEnabled: navigator.cookieEnabled,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		connection: nav.connection?.effectiveType || "unknown",
	};
}

export default function UserTracker() {
	const { data: session } = useSession();
	const pathname = usePathname();
	const lastPathRef = useRef<string>("");
	const pageStartTimeRef = useRef<number>(Date.now());
	const mousePositionsRef = useRef<Array<{ x: number; y: number; t: number }>>(
		[]
	);
	const isTrackingRef = useRef(false);

	const userId = session?.user?.id || "anonymous";

	// Send tracking event to server
	const track = useCallback(
		async (eventType: string, data: Record<string, unknown> = {}) => {
			if (!userId) return;

			try {
				await fetch("/api/tracking", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId,
						sessionId: getSessionId(),
						eventType,
						page: pathname,
						referrer: document.referrer,
						data,
						device: getDeviceInfo(),
					}),
				});
			} catch (error) {
				// Silently fail - don't disrupt user experience
				console.debug("Tracking failed:", error);
			}
		},
		[userId, pathname]
	);

	// Track page views
	useEffect(() => {
		if (pathname !== lastPathRef.current) {
			// Track time spent on previous page
			if (lastPathRef.current) {
				const duration = Math.round(
					(Date.now() - pageStartTimeRef.current) / 1000
				);
				track("page_leave", {
					previousPage: lastPathRef.current,
					duration,
				});
			}

			// Track new page view
			track("pageview", {
				title: document.title,
			});

			lastPathRef.current = pathname;
			pageStartTimeRef.current = Date.now();
		}
	}, [pathname, track]);

	// Track session start
	useEffect(() => {
		if (isTrackingRef.current) return;
		isTrackingRef.current = true;

		// Check if this is a new session
		const lastActivity = sessionStorage.getItem("last_activity");
		const now = Date.now();

		if (!lastActivity || now - parseInt(lastActivity) > 30 * 60 * 1000) {
			// New session (30 min inactivity threshold)
			track("session_start", {
				isNewUser: !localStorage.getItem("returning_user"),
			});
			localStorage.setItem("returning_user", "true");
		}

		sessionStorage.setItem("last_activity", String(now));
	}, [track]);

	// Set up event listeners
	useEffect(() => {
		if (typeof window === "undefined") return;

		// Track clicks
		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			track("click", {
				elementId: target.id || undefined,
				elementClass: target.className || undefined,
				elementText: target.textContent?.slice(0, 50) || undefined,
				elementTag: target.tagName,
				x: e.clientX,
				y: e.clientY,
			});
		};

		// Track scroll (debounced)
		let scrollTimeout: NodeJS.Timeout;
		const handleScroll = () => {
			clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
				const scrollPercent = Math.round(
					(window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
						100
				);
				track("scroll", {
					scrollY: window.scrollY,
					scrollPercent: Math.min(100, Math.max(0, scrollPercent)),
				});
			}, 500);
		};

		// Track mouse movement (batched)
		const handleMouseMove = (e: MouseEvent) => {
			mousePositionsRef.current.push({
				x: e.clientX,
				y: e.clientY,
				t: Date.now(),
			});

			// Send batch every 50 positions
			if (mousePositionsRef.current.length >= 50) {
				track("mousemove", {
					positions: mousePositionsRef.current,
				});
				mousePositionsRef.current = [];
			}
		};

		// Track visibility changes
		const handleVisibilityChange = () => {
			if (document.hidden) {
				track("tab_hidden", {
					duration: Math.round((Date.now() - pageStartTimeRef.current) / 1000),
				});
			} else {
				track("tab_visible", {});
				pageStartTimeRef.current = Date.now();
			}
		};

		// Track before unload
		const handleBeforeUnload = () => {
			const duration = Math.round(
				(Date.now() - pageStartTimeRef.current) / 1000
			);

			// Use sendBeacon for reliable tracking on page close
			navigator.sendBeacon(
				"/api/tracking",
				JSON.stringify({
					userId,
					sessionId: getSessionId(),
					eventType: "session_end",
					page: pathname,
					data: {
						duration,
						totalMousePositions: mousePositionsRef.current.length,
					},
					device: getDeviceInfo(),
				})
			);
		};

		// Add listeners
		document.addEventListener("click", handleClick);
		window.addEventListener("scroll", handleScroll, { passive: true });
		document.addEventListener("mousemove", handleMouseMove, { passive: true });
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("beforeunload", handleBeforeUnload);

		// Cleanup
		return () => {
			document.removeEventListener("click", handleClick);
			window.removeEventListener("scroll", handleScroll);
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("beforeunload", handleBeforeUnload);
			clearTimeout(scrollTimeout);
		};
	}, [track, userId, pathname]);

	// This component doesn't render anything
	return null;
}
