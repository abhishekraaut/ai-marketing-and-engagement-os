from typing import List, Optional
from pydantic import BaseModel

class Trend(BaseModel):
    id: str
    title: str
    description: str
    category: str

class TrendEvaluationResponse(BaseModel):
    relevance_score: int
    reason: str
    recommended_angle: str
    safety_considerations: str
