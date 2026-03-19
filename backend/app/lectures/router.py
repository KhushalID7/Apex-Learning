from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from app.lectures.schemas import LectureCreate, LectureUpdate, LectureResponse
from app.auth.dependencies import get_current_user, require_role
from app.supabase_client import supabase, supabase_admin
from app.utils.storage import upload_file_to_azure, generate_presigned_url
from typing import List, Optional
import uuid

router = APIRouter(prefix="/courses", tags=["Lectures"])

async def check_course_ownership(course_id: str, current_user: dict):
    # Fetch course to check ownership
    course_response = (
        supabase.table("courses")
        .select("teacher_id")
        .eq("id", course_id)
        .single()
        .execute()
    )
    if not course_response.data:
        raise HTTPException(status_code=404, detail="Course not found")
        
    course = course_response.data
    if course["teacher_id"] != current_user["id"] and current_user["role"] != "master":
         raise HTTPException(status_code=403, detail="You do not have permission to manage lectures for this course")

@router.post("/{course_id}/lectures", response_model=LectureResponse, status_code=status.HTTP_201_CREATED)
async def upload_lecture(
    course_id: str,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    order_index: Optional[int] = Form(0),
    video: UploadFile = File(...),
    current_user: dict = Depends(require_role("teacher", "master"))
):
    """Upload a new lecture video and create metadata via form data."""
    try:
        await check_course_ownership(course_id, current_user)

        # Validate file
        if not video.content_type.startswith("video/"):
            raise HTTPException(status_code=400, detail="File must be a video")

        # Upload video to Azure Blob Storage
        object_name = upload_file_to_azure(video.file, video.filename, video.content_type)
        
        # Save to database
        lecture_data = {
            "course_id": course_id,
            "title": title,
            "description": description,
            "order_index": order_index,
            "video_url": object_name
        }

        response = supabase_admin.table("lectures").insert(lecture_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create lecture record")

        lecture = response.data[0]
        # Optionally convert object_name to presigned URL for immediate consumption
        if lecture.get("video_url"):
            lecture["video_url"] = generate_presigned_url(lecture["video_url"])

        return lecture

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{course_id}/lectures", response_model=List[LectureResponse])
async def get_course_lectures(course_id: str):
    """Get all lectures for a course."""
    try:
        response = (
            supabase.table("lectures")
            .select("*")
            .eq("course_id", course_id)
            .order("order_index")
            .execute()
        )
        
        lectures = response.data
        for doc in lectures:
            if doc.get("video_url"):
                doc["video_url"] = generate_presigned_url(doc["video_url"])
                
        return lectures
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/lectures/{lecture_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lecture(lecture_id: str, current_user: dict = Depends(require_role("teacher", "master"))):
    """Delete a lecture. (Endpoint is not nested under course_id for generic access)"""
    try:
        # First get the lecture to find its course
        lecture_res = supabase_admin.table("lectures").select("course_id").eq("id", lecture_id).single().execute()
        if not lecture_res.data:
            raise HTTPException(status_code=404, detail="Lecture not found")
            
        course_id = lecture_res.data["course_id"]
        await check_course_ownership(course_id, current_user)
        
        # Delete from DB
        # Ideally, we should also delete the object from R2 here to save space
        # We can fetch video_url (which is the object key string) first.
        # But this is sufficient for now just deleting DB record.
        supabase_admin.table("lectures").delete().eq("id", lecture_id).execute()
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
