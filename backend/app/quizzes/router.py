from fastapi import APIRouter, HTTPException, status, Depends
from app.quizzes.schemas import (
    QuizCreate, QuizUpdate, QuizResponse, QuizDetailResponse,
    QuestionResponse, QuizSubmission, QuizAttemptResponse,
)
from app.auth.dependencies import get_current_user, require_role
from app.supabase_client import supabase, supabase_admin
from app.config import get_settings
from pydantic import BaseModel
from typing import List, Optional
import json

router = APIRouter(tags=["Quizzes"])


# ────────────────────── AI GENERATION ──────────────────────

class AIQuizRequest(BaseModel):
    topic: str
    num_questions: int = 5
    difficulty: Optional[str] = "medium"  # easy, medium, hard


@router.post("/courses/{course_id}/quizzes/generate", response_model=QuizDetailResponse, status_code=status.HTTP_201_CREATED)
async def generate_ai_quiz(
    course_id: str,
    payload: AIQuizRequest,
    current_user: dict = Depends(require_role("teacher", "master")),
):
    """Generate a quiz using Groq AI for a course (teacher/master only)."""
    try:
        import httpx

        groq_key = get_settings().GROQ_API_KEY
        if not groq_key:
            raise HTTPException(status_code=400, detail="Groq API key not configured")

        # Check course ownership
        course_res = (
            supabase.table("courses")
            .select("teacher_id, title")
            .eq("id", course_id)
            .single()
            .execute()
        )
        if not course_res.data:
            raise HTTPException(status_code=404, detail="Course not found")
        if course_res.data["teacher_id"] != current_user["id"] and current_user["role"] != "master":
            raise HTTPException(status_code=403, detail="You do not own this course")

        prompt = f"""Generate exactly {payload.num_questions} multiple choice questions about "{payload.topic}" for a course titled "{course_res.data['title']}".
Difficulty level: {payload.difficulty}.

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {{
    "question": "What is ...?",
    "option_a": "First option",
    "option_b": "Second option",
    "option_c": "Third option",
    "option_d": "Fourth option",
    "correct_answer": "A"
  }}
]

Rules:
- correct_answer must be exactly one of: "A", "B", "C", or "D"
- Each question must have exactly 4 options
- Questions should be factually accurate and educational
- Return ONLY the JSON array, nothing else"""

        # Call Groq API (OpenAI-compatible)
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {groq_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": "You are a quiz generator. Return ONLY valid JSON arrays, no markdown or extra text."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.7,
                    "max_tokens": 4096,
                },
                timeout=30.0,
            )

        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Groq API error: {resp.text}")

        response_text = resp.json()["choices"][0]["message"]["content"].strip()

        # Clean up markdown code blocks if present
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3].strip()

        questions_data = json.loads(response_text)

        if not isinstance(questions_data, list) or len(questions_data) == 0:
            raise HTTPException(status_code=400, detail="AI returned invalid quiz data")

        # Create quiz
        quiz_title = f"AI Quiz: {payload.topic}"
        quiz_res = supabase_admin.table("quizzes").insert({
            "course_id": course_id,
            "title": quiz_title,
        }).execute()

        if not quiz_res.data:
            raise HTTPException(status_code=400, detail="Failed to create quiz")

        quiz = quiz_res.data[0]

        # Insert AI-generated questions
        db_questions = [
            {
                "quiz_id": quiz["id"],
                "question": q["question"],
                "option_a": q["option_a"],
                "option_b": q["option_b"],
                "option_c": q["option_c"],
                "option_d": q["option_d"],
                "correct_answer": q["correct_answer"].upper(),
                "created_by_ai": True,
            }
            for q in questions_data
        ]

        questions_res = supabase_admin.table("questions").insert(db_questions).execute()

        return {
            **quiz,
            "questions": questions_res.data or [],
        }

    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="AI returned invalid JSON. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ────────────────────── TEACHER ENDPOINTS ──────────────────────

@router.post("/courses/{course_id}/quizzes", response_model=QuizDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    course_id: str,
    payload: QuizCreate,
    current_user: dict = Depends(require_role("teacher", "master")),
):
    """Create a quiz with questions for a course (teacher/master only)."""
    try:
        # Check course ownership
        course_res = (
            supabase.table("courses")
            .select("teacher_id")
            .eq("id", course_id)
            .single()
            .execute()
        )
        if not course_res.data:
            raise HTTPException(status_code=404, detail="Course not found")
        if course_res.data["teacher_id"] != current_user["id"] and current_user["role"] != "master":
            raise HTTPException(status_code=403, detail="You do not own this course")

        # Insert quiz
        quiz_res = supabase_admin.table("quizzes").insert({
            "course_id": course_id,
            "title": payload.title,
        }).execute()

        if not quiz_res.data:
            raise HTTPException(status_code=400, detail="Failed to create quiz")

        quiz = quiz_res.data[0]

        # Insert questions
        questions_data = [
            {
                "quiz_id": quiz["id"],
                "question": q.question,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
                "correct_answer": q.correct_answer,
                "created_by_ai": False,
            }
            for q in payload.questions
        ]

        questions_res = supabase_admin.table("questions").insert(questions_data).execute()

        return {
            **quiz,
            "questions": questions_res.data or [],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/quizzes/{quiz_id}", response_model=QuizDetailResponse)
async def update_quiz(
    quiz_id: str,
    payload: QuizUpdate,
    current_user: dict = Depends(require_role("teacher", "master")),
):
    """Update a quiz title and replace its questions (teacher/master only)."""
    try:
        # Get quiz -> course -> check ownership
        quiz_res = (
            supabase_admin.table("quizzes")
            .select("course_id")
            .eq("id", quiz_id)
            .single()
            .execute()
        )
        if not quiz_res.data:
            raise HTTPException(status_code=404, detail="Quiz not found")

        course_res = (
            supabase.table("courses")
            .select("teacher_id")
            .eq("id", quiz_res.data["course_id"])
            .single()
            .execute()
        )
        if not course_res.data:
            raise HTTPException(status_code=404, detail="Course not found")
        if course_res.data["teacher_id"] != current_user["id"] and current_user["role"] != "master":
            raise HTTPException(status_code=403, detail="You do not own this course")

        # Update quiz title
        updated_quiz = (
            supabase_admin.table("quizzes")
            .update({"title": payload.title})
            .eq("id", quiz_id)
            .execute()
        )
        if not updated_quiz.data:
            raise HTTPException(status_code=400, detail="Failed to update quiz")

        # Delete all old questions and re-insert
        supabase_admin.table("questions").delete().eq("quiz_id", quiz_id).execute()

        new_questions = [
            {
                "quiz_id": quiz_id,
                "question": q.question,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
                "correct_answer": q.correct_answer,
                "created_by_ai": False,
            }
            for q in payload.questions
        ]

        questions_res = supabase_admin.table("questions").insert(new_questions).execute()

        return {
            **updated_quiz.data[0],
            "questions": questions_res.data or [],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/courses/{course_id}/quizzes", response_model=List[QuizResponse])
async def list_course_quizzes(course_id: str):
    """List all quizzes for a course (public)."""
    try:
        quizzes_res = (
            supabase_admin.table("quizzes")
            .select("*")
            .eq("course_id", course_id)
            .order("created_at", desc=True)
            .execute()
        )
        quizzes = quizzes_res.data or []

        # Fetch question counts
        if quizzes:
            quiz_ids = [q["id"] for q in quizzes]
            questions_res = (
                supabase_admin.table("questions")
                .select("quiz_id")
                .in_("quiz_id", quiz_ids)
                .execute()
            )
            count_map = {}
            for q in (questions_res.data or []):
                count_map[q["quiz_id"]] = count_map.get(q["quiz_id"], 0) + 1

            for quiz in quizzes:
                quiz["question_count"] = count_map.get(quiz["id"], 0)

        return quizzes

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/quizzes/{quiz_id}", response_model=QuizDetailResponse)
async def get_quiz(quiz_id: str):
    """Get a quiz with all its questions (public)."""
    try:
        quiz_res = (
            supabase_admin.table("quizzes")
            .select("*")
            .eq("id", quiz_id)
            .single()
            .execute()
        )
        if not quiz_res.data:
            raise HTTPException(status_code=404, detail="Quiz not found")

        questions_res = (
            supabase_admin.table("questions")
            .select("*")
            .eq("quiz_id", quiz_id)
            .order("created_at")
            .execute()
        )

        return {
            **quiz_res.data,
            "questions": questions_res.data or [],
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: str,
    current_user: dict = Depends(require_role("teacher", "master")),
):
    """Delete a quiz (teacher/master only, must own the course)."""
    try:
        # Get quiz → course → check ownership
        quiz_res = (
            supabase_admin.table("quizzes")
            .select("course_id")
            .eq("id", quiz_id)
            .single()
            .execute()
        )
        if not quiz_res.data:
            raise HTTPException(status_code=404, detail="Quiz not found")

        course_res = (
            supabase.table("courses")
            .select("teacher_id")
            .eq("id", quiz_res.data["course_id"])
            .single()
            .execute()
        )
        if not course_res.data:
            raise HTTPException(status_code=404, detail="Course not found")
        if course_res.data["teacher_id"] != current_user["id"] and current_user["role"] != "master":
            raise HTTPException(status_code=403, detail="You do not own this course")

        # Cascade delete will remove questions and attempts too
        supabase_admin.table("quizzes").delete().eq("id", quiz_id).execute()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/quizzes/{quiz_id}/results")
async def get_quiz_results(
    quiz_id: str,
    current_user: dict = Depends(require_role("teacher", "master")),
):
    """Get all student attempts for a quiz (teacher only, must own the course)."""
    try:
        # Get quiz → course → check ownership
        quiz_res = (
            supabase_admin.table("quizzes")
            .select("course_id, title")
            .eq("id", quiz_id)
            .single()
            .execute()
        )
        if not quiz_res.data:
            raise HTTPException(status_code=404, detail="Quiz not found")

        course_res = (
            supabase.table("courses")
            .select("teacher_id")
            .eq("id", quiz_res.data["course_id"])
            .single()
            .execute()
        )
        if not course_res.data:
            raise HTTPException(status_code=404, detail="Course not found")
        if course_res.data["teacher_id"] != current_user["id"] and current_user["role"] != "master":
            raise HTTPException(status_code=403, detail="You do not own this course")

        # Fetch all attempts
        attempts_res = (
            supabase_admin.table("quiz_attempts")
            .select("*")
            .eq("quiz_id", quiz_id)
            .order("submitted_at", desc=True)
            .execute()
        )
        attempts = attempts_res.data or []

        # Fetch student names
        if attempts:
            student_ids = list(set(a["student_id"] for a in attempts))
            profiles_res = (
                supabase_admin.table("profiles")
                .select("id, full_name")
                .in_("id", student_ids)
                .execute()
            )
            name_map = {p["id"]: p.get("full_name", "Unknown") for p in (profiles_res.data or [])}
            for a in attempts:
                a["student_name"] = name_map.get(a["student_id"], "Unknown")

        return {
            "quiz_title": quiz_res.data["title"],
            "course_id": quiz_res.data["course_id"],
            "attempts": attempts,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ────────────────────── STUDENT ENDPOINTS ──────────────────────

@router.post("/quizzes/{quiz_id}/submit", response_model=QuizAttemptResponse)
async def submit_quiz(
    quiz_id: str,
    payload: QuizSubmission,
    current_user: dict = Depends(require_role("student")),
):
    """Submit answers for a quiz. Returns score."""
    try:
        # Fetch quiz questions to check answers
        questions_res = (
            supabase_admin.table("questions")
            .select("id, correct_answer")
            .eq("quiz_id", quiz_id)
            .execute()
        )
        questions = questions_res.data or []

        if not questions:
            raise HTTPException(status_code=404, detail="Quiz not found or has no questions")

        # Grade the quiz
        total = len(questions)
        score = 0
        for q in questions:
            student_answer = payload.answers.get(q["id"], "")
            if student_answer.upper() == q["correct_answer"].upper():
                score += 1

        # Save attempt
        attempt_res = supabase_admin.table("quiz_attempts").insert({
            "quiz_id": quiz_id,
            "student_id": current_user["id"],
            "score": score,
            "total": total,
            "answers": payload.answers,
        }).execute()

        if not attempt_res.data:
            raise HTTPException(status_code=400, detail="Failed to save attempt")

        return attempt_res.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/quizzes/{quiz_id}/attempts", response_model=List[QuizAttemptResponse])
async def get_quiz_attempts(
    quiz_id: str,
    current_user: dict = Depends(require_role("student")),
):
    """Get the current student's past attempts for a quiz."""
    try:
        res = (
            supabase_admin.table("quiz_attempts")
            .select("*")
            .eq("quiz_id", quiz_id)
            .eq("student_id", current_user["id"])
            .order("submitted_at", desc=True)
            .execute()
        )
        return res.data or []

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
