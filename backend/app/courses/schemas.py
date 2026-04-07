from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CourseCreate(BaseModel):
    """Request body for creating a new course."""
    title: str
    description: Optional[str] = None
    price: float = 0.0
    thumbnail_url: Optional[str] = None


class CourseUpdate(BaseModel):
    """Request body for updating a course."""
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    thumbnail_url: Optional[str] = None
    is_published: Optional[bool] = None


class CourseResponse(BaseModel):
    """Response model for a course."""
    id: str
    teacher_id: str
    teacher_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    price: float
    thumbnail_url: Optional[str] = None
    is_published: bool
    created_at: str

class PaymentOrderResponse(BaseModel):
    id: str
    amount: int
    currency: str
    receipt: str
    key_id: str

class PaymentVerification(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
