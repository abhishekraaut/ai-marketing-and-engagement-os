from typing import List, Optional
from pydantic import BaseModel

class TrendBase(BaseModel):
    title: str
    description: str
    category: str
    source_url: Optional[str] = None

class TrendCreate(TrendBase):
    pass

class TrendResponse(TrendBase):
    id: int

    class Config:
        from_attributes = True

class TrendListResponse(BaseModel):
    trends: List[TrendCreate]

class TrendEvaluationResponse(BaseModel):
    relevance_score: int
    reason: str
    recommended_angle: str
    safety_considerations: str
