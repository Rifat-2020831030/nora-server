# API Specification — Nora Backend

> **Version:** 1.0  
> **Date:** 2026-08-11  
> **Base URL:** `/api`  
> **Auth:** Bearer token (JWT access token) in `Authorization` header, unless noted otherwise.

---

## Conventions

### Request / Response Format
- All request and response bodies are `application/json` unless the endpoint accepts file uploads (`multipart/form-data`).
- All list responses include a pagination wrapper.

### Standard Success Envelope
```json
{
  "success": true,
  "data": { ... } | [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
`meta` is only present on paginated list responses.

### Standard Error Envelope
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [ { "field": "email", "message": "Invalid format" } ]
}
```
`errors` array is optional, used for validation failures.

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (successful delete/revoke with no body) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorised (missing or invalid token) |
| 403 | Forbidden (valid token, insufficient role/ownership) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 413 | Payload Too Large (file exceeds 50 MB) |
| 415 | Unsupported Media Type (invalid file MIME) |
| 500 | Internal Server Error |

### Pagination Query Params (all list endpoints)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page |

---

## Module Index

1. [Auth](#1-auth)
2. [Users (Self)](#2-users-self)
3. [Notes](#3-notes)
4. [Note Sharing](#4-note-sharing)
5. [Posts](#5-posts)
6. [Media](#6-media)
7. [Admin — Users](#7-admin--users)
8. [Admin — Posts](#8-admin--posts)
9. [Admin — Analytics](#9-admin--analytics)

---

## 1. Auth

### POST `/auth/register`
Register a new user account.

**Auth:** None

**Request Body**
```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "Str0ng!Pass",
  "interests": ["chess", "reading"]
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `name` | Yes | 2–100 chars |
| `email` | Yes | Valid email, unique |
| `password` | Yes | Min 8 chars |
| `interests` | No | Array of strings |

**Response `201`**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "Alice",
      "email": "alice@example.com",
      "role": "user",
      "interests": ["chess", "reading"],
      "createdAt": "2026-08-11T00:00:00.000Z"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

---

### POST `/auth/login`
Authenticate and receive tokens.

**Auth:** None

**Request Body**
```json
{
  "email": "alice@example.com",
  "password": "Str0ng!Pass"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "Alice",
      "email": "alice@example.com",
      "role": "user"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Failure cases**
- `401` — Invalid credentials
- `403` — Account has been deleted (soft deleted)

---

### POST `/auth/refresh`
Exchange a valid refresh token for a new access token.

**Auth:** None (refresh token in body)

**Request Body**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ..."
  }
}
```

**Failure cases**
- `401` — Refresh token invalid, expired, or not found in DB

---

### POST `/auth/logout`
Revoke the current session's refresh token.

**Auth:** Required

**Request Body**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response `204`** — No body

---

### POST `/auth/logout-all`
Revoke all refresh tokens for the authenticated user (logout from all devices).

**Auth:** Required

**Response `204`** — No body

---

### PUT `/auth/change-password`
Change the authenticated user's password. Revokes all existing sessions on success.

**Auth:** Required

**Request Body**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewStr0ng!Pass"
}
```

**Response `200`**
```json
{
  "success": true,
  "message": "Password changed. All sessions have been revoked."
}
```

**Failure cases**
- `400` — `currentPassword` is incorrect

---

## 2. Users (Self)

### GET `/users/me`
Get the authenticated user's own profile.

**Auth:** Required

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "user",
    "interests": ["chess", "reading"],
    "createdAt": "2026-08-11T00:00:00.000Z"
  }
}
```

---

### PATCH `/users/me`
Update the authenticated user's profile fields.

**Auth:** Required

**Request Body** (all fields optional)
```json
{
  "name": "Alice Updated",
  "interests": ["chess", "cooking"]
}
```

**Response `200`**
```json
{
  "success": true,
  "data": { "...updated user object..." }
}
```

---

## 3. Notes

### POST `/notes`
Create a new note.

**Auth:** Required

**Request Body**
```json
{
  "title": "My First Note",
  "body": "Content goes here...",
  "tags": ["work", "idea"]
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `title` | Yes | 1–500 chars |
| `body` | Yes | Non-empty, Markdown supported |
| `tags` | No | Array of strings, each ≤ 50 chars |

**Response `201`**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "owner": "...",
    "title": "My First Note",
    "body": "Content goes here...",
    "tags": ["work", "idea"],
    "status": "active",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### GET `/notes`
List the authenticated user's own notes with filtering and search.

**Auth:** Required

**Query Params**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | `active` | Filter by status: `active`, `archived`, `trashed` |
| `tags` | string | — | Comma-separated tags to filter by (AND logic) |
| `q` | string | — | Keyword search (applies only when `status=active`) |
| `page` | integer | 1 | — |
| `limit` | integer | 20 | — |

**Response `200`**
```json
{
  "success": true,
  "data": [ { "...note objects..." } ],
  "meta": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}
```

> **Note:** When `q` is provided with `status` other than `active`, the `q` param is ignored and a warning may be returned in the response.

---

### GET `/notes/shared-with-me`
List notes that other users have shared with the authenticated user.

**Auth:** Required

**Query Params:** `page`, `limit`

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "note": { "...full note object, status included..." },
      "owner": { "_id": "...", "name": "Bob", "email": "bob@example.com" },
      "access": "read",
      "sharedAt": "..."
    }
  ],
  "meta": { "..." }
}
```

> Notes with `status: "trashed"` are excluded from this list automatically.

---

### GET `/notes/:id`
Get a single note by ID.

**Auth:** Required  
**Access:** Owner or user the note is shared with (read-only).

**Response `200`**
```json
{
  "success": true,
  "data": { "...full note object..." }
}
```

**Failure cases**
- `403` — Not owner and note not shared with requester
- `403` — Note is trashed and requester is a shared user (not owner)
- `404` — Note not found

---

### PATCH `/notes/:id`
Update a note's content.

**Auth:** Required  
**Access:** Owner only. Not allowed if note status is `trashed`.

**Request Body** (all fields optional)
```json
{
  "title": "Updated Title",
  "body": "Updated content...",
  "tags": ["updated-tag"]
}
```

**Response `200`**
```json
{
  "success": true,
  "data": { "...updated note object..." }
}
```

**Failure cases**
- `400` — Note is trashed; updates not allowed
- `403` — Not the owner

---

### PATCH `/notes/:id/archive`
Move a note to `archived` status.

**Auth:** Required  
**Access:** Owner only. Allowed from `active` or `trashed` status.

**Response `200`**
```json
{
  "success": true,
  "data": { "...note with status: archived..." }
}
```

---

### PATCH `/notes/:id/restore-archive`
Restore an archived note back to `active`.

**Auth:** Required  
**Access:** Owner only.

**Response `200`**
```json
{
  "success": true,
  "data": { "...note with status: active..." }
}
```

---

### PATCH `/notes/:id/trash`
Move a note to `trashed` status.

**Auth:** Required  
**Access:** Owner only. Allowed from `active` or `archived` status.

**Response `200`**
```json
{
  "success": true,
  "data": { "...note with status: trashed, trashedAt: timestamp..." }
}
```

---

### PATCH `/notes/:id/restore-trash`
Restore a trashed note back to `active`.

**Auth:** Required  
**Access:** Owner only. Only allowed if note has been in trash for fewer than 30 days.

**Response `200`**
```json
{
  "success": true,
  "data": { "...note with status: active..." }
}
```

**Failure cases**
- `400` — Trash window expired (> 30 days); note is pending permanent deletion

---

## 4. Note Sharing

### POST `/notes/:id/shares`
Share a note with another user by email.

**Auth:** Required  
**Access:** Note owner only.

**Request Body**
```json
{
  "email": "bob@example.com"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "note": "...",
    "sharedWith": { "_id": "...", "name": "Bob", "email": "bob@example.com" },
    "access": "read",
    "createdAt": "..."
  }
}
```

**Failure cases**
- `404` — No user found with that email
- `409` — Note already shared with that user
- `400` — Cannot share a trashed note
- `400` — Cannot share with yourself

---

### GET `/notes/:id/shares`
List all users the note is shared with.

**Auth:** Required  
**Access:** Note owner only.

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "sharedWith": { "_id": "...", "name": "Bob", "email": "bob@example.com" },
      "access": "read",
      "createdAt": "..."
    }
  ]
}
```

---

### DELETE `/notes/:id/shares/:shareId`
Revoke a specific share.

**Auth:** Required  
**Access:** Note owner only.

**Response `204`** — No body

**Failure cases**
- `404` — Share record not found or does not belong to this note

---

## 5. Posts

### POST `/posts`
Create a new post.

**Auth:** Required (any role)

**Request Body**
```json
{
  "title": "My First Post",
  "body": "Post content...",
  "mediaUrls": ["https://r2.example.com/image1.jpg"]
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `title` | Yes | 1–500 chars |
| `body` | Yes | Non-empty, Markdown supported |
| `mediaUrls` | No | Array of valid URLs previously returned by the media upload endpoint |

**Response `201`**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "author": { "_id": "...", "name": "Alice" },
    "title": "My First Post",
    "body": "Post content...",
    "mediaUrls": ["..."],
    "isDeleted": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### GET `/posts`
List all non-deleted posts (public feed for authenticated users).

**Auth:** Required

**Query Params**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Keyword search on `title` and `body` |
| `page` | integer | — |
| `limit` | integer | — |

**Response `200`**
```json
{
  "success": true,
  "data": [ { "...post objects..." } ],
  "meta": { "..." }
}
```

---

### GET `/posts/:id`
Get a single post.

**Auth:** Required

**Response `200`**
```json
{
  "success": true,
  "data": { "...full post object..." }
}
```

**Failure cases**
- `404` — Post not found or soft-deleted

---

### PATCH `/posts/:id`
Update a post.

**Auth:** Required  
**Access:** Post author or admin.

**Request Body** (all optional)
```json
{
  "title": "Updated Post Title",
  "body": "Updated content...",
  "mediaUrls": ["https://r2.example.com/new-image.jpg"]
}
```

**Response `200`**
```json
{
  "success": true,
  "data": { "...updated post object..." }
}
```

---

### DELETE `/posts/:id`
Soft-delete a post (hidden from public listing; recoverable by admin).

**Auth:** Required  
**Access:** Post author or admin.

**Response `204`** — No body

---

## 6. Media

### POST `/media/upload`
Upload an image to Cloudflare R2 and receive a public URL.

**Auth:** Required  
**Content-Type:** `multipart/form-data`

**Form Fields**

| Field | Required | Rules |
|-------|----------|-------|
| `file` | Yes | MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. Max size: 50 MB |

**Response `201`**
```json
{
  "success": true,
  "data": {
    "url": "https://pub-xxxx.r2.dev/uploads/abc123.jpg",
    "filename": "abc123.jpg",
    "mimeType": "image/jpeg",
    "sizeBytes": 204800
  }
}
```

**Failure cases**
- `413` — File exceeds 50 MB
- `415` — Unsupported MIME type

---

## 7. Admin — Users

> All endpoints in this section require `role: admin`.

### GET `/admin/users`
Paginated list of all users, including soft-deleted (labelled with `isDeleted: true`).

**Query Params:** `page`, `limit`, `q` (search by name or email)

**Response `200`**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Alice",
      "email": "alice@example.com",
      "role": "user",
      "isDeleted": false,
      "createdAt": "..."
    }
  ],
  "meta": { "..." }
}
```

---

### POST `/admin/users`
Create a new user account directly (Admin only).

**Request Body**
```json
{
  "name": "Bob",
  "email": "bob@example.com",
  "password": "Password123",
  "role": "user"
}
```

**Response `201`**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Bob",
    "email": "bob@example.com",
    "role": "user",
    "createdAt": "..."
  }
}
```

---

### PATCH `/admin/users/:id`
Update a user's details (Admin only).

**Request Body** (all optional)
```json
{
  "name": "Bob Updated",
  "role": "admin"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": { "...updated user object..." }
}
```

---

### GET `/admin/users/:id`
Get a single user's profile with note and post count summary.

**Response `200`**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Alice",
    "email": "alice@example.com",
    "role": "user",
    "interests": ["chess"],
    "isDeleted": false,
    "noteCount": 12,
    "postCount": 3,
    "createdAt": "..."
  }
}
```

---

### DELETE `/admin/users/:id`
Soft-delete a user account.

**Response `204`** — No body

**Failure cases**
- `400` — Cannot delete another admin account
- `409` — User already deleted

---

### PATCH `/admin/users/:id/restore`
Restore a soft-deleted user account.

**Response `200`**
```json
{
  "success": true,
  "data": { "...restored user object..." }
}
```

**Failure cases**
- `400` — User is not deleted

---

## 7.5 Admin — Notes

> All endpoints in this section require `role: admin`.

### GET `/admin/notes`
Paginated list of all notes across the platform.

**Query Params:** `page`, `limit`, `status`

**Response `200`**
```json
{
  "success": true,
  "data": [ { "...note objects including owner details..." } ],
  "meta": { "..." }
}
```

---

## 8. Admin — Posts

> All endpoints in this section require `role: admin`.

### GET `/admin/posts`
Paginated list of all posts including soft-deleted (with `isDeleted` label).

**Query Params:** `page`, `limit`, `q`, `deleted` (`true` | `false` | omit for all)

**Response `200`**
```json
{
  "success": true,
  "data": [ { "...post objects with isDeleted field..." } ],
  "meta": { "..." }
}
```

---

### PATCH `/admin/posts/:id/restore`
Restore a soft-deleted post.

**Response `200`**
```json
{
  "success": true,
  "data": { "...restored post object..." }
}
```

**Failure cases**
- `400` — Post is not deleted

---

## 9. Admin — Analytics

> All endpoints in this section require `role: admin`.

### GET `/admin/analytics/interests`
Users grouped by interest, sorted by member count descending.

**MongoDB pipeline:** `$unwind → $group → $sort`

**Response `200`**
```json
{
  "success": true,
  "data": [
    { "interest": "chess", "count": 42 },
    { "interest": "reading", "count": 38 }
  ]
}
```

---

### GET `/admin/analytics/user-posts/:userId`
Fetch all posts belonging to a particular user.

**Constraint:** Uses a single aggregation pipeline with a `$lookup` stage.

**MongoDB pipeline:** `$match on userId → $lookup into posts`

**Response `200`**
```json
{
  "success": true,
  "data": [
    { 
      "_id": "...", 
      "name": "Alice", 
      "email": "alice@example.com", 
      "userPosts": [
        { "title": "My Post", "body": "...", "createdAt": "..." }
      ]
    }
  ]
}
```

---

### GET `/admin/analytics/note-counts`
Total active note count per user.

**Query Params:** `page`, `limit`

**Response `200`**
```json
{
  "success": true,
  "data": [
    { "_id": "...", "name": "Alice", "email": "alice@example.com", "noteCount": 12 }
  ],
  "meta": { "..." }
}
```

---

### GET `/admin/analytics/user-growth`
User registration count over time.

**Query Params**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `granularity` | string | `month` | `month` or `day` |

**MongoDB pipeline:** `$group by $dateToString on createdAt → $sort ascending`

**Response `200`**
```json
{
  "success": true,
  "data": [
    { "period": "2026-08", "count": 34 },
    { "period": "2026-09", "count": 61 }
  ]
}
```

For `granularity=day`, the `period` format is `YYYY-MM-DD`.

---

## Appendix A — Route Summary

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/auth/register` | None | — | Register |
| POST | `/auth/login` | None | — | Login |
| POST | `/auth/refresh` | None | — | Refresh access token |
| POST | `/auth/logout` | Required | — | Logout (current session) |
| POST | `/auth/logout-all` | Required | — | Logout all sessions |
| PUT | `/auth/change-password` | Required | — | Change password |
| GET | `/users/me` | Required | — | Get own profile |
| PATCH | `/users/me` | Required | — | Update own profile |
| POST | `/notes` | Required | — | Create note |
| GET | `/notes` | Required | — | List own notes |
| GET | `/notes/shared-with-me` | Required | — | Shared notes inbox |
| GET | `/notes/:id` | Required | — | Get note |
| PATCH | `/notes/:id` | Required | owner | Update note content |
| PATCH | `/notes/:id/archive` | Required | owner | Archive note |
| PATCH | `/notes/:id/restore-archive` | Required | owner | Restore archived note |
| PATCH | `/notes/:id/trash` | Required | owner | Trash note |
| PATCH | `/notes/:id/restore-trash` | Required | owner | Restore trashed note |
| POST | `/notes/:id/shares` | Required | owner | Share note |
| GET | `/notes/:id/shares` | Required | owner | List shares |
| DELETE | `/notes/:id/shares/:shareId` | Required | owner | Revoke share |
| POST | `/posts` | Required | — | Create post |
| GET | `/posts` | Required | — | List posts |
| GET | `/posts/:id` | Required | — | Get post |
| PATCH | `/posts/:id` | Required | author\|admin | Update post |
| DELETE | `/posts/:id` | Required | author\|admin | Delete post |
| POST | `/media/upload` | Required | — | Upload image |
| GET | `/admin/users` | Required | admin | List all users |
| POST | `/admin/users` | Required | admin | Create new user |
| GET | `/admin/users/:id` | Required | admin | Get user detail |
| PATCH | `/admin/users/:id` | Required | admin | Update user details |
| DELETE | `/admin/users/:id` | Required | admin | Soft-delete user |
| PATCH | `/admin/users/:id/restore` | Required | admin | Restore user |
| GET | `/admin/notes` | Required | admin | List all notes globally |
| GET | `/admin/posts` | Required | admin | List all posts |
| PATCH | `/admin/posts/:id/restore` | Required | admin | Restore post |
| GET | `/admin/analytics/interests` | Required | admin | Group by interests |
| GET | `/admin/analytics/user-posts/:userId` | Required | admin | Fetch user and their posts |
| GET | `/admin/analytics/note-counts` | Required | admin | Note counts per user |
| GET | `/admin/analytics/user-growth` | Required | admin | User growth over time |

---

## Appendix B — Background Job

| Job | Schedule | Description |
|-----|----------|-------------|
| Trash Cleanup | Daily at 00:00 UTC | Hard-deletes notes where `status=trashed` AND `trashedAt < now - 30 days`. Cascades to delete associated `SharedNote` records. Logs count of deleted documents. |
