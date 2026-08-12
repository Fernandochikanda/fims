/**
 * @file userService.js
 * @description Handles fetching user profiles.
 * This talks directly to the Supabase 'profiles' table.
 * 
 * Security Note:
 * RLS ensures that regular users can only see their own profile,
 * while Admins/Supervisors/CEO can view all profiles.
 */
import { supabase } from '../lib/supabaseClient';

export default {
  getAll: async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('name', { ascending: true });
    if (error) return { success: false, message: error.message };
    return { success: true, data };
  }
};
