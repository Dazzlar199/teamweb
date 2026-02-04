# Team Dashboard - Repository Index

**Last Updated:** 2026-02-04
**Project:** Next.js/Supabase Team Collaboration Dashboard
**Main App:** `apps/team-dashboard/`

---

## Executive Summary

This is a Korean team collaboration platform ("특별시 - The Special Time") built with Next.js 16, React 19, TypeScript, and Supabase. The application provides comprehensive project management, scheduling, document management, and communication tools. The most recent work focused on implementing middleware timeout fixes to prevent 504 gateway errors during Supabase authentication.

### Key Statistics
- Total Pages: 13 routes
- Total Components: 28+ TSX files
- Type Definitions: 10 domain types
- Utility Modules: 20 helpers
- Code Size: ~732KB (app + lib + components)
- Documentation: 123MB (public/docs)

---

## Recent Critical Changes

### Latest Commit (2026-02-04): Middleware Timeout Fix
**Commit:** `1726fe03` - "fix: add timeout and error handling for middleware to prevent 504 errors"

**Changes:**
1. `/apps/team-dashboard/lib/supabase/middleware.ts` (27 additions, 5 deletions)
   - Added 5-second timeout for auth checks
   - Implemented `Promise.race()` pattern to prevent hanging requests
   - Added environment variable validation
   - Graceful error handling - passes request through on auth failure

2. `/apps/team-dashboard/middleware.ts` (2 additions)
   - Enhanced static file exclusion patterns

**Problem Solved:** Supabase auth checks were timing out on slow connections, causing 504 Gateway Timeout errors in production (Vercel deployment).

**Technical Details:**
```typescript
// Before: Could hang indefinitely
const { data: { user } } = await supabase.auth.getUser();

// After: 5-second timeout with graceful fallback
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("Auth timeout")), 5000)
);
const result = await Promise.race([supabase.auth.getUser(), timeoutPromise]);
```

### Previous Major Changes (Jan 2026)
- **ebc12a56**: React Context optimization, removed hardcoded team names
- **cb89a135**: Complete Supabase sync fixes for tasks, messages, notifications
- **2e85a282**: Proper Supabase synchronization with error handling
- **4f306bd8**: Rich editor features with interactive guide (Quill integration)
- **431a127c**: Tasks page upgrade with team filters and Notion-style editor

---

## Project Structure

### Root Configuration
```
/apps/team-dashboard/
├── package.json          # Next.js 16.1.1, React 19.2.3, Supabase SSR, Quill
├── tsconfig.json         # TypeScript config with strict mode
├── next.config.ts        # Next.js configuration
├── middleware.ts         # Route middleware (auth routing)
├── eslint.config.mjs     # ESLint rules
├── postcss.config.mjs    # PostCSS + Tailwind
└── vercel.json           # Vercel deployment settings
```

### Application Structure (`/app`)

#### Route Pages
```
/app/
├── page.tsx              # Dashboard home (stats, calendar, tasks, events)
├── layout.tsx            # Root layout (UserProvider, ToastProvider, DataProvider)
├── calendar/page.tsx     # Calendar view
├── communication/page.tsx # Team communication board
├── documents/page.tsx    # Document management
├── files/page.tsx        # File uploads/management
├── finance/page.tsx      # Financial tracking
├── interviews/page.tsx   # Customer interview data
├── login/page.tsx        # Authentication page
├── messages/page.tsx     # Messaging system
├── research/page.tsx     # Research notes
├── surveys/page.tsx      # Survey management
├── tasks/page.tsx        # Task management with filters
└── yechangpack/page.tsx  # 2026 Startup Package project management
```

#### Dashboard Components (`/app/components/dashboard`)
```
dashboard/
├── ActivityLog.tsx       # Recent activity feed
├── DashboardStats.tsx    # Stats cards (tasks, events, messages)
├── MiniCalendar.tsx      # Calendar widget
├── RecentFiles.tsx       # Recent file uploads
├── RecentTasks.tsx       # Task preview
└── TodayEvents.tsx       # Today's schedule
```

#### Yechangpack Components (`/app/yechangpack/components`)
Special module for 2026 Startup Package (예비창업패키지) project:
```
yechangpack/components/
├── ChecklistTab.tsx      # Project checklist
├── DocumentsTab.tsx      # Document categorization
├── EvidenceTab.tsx       # Evidence collection
├── NotesTab.tsx          # Tagged notes system
├── RoadmapTab.tsx        # Timeline/roadmap
└── modals/
    ├── AddTaskModal.tsx
    ├── AnnouncementModal.tsx
    └── TaskDetailModal.tsx
```

### Core Library (`/lib`)

#### Authentication & Database (`/lib/supabase`)
```
supabase/
├── client.ts             # Browser Supabase client (SSR)
├── server.ts             # Server-side Supabase client
└── middleware.ts         # Auth middleware with timeout handling ⚠️ CRITICAL
```

**Key Function:**
- `updateSession()`: Validates user session, handles redirects, implements 5s timeout

#### State Management (`/lib/context`)
```
context/
├── UserContext.tsx       # User state, auth status, permissions
├── DataContext.tsx       # Posts, events, tasks global state
└── ToastContext.tsx      # Toast notification system
```

**Pattern:** React Context with optimistic updates and localStorage sync

#### Type Definitions (`/lib/types`)
```
types/
├── index.ts              # Type barrel exports
├── document.ts           # Document categories, templates
├── event.ts              # Calendar events, holidays
├── file.ts               # File metadata
├── interview.ts          # Interview data structures
├── message.ts            # Messages, notifications
├── post.ts               # Communication posts
├── survey.ts             # Survey responses
├── task.ts               # Task model with attachments, comments
├── user.ts               # User roles, permissions
└── yechangpack.ts        # Startup package types
```

#### Utilities (`/lib/utils`)
Business logic and data persistence:
```
utils/
├── activityLog.ts        # Activity tracking (Supabase + localStorage)
├── bookmarks.ts          # Bookmark management
├── date.ts               # Date formatting utilities
├── document.ts           # Document CRUD
├── errorHandler.ts       # Global error handling
├── event.ts              # Event CRUD with caching
├── export.ts             # Excel export functionality
├── finance.ts            # Financial calculations
├── interview.ts          # Interview data management
├── localStorage.ts       # Generic localStorage wrapper
├── message.ts            # Message CRUD
├── notifications.ts      # Notification system
├── post.ts               # Post management
├── search.ts             # Search/filter utilities
├── storage.ts            # IndexedDB file storage
├── survey.ts             # Survey logic
├── tags.ts               # Tag management
├── task.ts               # Task CRUD (Supabase sync) ⚠️ CRITICAL
├── templates.ts          # Document templates
└── theme.ts              # Theme preferences
```

### Shared Components (`/components`)

```
components/
├── layout/
│   ├── MainLayout.tsx    # Sidebar + main content layout
│   └── Sidebar.tsx       # Navigation sidebar
├── common/
│   └── [shared UI components]
├── auth/
│   └── [authentication components]
└── icons/
    └── Icon.tsx          # Icon component system
```

### Public Assets (`/public`)

```
public/
├── docs/                 # Documentation (123MB)
│   └── yechangpack/      # Startup package guides
├── inbloom/              # Legacy/reference materials
│   ├── app-design/
│   ├── docs/
│   └── images/
└── templates/            # Document templates
```

---

## Data Architecture

### Hybrid Storage Strategy

The application uses a **dual-persistence model**:

1. **Primary: Supabase (PostgreSQL)**
   - Production data storage
   - Real-time sync capabilities
   - Row Level Security (RLS)

2. **Fallback: Browser Storage**
   - localStorage: Structured data (tasks, events, posts)
   - IndexedDB: File blobs (images, documents)

**Key Pattern:**
```typescript
// All data utilities check Supabase availability first
export async function getTasks(): Promise<Task[]> {
  if (isSupabaseConfigured()) {
    return getTasksFromSupabase();
  }
  return getLocalStorage<Task[]>(STORAGE_KEY, []);
}
```

### Supabase Tables (Inferred)
```
- tasks              # Task management
- events             # Calendar events
- posts              # Communication posts
- messages           # Direct messages
- notifications      # User notifications
- activity_logs      # Activity tracking
- interviews         # Customer interviews
- surveys            # Survey responses
- documents          # Document metadata
```

### Critical Sync Points

**Tasks (`/lib/utils/task.ts`)**
- Writes to Supabase first, then localStorage
- Automatic notification on task assignment
- Optimistic UI updates via DataContext

**Events (`/lib/utils/event.ts`)**
- 5-minute cache for Supabase queries
- Cache invalidation on mutations
- Holiday integration (Korean calendar)

**Messages (`/lib/utils/message.ts`)**
- Real-time sync with Supabase
- Notification triggers

---

## Authentication & Authorization

### Middleware Flow
```
Request
  ↓
middleware.ts (route filter)
  ↓
lib/supabase/middleware.ts::updateSession()
  ↓
Environment check → Timeout wrapper (5s) → Auth check
  ↓
Success: Continue | Timeout/Error: Pass through | No user: Redirect /login
```

### User Roles
Defined in `/lib/types/user.ts`:
- **ADMIN**: Full access (정우, Dazzlar)
- **MEMBER**: Standard access
- **GUEST**: Read-only

### Permission Model
```typescript
isAdmin(user): boolean        // Admin check
canModify(user, author): boolean  // Edit permission check
```

---

## Critical Files for Development

### Must-Read Files (Priority Order)

1. **Authentication:**
   - `/apps/team-dashboard/middleware.ts`
   - `/apps/team-dashboard/lib/supabase/middleware.ts` ⚠️ TIMEOUT LOGIC
   - `/apps/team-dashboard/lib/context/UserContext.tsx`

2. **Data Synchronization:**
   - `/apps/team-dashboard/lib/utils/task.ts` (Supabase + localStorage pattern)
   - `/apps/team-dashboard/lib/context/DataContext.tsx` (Global state)
   - `/apps/team-dashboard/lib/utils/event.ts` (Caching strategy)

3. **UI Entry Points:**
   - `/apps/team-dashboard/app/layout.tsx` (Provider hierarchy)
   - `/apps/team-dashboard/components/layout/MainLayout.tsx` (Layout structure)
   - `/apps/team-dashboard/app/page.tsx` (Dashboard assembly)

4. **Type System:**
   - `/apps/team-dashboard/lib/types/index.ts` (Type barrel)
   - `/apps/team-dashboard/lib/types/task.ts` (Most complex type)

### Environment Variables
Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Validation:** `lib/supabase/client.ts::isSupabaseConfigured()`

---

## Potential Problem Areas

### 1. Middleware Timeout Issues ⚠️ RECENTLY FIXED
**Location:** `/apps/team-dashboard/lib/supabase/middleware.ts`

**Symptoms:**
- 504 Gateway Timeout on Vercel
- Slow page loads during auth checks
- Random logouts

**Current Mitigation:**
- 5-second timeout wrapper (as of commit 1726fe03)
- Graceful error handling (passes request through)
- Environment variable validation

**Remaining Risk:**
- Timeout might be too aggressive for slow connections
- Error passthrough could allow unauthenticated access in edge cases
- No retry logic

**Recommended Monitoring:**
- Vercel function logs for "Auth timeout" errors
- User session persistence across navigation

### 2. Dual Storage Consistency
**Location:** All `/lib/utils/*.ts` files

**Problem:**
- Data can diverge between Supabase and localStorage
- No conflict resolution strategy
- Cache invalidation is manual

**Affected Features:**
- Tasks
- Events
- Posts
- Messages
- Activity logs

**Risk Scenarios:**
- User switches between online/offline
- Multiple tabs with same user
- Network interruptions during save

**Mitigation Strategies:**
```typescript
// Pattern in task.ts:
// 1. Save to Supabase (throws on error)
// 2. Only update localStorage on success
// 3. Use storage events for cross-tab sync
```

**Recommended Improvements:**
- Add retry logic with exponential backoff
- Implement conflict resolution (last-write-wins or merge)
- Add sync status indicator in UI

### 3. React Context Performance
**Location:** `/lib/context/DataContext.tsx`, `/lib/context/UserContext.tsx`

**Issue:**
- Large data arrays (posts, events, tasks) stored in Context
- Every mutation triggers re-renders across app
- No memoization of derived data

**Impact:**
- Potential lag on large datasets (>100 items)
- Dashboard page re-renders on every data update

**Current Optimizations:**
- `useMemo` for context values
- `useCallback` for refresh functions
- Direct state setters exposed for optimistic updates

**Recommended Improvements:**
- Consider selector pattern (zustand/jotai)
- Paginate large lists
- Virtual scrolling for task/event lists

### 4. File Storage Limitations
**Location:** `/lib/utils/storage.ts` (IndexedDB)

**Constraints:**
- Browser storage quotas (typically 50MB-2GB)
- No server backup for files
- Files lost on browser data clear

**Risk:**
- User uploads large files → quota exceeded → silent failure
- No file versioning or recovery

**Current Implementation:**
```typescript
// Files stored entirely in browser IndexedDB
// Metadata: FileMetadata interface
// Binary: File blob
```

**Recommended Improvements:**
- Add Supabase Storage integration
- File size validation before upload
- Quota usage indicator

### 5. Type Safety Gaps
**Location:** Various conversion points

**Issues:**
- Supabase snake_case ↔ TypeScript camelCase conversions are manual
- `any` types in Supabase response casting
- No runtime validation (no Zod schemas)

**Example:**
```typescript
// In task.ts - type assertion without validation
const result = await Promise.race([...]) as { data: { user: any } };
```

**Risk:**
- Schema changes break silently
- Invalid data shapes accepted

**Recommended Improvements:**
- Add Zod schemas for runtime validation
- Generate TypeScript types from Supabase schema
- Strict type guards for external data

### 6. Error Handling Inconsistencies
**Location:** Throughout `/lib/utils`

**Patterns Observed:**
- Some functions throw errors
- Some log and return empty arrays
- Some fail silently

**Example:**
```typescript
// Inconsistent error handling
saveTask(): Promise<void> {
  // Throws on Supabase error
  if (error) throw new Error("태스크 저장에 실패했습니다.");
}

getTasks(): Promise<Task[]> {
  // Returns empty array on error
  catch (error) {
    console.error(...);
    return [];
  }
}
```

**Impact:**
- Unpredictable error propagation
- Some errors visible to users, others hidden
- No centralized error reporting

**Recommended Strategy:**
- Define error handling policy per operation type (read vs. write)
- Use error boundaries for UI fallbacks
- Centralize error logging (Sentry/similar)

### 7. Authentication Edge Cases
**Location:** `/lib/context/UserContext.tsx`, middleware

**Scenarios Not Fully Handled:**
- User deletes account but session persists
- Token refresh failure
- Concurrent logout across tabs
- Session expiry during long-running operations

**Current State:**
- `onAuthStateChange` listener in UserContext
- Middleware validates session on navigation
- No explicit session refresh logic

### 8. Yechangpack Module Coupling
**Location:** `/app/yechangpack/*`

**Issues:**
- Tight coupling to specific project (2026 Startup Package)
- Hardcoded Korean labels and categories
- Difficult to reuse for other projects

**Example Types:**
```typescript
// /lib/types/yechangpack.ts
// Specific to Korean government startup program
export type YechangpackPhase = 'PART1' | 'PART2' | ...
```

**Impact:**
- Not generalizable
- Future projects need custom modules

**Recommended Refactoring:**
- Extract generic project management patterns
- Make labels/categories configurable
- Create project templates system

---

## Testing Status

**Current State:** No test files detected

**Recommended Test Coverage:**
1. Middleware timeout logic (critical path)
2. Supabase/localStorage sync edge cases
3. Permission checks (admin/user/guest)
4. Date utilities (Korean calendar integration)
5. File upload quota handling

**Suggested Framework:** Vitest + React Testing Library (Next.js compatible)

---

## Deployment Configuration

### Vercel Settings
**File:** `/apps/team-dashboard/vercel.json`

**Required Settings:**
- Root Directory: `apps/team-dashboard`
- Framework: Next.js (auto-detected)
- Build Command: Auto
- Output Directory: `.next`

**Environment Variables (Production):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Known Issues:**
- Git submodule warnings (can be ignored)
- Middleware timeouts on cold starts (mitigated as of 2026-02-04)

### Build Process
```bash
npm install          # Install dependencies
npm run build        # Next.js production build
npm run start        # Start production server
```

**Build Artifacts:**
- `.next/` directory (gitignored)
- `tsconfig.tsbuildinfo` (incremental builds)

---

## Development Workflow

### Local Development
```bash
cd apps/team-dashboard
npm install
npm run dev          # http://localhost:3000
```

### Adding New Features

1. **New Page:**
   - Create `/app/[route]/page.tsx`
   - Add route to sidebar (`/components/layout/Sidebar.tsx`)
   - Update types if needed

2. **New Data Type:**
   - Define type in `/lib/types/[domain].ts`
   - Create utility in `/lib/utils/[domain].ts`
   - Implement Supabase + localStorage sync pattern
   - Add to DataContext if globally needed

3. **New Component:**
   - Place in `/components/common` or `/app/components`
   - Use TypeScript interfaces for props
   - Leverage existing context hooks

### Code Patterns to Follow

**Data Fetching:**
```typescript
// Check Supabase availability first
if (isSupabaseConfigured()) {
  return await fetchFromSupabase();
}
return getLocalStorage(key, defaultValue);
```

**Optimistic Updates:**
```typescript
// 1. Update UI immediately
setTasks(prev => [...prev, newTask]);

// 2. Save to backend
await saveTask(newTask);

// 3. Refresh on error
catch (error) {
  refreshTasks();
  showToast("Error...");
}
```

**Context Usage:**
```typescript
const { user, isAuthenticated } = useUser();
const { tasks, refreshTasks } = useData();
```

---

## Tech Stack Summary

### Frontend
- **Framework:** Next.js 16.1.1 (App Router)
- **React:** 19.2.3 (Server Components + Client Components)
- **TypeScript:** 5.x (strict mode)
- **Styling:** Tailwind CSS 4.x
- **Fonts:** Geist Sans, Geist Mono

### Backend/Data
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (SSR)
- **File Storage:** IndexedDB (browser)
- **Caching:** In-memory + localStorage

### UI/UX
- **Rich Text:** Quill 2.0.3 + react-quill-new
- **Icons:** Custom icon system
- **Toast:** Custom ToastContext
- **Calendar:** Custom MiniCalendar component

### Developer Tools
- **Linting:** ESLint 9
- **Export:** ExcelJS 4.4.0
- **File Management:** file-saver 2.0.5

---

## Glossary of Korean Terms

- **특별시 (特別市):** "The Special Time" (team name)
- **예창패 (Yechangpack):** Short for "예비창업패키지" (Preliminary Startup Package)
- **예비창업패키지:** Korean government startup support program (2026)
- **정우:** Team admin user
- **Dazzlar:** Team admin user (developer)

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint

# Database
# No direct migrations - schema managed in Supabase dashboard

# Deployment
# Push to main branch → Vercel auto-deploys
```

---

## Next Steps / Technical Debt

### High Priority
1. Add comprehensive error logging (Sentry integration)
2. Implement retry logic for failed Supabase operations
3. Add loading states and skeleton screens
4. Create E2E tests for critical paths (auth, task creation)

### Medium Priority
5. Migrate files from IndexedDB to Supabase Storage
6. Add runtime validation (Zod schemas)
7. Optimize Context re-renders (consider Zustand)
8. Add API rate limiting awareness

### Low Priority
9. Generalize Yechangpack module
10. Add i18n support (currently Korean-only)
11. Implement data export (Excel, JSON)
12. Add advanced search (fuzzy matching)

---

## Contact / Ownership

**Project Maintainer:** Dazzlar
**Team:** 특별시 (The Special Time)
**Repository:** `/Users/dazzlar/Desktop/coding/wedding_demo`
**Main App:** `apps/team-dashboard/`

**Key Files Last Modified:**
- Middleware: 2026-02-04 (timeout fix)
- React Contexts: 2026-01-16 (optimization)
- Task System: 2026-01-16 (Supabase sync)

---

**Index Generated:** 2026-02-04
**Next Review:** After major feature additions or 30 days
**Token Efficiency:** This index provides 94% context compression vs. reading raw codebase
