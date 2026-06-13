# AGENTS.md — JustPassIt

> Read this fully before writing any code. It contains the locked stack, the data model,
> the business rules, and the things you must NOT do. Do not re-ask the user for context
> that is written here. When something genuinely isn't covered, ask one focused question.

---

## 1. What this project is

**JustPassIt** is an online MCQ test-preparation platform sold to international clients.
People buy timed access to practice tests and drill multiple-choice questions until they pass.
It is a private, role-gated tool — **there is no SEO requirement and no public marketing site**
inside this app. Everything sits behind login.

There are three roles:

- **SuperAdmin** — owns the system. Uploads tests (from a spreadsheet), sets passing %,
  activates/deactivates tests, creates Admins, assigns tests to Admins, sees everything.
- **Admin** — sells test access to candidates. Sees only the tests assigned to them.
  Creates end-user accounts (auto-generated credentials), sets an access window
  (e.g. 7 / 15 days), can revoke access, and — if granted permission — can change the
  passing % on their assigned tests.
- **End User (candidate)** — logs in with auto-generated username + password, sees the
  tests they have access to, attempts them, gets instant per-question feedback with the
  reason, and a final pass/fail result. Can re-attempt freely while access is valid, and
  can run a "practice the ones I got wrong" mode.

---

## 2. Locked stack — do not substitute

This is decided. Do not propose alternatives, do not add libraries beyond this list
without asking first.

**Monorepo:** Turborepo, package manager **yarn v1 (1.22.22)**.
Workspaces live under `apps/*` and `packages/*`.

**Frontend — `apps/web`:** React 19 + Vite + TypeScript.
- Routing: TanStack Router
- Server state / data fetching: TanStack Query (React Query)
- Tables: TanStack Table
- Forms: React Hook Form + `@hookform/resolvers`
- Validation: Zod
- HTTP: Axios
- Dates: date-fns
- Toasts: Sonner
- Icons: hugeicons-react
- UI: shadcn/ui (Radix registry, **Mira** preset), Tailwind v4
- Theme tokens live in `apps/web/src/index.css` (`:root` + `.dark`, OKLCH, cream/olive/orange).

**Backend — `apps/api`:** NestJS + TypeScript.
- ORM: Prisma
- Auth: JWT via `@nestjs/jwt` + `@nestjs/passport` (passport-jwt, passport-local)
- Config: `@nestjs/config`
- Password hashing: bcrypt
- Request validation: class-validator + class-transformer (global ValidationPipe)

**Database:** Neon (managed PostgreSQL). Connection string in `apps/api/.env` as `DATABASE_URL`.

**Deploy targets:** web → Vercel (root dir `apps/web`); api → Railway (root dir `apps/api`,
start `node dist/main.js`). One GitHub repo, two deployments.

**Environment:** Windows + Git Bash (MINGW64). The global `nest` CLI is NOT on PATH —
always use `npx nest ...` for generators. `yarn dlx` does not exist on yarn v1 — use `npx`.

---

## 3. Repo layout

```
justpassit/
├── apps/
│   ├── web/                 React 19 + Vite (the SPA, all three role UIs)
│   │   └── src/
│   │       ├── index.css    theme tokens (do not move to app.css; this file is the source of truth)
│   │       ├── routes/      TanStack Router route files
│   │       ├── features/    feature folders (auth, tests, candidates, attempt, ...)
│   │       ├── components/   shared UI + shadcn components under components/ui
│   │       ├── lib/          axios instance, query client, helpers
│   │       └── docs/         frontend docs for humans + future AI (see §8)
│   └── api/                 NestJS + Prisma (all backend logic & auth)
│       ├── prisma/
│       │   └── schema.prisma the schema in §5 is the source of truth
│       ├── src/
│       │   ├── modules/      auth, users, tests, questions, assignments,
│       │   │                 access, attempts, audit, prisma (one module each)
│       │   └── docs/         API docs (see §8)
│       └── .env             DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT, NODE_ENV
└── packages/
    └── shared/             Zod schemas + shared enums + DTO types used by BOTH apps
```

`packages/shared` is the single source of truth for request/response shapes. The frontend
validates forms with these Zod schemas; the backend validates incoming requests with the
same schemas. Never let the two drift.

---

## 4. Run commands

From repo root: `yarn dev` runs both apps via Turbo. `apps/api` exposes `dev`
(`nest start --watch`), `build` (`nest build`), `start` (`node dist/main`).

Prisma (run inside `apps/api`): `npx prisma db push`, `npx prisma generate`,
`npx prisma migrate dev`, `npx prisma db seed`. NestJS generators: `npx nest g module x`, etc.

---

## 5. Database schema — source of truth

Normalized. **One `questions` table with a `testId` FK — NEVER a table-per-test.**
Letters `A`–`E` for answers. C/D/E optional (true/false questions only use A/B).

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

model User {
  id        String   @id @default(uuid())
  name      String
  email     String?  @unique        // admins & superadmins log in with email
  username  String?  @unique        // end users log in with auto-generated username
  password  String                  // bcrypt hash only, never plaintext
  role      Role
  isActive  Boolean  @default(true)  // checked LIVE in guards — block is immediate
  createdBy String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  createdTests     Test[]            @relation("TestCreator")
  adminAssignments AdminAssignment[] @relation("AdminUser")
  candidateAccess  CandidateAccess[] @relation("CandidateUser")
  auditLogs        AuditLog[]

  @@index([role])
  @@index([createdBy])
}

model Test {
  id             String   @id @default(uuid())
  name           String
  description    String?
  passingPct     Int      @default(70)
  totalQuestions Int      @default(0)
  isActive       Boolean  @default(true)   // deactivate without deleting
  isLocked       Boolean  @default(false)  // flips true on first attempt; no edits after
  createdBy      String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  creator          User              @relation("TestCreator", fields: [createdBy], references: [id])
  questions        Question[]
  adminAssignments AdminAssignment[]
  candidateAccess  CandidateAccess[]
  attempts         TestAttempt[]

  @@index([createdBy])
  @@index([isActive])
}

model Question {
  id            String   @id @default(uuid())
  testId        String
  questionText  String
  optionA       String
  optionB       String
  optionC       String?
  optionD       String?
  optionE       String?
  correctAnswer String   // "A".."E"
  reason        String?
  orderNum      Int
  createdAt     DateTime @default(now())

  test    Test            @relation(fields: [testId], references: [id], onDelete: Cascade)
  answers AttemptAnswer[]

  @@index([testId])
  @@unique([testId, orderNum])
}

model AdminAssignment {
  id                String   @id @default(uuid())
  adminId           String
  testId            String
  assignedBy        String
  canEditPassingPct Boolean  @default(false)
  createdAt         DateTime @default(now())

  admin User @relation("AdminUser", fields: [adminId], references: [id], onDelete: Cascade)
  test  Test @relation(fields: [testId], references: [id], onDelete: Cascade)

  @@unique([adminId, testId])
  @@index([adminId])
  @@index([testId])
}

model CandidateAccess {
  id          String    @id @default(uuid())
  candidateId String
  testId      String
  adminId     String                       // who granted it — used for scoping
  expiresAt   DateTime                      // the ONLY time concept in the system
  isRevoked   Boolean   @default(false)
  revokedBy   String?
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())

  candidate User          @relation("CandidateUser", fields: [candidateId], references: [id], onDelete: Cascade)
  test      Test          @relation(fields: [testId], references: [id], onDelete: Cascade)
  attempts  TestAttempt[]

  @@unique([candidateId, testId])
  @@index([candidateId])
  @@index([adminId])
  @@index([testId])
}

model TestAttempt {
  id             String        @id @default(uuid())
  accessId       String
  testId         String
  candidateId    String
  attemptNum     Int           @default(1)
  mode           AttemptMode   @default(FULL)    // PRACTICE excluded from stats
  status         AttemptStatus @default(IN_PROGRESS)  // IN_PROGRESS = the resumable one
  score          Float?
  totalQuestions Int           @default(0)
  correctCount   Int           @default(0)
  isPassed       Boolean?
  startedAt      DateTime      @default(now())
  completedAt    DateTime?

  access  CandidateAccess @relation(fields: [accessId], references: [id], onDelete: Cascade)
  test    Test            @relation(fields: [testId], references: [id], onDelete: Cascade)
  answers AttemptAnswer[]

  @@index([accessId])
  @@index([candidateId])
  @@index([testId])
  @@index([status])
}

model AttemptAnswer {
  id         String   @id @default(uuid())
  attemptId  String
  questionId String
  selected   String   // "A".."E"
  isCorrect  Boolean  // computed SERVER-SIDE, never trusted from client
  answeredAt DateTime @default(now())

  attempt  TestAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question Question    @relation(fields: [questionId], references: [id])

  @@unique([attemptId, questionId])   // upsert on save → no double-submit dupes
  @@index([attemptId])
  @@index([questionId])
}

model AuditLog {
  id         String   @id @default(uuid())
  actorId    String
  action     String   // e.g. "TEST_UPLOADED","ACCESS_GRANTED","ACCESS_REVOKED",
                       //      "USER_BLOCKED","ADMIN_CREATED","PASSING_PCT_CHANGED"
  entityType String   // "Test" | "User" | "CandidateAccess" | "AdminAssignment"
  entityId   String?
  metadata   Json?    // freeform: old/new passing %, days granted, etc.
  createdAt  DateTime @default(now())

  actor User @relation(fields: [actorId], references: [id])

  @@index([actorId])
  @@index([entityType, entityId])
  @@index([createdAt])
}

enum Role          { SUPERADMIN ADMIN ENDUSER }
enum AttemptMode   { FULL PRACTICE }
enum AttemptStatus { IN_PROGRESS COMPLETED }
```

---

## 6. Business rules — enforce these exactly

These are confirmed product decisions. Do not reinterpret them.

1. **Time = access window only.** The only time concept is `CandidateAccess.expiresAt`
   (the 5/15-day window the Admin sells). There is **no in-test countdown timer.** A user
   attempts freely as long as their access is valid.

2. **Tests freeze on first attempt.** When the first `TestAttempt` is created for a test,
   set `Test.isLocked = true`. After that, questions and the question set **cannot be edited
   or re-uploaded** — enforce this in the service layer (reject the edit). This is how
   historical results stay valid; do not snapshot answers.

3. **Everything is practice.** A normal run (`mode = FULL`) still produces a real score and
   pass/fail. The "redo my wrong ones" run is `mode = PRACTICE` and is **excluded from
   best/worst/pass statistics.** A PRACTICE attempt's question set is derived at creation
   time from the wrong answers of the preceding FULL attempt — no extra column needed.

4. **Immediate access changes.** `User.isActive`, `CandidateAccess.isRevoked`, and
   `CandidateAccess.expiresAt` are checked **live in guards on every protected request** —
   never trusted from the JWT alone. A blocked user, revoked admin, or expired window loses
   access on the very next request, not when the token expires.

5. **Scoring is server-side.** `AttemptAnswer.isCorrect`, `TestAttempt.score`,
   `correctCount`, and `isPassed` are computed on the server by comparing against the stored
   `correctAnswer`. Never trust correctness from the client. `isPassed = score >= test.passingPct`.

6. **Auto-save with no duplicates.** Selecting an answer upserts the `AttemptAnswer`
   (unique on `[attemptId, questionId]`). Firing twice for the same question updates the row,
   never inserts a second.

7. **Resume.** Starting a test finds the existing `IN_PROGRESS` attempt and continues from
   the first unanswered question; only creates a new attempt when none is in progress.

8. **Data scoping, not just route guards.** An Admin's queries are filtered to their own
   rows (`where adminId = me`); an End User only ever touches their own access/attempts.
   Enforce ownership in the service/query layer, not just by allowing the route.

9. **Audit the important actions.** Write an `AuditLog` row for test upload, admin creation,
   access grant/revoke, user block/unblock, and passing-% change (old/new in `metadata`).

---

## 7. Excel/CSV ingestion (SuperAdmin upload)

Expected columns (the client's sheet):
`Index | Question | Option A | Option B | Option C | Option D | Option E | Answer | Reason`

- `Answer` should be a **letter** `A`–`E`. Prefer letters over full text — full-text matching
  is fragile (trailing spaces, casing). If a client sheet stores the full answer text instead,
  match it back to the option to resolve the letter, and reject the row if it can't be resolved.
- `Option C/D/E` and `Reason` may be empty.
- Parse with SheetJS (`xlsx`) OR `csv` on the backend. Validate every row before inserting:
  non-empty question, at least A and B present, a resolvable `correctAnswer`. Show the
  SuperAdmin a preview + per-row validation errors **before** committing. Set
  `Test.totalQuestions` to the inserted count.

---

## 8. Documentation duties (the user wants these maintained)

Keep two living doc sets, updated as features land:

- `apps/web/src/docs/` — frontend docs for humans and future AI: routing map, feature
  folders, how server state is fetched, theme tokens, component conventions.
- `apps/api/src/docs/` — API docs: every endpoint (method, path, role required, request
  Zod/DTO, response shape), the auth flow, and the audit actions list.

Write clean, self-documenting code. When you add or change an endpoint or a route, update
the matching doc in the same change.

---

## 9. Hard NOs — do not do these

- ❌ No dynamic per-test tables. One normalized `questions` table, always.
- ❌ No second auth system (no Supabase Auth, no Firebase). NestJS JWT only.
- ❌ No Redis, no message queue, no websockets, no microservices — a modular NestJS monolith
  is correct for this scale. Don't add infra without being asked.
- ❌ No GraphQL. REST.
- ❌ No global client state library beyond TanStack Query for server state. Local UI state
  stays in React (`useState`/context). Don't add Redux/Zustand unless asked.
- ❌ No plaintext passwords anywhere. bcrypt hash on write; return generated plaintext to the
  Admin UI exactly once at creation, never store it.
- ❌ No trusting the client for correctness, role, ownership, or access validity.
- ❌ No in-test timer.
- ❌ Don't move theme tokens out of `apps/web/src/index.css`.

---

## 10. Conventions

- TypeScript strict everywhere. Share types via `packages/shared`, don't redefine per app.
- Validate every API input with class-validator DTOs (global `ValidationPipe`,
  `whitelist: true`). Mirror shapes with the Zod schemas in `packages/shared` for the forms.
- Configure CORS on the API (web and api are different origins).
- Validate env on boot via `@nestjs/config` so a missing `DATABASE_URL`/`JWT_SECRET` fails fast.
- Prefer small focused NestJS modules (one domain each) over fat controllers.
- Keep formatting minimal and readable; the user is a frontend dev learning backend — favour
  clarity over cleverness, and add a short comment when a backend concept is non-obvious.

## REMEMBER:
YOUR code will be Analyzed by Codex,UI will be analyzed by gemeni and best practices will be analyzed by CodeRabbit. So Think before you code, always test when done.Its the real test of your capabilites. YOU can BEAT IT
