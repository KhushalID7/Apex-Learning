from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class DoubtCreate(BaseModel):
    lecture_id: Optional[str] = None
    title: str
    description: str

class DoubtUpdate(BaseModel):
    status: str  # 'open' or 'resolved'

class DoubtReplyCreate(BaseModel):
    content: str

class DoubtReplyResponse(BaseModel):
    id: str
    doubt_id: str
    user_id: str
    user_name: Optional[str] = None
    content: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DoubtResponse(BaseModel):
    id: str
    course_id: str
    student_id: str
    student_name: Optional[str] = None
    lecture_id: Optional[str] = None
    lecture_title: Optional[str] = None
    title: str
    description: str
    status: str
    created_at: datetime
    reply_count: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)

class DoubtDetailResponse(DoubtResponse):
    replies: List[DoubtReplyResponse] = []
