import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for server components.
 * Bypasses RLS — only use AFTER verifying identity via createClient().auth.getUser().
 * Never expose this client or its key to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
