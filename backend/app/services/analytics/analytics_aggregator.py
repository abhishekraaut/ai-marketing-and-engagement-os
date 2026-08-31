from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.domain import AnalyticsSnapshot, Campaign, PublishedPost, PlatformVariant, ContentItem

class AnalyticsAggregator:
    def get_overview(self, db: Session, org_id: int, start_date: datetime = None, end_date: datetime = None, platform: str = None) -> dict:
        query = db.query(
            func.sum(AnalyticsSnapshot.impressions).label('impressions'),
            func.sum(AnalyticsSnapshot.reach).label('reach'),
            func.sum(AnalyticsSnapshot.likes + AnalyticsSnapshot.comments + AnalyticsSnapshot.shares).label('engagements'),
            func.sum(AnalyticsSnapshot.clicks).label('clicks')
        ).filter(AnalyticsSnapshot.organization_id == org_id, AnalyticsSnapshot.published_post_id != None)

        if start_date: query = query.filter(AnalyticsSnapshot.snapshot_date >= start_date)
        if end_date: query = query.filter(AnalyticsSnapshot.snapshot_date <= end_date)
        if platform: query = query.filter(AnalyticsSnapshot.platform == platform)
        
        res = query.one()
        
        imp = res.impressions or 0
        eng = res.engagements or 0
        
        posts_query = db.query(func.count(func.distinct(AnalyticsSnapshot.published_post_id))).filter(AnalyticsSnapshot.organization_id == org_id, AnalyticsSnapshot.published_post_id != None)
        if start_date: posts_query = posts_query.filter(AnalyticsSnapshot.snapshot_date >= start_date)
        if platform: posts_query = posts_query.filter(AnalyticsSnapshot.platform == platform)

        # Get latest followers from Page-Level snapshots
        followers_query = db.query(AnalyticsSnapshot.platform, AnalyticsSnapshot.followers).filter(
            AnalyticsSnapshot.organization_id == org_id,
            AnalyticsSnapshot.published_post_id == None
        ).order_by(AnalyticsSnapshot.snapshot_date.desc())
        
        if platform:
            followers_query = followers_query.filter(AnalyticsSnapshot.platform == platform)
            
        followers = 0
        seen_platforms = set()
        for snap in followers_query.all():
            if snap.platform not in seen_platforms:
                followers += (snap.followers or 0)
                seen_platforms.add(snap.platform)

        # Let's also include page_reach from page-level snapshots if available
        page_reach_query = db.query(AnalyticsSnapshot.platform, AnalyticsSnapshot.reach).filter(
            AnalyticsSnapshot.organization_id == org_id,
            AnalyticsSnapshot.published_post_id == None
        ).order_by(AnalyticsSnapshot.snapshot_date.desc())
        
        if platform:
            page_reach_query = page_reach_query.filter(AnalyticsSnapshot.platform == platform)
            
        page_reach = 0
        seen_platforms = set()
        for snap in page_reach_query.all():
            if snap.platform not in seen_platforms:
                page_reach += (snap.reach or 0)
                seen_platforms.add(snap.platform)

        return {
            "impressions": imp,
            "reach": page_reach or res.reach or 0,
            "engagements": eng,
            "clicks": res.clicks or 0,
            "engagement_rate": round((eng / imp * 100) if imp > 0 else 0, 2),
            "posts_published": posts_query.scalar() or 0,
            "followers": followers
        }


    def get_trends(self, db: Session, org_id: int, start_date: datetime = None, end_date: datetime = None) -> list:
        # Group by date part
        query = db.query(
            func.date(AnalyticsSnapshot.snapshot_date).label('date'),
            func.sum(AnalyticsSnapshot.impressions).label('impressions'),
            func.sum(AnalyticsSnapshot.likes + AnalyticsSnapshot.comments + AnalyticsSnapshot.shares).label('engagements'),
            func.sum(AnalyticsSnapshot.clicks).label('clicks')
        ).filter(AnalyticsSnapshot.organization_id == org_id)
        
        if start_date: query = query.filter(AnalyticsSnapshot.snapshot_date >= start_date)
        if end_date: query = query.filter(AnalyticsSnapshot.snapshot_date <= end_date)
        
        query = query.group_by(func.date(AnalyticsSnapshot.snapshot_date)).order_by(func.date(AnalyticsSnapshot.snapshot_date))
        
        return [
            {
                "date": str(row.date),
                "impressions": row.impressions or 0,
                "engagements": row.engagements or 0,
                "clicks": row.clicks or 0
            } for row in query.all()
        ]

    def get_platform_performance(self, db: Session, org_id: int, start_date: datetime = None, end_date: datetime = None) -> list:
        query = db.query(
            AnalyticsSnapshot.platform,
            func.sum(AnalyticsSnapshot.impressions).label('impressions'),
            func.sum(AnalyticsSnapshot.likes + AnalyticsSnapshot.comments + AnalyticsSnapshot.shares).label('engagements'),
            func.sum(AnalyticsSnapshot.clicks).label('clicks')
        ).filter(AnalyticsSnapshot.organization_id == org_id)
        
        if start_date: query = query.filter(AnalyticsSnapshot.snapshot_date >= start_date)
        if end_date: query = query.filter(AnalyticsSnapshot.snapshot_date <= end_date)
        
        query = query.group_by(AnalyticsSnapshot.platform)
        
        result = []
        for row in query.all():
            imp = row.impressions or 0
            eng = row.engagements or 0
            result.append({
                "platform": row.platform.value if row.platform else "UNKNOWN",
                "impressions": imp,
                "engagements": eng,
                "clicks": row.clicks or 0,
                "engagement_rate": round((eng / imp * 100) if imp > 0 else 0, 2)
            })
        return result

    def get_top_content(self, db: Session, org_id: int, limit: int = 5) -> list:
        # For top content, we sum metrics per post
        query = db.query(
            PublishedPost.id.label('published_post_id'),
            AnalyticsSnapshot.platform,
            Campaign.name.label('campaign_name'),
            ContentItem.title,
            PlatformVariant.content,
            func.sum(AnalyticsSnapshot.impressions).label('impressions'),
            func.sum(AnalyticsSnapshot.likes + AnalyticsSnapshot.comments + AnalyticsSnapshot.shares).label('engagements'),
            func.sum(AnalyticsSnapshot.clicks).label('clicks')
        ).select_from(AnalyticsSnapshot).join(PublishedPost).join(PlatformVariant, PublishedPost.platform_variant_id == PlatformVariant.id).join(ContentItem).join(Campaign).filter(
            AnalyticsSnapshot.organization_id == org_id
        ).group_by(
            PublishedPost.id, AnalyticsSnapshot.platform, Campaign.name, ContentItem.title, PlatformVariant.content
        ).order_by(desc('engagements')).limit(limit)
        
        result = []
        for row in query.all():
            imp = row.impressions or 0
            eng = row.engagements or 0
            result.append({
                "published_post_id": row.published_post_id,
                "platform": row.platform.value if row.platform else "UNKNOWN",
                "campaign_name": row.campaign_name,
                "title": row.title or "Untitled",
                "content_preview": (row.content[:100] + '...') if row.content else "",
                "impressions": imp,
                "engagements": eng,
                "clicks": row.clicks or 0,
                "engagement_rate": round((eng / imp * 100) if imp > 0 else 0, 2)
            })
        return result

    def get_post_analytics(self, db: Session, org_id: int, post_id: int) -> dict:
        row = db.query(
            PublishedPost.id.label('published_post_id'),
            AnalyticsSnapshot.platform,
            func.sum(AnalyticsSnapshot.impressions).label('impressions'),
            func.sum(AnalyticsSnapshot.reach).label('reach'),
            func.sum(AnalyticsSnapshot.likes).label('likes'),
            func.sum(AnalyticsSnapshot.comments).label('comments'),
            func.sum(AnalyticsSnapshot.shares).label('shares'),
            func.sum(AnalyticsSnapshot.clicks).label('clicks'),
            func.sum(AnalyticsSnapshot.url_clicks).label('url_clicks'),
            func.sum(AnalyticsSnapshot.followers).label('followers')
        ).select_from(AnalyticsSnapshot).join(PublishedPost).filter(
            AnalyticsSnapshot.organization_id == org_id,
            PublishedPost.id == post_id
        ).group_by(
            PublishedPost.id, AnalyticsSnapshot.platform
        ).first()

        if not row:
            return None

        imp = row.impressions or 0
        clicks = row.clicks or 0
        return {
            "published_post_id": row.published_post_id,
            "platform": row.platform.value if row.platform else "UNKNOWN",
            "impressions": imp,
            "reach": row.reach or 0,
            "likes": row.likes or 0,
            "comments": row.comments or 0,
            "shares": row.shares or 0,
            "clicks": clicks,
            "url_clicks": row.url_clicks or 0,
            "followers": row.followers or 0,
            "conversion_rate": round((clicks / imp * 100) if imp > 0 else 0, 2)
        }

analytics_aggregator = AnalyticsAggregator()
