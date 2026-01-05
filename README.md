# 🚗 Drive Tracker - Weapon of Math Destruction

A location tracking web application that demonstrates how data collection can be used to profile users and influence their experience. Built as part of the Dev5 course at Erasmushogeschool Brussel.

## 📖 Project Overview

This project is a **"Weapon of Math Destruction"** - a system that collects user data, builds profiles, and uses that data to influence the user experience. It simulates how companies like insurance providers, ride-sharing apps, or fleet management systems could use driving data to profile and potentially discriminate against users.

### What It Does

1. **Collects** - GPS location, speed, timestamps, driving patterns
2. **Profiles** - Infers home/work locations, driving style, risk scores
3. **Influences** - Changes UI based on user profile (personalized warnings, tips)
4. **Administrates** - Dashboard for viewing and analyzing all user data

## ✨ Features

### User-Facing

- 📍 Real-time GPS tracking with Google Maps
- 🚦 Dynamic speed limit estimation based on driving patterns
- ⚠️ Speed violation detection and logging
- 🎯 Personalized banner that changes based on your driving profile
- 📊 Personal dashboard with trip history and statistics

### Admin Dashboard

- 👥 View all users and their data
- 🗺️ Live map with all user locations
- 📈 Data visualization with charts
- 🔍 User profiling - inferred home/work locations
- ⚡ Risk scoring and driving behavior analysis

### Data Collection

- Location coordinates (latitude, longitude)
- Speed at each point
- Timestamps
- Trip detection (start/end)
- Violation records
- Device accuracy and heading

## 🛠️ Tech Stack

| Category             | Technology                 |
| -------------------- | -------------------------- |
| **Framework**        | Next.js 15 (App Router)    |
| **Language**         | TypeScript                 |
| **Database**         | MongoDB Atlas + Mongoose   |
| **Authentication**   | NextAuth.js (Credentials)  |
| **Maps**             | Google Maps JavaScript API |
| **Styling**          | Tailwind CSS               |
| **Charts**           | Recharts                   |
| **Containerization** | Docker + Docker Compose    |

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Google Maps API key
- MongoDB (local or Atlas)

### Quick Start with Docker

```bash
# 1. Clone the repository
git clone https://github.com/EHB-MCT/wdm-ErenSahbaz1.git
cd wdm-ErenSahbaz1

# 2. Create environment file
cp .env.template .env
# Edit .env with your values

# 3. Run with Docker
docker compose up --build
```

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.template .env
# Edit .env with your values

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── locations/    # Location data endpoints
│   │   ├── trips/        # Trip management
│   │   ├── violations/   # Speed violations
│   │   ├── analytics/    # Data analytics
│   │   └── admin/        # Admin endpoints
│   ├── admin/            # Admin dashboard pages
│   ├── dashboard/        # User dashboard
│   ├── login/            # Authentication pages
│   └── register/
├── components/
│   ├── Maps.tsx          # Main tracking component
│   ├── Header.tsx        # Navigation
│   ├── PersonalizedBanner.tsx  # Data-influenced UI
│   └── GoogleMapsProvider.tsx
├── lib/
│   ├── mongodb.ts        # Database connection
│   ├── models.ts         # Mongoose schemas
│   ├── tripDetection.ts  # Trip detection algorithm
│   ├── utils.ts          # Speed estimation & helpers
│   └── authOptions.ts    # NextAuth configuration
└── types/
    └── location.ts       # TypeScript interfaces
```

## 🔐 Environment Variables

See `.env.template` for all required variables:

| Variable                      | Description               |
| ----------------------------- | ------------------------- |
| `NEXT_PUBLIC_GOOGLE_MAPS_API` | Google Maps API key       |
| `MONGODB_URI`                 | MongoDB connection string |
| `NEXTAUTH_SECRET`             | Secret for JWT signing    |
| `NEXTAUTH_URL`                | Base URL of the app       |

## 📊 How Data Influences UI

The `PersonalizedBanner` component demonstrates how collected data changes the user experience:

| Driving Style | Banner Color | Message                  |
| ------------- | ------------ | ------------------------ |
| Aggressive    | 🔴 Red       | Warning about risk score |
| Moderate      | 🟡 Yellow    | Tips for improvement     |
| Careful       | 🟢 Green     | Positive reinforcement   |

The banner also considers:

- Time of day (greets based on typical driving schedule)
- Violation count (warns about insurance implications)
- Risk score (shows potential consequences)

## ⚠️ Known Limitations

1. **Google Maps API Key Required** - The project requires a Google Maps API key. This goes against the "no external API keys" requirement, but was necessary for proper map visualization.

2. **Speed Limit Estimation** - Since real road speed limit data is not freely available, we estimate limits based on driving speed. This can lead to false violations.

3. **GPS Accuracy** - Mobile GPS can be inaccurate, especially in urban areas or tunnels.

4. **HTTPS Required** - Location tracking on mobile devices requires HTTPS. For local development, use localhost.

## 📚 Documentation & Sources

### Libraries Used

- [Next.js 15](https://nextjs.org/docs) - React framework
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Mongoose](https://mongoosejs.com/) - MongoDB ODM
- [Google Maps React](https://www.npmjs.com/package/@react-google-maps/api) - Maps integration
- [Recharts](https://recharts.org/) - Data visualization
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) - Password hashing

### Tutorials & Guides

- [Next.js App Router Tutorial](https://nextjs.org/learn) - Official Next.js learning path
- [NextAuth.js Credentials Provider](https://next-auth.js.org/providers/credentials) - Authentication setup
- [Geolocation API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) - Browser location tracking
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) - Map integration
- [Docker Compose Tutorial](https://docs.docker.com/compose/gettingstarted/) - Container orchestration

### Algorithm References

- [Haversine Formula](https://en.wikipedia.org/wiki/Haversine_formula) - Distance calculation between GPS coordinates
- [Speed Calculation from GPS](https://stackoverflow.com/questions/639695/how-to-convert-latitude-or-longitude-to-meters) - Converting coordinates to distance

### Concept & Inspiration

- [GDPR and Location Data](https://gdpr.eu/article-9-processing-special-categories-of-personal-data-prohibited/) - Privacy implications of tracking

### Stack Overflow & Community Help

- [Next.js with Docker](https://github.com/vercel/next.js/tree/canary/examples/with-docker) - Official Docker example
- [NextAuth JWT Session](https://next-auth.js.org/configuration/options#session) - Session configuration
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design) - Mobile-first CSS utilities

### AI Assistance

This project was developed with assistance from GitHub Copilot (Claude) for:

- Code structure and architecture
- Bug fixes and debugging
- Responsive design implementation
- Documentation

## 👤 Author

**Eren Sahbaz**

- GitHub: [@ErenSahbaz1](https://github.com/ErenSahbaz1)
- Email: eren.sahbaz@student.ehb.be

MCT Student @ Erasmushogeschool Brussel

## 📄 License

This project is part of a school assignment for Dev5 at EHB.
