# Nora Backend — Iterative Sprint Plan

> **Note:** "Sprint" here refers to a distinct development phase based on dependency order, ensuring each module can be built and tested without blockers. Each sprint includes a unit testing phase to validate the desired functionality.

---

## Sprint 1: Project Setup & Core Data Models
**Goal:** Establish the foundational architecture, database connection, and core entities.

**Tasks:**
1. Review and follow the existing Node.js + Express project structure.
2. Ensure the MVC directory structure (`routes`, `controllers`, `services`, `models`, `middlewares`, `utils`) is utilized properly within the current setup.
3. Configure MongoDB connection using Mongoose, utilizing the Docker-based Mongo setup along with the project image (`docker-compose.yml`).
4. Review and build upon the existing consistent JSON error and response formatting middlewares.
5. Define the **User** schema and model (including bcrypt pre-save hooks).
   - *Indexes:* `schema.index({ email: 1 }, { unique: true })`, `schema.index({ role: 1, isDeleted: 1 })`.
6. Define the **RefreshToken** schema and model.
   - *Indexes:* `schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })`, `schema.index({ user: 1 })`.

**Testing Requirements:**
- Unit test database connection logic.
- Unit test User and RefreshToken model validations.
- Unit test standard error handler middleware.

---

## Sprint 2: Authentication & Session Management
**Goal:** Secure the application with JWT and establish user sessions. Depends on Sprint 1.

**Tasks:**
1. Create JWT utility functions (sign access/refresh tokens, verify tokens).
2. Implement Auth Middleware to protect routes and Role Middleware for role-based access.
3. Implement `AuthService` and `AuthController`:
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `POST /api/auth/refresh`
   - `POST /api/auth/logout`
   - `POST /api/auth/logout-all`
   - `PUT /api/auth/change-password`
4. Implement Self User Management:
   - `GET /api/users/me`
   - `PATCH /api/users/me`

**Testing Requirements:**
- Unit test JWT token generation and verification.
- Unit test Auth Middleware (valid token, expired token, no token).
- Unit test authentication services (mocking DB calls).

---

## Sprint 3: Notes Module (Core CRUD)
**Goal:** Implement the primary feature—Note management. Depends on Sprint 2.

**Tasks:**
1. Define the **Note** schema and model.
   - *Indexes:* `schema.index({ owner: 1, status: 1 })`, `schema.index({ status: 1 })`, `schema.index({ title: "text", body: "text", tags: "text" })`.
2. Implement Note creation, retrieving a single note (by owner), and updating a note.
3. Implement paginated list retrieval (`GET /api/notes`) for the owner's notes, including:
   - Filtering by `status` (active, archived, trashed).
   - Filtering by `tags`.
   - Keyword search using text indexes (only for active notes).

**Testing Requirements:**
- Unit test Note CRUD service logic.
- Unit test text search and filtering queries.
- Validate access control (only the owner can view/edit).

---

## Sprint 4: Note Lifecycle & Sharing
**Goal:** Complete the Note feature set with lifecycle management and collaborative sharing. Depends on Sprint 3.

**Tasks:**
1. Implement Note status transition endpoints: Archive, Restore Archive, Trash, Restore Trash.
   - Enforce the 30-day restore window logic.
2. Define the **SharedNote** schema and model.
   - *Indexes:* `schema.index({ note: 1, sharedWith: 1 }, { unique: true })`.
3. Implement Sharing services and endpoints:
   - Share a note by email (`POST /api/notes/:id/shares`).
   - List shares for a note (`GET /api/notes/:id/shares`).
   - Revoke a share (`DELETE /api/notes/:id/shares/:shareId`).
4. Implement `GET /api/notes/shared-with-me` for users to view notes shared with them.
5. Update `GET /api/notes/:id` to allow read access for shared users.

**Testing Requirements:**
- Unit test lifecycle state machine transitions and access controls.
- Unit test sharing logic (email lookup, duplicate prevention).
- Unit test note read access for shared users vs. non-shared users.

---

## Sprint 5: Media Upload & Posts Module
**Goal:** Implement public posts and support image uploads. Depends on Sprint 2.

**Tasks:**
1. Set up Multer middleware for multipart file parsing (validating MIME types and 50MB size limit).
2. Implement Cloudflare R2 integration via `@aws-sdk/client-s3`.
3. Create `POST /api/media/upload` endpoint to return public R2 URLs.
4. Define the **Post** schema and model.
   - *Indexes:* `schema.index({ author: 1 })`, `schema.index({ title: "text", body: "text" })`.
5. Implement Post CRUD:
   - Create post (attaching media URLs).
   - Get list of non-deleted posts (with keyword search).
   - Get single post.
   - Update post.
   - Soft-delete post.

**Testing Requirements:**
- Unit test file validation (size, type).
- Mock S3 client to unit test upload service.
- Unit test Post CRUD logic and soft-delete filtering.

---

## Sprint 6: Admin Dashboard & Advanced Aggregations
**Goal:** Build out the admin capabilities and complex queries. Depends on all previous sprints.

**Tasks:**
1. Implement Admin User endpoints (`GET`, `POST`, `PATCH` on `/api/admin/users`), including soft-deleting users.
2. Implement Admin Note & Post views (viewing all global content, including soft-deleted posts).
3. Implement MongoDB Aggregation Pipelines:
   - **Pipeline 1 (Group by Interests):** `$unwind` interests, `$group`, `$sort`.
   - **Pipeline 2 (User Posts `$lookup`):** `$match` user, `$lookup` posts.
   - **Pipeline 3 (User Growth):** `$group` by date (`$dateToString`), `$sort`.
4. Integrate aggregation results into the Admin Analytics controllers.

**Testing Requirements:**
- Unit test aggregation pipeline logic (using a test DB or mocking responses).
- Unit test Admin Middleware (ensure regular users receive 403 Forbidden).

---

## Sprint 7: Background Jobs & Final Polish
**Goal:** Handle system maintenance, cleanup, and final review.

**Tasks:**
1. Set up `node-cron` for scheduled background tasks.
2. Implement the Trash Cleanup job (runs daily):
   - Find notes with `status = "trashed"` and `trashedAt < now - 30 days`.
   - Hard delete those notes.
   - **Cascade delete:** Delete all `SharedNote` records referencing the hard-deleted notes.
3. Review code against project constraints (explicit `schema.index()`, MVC pattern).

**Testing Requirements:**
- Unit test the Trash Cleanup job logic (mocking the date and verifying cascade deletions).
- Run full suite of all previously written unit tests to ensure no regressions.
