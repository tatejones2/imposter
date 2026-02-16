# Imposter Game - Technical Implementation Guide

This document defines the technical architecture, database schema, API structure, and step-by-step implementation plan for the "Imposter" multiplayer web game. It is designed to be used as a prompt for GitHub Copilot to generate the codebase.

## 1. Executive Summary

**Project Name:** Imposter
**Type:** Real-time Multiplayer Social Deduction Game
**Platform:** Web (Browser-based)
**Core Stack:** React, TypeScript, Vite, TailwindCSS, Node.js, Express, Socket.IO, Prisma, PostgreSQL.

**Gameplay Overview:**
Players join a room via a 4-letter code. A category (e.g., "Sports") and a secret word (e.g., "Baseball") are selected. Most players know the word; "Imposters" do not. Players take turns giving 1-word clues. After a round of clues, players vote to eliminate the Imposter. Imposters win if they survive or guess the word.

## 2. System Architecture

The application follows a standard Client-Server architecture with real-time bidirectional communication.

-   **Client (Frontend):**
    -   Single Page Application (SPA) built with React & Vite.
    -   Manages UI state, socket connection, and game interactions.
    -   Uses TailwindCSS for styling.
    -   Connects to backend via `socket.io-client`.

-   **Server (Backend):**
    -   Node.js with Express and TypeScript.
    -   **Socket.IO Server:** Handles all real-time game logic, room management, and state synchronization.
    -   **REST API:** Minimal use (mostly for health checks or static data), primary interaction is via Sockets.
    -   **Prisma ORM:** Interfaces with the PostgreSQL database.
    -   **PostgreSQL:** Persists game history, categories, and potentially user stats (optional for MVP).
    -   **In-Memory Store:** Active game state (rooms, players, current phase) is primarily held in memory (Redis optional for scaling) for speed, with critical results persisted to DB at end of rounds.

## 3. Database Schema (Prisma)

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Room {
  id        String   @id @default(uuid())
  code      String   @unique // 4-letter code
  createdAt DateTime @default(now())
  status    String   // "WAITING", "PLAYING", "FINISHED"
  hostId    String?  // socket ID of host (ephemeral)
  
  // Settings
  imposterCount Int @default(1)
  roundTime     Int @default(60) // seconds per turn or phase

  // Relations
  players       Player[]
  games         GameSession[]
}

model Player {
  id        String   @id @default(uuid())
  socketId  String   @unique
  username  String
  isHost    Boolean  @default(false)
  score     Int      @default(0)
  
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id])
}

model Category {
  id    String @id @default(uuid())
  name  String @unique
  words Word[]
}

model Word {
  id         String   @id @default(uuid())
  text       String
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id])
}

model GameSession {
  id           String   @id @default(uuid())
  roomId       String
  room         Room     @relation(fields: [roomId], references: [id])
  winningTeam  String   // "VILLAGERS" or "IMPOSTERS"
  secretWord   String
  playedAt     DateTime @default(now())
}
```

## 4. Backend Design & Game State Machine

The backend is authoritative. The Client strictly renders state provided by the Server.

### Game Key Phases (FSM)

The `GameState` object for a room transitions through these phases:

1.  **LOBBY**:
    -   Players join/leave.
    -   Host configures settings (Imposter count, Category).
    -   Events: `JOIN_ROOM`, `LEAVE_ROOM`, `UPDATE_SETTINGS`.
    -   Transition: Host clicks "Start" -> `ASSIGN_ROLES`.

2.  **ASSIGN_ROLES** (Internal/Transient):
    -   Server selects secret word.
    -   Server assigns Imposter(s).
    -   Server emits `GAME_STARTED` (Imposters get "Imposter", others get "Word").
    -   Transition: Immediate -> `CLUE_PHASE`.

3.  **CLUE_PHASE**:
    -   Turn-based or Free-for-all (Design choice: Turn-based recommended).
    -   Active player submits a clue word.
    -   Events: `SUBMIT_CLUE`.
    -   Transition: All players have submitted -> `VOTING_PHASE`.

4.  **VOTING_PHASE**:
    -   Players discuss and vote for the Imposter.
    -   Events: `SUBMIT_VOTE`.
    -   Transition: All votes in or Timer ends -> `REVEAL_PHASE`.

5.  **REVEAL_PHASE**:
    -   Server reveals who was voted out.
    -   **Win Condition Check:**
        -   Imposter voted out? -> Villagers win.
        -   Villager voted out? -> Imposters win (or continue if >1 imposter).
        -   Word Guessed? (Optional mechanic: Imposter can guess word to steal win).
    -   Transition: Timer (5s) -> `SCORE_PHASE` or `GAME_OVER`.

6.  **SCORE_PHASE**:
    -   Show points gained.
    -   Transition: Host clicks "Next Round" -> `LOBBY` or `ASSIGN_ROLES`.

## 5. Socket Contract Specification

### Client -> Server Events

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `create_room` | `{ username: string }` | Creates a new room, returns room code |
| `join_room` | `{ code: string, username: string }` | Joins an existing room |
| `update_settings` | `{ imposterCount: number, categoryId: string }` | Host updates game rules |
| `start_game` | `{}` | Host starts the game |
| `submit_clue` | `{ clue: string }` | Player submits their clue word |
| `submit_vote` | `{ votedForId: string }` | Player votes for a suspect |
| `play_again` | `{}` | Returns to lobby/setup for new round |
| `leave_room` | `{}` | Explicit leave |

### Server -> Client Events

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `room_created` | `{ code: string, playerId: string }` | Confirms creation |
| `room_joined` | `{ room: RoomState, playerId: string }` | Initial state sync |
| `player_joined` | `{ player: Player }` | Broadcast to room when someone joins |
| `player_left` | `{ playerId: string }` | Broadcast disconnect |
| `game_state_update` | `{ phase: string, activePlayerId: string, timer: number, ... }` | Generic state sync (Redux-style) |
| `game_started` | `{ role: 'IMPOSTER' \| 'VILLAGER', word?: string }` | **CRITICAL:** `word` is undefined for Imposters |
| `clue_submitted` | `{ playerId: string, clue: string }` | Broadcasts a submitted clue |
| `voting_started` | `{ candidates: Player[] }` | Triggers voting screen |
| `vote_update` | `{ playerId: string }` | (Optional) Shows who has voted (not who they voted for) |
| `game_over` | `{ winners: 'IMPOSTERS' \| 'VILLAGERS', imposters: string[], word: string }` | End of game results |
| `error` | `{ message: string }` | Toaster notification for errors |

## 6. Frontend Structure (React + Vite)

### Directory Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── UserAvatar.tsx
│   │   └── Card.tsx
│   ├── game/
│   │   ├── GameBoard.tsx
│   │   ├── ClueInput.tsx
│   │   ├── VoteList.tsx
│   │   └── Timer.tsx
│   └── layout/
│       └── Layout.tsx
├── context/
│   ├── SocketContext.tsx  // Manages single socket connection
│   └── GameContext.tsx    // Manages global game state (players, phase, etc.)
├── hooks/
│   ├── useSocket.ts
│   └── useGameLogic.ts
├── pages/
│   ├── Home.tsx           // "Create" or "Join" buttons
│   ├── Lobby.tsx          // Waiting for players
│   ├── Game.tsx           // Main game container (conditionally renders phases)
│   └── Results.tsx        // Final score
├── types/
│   └── index.ts           // Shared TS interfaces
└── App.tsx                // Router setup
```

### State Management
Use `React Context` + `useReducer`.
-   `GameContext` holds `gameState`: `{ phase, players, myself, currentTurn, messages, settings }`.
-   Socket events dispatch actions to the reducer: `socket.on('game_state_update', (data) => dispatch({ type: 'UPDATE', payload: data }))`.

## 7. Security Considerations
1.  **Role Secrecy:** NEVER send the secret word to the Imposter client. The payload for `game_started` must be conditional based on the recipient's socket ID.
2.  **Input Validation:** Validate `clue` string length and ensure it's not the secret word itself (simple "contains" check).
3.  **Vote Integrity:** Server must verify the player hasn't already voted.

## 8. Edge Case Handling

1.  **Player Disconnects Mid-Round:**
    -   If active player leaves: Mark as "disconnected", force skip turn or end round.
    -   If Host leaves: Assign host role to the next oldest player.
    -   If room becomes empty: Delete room memory after cleanup delay (5 mins).
2.  **Not Enough Players:** Start button disabled unless minimum player count (3) met.
3.  **Tied Vote:**
    -   Impasse logic: No one ejected, or revote (simplest: No one ejected, Imposters win round).
4.  **All Imposters Leave:** Instant Villager win.
5.  **Race Conditions:** Use atomic updates or sequential processing for votes to handle last-second submissions correctly.

## 9. Implementation Steps for Copilot

**Prompt Copilot with each step sequentially.**

### Phase 1: Project Setup
1.  **Prompt:** "Initialize a new Vite React TypeScript project with TailwindCSS. Create a `/backend` folder and initialize a Node.js Express TypeScript project inside it with `socket.io`."
2.  **Prompt:** "Install `socket.io-client` in the frontend and `socket.io`, `cors`, `nodemon` in the backend. Set up `tsconfig.json` for both."

### Phase 2: Basic Socket Connection & Lobby
1.  **Backend:** "Create `Server.ts` and initialize `Socket.io` with CORS allowing localhost:5173."
2.  **Shared:** "Create a `types.ts` file in both frontend and backend to define `GameState`, `Player`, `Room` interfaces."
3.  **Backend:** "Implement a `RoomManager` class to store rooms in-memory. Add methods needed: `createRoom()`, `joinRoom(code, player)`."
4.  **Backend:** "Handle `create_room` socket event: create a room, add the socket user as host, emit success."
5.  **Frontend:** "Create `SocketContext.tsx` to wrap the app and provide the socket instance."
6.  **Frontend:** "Create `Home.tsx` with inputs for username/room code. Connect to socket and emit `join_room` on submit."

### Phase 3: Game Logic Core
1.  **Backend:** "Implement `GameController` class for game logic. Add `startGame()` method regarding role assignment."
2.  **Prompt:** "Implement the `CLUE_PHASE` logic. Handle `submit_clue` event. Broadcast the clue to all players and advance the turn."
3.  **Frontend:** "Create `ClueInput` component. Only show input if `gameState.activePlayerId === myId`."
4.  **Backend:** "Implement `VOTING_PHASE`. Handle `submit_vote`. Store votes in a temporary map. Check if all votes depend."
5.  **Frontend:** "Create `VotingScreen` displaying all players as candidates."

### Phase 4: Polish & Database
1.  **Prompt:** "Set up Prisma with PostgreSQL. Create schema for Room, Player, Category, Word."
2.  **Backend:** "Create a script to seed the database with initial categories and words."
3.  **Backend:** "Service layer to fetch random words from DB on `startGame`."
4.  **Frontend:** "Style the game board using TailwindCSS. Make it responsive for mobile."

## 10. Deployment Guide

-   **Frontend:** Deploy to Vercel or Netlify.
    -   Set `VITE_API_URL` environment variable to backend URL.
-   **Backend:** Deploy to Render, Railway, or Heroku.
    -   Set `DATABASE_URL` for PostgreSQL.
    -   Ensure WebSocket support is enabled (sticky sessions usually required).
-   **Database:** Use a managed PostgreSQL instance (e.g., Supabase, Neon).

## 11. Future Scaling & Enhancements

-   **Redis Adapter:** Use `socket.io-redis-adapter` to scale to multiple server instances.
-   **Session Persistence:** Start storing active game state in Redis to survive server restarts.
-   **User Accounts:** Add OAuth (Google/GitHub) to `Users` table to track lifetime stats.
-   **New Roles:** Add "Jester" or "Sheriff" roles for varied gameplay.
-   **Voice Chat:** Integrate WebRTC for voice clues instead of text.

---

**End of Design Document**
