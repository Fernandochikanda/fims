/**
 * @file supabaseClient.js
 * @description Initializes the Supabase client for the frontend.
 * This acts as the secure bridge between the React app and the PostgreSQL database.
 * It uses the anon key, which is safe to expose in the frontend because Row-Level Security (RLS) 
 * protects the database.
 * 
 * @env VITE_SUPABASE_URL - The project URL from Supabase dashboard.
 * @env VITE_SUPABASE_ANON_KEY - The public anon key from Supabase dashboard.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("WARNING: Missing Supabase environment variables. Check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
