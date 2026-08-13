import enum

class RoleEnum(str, enum.Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    EDITOR = "EDITOR"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"

class PlatformEnum(str, enum.Enum):
    LINKEDIN = "LINKEDIN"
    INSTAGRAM = "INSTAGRAM"
    FACEBOOK = "FACEBOOK"
    X = "X"
    YOUTUBE = "YOUTUBE"

class SocialAccountStatusEnum(str, enum.Enum):
    CONNECTED = "CONNECTED"
    DISCONNECTED = "DISCONNECTED"
    EXPIRED = "EXPIRED"
    ERROR = "ERROR"

class CampaignStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    PLANNING = "PLANNING"
    READY = "READY"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

class ContentTypeEnum(str, enum.Enum):
    SOCIAL = "SOCIAL"
    EMAIL = "EMAIL"

class ContentStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    GENERATED = "GENERATED"
    IN_REVIEW = "IN_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SCHEDULED = "SCHEDULED"
    PUBLISHED = "PUBLISHED"

class ScheduleStatusEnum(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    PROCESSING = "PROCESSING"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class PublishedPostStatusEnum(str, enum.Enum):
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"
    DELETED = "DELETED"

class EngagementTypeEnum(str, enum.Enum):
    COMMENT = "COMMENT"
    MESSAGE = "MESSAGE"
    MENTION = "MENTION"

class SentimentEnum(str, enum.Enum):
    POSITIVE = "POSITIVE"
    NEUTRAL = "NEUTRAL"
    NEGATIVE = "NEGATIVE"

class EngagementCategoryEnum(str, enum.Enum):
    QUESTION = "QUESTION"
    PRAISE = "PRAISE"
    COMPLAINT = "COMPLAINT"
    LEAD = "LEAD"
    SPAM = "SPAM"
    OTHER = "OTHER"

class ReplyStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    AI_DRAFTED = "AI_DRAFTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    REPLIED = "REPLIED"
    ESCALATED = "ESCALATED"

class EmailCampaignStatusEnum(str, enum.Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    APPROVED = "APPROVED"
    SCHEDULED = "SCHEDULED"
    SENDING = "SENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class InsightTypeEnum(str, enum.Enum):
    PERFORMANCE = "PERFORMANCE"
    RECOMMENDATION = "RECOMMENDATION"
    TREND = "TREND"
    CONTENT = "CONTENT"
    ENGAGEMENT = "ENGAGEMENT"

class LeadSourceEnum(str, enum.Enum):
    SOCIAL = "SOCIAL"
    EMAIL = "EMAIL"
    WEBSITE = "WEBSITE"
    REFERRAL = "REFERRAL"
    OTHER = "OTHER"

class LeadStatusEnum(str, enum.Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    UNQUALIFIED = "UNQUALIFIED"
    CONVERTED = "CONVERTED"
    LOST = "LOST"

