// API helper functions for course operations
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Course {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  title: string;
  description?: string;
  price: number;
  thumbnail_url?: string;
  is_published: boolean;
  created_at: string;
}

export interface Lecture {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  video_url?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TeacherStats {
  total_courses: number;
  total_enrollments: number;
  total_revenue: number;
  average_engagement: number;
  enrollment_trend: { date: string; count: number }[];
  course_breakdown: {
    id: string;
    title: string;
    students: number;
    revenue: number;
    engagement: number;
  }[];
}

export async function createCourse(
  course: {
    title: string;
    description?: string;
    price: number;
    thumbnail_url?: string;
  },
  token: string
): Promise<Course> {
  const response = await fetch(`${API_BASE_URL}/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(course),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create course");
  }

  return response.json();
}

export async function updateCourse(
  courseId: string,
  updates: Partial<Course>,
  token: string
): Promise<Course> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update course");
  }

  return response.json();
}

export async function deleteCourse(courseId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete course");
  }
}

export async function getTeacherCourses(token: string): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/courses/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }

  return response.json();
}

export async function getPublishedCourses(): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/courses`);

  if (!response.ok) {
    throw new Error("Failed to fetch courses");
  }

  return response.json();
}

export async function getCourseById(courseId: string): Promise<Course> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Course not found");
  }

  return response.json();
}

export async function getCourseLectures(courseId: string): Promise<Lecture[]> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/lectures`);

  if (!response.ok) {
    throw new Error("Failed to fetch lectures");
  }

  return response.json();
}

export async function uploadLecture(
  courseId: string,
  data: FormData,
  token: string
): Promise<Lecture> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/lectures`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to upload lecture");
  }

  return response.json();
}

export async function deleteLecture(lectureId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/courses/lectures/${lectureId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete lecture");
  }
}

export async function enrollInCourse(courseId: string, token: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enroll`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to enroll in course");
  }

  return response.json();
}

export async function checkEnrollmentStatus(courseId: string, token: string): Promise<{ is_enrolled: boolean }> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/enrollment-status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to check enrollment status");
  }

  return response.json();
}

export async function getEnrolledCourses(token: string): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/courses/enrolled`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch enrolled courses");
  }

  return response.json();
}

export async function getCourseProgress(courseId: string, token: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/progress`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch progress");
  const data = await response.json();
  return data.completed_lecture_ids;
}

export async function toggleLectureProgress(
  courseId: string,
  lectureId: string,
  completed: boolean,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/lectures/${lectureId}/progress?completed=${completed}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to update progress");
}

export async function getTeacherStats(token: string): Promise<TeacherStats> {
  const response = await fetch(`${API_BASE_URL}/courses/teacher/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch teacher stats");
  }

  return response.json();
}

// ─────────────────── Quiz Types ───────────────────

export interface Question {
  id: string;
  quiz_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  created_by_ai: boolean;
  created_at: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  created_at: string;
  question_count?: number;
}

export interface QuizDetail {
  id: string;
  course_id: string;
  title: string;
  created_at: string;
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total: number;
  answers: Record<string, string>;
  submitted_at: string;
}

// ─────────────────── Quiz API ───────────────────

export async function createQuiz(
  courseId: string,
  data: {
    title: string;
    questions: {
      question: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_answer: string;
    }[];
  },
  token: string
): Promise<QuizDetail> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/quizzes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to create quiz");
  }

  return response.json();
}

export async function getCourseQuizzes(courseId: string): Promise<Quiz[]> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/quizzes`);

  if (!response.ok) {
    throw new Error("Failed to fetch quizzes");
  }

  return response.json();
}

export async function getQuizById(quizId: string): Promise<QuizDetail> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Quiz not found");
  }

  return response.json();
}

export async function deleteQuiz(quizId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to delete quiz");
  }
}

export async function updateQuiz(
  quizId: string,
  data: {
    title: string;
    questions: {
      question: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      correct_answer: string;
    }[];
  },
  token: string
): Promise<QuizDetail> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to update quiz");
  }

  return response.json();
}

export async function submitQuiz(
  quizId: string,
  answers: Record<string, string>,
  token: string
): Promise<QuizAttempt> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ answers }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to submit quiz");
  }

  return response.json();
}

export async function getQuizAttempts(quizId: string, token: string): Promise<QuizAttempt[]> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/attempts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch quiz attempts");
  }

  return response.json();
}

// ─────────────────── Teacher Quiz Results ───────────────────

export interface QuizAttemptWithName extends QuizAttempt {
  student_name: string;
}

export interface QuizResults {
  quiz_title: string;
  course_id: string;
  attempts: QuizAttemptWithName[];
}

export async function getQuizResults(quizId: string, token: string): Promise<QuizResults> {
  const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/results`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to fetch quiz results");
  }

  return response.json();
}

// ─────────────────── AI Quiz Generation ───────────────────

export async function generateAIQuiz(
  courseId: string,
  data: { topic: string; num_questions?: number; difficulty?: string },
  token: string
): Promise<QuizDetail> {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/quizzes/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate AI quiz");
  }

  return response.json();
}
