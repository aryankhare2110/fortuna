import psycopg2
import psycopg2.pool
import psycopg2.extras 
from config import Config

_pool: psycopg2.pool.SimpleConnectionPool | None = None

def init_db_pool() -> None:
    global _pool
    _pool = psycopg2.pool.SimpleConnectionPool(
        minconn=1,
        maxconn=10,
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        dbname=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
    )
    print(f"[db] Connected to '{Config.DB_NAME}' on {Config.DB_HOST}:{Config.DB_PORT}")

def get_db() -> psycopg2.extensions.connection:
    if _pool is None:
        raise RuntimeError("DB pool not initialised — call init_db_pool() first.")
    return _pool.getconn()

def release_db(conn: psycopg2.extensions.connection) -> None:
    if _pool and conn:
        _pool.putconn(conn)

def query(sql: str, params: tuple = (), fetchone: bool = False):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            result = cur.fetchone() if fetchone else cur.fetchall()
        conn.commit()
        return result
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        release_db(conn)

def execute(sql: str, params: tuple = (), returning: bool = False):
    conn = get_db()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            result = cur.fetchone() if returning else None
        conn.commit()
        return result
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        release_db(conn)