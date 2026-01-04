/**
 * Supabase Client - Authentication & Database Operations
 * Handles all Supabase interactions for CBAM Calculator
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Initialize Supabase client with credentials
const SUPABASE_URL = 'https://pcqsopnhpahcvpaxspik.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcXNvcG5ocGFoY3ZwYXhzcGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzA2NTgsImV4cCI6MjA4MzA0NjY1OH0.e1L5khCp70kdYmR00aT-MfPhHDS_JeuZBW_a3lu5eC8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Authentication object with user management methods
 */
export const auth = {
    /**
     * Sign up a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<{data, error}>}
     */
    async signUp(email, password) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });
            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Sign in an existing user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<{data, error}>}
     */
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    },

    /**
     * Sign out the current user
     * @returns {Promise<{error}>}
     */
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            return { error };
        } catch (error) {
            return { error };
        }
    },

    /**
     * Get the current logged-in user
     * @returns {Promise<{data, error}>}
     */
    async getUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            return { data: user, error };
        } catch (error) {
            return { data: null, error };
        }
    }
};

/**
 * Database object with data operations
 */
export const db = {
    /**
     * Save CBAM report to database
     * @param {Object} reportData - Report data to save
     * @param {string} reportData.cnCode - CN Code (8-digit)
     * @param {string} reportData.productType - Product type
     * @param {number} reportData.productionQty - Production quantity in tonnes
     * @param {Object} reportData.inputData - Input data (electricity, diesel, coal, precursors)
     * @param {number} reportData.totalEmissions - Total emissions in tCO2e
     * @param {number} reportData.intensity - Embedded intensity
     * @returns {Promise<{data, error}>}
     */
    async saveReport(reportData) {
        try {
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            
            if (userError || !user) {
                return { data: null, error: new Error('User not authenticated') };
            }

            // Prepare data for insertion
            const reportToSave = {
                user_id: user.id,
                cn_code: reportData.cnCode,
                product_type: reportData.productType || 'Unknown',
                production_qty: reportData.productionQty,
                input_data: reportData.inputData,
                total_emissions: reportData.totalEmissions,
                intensity: reportData.intensity
            };

            // Insert into cbam_reports table
            const { data, error } = await supabase
                .from('cbam_reports')
                .insert([reportToSave])
                .select();

            return { data: data?.[0], error };
        } catch (error) {
            return { data: null, error };
        }
    }
};
