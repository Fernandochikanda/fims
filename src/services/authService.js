/**
 * @file authService.js
 * @description Handles user authentication via Supabase Auth.
 * This replaces the old Netlify JSON backend login.
 * 
 * Workflow:
 * 1. Sends email/password to Supabase Auth.
 * 2. If successful, fetches the user's role/profile from the 'profiles' table.
 * 3. Checks if the account is active.
 * 4. Returns the JWT token and user object to the React app.
 */
import { supabase } from '../lib/supabaseClient';

export default {
  login: async (email, password) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) return { success: false, message: authError.message };
      
      // Fetch the user's role/profile from the 'profiles' table (Protected by RLS)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) return { success: false, message: "Failed to fetch user profile." };
      if (!profile.active) return { success: false, message: "Account deactivated. Contact admin." };

      return { success: true, data: { token: authData.session.access_token, user: profile } };
    } catch (error) {
      return { success: false, message: "Network error during login." };
    }
  },
  
  me: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };
    
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    return { success: true, data: profile };
  },
  
  logout: async () => { 
    localStorage.removeItem('fims_token');
    await supabase.auth.signOut(); 
  }
};
