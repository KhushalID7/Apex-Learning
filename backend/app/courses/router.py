from fastapi import APIRouter, HTTPException, status, Depends
from app.courses.schemas import CourseCreate, CourseUpdate, CourseResponse
from app.auth.dependencies import get_current_user, require_role
from app.supabase_client import supabase, supabase_admin
from typing import List

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreate,
    current_user: dict = Depends(require_role("teacher", "master")),
):
    """Create a new course (teacher/master only)."""
    try:
        course_data = {
            "teacher_id": current_user["id"],
            "title": payload.title,
            "description": payload.description,
            "price": payload.price,
            "thumbnail_url": payload.thumbnail_url,
            "is_published": True,  # Default to published
        }

        response = supabase_admin.table("courses").insert(course_data).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create course",
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/", response_model=List[CourseResponse])
async def list_published_courses():
    """List all published courses (public endpoint)."""
    try:
        response = (
            supabase.table("courses")
            .select("*")
            .eq("is_published", True)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/my", response_model=List[CourseResponse])
async def list_my_courses(
    current_user: dict = Depends(require_role("teacher", "master")),
):
    """List the current teacher's courses."""
    try:
        response = (
            supabase.table("courses")
            .select("*")
            .eq("teacher_id", current_user["id"])
            .order("created_at", desc=True)
            .execute()
        )
        return response.data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str):
    """Get single course details (public endpoint)."""
    try:
        response = (
            supabase.table("courses")
            .select("*")
            .eq("id", course_id)
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found",
            )

        course = response.data

        # If the course is not published, we still allow viewing it
        # (enforcement happens at the database RLS level)
        return course

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    payload: CourseUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update a course (teacher/owner only)."""
    try:
        # Fetch the course to check ownership
        course_response = (
            supabase.table("courses")
            .select("teacher_id")
            .eq("id", course_id)
            .single()
            .execute()
        )

        if not course_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found",
            )

        course = course_response.data

        # Check ownership
        if course["teacher_id"] != current_user["id"] and current_user["role"] != "master":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only edit your own courses",
            )

        # Build update data (only include provided fields)
        update_data = payload.model_dump(exclude_unset=True)

        response = (
            supabase_admin.table("courses")
            .update(update_data)
            .eq("id", course_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update course",
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a course (teacher/owner only)."""
    try:
        # Fetch the course to check ownership
        course_response = (
            supabase.table("courses")
            .select("teacher_id")
            .eq("id", course_id)
            .single()
            .execute()
        )

        if not course_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found",
            )

        course = course_response.data

        # Check ownership
        if course["teacher_id"] != current_user["id"] and current_user["role"] != "master":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own courses",
            )

        # Delete the course
        supabase_admin.table("courses").delete().eq("id", course_id).execute()

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
