import os
import asyncpg
from typing import Optional

_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> Optional[asyncpg.Pool]:
    """Return a shared asyncpg connection pool, or None if DATABASE_URL is not set."""
    global _pool
    if _pool is not None:
        return _pool

    db_url = os.getenv("DATABASE_URL", "").strip()
    if not db_url:
        return None

    try:
        _pool = await asyncpg.create_pool(
            dsn=db_url,
            min_size=1,
            max_size=5,
            command_timeout=10,
        )
        print("[db] Connected to Neon PostgreSQL")
    except Exception as e:
        print(f"[db] Connection failed: {e}")
        _pool = None

    return _pool


async def close_pool() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
