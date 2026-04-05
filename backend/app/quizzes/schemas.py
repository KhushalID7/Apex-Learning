from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
import uuid


class QuestionCreate(BaseModel):
    """A single question in a quiz creation request."""
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str = Field(..., pattern="^[A-D]$")


class QuizCreate(BaseModel):
    """Request body to create a quiz with questions."""
    title: str
    questions: List[QuestionCreate] = Field(..., min_length=1)


class QuestionUpdate(BaseModel):
    """A question in an update request — may have an id (existing) or not (new)."""
    id: Optional[str] = None
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str = Field(..., pattern="^[A-D]$")


class QuizUpdate(BaseModel):
    """Request body to update an existing quiz."""
    title: str
    questions: List[QuestionUpdate] = Field(..., min_length=1)


class QuestionResponse(BaseModel):
    """Response model for a question."""
    id: str
    quiz_id: str
    question: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    created_by_ai: bool = False
    created_at: str


class QuizResponse(BaseModel):
    """Response model for a quiz (without questions)."""
    id: str
    course_id: str
    title: str
    created_at: str
    question_count: Optional[int] = 0


class QuizDetailResponse(BaseModel):
    """Response model for a quiz with its questions."""
    id: str
    course_id: str
    title: str
    created_at: str
    questions: List[QuestionResponse] = []


class QuizSubmission(BaseModel):
    """Request body for a student submitting quiz answers."""
    answers: Dict[str, str]  # { question_id: "A"|"B"|"C"|"D" }


class QuizAttemptResponse(BaseModel):
    """Response model for a quiz attempt result."""
    id: str
    quiz_id: str
    student_id: str
    score: int
    total: int
    answers: Dict[str, str]
    submitted_at: str
