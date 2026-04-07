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

## Phase 2 — Course Management ✅
- [x] `courses` + `lectures` tables in Supabase
- [x] Backend: CRUD endpoints for courses (teacher-only create/update)
- [x] Backend: lecture upload endpoint (video → Azure Blob)
- [x] Frontend: teacher dashboard — create course + add lectures
- [x] Frontend: student course catalog page
- [x] Test: teacher creates course → student sees it

## Phase 3 — Student Enrollment ✅
- [x] `enrollments` table
- [x] Backend: enroll endpoint + "my courses" endpoint
- [ ] Redis cache for enrollment lookups (Upstash)
- [x] Frontend: enroll button + enrolled courses page
- [x] Test: student enrolls → appears in "my courses"

## Phase 4 — Video Streaming ✅
- [x] Backend: signed URL generator for Azure Blob videos
- [x] Frontend: Video player with signed URL
- [x] Test: enrolled student can watch video, unenrolled cannot

## Phase 5 — Progress Tracking ✅
- [x] Backend: mark lecture complete endpoint → update progress
- [x] Frontend: progress bar on course page
- [x] Test: complete all lectures → 100% progress

## Phase 6 — Quiz System
- [x] `quizzes` + `questions` tables
- [x] Backend: teacher creates quiz, student submits answers
- [x] Frontend: quiz create & attempt UI
- [ ] Test: teacher creates quiz → student takes it → score returned

## Phase 7 — AI MCQ Generator
- [x] Backend: Gemini API integration → generate questions as JSON
- [x] Frontend: "Generate quiz with AI" button
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
