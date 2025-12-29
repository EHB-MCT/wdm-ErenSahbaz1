// In-memory storage for now - will be replaced with a real database later
import { LocationPoint, SpeedViolation, UserRoute } from "@/types/location";

class DataStorage {
	private locations: LocationPoint[] = [];
	private violations: SpeedViolation[] = [];
	private routes: UserRoute[] = [];

	// Add a location point
	addLocation(location: LocationPoint): void {
		this.locations.push(location);
	}

	// Get all locations for a user
	getUserLocations(userId: string): LocationPoint[] {
		return this.locations.filter((loc) => loc.userId === userId);
	}

	// Get all locations (admin use)
	getAllLocations(): LocationPoint[] {
		return this.locations;
	}

	// Add a speed violation
	addViolation(violation: SpeedViolation): void {
		this.violations.push(violation);
	}

	// Get violations for a user
	getUserViolations(userId: string): SpeedViolation[] {
		return this.violations.filter((v) => v.userId === userId);
	}

	// Get all violations (admin use)
	getAllViolations(): SpeedViolation[] {
		return this.violations;
	}

	// Get recent locations (last N locations)
	getRecentLocations(limit: number = 100): LocationPoint[] {
		return this.locations
			.sort((a, b) => b.timestamp - a.timestamp)
			.slice(0, limit);
	}

	// Get unique users
	getUniqueUsers(): string[] {
		return [...new Set(this.locations.map((loc) => loc.userId))];
	}
}

// Singleton instance
export const storage = new DataStorage();
