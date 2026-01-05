# Contributing to Drive Tracker

Thank you for your interest in contributing to Drive Tracker! This document provides guidelines for contributing to this project.

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- MongoDB (local or Atlas account)
- Google Maps API key

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/wdm-ErenSahbaz1.git
   cd wdm-ErenSahbaz1
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create your environment file:
   ```bash
   cp .env.template .env
   # Edit .env with your values
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in Issues
2. If not, create a new issue with:
   - Clear title describing the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser/device information

### Suggesting Features

1. Open an issue with the `enhancement` label
2. Describe the feature and its use case
3. Explain how it fits the "Weapon of Math Destruction" theme

### Submitting Code

1. Create a branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes following the code style below
3. Test your changes locally
4. Commit with a clear message:
   ```bash
   git commit -m "feat: add speed limit display"
   ```
5. Push and create a Pull Request

## 💻 Code Style

### TypeScript

- Use TypeScript for all new files
- Define interfaces for props and data structures
- Avoid `any` type - use proper typing

### React/Next.js

- Use functional components with hooks
- Place client components in `components/`
- Place API routes in `app/api/`
- Use `"use client"` directive only when needed

### Naming Conventions

| Type       | Convention              | Example                  |
| ---------- | ----------------------- | ------------------------ |
| Components | PascalCase              | `PersonalizedBanner.tsx` |
| Functions  | camelCase               | `calculateSpeed()`       |
| Constants  | UPPER_SNAKE             | `MAX_SPEED_LIMIT`        |
| Files      | PascalCase (components) | `Maps.tsx`               |
| API routes | lowercase               | `route.ts`               |

### Formatting

- Use tabs for indentation (project default)
- Use Prettier for formatting
- Run `npm run lint` before committing

## 📁 Project Structure

```
├── app/              # Next.js App Router pages and API
│   ├── api/          # Backend API routes
│   ├── admin/        # Admin dashboard pages
│   ├── dashboard/    # User dashboard
│   └── ...
├── components/       # React components
├── lib/              # Utilities and database
├── types/            # TypeScript type definitions
└── public/           # Static assets
```

## 🧪 Testing

Before submitting a PR:

1. Run the build to check for errors:
   ```bash
   npm run build
   ```
2. Test on both desktop and mobile viewports
3. Verify authentication flows work
4. Check the admin dashboard loads correctly

## 📜 Commit Messages

Follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Formatting (no code change)
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## ❓ Questions?

If you have questions, open an issue with the `question` label or contact:

- **Eren Sahbaz** - eren.sahbaz@student.ehb.be

## 📄 License

By contributing, you agree that your contributions will be part of this school project.
