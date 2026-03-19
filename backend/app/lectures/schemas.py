from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class LectureCreate(BaseModel):
    title: str
    description: Optional[str] = None
    order_index: Optional[int] = 0

class LectureUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    # video_url can also be updated but via a separate upload or included here if they manually set it
    video_url: Optional[str] = None

class LectureResponse(BaseModel):
    id: uuid.UUID
    course_id: uuid.UUID
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    order_index: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
