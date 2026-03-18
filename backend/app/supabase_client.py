from supabase import create_client, Client
from app.config import get_settings

settings = get_settings()

# Public/Anon client - respects RLS policies (for auth)
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

# Service role client - bypasses RLS policies (for server operations)
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
