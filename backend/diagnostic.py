import asyncio
from app.supabase_client import supabase_admin

async def diagnostic():
    tables = ["profiles", "courses", "lectures", "enrollments", "progress"]
    for table in tables:
        try:
            print(f"Checking {table} table...")
            response = supabase_admin.table(table).select("*").limit(1).execute()
            print(f"Success! {table} exists.")
        except Exception as e:
            print(f"Error for {table}: {e}")

if __name__ == "__main__":
    asyncio.run(diagnostic())
