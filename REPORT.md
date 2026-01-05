# Drive Tracker - Written Report

**Course:** Development 5
**Student:** Eren Sahbaz  
**Project:** Weapon of Math Destruction  
**Date:** January 2026

---

## 1. Project Overview

### 1.1 Concept

Drive Tracker is a "Weapon of Math Destruction" (WMD) - a term coined by Cathy O'Neil to describe algorithmic systems that collect data about people and use it to make decisions that can significantly impact their lives, often in opaque and unfair ways.

This project simulates how a company (like an insurance provider or fleet management service) could collect driving data and use it to:

1. **Profile users** - Determine driving style, risk level, home/work locations
2. **Influence behavior** - Show personalized warnings and tips based on driving patterns
3. **Enable discrimination** - Generate "risk scores" that could affect insurance premiums

### 1.2 Core Features

| Feature           | Description                                         |
| ----------------- | --------------------------------------------------- |
| Location Tracking | Real-time GPS tracking via browser geolocation API  |
| Speed Monitoring  | Calculate speed from GPS or device sensors          |
| Trip Detection    | Automatically detect when a user starts/ends a trip |
| Violation Logging | Record speed violations with estimated limits       |
| User Profiling    | Infer driving style, home/work locations, schedules |
| Personalized UI   | Banner that changes based on user profile data      |
| Admin Dashboard   | View all users, their data, and analytics           |

---

## 2. Technical Implementation

### 2.1 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                │
├─────────────────────────────────────────────────────────┤
│  Maps.tsx          │  PersonalizedBanner.tsx           │
│  (Location tracking)│  (Data-influenced UI)            │
│  UserTracker.tsx   │  Dashboard pages                  │
│  (Behavior tracking)│  Admin pages                     │
├─────────────────────────────────────────────────────────┤
│                    API Routes (Next.js)                 │
├─────────────────────────────────────────────────────────┤
│  /api/locations    │  /api/violations                  │
│  /api/trips        │  /api/analytics                   │
│  /api/tracking     │  /api/user-insights               │
├─────────────────────────────────────────────────────────┤
│                    Database (MongoDB)                   │
│  Users │ Locations │ Trips │ Violations │ TrackingEvents│
└─────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

1. **Collection**: Browser's Geolocation API sends coordinates every few seconds
2. **Processing**: Server calculates speed, detects trips, estimates speed limits
3. **Storage**: MongoDB stores all location points, violations, and events
4. **Analysis**: Analytics API aggregates data into user profiles
5. **Influence**: PersonalizedBanner component fetches profile and adjusts UI

### 2.3 Key Algorithms

#### Speed Limit Estimation

Since real road speed limit data requires expensive APIs, I implemented a **smart estimation algorithm** based on driving patterns:

```typescript
// Simplified logic from lib/utils.ts
if (speed > 100) → Highway (120 km/h limit)
if (speed > 75)  → Regional road (90 km/h limit)
if (speed > 55)  → Secondary road (70 km/h limit)
if (speed > 35)  → Urban road (50 km/h limit)
if (speed > 20)  → Residential (30-50 km/h limit)
else             → Zone 30 or traffic
```

This algorithm also considers:

- Time of day (rush hour, school hours, night)
- Recent speed history (to determine road type context)

#### Risk Score Calculation

```typescript
// From api/user-insights
riskScore = min(100, violations * 5 + (avgSpeed > 50 ? 20 : 0));
```

#### Driving Style Classification

| Style      | Criteria                         |
| ---------- | -------------------------------- |
| Aggressive | avgSpeed > 60 OR violations > 10 |
| Moderate   | avgSpeed > 45 OR violations > 3  |
| Careful    | Low speed, few violations        |

---

## 3. How Data Influences the UI

The **PersonalizedBanner** component demonstrates the WMD concept by changing its appearance and message based on user data:

### 3.1 Visual Changes

| Driving Style | Banner Color        | Icon |
| ------------- | ------------------- | ---- |
| Aggressive    | 🔴 Red (danger)     | 🚨   |
| Moderate      | 🟡 Yellow (warning) | ⚡   |
| Careful       | 🟢 Green (success)  | ✅   |
| Unknown       | 🔵 Blue (info)      | 📊   |

### 3.2 Message Personalization

- **Time-based greeting**: "Good morning!" / "Working late?"
- **Schedule awareness**: "Right on schedule! This is usually when you drive."
- **Risk warnings**: "Your risk score is 75/100. Insurance companies use this data."
- **Violation alerts**: "You have 15 speed violations on record."

### 3.3 The "What We Know About You" Section

A collapsible section shows users exactly what data has been collected:

- Driving style classification
- Risk score
- Average speed
- Violation count
- Total trips
- Most active driving hour

This transparency is intentional - it demonstrates how much can be inferred from location data alone.

---

## 4. Outcomes

### 4.1 What Worked Well

1. **Real-time tracking** - The geolocation API works reliably on modern browsers
2. **Trip detection** - The algorithm correctly identifies when users start/stop driving
3. **Data visualization** - Charts provide clear insights into driving patterns
4. **User profiling** - Successfully infers home/work locations from timestamp patterns
5. **Responsive design** - Works well on both desktop and mobile devices
6. **Docker deployment** - Easy to deploy with docker-compose

### 4.2 Demonstration of WMD Concepts

The project successfully demonstrates:

- **Data collection at scale**: Every location point is stored and never deleted
- **Algorithmic inference**: Home/work locations are inferred without user input
- **Opaque scoring**: Risk scores are calculated but the exact formula is hidden
- **Behavioral nudging**: UI changes to influence user behavior
- **Potential for discrimination**: Risk scores could affect real-world outcomes

---

## 5. Shortcomings & Limitations

### 5.1 Technical Limitations

| Issue                                   | Impact                              | Reason                                   |
| --------------------------------------- | ----------------------------------- | ---------------------------------------- |
| **Google Maps API key required**        | Goes against "no external API" rule | No free alternative for maps             |
| **Speed limit estimation is imperfect** | False violations possible           | Real speed limit data requires paid APIs |
| **GPS accuracy varies**                 | Speed calculations can be off       | Device/environment dependent             |
| **HTTPS required for mobile**           | Extra setup for testing             | Browser security requirement             |

### 5.2 Conceptual Limitations

1. **No real consequences** - In a real WMD, the risk score would affect insurance premiums, job applications, or loan approvals. This demo only shows warnings.

2. **User awareness** - Real WMDs often operate without user knowledge. This app is transparent by design (for educational purposes).

3. **Single data source** - Real systems combine multiple data sources (driving data + social media + purchase history + etc.)

### 5.3 Missing Features

- Real-time traffic data integration
- Weather-based risk adjustment
- Comparison with other drivers ("You drive faster than 80% of users")
- Historical trend analysis ("Your driving has improved this month")

---

## 6. Ethical Considerations

### 6.1 The WMD Problem

This project illustrates several concerning aspects of data-driven systems:

1. **Feedback loops**: Aggressive drivers get higher risk scores → higher insurance → more financial stress → potentially more aggressive driving

2. **Proxy discrimination**: Location patterns could reveal socioeconomic status, neighborhood, workplace - enabling discrimination without explicitly using protected characteristics

3. **Lack of recourse**: If the algorithm marks you as "high risk," how do you appeal? The decision is opaque.

4. **Data permanence**: Every violation is recorded forever. A single bad day affects your score indefinitely.

### 6.2 Real-World Parallels

- **Insurance telematics** (Progressive Snapshot, Allstate Drivewise)
- **Uber driver ratings**
- **Social credit systems**
- **Predictive policing**

---

## 7. Insights & Learnings

### 7.1 Technical Learnings

1. **Next.js 15 App Router** - Learned the new app directory structure, server components, and API routes
2. **NextAuth.js** - Implemented JWT-based authentication with credentials provider
3. **MongoDB/Mongoose** - Schema design for time-series location data
4. **Geolocation API** - Browser limitations, accuracy issues, permission handling
5. **Responsive Design** - Mobile-first approach with Tailwind CSS

### 7.2 Conceptual Insights

1. **Small data, big inferences** - Just GPS coordinates + timestamps reveal home, work, schedule, habits
2. **Algorithms seem neutral but aren't** - Speed limit estimation favors certain driving patterns
3. **UI design is manipulation** - Color choices and wording influence user perception
4. **Transparency doesn't solve everything** - Even knowing you're tracked doesn't reduce the power imbalance

### 7.3 What I Would Do Differently

1. Use a simpler map solution (Leaflet with OpenStreetMap) to avoid API key requirement
2. Implement data retention policies (auto-delete after X days)
3. Add "data export" feature for user transparency
4. Create a "what if" simulator showing how different driving would affect scores

---

## 8. Conclusion

Drive Tracker successfully demonstrates how a "Weapon of Math Destruction" operates:

1. **Collect** seemingly innocent data (just GPS coordinates)
2. **Process** it into profiles and scores
3. **Influence** user behavior through UI manipulation
4. **Enable** potential discrimination through opaque algorithms

The project meets the assignment requirements:

- ✅ User-facing part influenced by collected data
- ✅ Backend that gathers, sorts, filters, and stores data
- ✅ Admin dashboard for data visualization
- ✅ Docker environment for deployment
- ✅ Individual user level tracking (UID)

Most importantly, it raises awareness about how similar systems operate in the real world, often without user knowledge or consent.

---

## 9. References

### Literature

- O'Neil, C. (2016). _Weapons of Math Destruction: How Big Data Increases Inequality and Threatens Democracy_

### Technical Documentation

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [MongoDB/Mongoose](https://mongoosejs.com/)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Geolocation API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

### AI Assistance

This project was developed with assistance from GitHub Copilot (Claude) for code structure, debugging, and documentation.


