# AWT Learning Platform — Master Task List

## Phase 0 — Project Scaffolding ✅
- [x] Create FastAPI backend skeleton ([main.py](file:///e:/CODES/AWT%20Learning%20platform/backend/app/main.py), [requirements.txt](file:///e:/CODES/AWT%20Learning%20platform/backend/requirements.txt), [.env.example](file:///e:/CODES/AWT%20Learning%20platform/backend/.env.example))
- [x] Create Next.js frontend project
- [x] Verify both servers start successfully

## Phase 1 — Auth + RBAC
- [/] Supabase project setup + `profiles` table (SQL migration ready, needs to be run)
- [x] Backend: register / login endpoints (JWT via Supabase Auth)
- [x] Backend: role middleware (master / teacher / student)
- [x] Frontend: login & register pages
- [ ] Test: register → login → access protected route

## Phase 2 — Course Management
- [ ] `courses` + `lectures` tables in Supabase
- [ ] Backend: CRUD endpoints for courses (teacher-only create/update)
- [ ] Backend: lecture upload endpoint (video → R2)
- [ ] Frontend: teacher dashboard — create course + add lectures
- [ ] Frontend: student course catalog page
- [ ] Test: teacher creates course → student sees it

## Phase 3 — Student Enrollment
- [ ] `enrollments` table
- [ ] Backend: enroll endpoint + "my courses" endpoint
- [ ] Redis cache for enrollment lookups (Upstash)
- [ ] Frontend: enroll button + enrolled courses page
- [ ] Test: student enrolls → appears in "my courses"

## Phase 4 — Video Streaming
- [ ] Backend: signed URL generator for R2 videos
- [ ] Frontend: React player with signed URL
- [ ] Test: enrolled student can watch video, unenrolled cannot

## Phase 5 — Progress Tracking
- [ ] Backend: mark lecture complete endpoint → update `progress_pct`
- [ ] Frontend: progress bar on course page
- [ ] Test: complete all lectures → 100% progress

## Phase 6 — Quiz System
- [ ] `quizzes` + `questions` tables
- [ ] Backend: teacher creates quiz, student submits answers
- [ ] Frontend: quiz create & attempt UI
- [ ] Test: teacher creates quiz → student takes it → score returned

## Phase 7 — AI MCQ Generator
- [ ] Backend: Gemini API integration → generate questions as JSON
- [ ] Frontend: "Generate quiz with AI" button
- [ ] Test: teacher generates AI quiz → questions saved to DB

## Phase 8 — Doubt System
- [ ] Backend: send email (Resend) from student → teacher
- [ ] Frontend: doubt form on lecture page
- [ ] Test: student submits doubt → teacher receives email

## Phase 9 — Payments (Razorpay)
- [ ] `payments` table
- [ ] Backend: create Razorpay order + verify webhook → enroll
- [ ] Frontend: payment flow
- [ ] Test: simulate webhook → student enrolled

## Phase 10 — Certificates
- [ ] `certificates` table
- [ ] Backend: WeasyPrint generates PDF → upload to storage
- [ ] Frontend: download certificate button
- [ ] Test: 100% progress → certificate generated & downloadable
