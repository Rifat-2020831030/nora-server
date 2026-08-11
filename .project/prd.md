# Product Requirements Document — Nora Backend

> **Version:** 1.0  
> **Date:** 2026-08-11  
> **Status:** Draft

---

## 1. Overview

Nora is a note-taking web application with a private-by-default model. Users can write, organise, and share notes privately, publish content as public posts, and collaborate by sharing individual notes. The backend exposes a RESTful API consumed by a web frontend.

---

## 2. Goals

| # | Goal |
|---|------|
| G1 | Provide a secure, role-aware authentication system with access + refresh token pair strategy |
| G2 | Give users a full lifecycle for notes: active → archived / trashed → deleted |
| G3 | Let users publish posts visible to all authenticated users |
| G4 | Allow note owners to share individual notes in read-only mode |
| G5 | Provide a powerful admin dashboard with user analytics, content management, and aggregations |
| G6 | Support keyword search and tag-based filtering for notes and posts |
| G7 | Support media uploads (images) via Cloudflare R2 |

---

## 3. Non-Goals (v1)

- Real-time collaboration or WebSocket support
- Video or PDF attachment support
- Email notifications
- Autocomplete / typeahead search
- Public (unauthenticated) access to any resource
- API versioning (`/api/v1/` prefix is not required)

---

## 4. Constraints (from project spec)

- **Database:** MongoDB (Mongoose ODM)
- **Architecture:** MVC — Router → Controller → Service → Model
- **Auth:** JWT (access token + refresh token); refresh tokens stored in DB
- **Collections:** At minimum — `users`, `notes`, `posts`, `refresh_tokens`, `shared_notes`
- **Required MongoDB features:**
  - At least **two aggregation pipelines** involving `$group` and `$lookup`. One must strictly be a Group by Interests using exactly one `collection.aggregate()` call. Another must be a Retrieve User Posts using a single aggregation pipeline with a `$lookup` stage.
  - At least **two advanced indexes** (compound, text, or partial).
- **Indexing Requirement:** You **must** use the `schema.index()` method for defining indexes in the Mongoose schema code so they are explicitly visible during review. Proper indexes must support all list views and GET operations.
- **Media storage:** Cloudflare R2 (images only)
- **Environment:** Node.js + Express

---

## 5. User Roles

| Role | Description |
|------|-------------|
| `user` | Default role on registration. Can create, update, delete, and view a list of their own notes. Can manage own posts and shares. |
| `admin` | Inherits User capabilities. Can manage users (add, remove, update, and list all users). Can view everyone's notes. Has read/write access to all content + admin dashboard. |

Role is stored on the `User` document and included in the JWT payload for authorisation middleware.

---

## 6. Entities & Data Models

### 6.1 User

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | PK |
| `name` | String | Display name |
| `email` | String | Unique, indexed |
| `password` | String | bcrypt hashed |
| `role` | Enum: `user` \| `admin` | Default `user` |
| `interests` | String[] | e.g. `["chess", "reading"]` |
| `isDeleted` | Boolean | Default `false` — soft delete |
| `deletedAt` | Date | Set on soft delete |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Soft delete behaviour:** Deleted users cannot log in. Their content (notes, posts) is preserved but excluded from default queries.

---

### 6.2 Note

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | PK |
| `owner` | ObjectId → User | Required |
| `title` | String | Required |
| `body` | String | Required, stores Markdown text for rich text support |
| `tags` | String[] | Optional, free-form |
| `status` | Enum: `active` \| `archived` \| `trashed` | Default `active` |
| `trashedAt` | Date | Set when moved to trash |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Note lifecycle state machine:**

```
active ──────────────────────────► archived
  │                                    │
  ▼                                    │ (restore)
trashed ◄───────────────────────────── ┘
  │
  │  (30 days, background job)
  ▼
hard deleted
```

- `active → archived`: reversible by the owner at any time.
- `active → trashed`: owner moves to trash; restorable within 30 days.
- `archived → trashed`: allowed.
- `trashed → active`: restore action available within 30-day window.
- Permanent deletion is **not** exposed as a user-facing API action; it is handled by the background cleanup job only.

---

### 6.3 Post

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | PK |
| `author` | ObjectId → User | Required |
| `title` | String | Required |
| `body` | String | Required, stores Markdown text for rich text support |
| `mediaUrls` | String[] | R2 public URLs |
| `isDeleted` | Boolean | Default `false` |
| `deletedAt` | Date | Set on soft delete |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

**Visibility:** Visible to all authenticated users. Soft-deleted posts are hidden from all listing endpoints but remain recoverable by admins.

---

### 6.4 Shared Note

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | PK |
| `note` | ObjectId → Note | Required |
| `owner` | ObjectId → User | Redundant ref for fast query |
| `sharedWith` | ObjectId → User | Required |
| `access` | Enum: `read` | Only `read` in v1 |
| `createdAt` | Date | Auto |

**Access rules:**
- Shares are resolved by email lookup of target user.
- If the note is trashed, shared users lose access immediately.
- If the note is archived, shared users can still read it (shown with an "archived" label in the UI context).
- Owner can revoke a share at any time (delete the SharedNote document).

---

### 6.5 Refresh Token

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | PK |
| `user` | ObjectId → User | Required |
| `token` | String | Hashed token stored |
| `expiresAt` | Date | TTL-indexed |
| `createdAt` | Date | Auto |

One record per session. Used to issue new access tokens and to support individual session logout.

---

## 7. Feature Areas

### 7.1 Authentication & Session Management

- **Register:** Email + password + name + optional interests. Password hashed with bcrypt (≥ 12 rounds).
- **Login:** Returns short-lived access token (15 min) + long-lived refresh token (7 days). Refresh token stored in DB; sent to client (cookie or response body — implementation choice).
- **Refresh:** Client sends refresh token → server validates against DB → issues new access token.
- **Logout:** Deletes the refresh token record from DB (single-session logout).
- **Logout All:** Deletes all refresh token records for the user (multi-device logout).
- **Password change:** Requires current password verification; on success, all refresh tokens for the user are revoked.

---

### 7.2 Notes

Full CRUD with lifecycle management.

| Action | Detail |
|--------|--------|
| Create | Owner creates with title, body, optional tags |
| Read list | Paginated; filterable by status (`active`, `archived`, `trashed`), tags; searchable by keyword |
| Read one | Owner or shared user (read-only) |
| Update | Title, body, tags — owner only; not allowed if note is trashed |
| Archive | Moves status to `archived` |
| Restore archive | Moves status back to `active` |
| Trash | Moves status to `trashed`, sets `trashedAt` |
| Restore trash | Moves status back to `active` (within 30-day window) |
| Share | Owner shares with another user by email |
| Revoke share | Owner removes a specific share |
| List shares | Owner lists who the note is shared with |

**Search & Filter scope:** Only `active` notes appear in search results. `archived` and `trashed` notes are excluded from keyword search.

---

### 7.3 Posts

| Action | Detail |
|--------|--------|
| Create | Any authenticated user; title + body required; media optional |
| Read list | Paginated; keyword searchable; excludes soft-deleted |
| Read one | Any authenticated user |
| Update | Author or admin |
| Delete | Author (soft) or admin (soft); hidden from public listing |

---

### 7.4 Media Upload (Cloudflare R2)

- **Scope:** Images only (`image/jpeg`, `image/png`, `image/webp`, `image/gif`)
- **Max file size:** 50 MB
- **Flow:** Client POSTs file → server validates MIME + size → uploads to R2 → returns public URL
- **Usage:** URLs are attached to posts at creation/update time
- **Future extension:** Video and PDF support would require transcoding pipelines and separate storage logic (out of scope v1)

---

### 7.5 Search & Filtering

| Resource | Searchable Fields | Filters |
|----------|------------------|---------|
| Notes | `title`, `body`, `tags` | `status`, `tags` |
| Posts | `title`, `body` | none (v1) |

- Implemented via MongoDB native text indexes.
- Search only runs on active (non-trashed, non-archived for notes) records.
- No autocomplete or typeahead.

---

### 7.6 Admin Dashboard

Accessible to `admin` role only.

| Feature | Description |
|---------|-------------|
| Add User | Create new user accounts directly |
| Update User | Modify details of any user profile |
| User listing | Paginated list of all users (including soft-deleted, labelled) |
| User detail | Single user profile with their note and post counts |
| User management | Soft delete / restore user accounts |
| Global Note View | View everyone's notes across the platform |
| Post management | View all posts including soft-deleted (with label); restore soft-deleted posts |
| Group by interests | Aggregation: users grouped by interest with member count |
| User posts via `$lookup` | Aggregation: fetch all posts belonging to a particular user |
| Notes per user | Total active note count per user |
| Posts per user | Total post count per user |
| User growth by month | Registration count grouped by calendar month |
| User growth by day | Registration count grouped by calendar day |

---

### 7.7 Background Job — Trash Cleanup

- **Trigger:** Scheduled job (cron, runs daily at midnight UTC)
- **Logic:** Find all notes where `status = "trashed"` AND `trashedAt < now - 30 days` → hard delete those documents
- **Shared note cleanup:** When a note is hard deleted, all `SharedNote` documents referencing it must also be deleted (cascading cleanup within the job)
- **Logging:** Job run result (count deleted) should be logged for observability

---

## 8. Non-Functional Requirements

| Concern | Requirement |
|---------|-------------|
| Security | All endpoints require valid JWT except login and register. Role middleware enforced per route. |
| Passwords | bcrypt with ≥ 12 salt rounds |
| Token expiry | Access token: 15 min. Refresh token: 7 days. |
| Pagination | All list endpoints support `page` + `limit` query params. Default: page 1, limit 20. |
| Error format | Consistent JSON error body: `{ success: false, message: string, errors?: [] }` |
| Input validation | All inputs validated at the controller/middleware layer before hitting services |
| File upload | Multer (or equivalent) for multipart handling before R2 upload |
| Indexes | Text indexes on notes and posts for search; compound index on `(owner, status)` for note queries; TTL index on refresh tokens |
| Soft delete queries | All user-facing list queries must filter `isDeleted: false` by default |

---

## 9. Third-Party Integrations

| Integration | Purpose | Notes |
|-------------|---------|-------|
| Cloudflare R2 | Image storage and delivery | S3-compatible API; use `@aws-sdk/client-s3` with R2 endpoint |
| bcrypt | Password hashing | Standard Node.js library |
| jsonwebtoken | JWT sign/verify | Standard |
| Multer | Multipart file parsing | Precedes R2 upload handler |
| node-cron | Background job scheduling | Trash cleanup job |

---

## 10. Index Plan

> **Note:** All indexes **must** be defined using the `schema.index()` method in Mongoose. Proper indexing must support all list views and all read operations (GET endpoints).

| Collection | Index | Type | Rationale |
|------------|-------|------|-----------|
| `users` | `email` | Unique | Login lookup (Read operation) |
| `users` | `role, isDeleted` | Compound | Support admin list views |
| `notes` | `(owner, status)` | Compound | Support user listing their own notes (List operation) |
| `notes` | `status` | Regular | Support admin global note list (List operation) |
| `notes` | `title, body, tags` | Text | Keyword search |
| `posts` | `title, body` | Text | Keyword search |
| `posts` | `author` | Regular | Support looking up posts by user (List operation) |
| `refresh_tokens` | `expiresAt` | TTL | Auto-expire old tokens |
| `refresh_tokens` | `user` | Regular | Logout-all query |
| `shared_notes` | `(note, sharedWith)` | Compound unique | Prevent duplicate shares |

---

## 11. Aggregation Pipeline Plan

### Pipeline 1 — Group Users by Interest
Collection: `users`  
Stage: `$unwind` interests array → `$group` by interest → `$sort` by member count descending  
Output: `[{ interest: "chess", count: 42 }, ...]`

### Pipeline 2 — Retrieve User Posts via `$lookup`
Collection: `users`  
Task: Retrieve all posts belonging to a particular user. Constraint: Use a single aggregation pipeline with a `$lookup` stage.
Stage: `$match` on user `_id` → `$lookup` into `posts` on `author = _id` (as `userPosts`)  
Output: `[{ _id, name, email, userPosts: [ { title, body... } ] }]`

### Pipeline 3 — User Growth by Month/Day
Collection: `users`  
Stage: `$group` by `$dateToString` on `createdAt` (format by month or day) → `$sort` by date ascending  

---

## 12. Open Items / Future Work

- Video and PDF upload support (requires transcoding pipeline)
- Edit access for shared notes (v2)
- Email notifications (invite to share, post published, etc.)
- Rate limiting per user/IP
- API versioning (`/api/v1/`) if the API becomes public
