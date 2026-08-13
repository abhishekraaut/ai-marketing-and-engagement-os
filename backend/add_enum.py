from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Need to commit before ALTER TYPE in Postgres
    conn.execute(text("COMMIT"))
    try:
        conn.execute(text("ALTER TYPE platform_enum ADD VALUE 'YOUTUBE'"))
        print("Added YOUTUBE to enum")
    except Exception as e:
        print("Error or already exists:", e)
