// MongoDB initialization script
// This runs when the container is first created

db = db.getSiblingDB("drivetracker");

// Create collections
db.createCollection("users");
db.createCollection("locations");
db.createCollection("violations");
db.createCollection("trips");
db.createCollection("trackingevents");

// Create indexes for better performance
db.locations.createIndex({ userId: 1, timestamp: -1 });
db.locations.createIndex({ tripId: 1 });
db.violations.createIndex({ userId: 1, timestamp: -1 });
db.trips.createIndex({ userId: 1, startTime: -1 });
db.trips.createIndex({ isActive: 1 });
db.trackingevents.createIndex({ userId: 1, timestamp: -1 });
db.users.createIndex({ email: 1 }, { unique: true });

print("Database initialized successfully!");
