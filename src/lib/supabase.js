import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Stable anonymous identity survives refreshes via localStorage.
        storageKey: "swbio-qa-auth",
      },
    })
  : null;

let authPromise = null;

// Ensures the visitor has an anonymous session and returns their user id.
// The id is what the database uses to enforce one vote per person.
export function ensureAnonAuth() {
  if (!supabase) return Promise.resolve(null);
  if (authPromise) return authPromise;

  authPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session.user.id;

    const { data: signIn, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return signIn.user?.id ?? null;
  })().catch((err) => {
    authPromise = null;
    throw err;
  });

  return authPromise;
}
