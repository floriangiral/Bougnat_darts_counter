# DartMaster X01 - Technical Specifications

## 1. Functional Specifications (MVP)

### User Journey
1. **Home**: Choose "Quick Game" (Guest) or "Login" (Persisted).
2. **Setup**: Configure Game (Score: 501, In: Open, Out: Double, Players: 2).
3. **Match**: 
   - Display scoreboard with current leg score.
   - Input score per turn (0-180).
   - Validation (No score > 180, Bust logic).
   - Checkout suggestions dynamic based on remaining score.
   - Undo capability.
4. **Summary**: Match result, averages, checkout %.

### Rules Implementation
- **Bust Rule**: Score < 0 or Score == 1 (if Double Out).
- **In Rule**: Score strictly requires Double/Master to start decrementing (if configured).
- **Out Rule**: Must hit exact zero with Double/Master.

## 2. Data Model

### Types (TypeScript Interface)

```typescript
type GameMode = '301' | '501' | '701' | '1001';
type InOutRule = 'Open' | 'Double' | 'Master';

interface Player {
  id: string;
  name: string;
  isGuest: boolean;
}

interface Turn {
  playerId: string;
  legId: string;
  score: number; // Total for 3 darts
  darts?: number[]; // Optional individual darts
  isBust: boolean;
  remainingAfter: number;
}

interface Leg {
  id: string;
  winnerId?: string;
  turns: Turn[];
  startingScore: number;
}

interface Match {
  id: string;
  config: {
    startingScore: number;
    checkIn: InOutRule;
    checkOut: InOutRule;
    maxLegs: number; // Best of X
  };
  players: Player[];
  legs: Leg[];
  currentLegIndex: number;
  status: 'setup' | 'active' | 'finished';
  winnerId?: string;
  createdAt: string;
}
```

## 3. API Design (Future Backend)

### REST Endpoints
- `POST /api/auth/login`
- `POST /api/matches` (Create match)
- `POST /api/matches/:id/turn` (Submit turn - validates logic server-side)
- `POST /api/matches/:id/undo`
- `GET /api/users/:id/stats`

### Logic Separation
The frontend contains a full "Game Engine" (`gameLogic.ts`) to handle local state immediately for the PWA experience. Syncing happens in the background for logged-in users.
