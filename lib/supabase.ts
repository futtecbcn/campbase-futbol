import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isCloudConfigured = Boolean(url && key && !url.includes("YOUR_PROJECT") && !key.includes("YOUR_SUPABASE"));

export const supabase = isCloudConfigured
  ? createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
