import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yxurvjtpghxdupwkzvfb.supabase.co";
const supabaseAnonKey = "sb_publishable_nxvv98fQBgEfoqGyf3tOFA_l3EjPDu5";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
