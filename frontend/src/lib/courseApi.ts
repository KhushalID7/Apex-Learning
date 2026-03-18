// API helper functions for course operations
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Course {
  id: string;
  teacher_id: string;
  title: string;
  description?: string;
  price: number;
  thumbnail_url?: string;
  is_published: boolean;
  created_at: string;
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
