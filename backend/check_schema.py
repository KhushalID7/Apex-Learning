import os
import sys

# Add backend directory to PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'e:\\CODES\\AWT Learning platform\\backend')))

from app.supabase_client import supabase_admin

try:
    res = supabase_admin.table('lectures').select('*').limit(1).execute()
    print("Lectures table exists, empty data or sample data:")
    print(res.data)

    # Let's try to get columns using pgsodium or just print a record if it exists
    if len(res.data) > 0:
        print("Columns:", list(res.data[0].keys()))
    else:
        # If empty, insert and delete to get the schema or just assume standard fields
        # This is risky, let's just assume we know or will figure it out.
        print("No rows found. Attempting to insert dummy to see required fields...")
        try:
            res_ins = supabase_admin.table('lectures').insert({}).execute()
        except Exception as e:
            print("Insert empty error:", e)
except Exception as e:
    print("Error querying lectures:", e)
