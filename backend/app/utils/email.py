import httpx
from app.config import get_settings

settings = get_settings()

async def send_new_doubt_email(teacher_email: str, teacher_name: str, course_title: str, student_name: str, doubt_title: str, doubt_desc: str):
    """Sends an email notification to the teacher when a student asks a new doubt."""
    
    if not settings.RESEND_API_KEY:
        print(f"[Email Service] Skipping email notification - RESEND_API_KEY is not set.")
        print(f"[Email To: {teacher_email}] {doubt_title} - {student_name}")
        return False
        
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    html_content = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Question in {course_title}</h2>
        <p>Hi {teacher_name or 'Teacher'},</p>
        <p><strong>{student_name or 'A student'}</strong> has just asked a new question in your course.</p>
        
        <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #18181b;">{doubt_title}</h3>
            <p style="color: #3f3f46; white-space: pre-wrap;">{doubt_desc}</p>
        </div>
        
        <p>Log in to your dashboard to view and respond to this doubt.</p>
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0" />
        <p style="font-size: 12px; color: #71717a;">AWT Learning Platform</p>
    </div>
    """
    
    payload = {
        "from": "AWT Learning Platform <onboarding@resend.dev>",
        "to": [teacher_email],
        "subject": f"New Doubt in {course_title}: {doubt_title}",
        "html": html_content
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            if response.status_code >= 400:
                print(f"[Email Service] Failed to send email: {response.text}")
                return False
            return True
    except Exception as e:
        print(f"[Email Service] Error sending email: {str(e)}")
        return False
