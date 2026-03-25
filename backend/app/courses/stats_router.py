from fastapi import APIRouter, Depends, HTTPException, status
from app.auth.dependencies import require_role
from app.supabase_client import supabase, supabase_admin
from typing import Dict, Any

router = APIRouter(prefix="/courses/teacher", tags=["Course Stats"])

@router.get("/stats")
async def get_teacher_stats(
    current_user: dict = Depends(require_role("teacher", "master"))
):
    """Get aggregate statistics for courses owned by the teacher."""
    try:
        # 1. Fetch all courses owned by the teacher
        courses_res = supabase.table("courses").select("id, title, price").eq("teacher_id", current_user["id"]).execute()
        courses = courses_res.data if courses_res.data else []
        
        if not courses:
            return {
                "total_courses": 0,
                "total_enrollments": 0,
                "total_revenue": 0,
                "average_engagement": 0,
                "course_breakdown": []
            }

        course_ids = [c["id"] for c in courses]
        
        # 2. Fetch all enrollments for these courses
        enrollments_res = supabase_admin.table("enrollments").select("course_id, student_id, enrolled_at").in_("course_id", course_ids).execute()
        enrollments = enrollments_res.data if enrollments_res.data else []
        total_enrollments = len(enrollments)
        
        # 3. Calculate total revenue
        course_prices = {c["id"]: c.get("price", 0) for c in courses}
        total_revenue = sum(course_prices.get(e["course_id"], 0) for e in enrollments)
        
        # 4. Calculate enrollment trend (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
        
        daily_counts = {}
        for i in range(30):
            date_str = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            daily_counts[date_str] = 0
            
        for e in enrollments:
            date_str = e["enrolled_at"][:10]  # Take YYYY-MM-DD
            if date_str in daily_counts:
                daily_counts[date_str] += 1
                
        enrollment_trend = [
            {"date": d, "count": c} for d, c in sorted(daily_counts.items())
        ]
        
        # 5. Calculate engagement and course breakdown
        lectures_res = supabase.table("lectures").select("id, course_id").in_("course_id", course_ids).execute()
        lectures_per_course = {}
        for l in (lectures_res.data or []):
            lectures_per_course[l["course_id"]] = lectures_per_course.get(l["course_id"], 0) + 1
            
        progress_res = supabase_admin.table("progress").select("course_id, student_id, lecture_id").in_("course_id", course_ids).execute()
        progress_data = progress_res.data or []
        
        student_progress = {}
        for p in progress_data:
            key = (p["course_id"], p["student_id"])
            student_progress[key] = student_progress.get(key, 0) + 1
            
        course_stats = []
        all_engagements = []
        
        for c in courses:
            c_id = c["id"]
            c_enrollments = [e for e in enrollments if e["course_id"] == c_id]
            c_total_students = len(c_enrollments)
            c_total_lectures = lectures_per_course.get(c_id, 0)
            
            c_engagements = []
            for e in c_enrollments:
                if c_total_lectures > 0:
                    completed = student_progress.get((c_id, e["student_id"]), 0)
                    score = (completed / c_total_lectures) * 100
                    c_engagements.append(score)
                    all_engagements.append(score)
                else:
                    c_engagements.append(0)
                    all_engagements.append(0)
            
            c_avg_engagement = sum(c_engagements) / len(c_engagements) if c_engagements else 0
            
            course_stats.append({
                "id": c_id,
                "title": c["title"],
                "students": c_total_students,
                "revenue": c_total_students * c.get("price", 0),
                "engagement": round(c_avg_engagement, 1)
            })
                
        average_engagement = sum(all_engagements) / len(all_engagements) if all_engagements else 0
        
        return {
            "total_courses": len(courses),
            "total_enrollments": total_enrollments,
            "total_revenue": total_revenue,
            "average_engagement": round(average_engagement, 1),
            "enrollment_trend": enrollment_trend,
            "course_breakdown": course_stats
        }

    except Exception as e:
        print(f"Error fetching teacher stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
