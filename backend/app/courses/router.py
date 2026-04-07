from fastapi import APIRouter, HTTPException, status, Depends, Request
from app.courses.schemas import (
    CourseCreate, CourseUpdate, CourseResponse,
    PaymentOrderResponse, PaymentVerification
)
from app.auth.dependencies import get_current_user, require_role
from app.limiter import limiter
from app.supabase_client import supabase, supabase_admin
from app.config import get_settings
import razorpay
from typing import List

settings = get_settings()
razorpay_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)) if settings.RAZORPAY_KEY_ID else None
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
        courses_data = response.data
        if courses_data:
            teacher_ids = list(set([c["teacher_id"] for c in courses_data]))
            profiles_res = supabase.table("profiles").select("id, full_name").in_("id", teacher_ids).execute()
            profiles_map = {p["id"]: p.get("full_name") for p in profiles_res.data} if profiles_res.data else {}
            for c in courses_data:
                c["teacher_name"] = profiles_map.get(c["teacher_id"])
        return courses_data

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
        courses_data = response.data
        if courses_data:
            # For list_my_courses, teacher_id is always current_user["id"], but we fetch full_name
            profile_res = supabase.table("profiles").select("full_name").eq("id", current_user["id"]).single().execute()
            full_name = profile_res.data.get("full_name") if profile_res.data else None
            for c in courses_data:
                c["teacher_name"] = full_name
        return courses_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/enrolled", response_model=List[CourseResponse])
async def list_enrolled_courses(
    current_user: dict = Depends(require_role("student")),
):
    """List all courses the current student is enrolled in."""
    try:
        # Fetch enrollments
        enrollments_res = supabase_admin.table("enrollments").select("course_id").eq("student_id", current_user["id"]).execute()
        
        if not enrollments_res.data:
            return []
            
        course_ids = [e["course_id"] for e in enrollments_res.data]
        
        # Fetch courses
        courses_res = supabase.table("courses").select("*").in_("id", course_ids).order("created_at", desc=True).execute()
        courses_data = courses_res.data
        
        if courses_data:
            teacher_ids = list(set([c["teacher_id"] for c in courses_data]))
            profiles_res = supabase.table("profiles").select("id, full_name").in_("id", teacher_ids).execute()
            profiles_map = {p["id"]: p.get("full_name") for p in profiles_res.data} if profiles_res.data else {}
            for c in courses_data:
                c["teacher_name"] = profiles_map.get(c["teacher_id"])
                
        return courses_data

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
        
        # Fetch profile
        if "teacher_id" in course:
            profile_res = supabase.table("profiles").select("full_name").eq("id", course["teacher_id"]).execute()
            if profile_res.data and len(profile_res.data) > 0:
                course["teacher_name"] = profile_res.data[0].get("full_name")
            else:
                course["teacher_name"] = None

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


@router.post("/{course_id}/enroll", status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    course_id: str,
    current_user: dict = Depends(require_role("student"))
):
    """Enroll a student in a course."""
    try:
        # Check if course exists and is published
        course_check = supabase.table("courses").select("id, is_published, price").eq("id", course_id).single().execute()
        if not course_check.data or not course_check.data.get("is_published"):
            raise HTTPException(status_code=404, detail="Course not found or not published")

        # Check if the course is free
        price = course_check.data.get("price", 0)
        if price > 0:
            raise HTTPException(status_code=400, detail="This course requires payment. Please use the checkout flow.")

        # Insert enrollment
        response = supabase_admin.table("enrollments").insert({
            "student_id": current_user["id"],
            "course_id": course_id
        }).execute()

        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to enroll")
        
        return {"message": "Successfully enrolled", "enrollment": response.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        if "duplicate key value" in str(e) or "enrollments_student_id_course_id_key" in str(e):
            raise HTTPException(status_code=400, detail="Already enrolled in this course")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{course_id}/payment/create-order", response_model=PaymentOrderResponse)
@limiter.limit("5/minute")
async def create_payment_order(
    request: Request,
    course_id: str,
    current_user: dict = Depends(require_role("student"))
):
    """Create a Razorpay order for a paid course."""
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment Gateway not configured")
        
    try:
        course_check = supabase.table("courses").select("id, is_published, price").eq("id", course_id).single().execute()
        if not course_check.data or not course_check.data.get("is_published"):
            raise HTTPException(status_code=404, detail="Course not found or not published")
            
        price = course_check.data.get("price", 0)
        if price <= 0:
            raise HTTPException(status_code=400, detail="This course is free, use regular enrollment")
            
        enroll_check = supabase_admin.table("enrollments").select("id").eq("course_id", course_id).eq("student_id", current_user["id"]).execute()
        if enroll_check.data:
            raise HTTPException(status_code=400, detail="Already enrolled")
            
        amount_in_paise = int(price * 100)
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"rcpt_{course_id[:8]}_{current_user['id'][:8]}"
        }
        order = razorpay_client.order.create(data=order_data)
        
        return {
            "id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "receipt": order["receipt"],
            "key_id": settings.RAZORPAY_KEY_ID
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{course_id}/payment/verify")
@limiter.limit("5/minute")
async def verify_payment(
    request: Request,
    course_id: str,
    payload: PaymentVerification,
    current_user: dict = Depends(require_role("student"))
):
    """Verify Razorpay signature and enroll student."""
    if not razorpay_client:
        raise HTTPException(status_code=500, detail="Payment Gateway not configured")
        
    try:
        params_dict = {
            'razorpay_order_id': payload.razorpay_order_id,
            'razorpay_payment_id': payload.razorpay_payment_id,
            'razorpay_signature': payload.razorpay_signature
        }
        
        try:
            razorpay_client.utility.verify_payment_signature(params_dict)
        except Exception:
            raise HTTPException(status_code=400, detail="Signature verification failed")
            
        course_check = supabase.table("courses").select("price").eq("id", course_id).single().execute()
        price = course_check.data.get("price", 0) if course_check.data else 0
            
        payment_data = {
            "course_id": course_id,
            "student_id": current_user["id"],
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "razorpay_signature": payload.razorpay_signature,
            "amount": price,
            "status": "success"
        }
        
        try:
            supabase_admin.table("payments").insert(payment_data).execute()
        except Exception:
            pass # Ignore if duplicate order_id
            
        try:
            supabase_admin.table("enrollments").insert({
                "student_id": current_user["id"],
                "course_id": course_id
            }).execute()
        except Exception as e:
            if "duplicate key value" not in str(e) and "enrollments_student_id_course_id_key" not in str(e):
                raise
                
        return {"message": "Payment successful and enrolled"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/enrollment-status")
async def check_enrollment_status(
    course_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check if the current user is enrolled in the course."""
    if current_user["role"] != "student":
        return {"is_enrolled": False}

    try:
        response = supabase_admin.table("enrollments").select("id").eq("course_id", course_id).eq("student_id", current_user["id"]).execute()
        
        is_enrolled = len(response.data) > 0
        return {"is_enrolled": is_enrolled}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{course_id}/progress")
async def get_course_progress(
    course_id: str,
    current_user: dict = Depends(require_role("student"))
):
    """Get the list of completed lecture IDs for the current student in a course."""
    try:
        response = supabase_admin.table("progress").select("lecture_id").eq("course_id", course_id).eq("student_id", current_user["id"]).execute()
        completed_ids = [row["lecture_id"] for row in response.data] if response.data else []
        return {"completed_lecture_ids": completed_ids}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{course_id}/lectures/{lecture_id}/progress")
async def toggle_lecture_progress(
    course_id: str,
    lecture_id: str,
    completed: bool,
    current_user: dict = Depends(require_role("student"))
):
    """Mark a lecture as complete or incomplete."""
    try:
        if completed:
            # Mark complete
            response = supabase_admin.table("progress").insert({
                "student_id": current_user["id"],
                "course_id": course_id,
                "lecture_id": lecture_id
            }).execute()
        else:
            # Mark incomplete
            response = supabase_admin.table("progress").delete().eq("student_id", current_user["id"]).eq("lecture_id", lecture_id).execute()
        
        return {"message": "Progress updated successfully"}
    except Exception as e:
        if "duplicate key value" in str(e) or "progress_student_id_lecture_id_key" in str(e):
            return {"message": "Progress already logged"}
        raise HTTPException(status_code=400, detail=str(e))
