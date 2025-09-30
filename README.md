# GolfMatch - Money Match Platform

A web application for golfers to create, discover, and join money matches tied to tee times. This is a frontend-only MVP with mock data and deterministic handicap calculations, designed to be upgraded to Supabase (backend) and Stripe Connect (payments) in future phases.

## Features

### Current Implementation (Phase 1 - Frontend Only)

- **Discover Matches**: Browse available matches with filters for status, course, and format
- **Match Cards**: View course details, tee times, players, stakes, and format options
- **Handicap Engine**: Deterministic calculations for Course Handicap, Playing Handicap, and stroke allocation
- **Format Support**: Match Play Net and Net Stroke Play with optional Skins and Nassau
- **Mock Data**: In-memory storage with localStorage persistence for demo purposes
- **Unit Tests**: Comprehensive test coverage for handicap and scoring engines

### Coming Soon (Phase 2 & 3)

- Create Match Wizard (multi-step form)
- Match Detail & Join functionality
- Live Scorecard with hole-by-hole entry
- Results calculation and settlement preview
- Wallet management (demo)
- Profile management
- Admin dashboard (demo)
- Geofence check-in
- Supabase integration (Auth + DB + Storage)
- Stripe Connect integration (escrow + payouts)

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS + ShadCN UI components
- **State Management**: Zustand (ready for use)
- **Testing**: Vitest + Testing Library
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Type checking
pnpm typecheck

# Build for production
pnpm build
```

## Project Structure

```
src/
├── lib/
│   ├── types.ts                 # Domain type definitions
│   ├── handicap.ts              # Handicap calculation engine
│   ├── money.ts                 # Money formatting utilities
│   ├── geofence.ts              # Geolocation utilities
│   ├── formats/
│   │   ├── matchPlay.ts         # Match play scoring
│   │   ├── netStroke.ts         # Stroke play scoring
│   │   ├── skins.ts             # Skins game scoring
│   │   └── nassau.ts            # Nassau scoring
│   ├── store/
│   │   └── mockDb.ts            # Mock database with localStorage
│   └── api/
│       ├── matches.client.ts    # Match API client (mock)
│       ├── users.client.ts      # User API client (mock)
│       └── wallet.client.ts     # Wallet API client (mock)
├── components/
│   ├── ui/                      # ShadCN UI components
│   └── layout/
│       └── Header.tsx           # App header with navigation
├── pages/
│   └── DiscoverPage.tsx         # Match discovery page
├── tests/
│   ├── setup.ts                 # Test configuration
│   ├── handicap.test.ts         # Handicap engine tests
│   ├── formats.matchPlay.test.ts
│   └── formats.netStroke.test.ts
└── App.tsx                      # Main app with routing
```

## Handicap System

The application implements USGA handicap calculations:

### Course Handicap
```
CH = round(HI × (Slope / 113) + (CR - Par))
```

### Playing Handicap
- **Match Play**: 100% of Course Handicap
- **Stroke Play**: 95% of Course Handicap

### Stroke Allocation
Strokes are distributed across holes based on the stroke index (1-18, where 1 is the hardest hole). Players receive strokes relative to the lowest handicap in the group.

## Testing

The project includes comprehensive unit tests for all calculation engines:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage

# Open test UI
pnpm test:ui
```

## Mock Data

The application uses mock data stored in `src/lib/store/mockDb.ts`:

- **Profiles**: 3 sample golfers with different handicap indexes
- **Courses**: 3 famous golf courses (Pebble Beach, Augusta National, Torrey Pines)
- **Tees**: Multiple tee sets per course with accurate slope/rating data
- **Matches**: 2 sample matches (one open, one with multiple players)
- **Wallets**: Sample wallet with transaction history

Data persists in localStorage for demo purposes.

## Future Integration Points

### Supabase (Phase 2)

Replace mock database with Supabase:

```typescript
// TODO(supabase): Replace mockDb with Supabase tables
// - profiles table with RLS policies
// - courses and tees tables
// - matches table with real-time subscriptions
// - scorecards table with attestation workflow
// - Storage bucket for avatars and course images
```

### Stripe Connect (Phase 3)

Replace mock wallet with Stripe:

```typescript
// TODO(stripe): Replace escrow preview with Stripe Connect
// - Create connected accounts for users
// - Hold funds in escrow using payment intents
// - Transfer funds to winners after match completion
// - Handle refunds for canceled matches
```

### Geofence (Phase 2)

Move geofence check to Edge Function:

```typescript
// TODO(geofence): Move to Supabase Edge Function
// - Verify user location server-side
// - Prevent spoofing of GPS coordinates
// - Log check-in events for audit trail
```

## Design System

The application uses a golf-inspired color scheme with green as the primary color:

- **Primary**: Green (#22c55e) - Golf course greens
- **Background**: White/Dark gray - Clean, professional
- **Accents**: Subtle shadows and rounded corners
- **Typography**: Inter font family for modern, readable text

## Contributing

This is a demo/MVP project. For production use, implement:

1. Real authentication (Supabase Auth)
2. Database persistence (Supabase)
3. Payment processing (Stripe Connect)
4. Server-side validation
5. Rate limiting and security measures
6. Error tracking (Sentry, etc.)
7. Analytics (PostHog, etc.)

## License

MIT

## Acknowledgments

- USGA for handicap calculation standards
- ShadCN for the excellent UI component library
- Pexels for golf course imagery