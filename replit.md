# UniWall

## Overview

UniWall is a university-specific anonymous social wall app built with Expo (React Native) on the frontend and Express.js on the backend. Students select their university during onboarding, then can post anonymously to their campus "wall," comment on posts, vote, report content, watch/upload Reels, and chat with other users. Features include secret key authentication, admin panel, ad system, and gzip compression. The app targets mobile (iOS/Android) and web platforms with a dark cyber-campus aesthetic (#0F172A background, #A855F7 purple accents).

## User Preferences

Preferred communication style: Simple, everyday language. User speaks Urdu/Roman Urdu.

## Recent Changes (Feb 2026)

- Migrated from in-memory storage to PostgreSQL database with Drizzle ORM
- Added secret key authentication: 16-char key (XXXX-XXXX-XXXX-XXXX) generated on registration, required for login, no recovery
- Built admin panel at /admin route (HTML page served by Express on port 5000) with login, dashboard stats, and CRUD for posts/users/ads/reels
- Created ad management system with 8 placement zones (feed, top_banner, bottom_banner, inbox, profile, reels, splash, comment) and priority ordering
- Implemented gzip compression for messages and video data storage
- Added Reels screen with video upload (up to 3 minutes), permanently stored in database
- Updated to 4-tab navigation: Wall, Reels, Inbox, Profile
- Integrated ad display components: FeedAd between posts, AdBanner for various placements
- Enhanced onboarding with login/register modes and secret key display after registration
- Secret key visible on Profile screen for reference
- User registration with server-side user records

## System Architecture

### Frontend (Expo / React Native)

- **Framework**: Expo SDK 54 with expo-router for file-based routing
- **State Management**: React Context (`UniversityContext`) for user session/profile state, TanStack React Query for server state (posts, comments, chats, reels, ads)
- **Navigation**: Single `index` screen that conditionally renders `OnboardingScreen` or `MainApp` (which contains a custom tab bar switching between Wall, Reels, Inbox, and Profile)
- **Routing approach**: The app uses expo-router but effectively has a single-page architecture — all major screens are components rendered conditionally within `app/index.tsx` rather than separate routes
- **Styling**: Plain React Native `StyleSheet` with a centralized dark theme in `constants/colors.ts`
- **Fonts**: Outfit font family loaded via `@expo-google-fonts/outfit`
- **Local persistence**: `@react-native-async-storage/async-storage` stores university selection, display name, gender, user ID, secret key, and TOS acceptance
- **Animations**: `react-native-reanimated` for micro-interactions (shake effects, fade-ins, vote animations)
- **Haptics**: `expo-haptics` for tactile feedback on interactions (non-web)
- **Clipboard**: `expo-clipboard` for copying secret key during onboarding

### Backend (Express.js)

- **Runtime**: Express 5 running on Node.js, TypeScript compiled with `tsx` (dev) or `esbuild` (prod)
- **API**: RESTful JSON API under `/api/` prefix with routes for posts, comments, votes, reports, chats, messages, user profiles, reels, ads, and admin
- **Database**: PostgreSQL via Drizzle ORM (`server/db.ts`, `shared/schema.ts`) — tables for users, posts, comments, chats, messages, ads, reels
- **Admin Panel**: HTML page at `/admin` route with JavaScript-based login, dashboard stats, and CRUD management
- **Admin Auth**: Bearer token auth using ADMIN_PASSWORD env var (default: UniWall@Admin2026)
- **Compression**: gzip compression for message content and video data to reduce storage
- **Seed data**: The storage class seeds sample posts and comments on startup for demo purposes
- **Cleanup**: A timer-based cleanup deletes messages older than 24 hours
- **CORS**: Dynamic CORS based on Replit environment variables, also allows localhost origins for local development

### Key Components

- `components/OnboardingScreen.tsx` - Multi-step onboarding (ToS → Profile → University) with login/register modes
- `components/MainApp.tsx` - Tab navigation container (Wall/Reels/Inbox/Profile)
- `components/WallScreen.tsx` - Main feed with posts, FAB for creating posts, FeedAd between posts
- `components/PostCard.tsx` - Individual post with voting, comments, reporting
- `components/CreatePostModal.tsx` - Bottom sheet for composing new posts
- `components/CommentSheet.tsx` - Bottom sheet for viewing/adding comments
- `components/InboxScreen.tsx` - Private messaging with 24h auto-delete
- `components/ProfileScreen.tsx` - User profile with secret key display
- `components/ReelsScreen.tsx` - Video reels feed with upload capability
- `components/AdBanner.tsx` - Ad display component for various placements
- `components/FeedAd.tsx` - Ad component for displaying between feed posts
- `server/admin.html` - Admin panel HTML with login, dashboard, and management UI

### Key Architectural Decisions

1. **PostgreSQL with Drizzle ORM**: Persistent storage for all data (users, posts, comments, chats, messages, ads, reels).
2. **Secret key authentication**: 16-character keys generated server-side, no password recovery — emphasizes anonymity.
3. **Shared types between frontend and backend**: `shared/schema.ts` contains Drizzle table definitions and TypeScript interfaces.
4. **Custom tab navigation instead of expo-router tabs**: The app implements its own tab bar in `MainApp.tsx`.
5. **Content moderation**: A blacklist system (`constants/blacklist.ts`) checks post content client-side before submission.
6. **Anonymous identity system**: Users pick a display name and identity tag during onboarding. Identity is stored locally.
7. **Polling for real-time updates**: React Query's `refetchInterval` (3-10 seconds) instead of WebSockets.
8. **Camera-only photo policy**: Gallery uploads disabled to prevent misuse.
9. **Gzip compression**: Messages and video data compressed before database storage.
10. **Admin panel as separate HTML page**: Served by Express at /admin, not part of the Expo app.

### Build & Development

- **Dev mode**: Two processes needed — `expo:dev` for the Expo bundler (port 8081) and `server:dev` for the Express API (port 5000)
- **Admin panel**: Accessible at `http://localhost:5000/admin` in dev mode (not through Expo)
- **Production build**: `expo:static:build` creates a static web bundle, `server:build` bundles the server with esbuild, `server:prod` runs the production server
- **The server serves the static web build** in production and proxies to the Expo dev server in development

## External Dependencies

- **PostgreSQL**: Connected via `DATABASE_URL` environment variable, managed with Drizzle ORM
- **Expo ecosystem**: Core platform for cross-platform mobile/web development
- **TanStack React Query**: Server state management and caching
- **AsyncStorage**: Client-side persistent key-value storage
- **expo-clipboard**: For copying secret key to clipboard
- **No external auth service**: Custom secret key auth, identity stored locally
- **Replit environment**: Build scripts and CORS configuration are tailored for Replit's domain and deployment system
