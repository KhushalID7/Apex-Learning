# Phase 2 — Course Management

Implement the Course Management module so **teachers can create, edit, and list courses**, and **students can browse published courses**. This covers the `courses` table from the database schema along with backend CRUD endpoints and a polished frontend UI.

> [!NOTE]
> This phase intentionally does **not** include video/PDF upload (that's Phase 4 — Video Streaming) or enrollment (Phase 3). We're building the course metadata layer first.

## Supabase Database Setup (Manual)

> [!IMPORTANT]
> You'll need to create the `courses` table in your **Supabase Dashboard → Table Editor** before testing:
>
> | Column | Type | Notes |
> |---|---|---|
> | [id](file:///e:/CODES/AWT%20Learning%20platform/frontend/src/context/AuthContext.tsx#36-96) | `uuid` (PK, default `gen_random_uuid()`) | |
> | `teacher_id` | `uuid` (FK → `auth.users.id`) | |
> | `title` | [text](file:///e:/CODES/AWT%20Learning%20platform/frontend/src/context/AuthContext.tsx#20-27), NOT NULL | |
> | `description` | [text](file:///e:/CODES/AWT%20Learning%20platform/frontend/src/context/AuthContext.tsx#20-27) | |
> | `price` | `numeric`, default `0` | |
> | `thumbnail_url` | [text](file:///e:/CODES/AWT%20Learning%20platform/frontend/src/context/AuthContext.tsx#20-27) | |
> | `is_published` | `boolean`, default `false` | |
> | `created_at` | `timestamptz`, default `now()` | |
>
> Also add RLS policies:
> - **SELECT**: Allow all authenticated users to read published courses (`is_published = true`), and teachers to read their own courses.
> - **INSERT/UPDATE/DELETE**: Allow only the course's `teacher_id` to modify their own courses.

---

## Proposed Changes

### Backend — Course Module

#### [NEW] [schemas.py](file:///e:/CODES/AWT%20Learning%20platform/backend/app/courses/schemas.py)
- `CourseCreate` — title (required), description, price, thumbnail_url
- `CourseUpdate` — all fields optional
- `CourseResponse` — full course fields + teacher_id, created_at

#### [NEW] [router.py](file:///e:/CODES/AWT%20Learning%20platform/backend/app/courses/router.py)
Endpoints (all under `/courses` prefix):
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | Teacher/Master | Create a new course |
| `GET` | `/` | Public | List all published courses |
| `GET` | `/my` | Teacher | List teacher's own courses |
| `GET` | `/{course_id}` | Public | Get single course details |
| `PUT` | `/{course_id}` | Teacher (owner) | Update course |
| `DELETE` | `/{course_id}` | Teacher (owner) | Delete course |

#### [NEW] [\_\_init\_\_.py](file:///e:/CODES/AWT%20Learning%20platform/backend/app/courses/__init__.py)
Empty init file for the courses package.

#### [MODIFY] [main.py](file:///e:/CODES/AWT%20Learning%20platform/backend/app/main.py)
- Import and register the courses router.

---

### Frontend — Teacher Course Management

#### [NEW] [page.tsx](file:///e:/CODES/AWT%20Learning%20platform/frontend/src/app/dashboard/courses/page.tsx)
Teacher's "My Courses" page:
- Lists all courses created by the teacher (cards with title, price, published status)
- "Create Course" button → opens create form/modal
- Edit & Delete actions on each card
- Only accessible to `teacher` role

#### [NEW] [page.tsx](file:///e:/CODES/AWT%20Learning%20platform/frontend/src/app/dashboard/courses/new/page.tsx)
Create Course form page:
- Fields: title, description, price, thumbnail URL
- Submit → `POST /courses`
- Redirect to `/dashboard/courses` on success

#### [NEW] [page.tsx](file:///e:/CODES/AWT%20Learning%20platform/frontend/src/app/dashboard/courses/[id]/edit/page.tsx)
Edit Course form page:
- Pre-filled form with existing course data
- Submit → `PUT /courses/{id}`
- Delete button → `DELETE /courses/{id}`

---

### Frontend — Student Course Browsing

#### [NEW] [page.tsx](file:///e:/CODES/AWT%20Learning%20platform/frontend/src/app/courses/page.tsx)
Public course catalog page:
- Grid of published course cards (thumbnail, title, price, teacher name)
- Search/filter functionality
- Click → course detail page

#### [NEW] [page.tsx](file:///e:/CODES/AWT%20Learning%20platform/frontend/src/app/courses/[id]/page.tsx)
Single course detail page:
- Course title, description, price, teacher info
- "Enroll" button (disabled/placeholder for Phase 3)

---

### Frontend — Dashboard Navigation Updates

#### [MODIFY] [page.tsx](file:///e:/CODES/AWT%20Learning%20platform/frontend/src/app/dashboard/page.tsx)
- Add navigation links: "My Courses" (teacher) / "Browse Courses" (student)
- Update stat cards to show real course counts from the API

---

## Verification Plan

### Browser Testing
1. **Start backend**: `cd backend && uvicorn app.main:app --reload --port 8000`
2. **Start frontend**: `cd frontend && npm run dev`
3. **Teacher flow**: Log in as teacher → navigate to "My Courses" → create a course → verify it appears in the list → edit the course → verify changes → delete the course
4. **Student flow**: Log in as student → browse courses → verify published courses appear → view course detail page
5. **RBAC verification**: Confirm students cannot access `/dashboard/courses` (teacher create/manage page)

### API Testing (manual via browser/Swagger)
- Visit `http://localhost:8000/docs` → test each endpoint with valid/invalid tokens and roles
