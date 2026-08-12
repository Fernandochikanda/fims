/**
 * @file inspectionService.js
 * @description Handles all CRUD operations for Inspections.
 * This talks directly to the Supabase 'inspections' table.
 * 
 * Security Note: 
 * Row-Level Security (RLS) is enabled on this table. 
 * - Inspectors can only select/update their own inspections.
 * - Supervisors/Admins can select/insert/update all.
 * - Approved inspections cannot be edited (enforced by DB trigger).
 */
import { supabase } from '../lib/supabaseClient';

export default {
  getAll: async () => {
    const { data, error } = await supabase.from('inspections').select('*').order('created_at', { ascending: false });
    if (error) return { success: false, message: error.message };
    return { success: true, data };
  },
  
  create: async (inspection) => {
    const { data, error } = await supabase.from('inspections').insert(inspection).select();
    if (error) return { success: false, message: error.message };
    return { success: true, data: data[0] };
  },
  
  update: async (id, updates) => {
    const { data, error } = await supabase.from('inspections').update(updates).eq('id', id).select();
    if (error) return { success: false, message: error.message };
    return { success: true, data: data[0] };
  },
  
  delete: async (id) => {
    const { error } = await supabase.from('inspections').delete().eq('id', id);
    if (error) return { success: false, message: error.message };
    return { success: true };
  }
};
