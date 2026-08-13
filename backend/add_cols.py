from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE analytics_snapshots ADD COLUMN url_clicks INTEGER DEFAULT 0"))
        conn.commit()
        print("Added url_clicks")
    except Exception as e:
        print("Error or already exists:", e)
        conn.rollback()

    try:
        conn.execute(text("ALTER TABLE analytics_snapshots ADD COLUMN followers INTEGER DEFAULT 0"))
        conn.commit()
        print("Added followers")
    except Exception as e:
        print("Error or already exists:", e)
        conn.rollback()
