from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import List, Dict, Any
from app.auth.dependencies import get_current_user, require_role
from app.limiter import limiter
from app.supabase_client import supabase, supabase_admin
from app.utils.email import send_new_doubt_email
from app.doubts.schemas import (
    DoubtCreate, DoubtUpdate, DoubtResponse, 
    DoubtDetailResponse, DoubtReplyCreate, DoubtReplyResponse
)

router = APIRouter(tags=["Doubts"])

@router.post("/courses/{course_id}/doubts", response_model=DoubtResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def create_doubt(
    request: Request,
    course_id: str,
    payload: DoubtCreate,
    current_user: dict = Depends(require_role("student"))
):
    """Student creates a new doubt for a specific course."""
    try:
        # Check enrollment first
        enroll_res = supabase_admin.table("enrollments").select("id").eq("course_id", course_id).eq("student_id", current_user["id"]).execute()
        if not enroll_res.data:
            raise HTTPException(status_code=403, detail="You must be enrolled to ask a doubt.")

        data = {
            "course_id": course_id,
            "student_id": current_user["id"],
            "lecture_id": payload.lecture_id,
            "title": payload.title,
            "description": payload.description,
            "status": "open"
        }
        # Use supabase_admin since anon client would fail RLS for custom user logic
        res = supabase_admin.table("doubts").insert(data).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to create doubt")
        
        doubt = res.data[0]
        student_name = current_user.get("full_name")
        doubt["student_name"] = student_name
        
        # Fire and forget email notification
        try:
            # 1. Fetch course title and teacher_id
            course_res = supabase_admin.table("courses").select("title, teacher_id").eq("id", course_id).single().execute()
            if course_res.data:
                course_title = course_res.data.get("title")
                teacher_id = course_res.data.get("teacher_id")
                
                # 2. Fetch teacher email and name
                teacher_res = supabase_admin.table("profiles").select("full_name").eq("id", teacher_id).single().execute()
                teacher_name = teacher_res.data.get("full_name") if teacher_res.data else "Teacher"
                
                # Fetch user email from auth via admin
                auth_res = supabase_admin.auth.admin.get_user_by_id(teacher_id)
                if auth_res.user and auth_res.user.email:
                    teacher_email = auth_res.user.email
                    
                    import asyncio
                    asyncio.create_task(
                        send_new_doubt_email(
                            teacher_email=teacher_email,
                            teacher_name=teacher_name,
                            course_title=course_title,
                            student_name=student_name,
                            doubt_title=payload.title,
                            doubt_desc=payload.description
                        )
                    )
        except Exception as email_err:
            print(f"Failed to queue email: {email_err}")

        return doubt
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/courses/{course_id}/doubts", response_model=List[DoubtResponse])
async def list_course_doubts(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """List all doubts for a course. Includes student name and reply count."""
    try:
        res = supabase_admin.table("doubts").select("*").eq("course_id", course_id).order("created_at", desc=True).execute()
        doubts = res.data or []

        if not doubts:
            return []

        # Get student profiles
        student_ids = list(set([d["student_id"] for d in doubts]))
        profiles_res = supabase_admin.table("profiles").select("id, full_name").in_("id", student_ids).execute()
        profiles_map = {p["id"]: p.get("full_name") for p in (profiles_res.data or [])}

        # Get lecture info
        lecture_ids = list(set([d["lecture_id"] for d in doubts if d.get("lecture_id")]))
        lectures_map = {}
        if lecture_ids:
            lectures_res = supabase_admin.table("lectures").select("id, title").in_("id", lecture_ids).execute()
            lectures_map = {l["id"]: l.get("title") for l in (lectures_res.data or [])}

        # Get reply counts
        reply_res = supabase_admin.table("doubt_replies").select("doubt_id").in_("doubt_id", [d["id"] for d in doubts]).execute()
        reply_counts = {}
        for r in (reply_res.data or []):
            reply_counts[r["doubt_id"]] = reply_counts.get(r["doubt_id"], 0) + 1

        for d in doubts:
            d["student_name"] = profiles_map.get(d["student_id"])
            if d.get("lecture_id"):
                d["lecture_title"] = lectures_map.get(d["lecture_id"])
            d["reply_count"] = reply_counts.get(d["id"], 0)

        return doubts
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/doubts/{doubt_id}", response_model=DoubtDetailResponse)
async def get_doubt_detail(
    doubt_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific doubt along with its replies."""
    try:
        res = supabase_admin.table("doubts").select("*").eq("id", doubt_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Doubt not found")
        doubt = res.data

        # Profile
        profile_res = supabase_admin.table("profiles").select("full_name").eq("id", doubt["student_id"]).execute()
        doubt["student_name"] = profile_res.data[0].get("full_name") if profile_res.data else None

        # Replies
        replies_res = supabase_admin.table("doubt_replies").select("*").eq("doubt_id", doubt_id).order("created_at").execute()
        replies = replies_res.data or []
        
        reply_user_ids = list(set([r["user_id"] for r in replies]))
        if reply_user_ids:
            rp_res = supabase_admin.table("profiles").select("id, full_name").in_("id", reply_user_ids).execute()
            rp_map = {p["id"]: p.get("full_name") for p in (rp_res.data or [])}
            for r in replies:
                r["user_name"] = rp_map.get(r["user_id"])
                
        doubt["replies"] = replies
        return doubt
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/doubts/{doubt_id}/replies", response_model=DoubtReplyResponse)
async def reply_to_doubt(
    doubt_id: str,
    payload: DoubtReplyCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add a reply to a doubt."""
    try:
        data = {
            "doubt_id": doubt_id,
            "user_id": current_user["id"],
            "content": payload.content
        }
        # Use supabase_admin for inserting
        res = supabase_admin.table("doubt_replies").insert(data).execute()
        if not res.data:
            raise HTTPException(status_code=400, detail="Failed to post reply")
            
        reply = res.data[0]
        reply["user_name"] = current_user.get("full_name")
        return reply
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/doubts/{doubt_id}/resolve", response_model=DoubtResponse)
async def resolve_doubt(
    doubt_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Toggle doubt status (Teacher or author)."""
    try:
        res = supabase_admin.table("doubts").select("*").eq("id", doubt_id).single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Doubt not found")
        doubt = res.data
        
        # Check permissions
        is_owner = doubt["student_id"] == current_user["id"]
        
        # Check teacher
        course_res = supabase_admin.table("courses").select("teacher_id").eq("id", doubt["course_id"]).single().execute()
        is_teacher = course_res.data and course_res.data.get("teacher_id") == current_user["id"]
        
        if not (is_owner or is_teacher) and current_user.get("role") != "master":
            raise HTTPException(status_code=403, detail="Not authorized to resolve this doubt")
            
        new_status = "resolved" if doubt["status"] == "open" else "open"
        up_res = supabase_admin.table("doubts").update({"status": new_status}).eq("id", doubt_id).execute()
        return up_res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
