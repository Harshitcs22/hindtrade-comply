/**
 * Supabase Client Configuration
 * Authentication and Database functions
 */

// Initialize Supabase client with credentials
const SUPABASE_URL = 'https://pcqsopnhpahcvpaxspik.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcXNvcG5ocGFoY3ZwYXhzcGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzA2NTgsImV4cCI6MjA4MzA0NjY1OH0.e1L5khCp70kdYmR00aT-MfPhHDS_JeuZBW_a3lu5eC8';

// Supabase client and loading state
let supabase = null;
let supabaseLoading = null;

// Initialize Supabase dynamically
supabaseLoading = (async () => {
    try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Failed to load Supabase SDK:', error.message);
        console.warn('⚠️  Authentication features will not work until Supabase SDK loads.');
        return false;
    }
})();

/**
 * Authentication object with user management functions
 */
export const auth = {
    /**
     * Sign up a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<{data, error}>}
     */
    async signUp(email, password) {
        await supabaseLoading; // Wait for Supabase to load
        if (!supabase) {
            return { 
                data: null, 
                error: new Error('Supabase is not loaded. Please check your internet connection and refresh the page.') 
            };
        }
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
        await supabaseLoading; // Wait for Supabase to load
        if (!supabase) {
            return { 
                data: null, 
                error: new Error('Supabase is not loaded. Please check your internet connection and refresh the page.') 
            };
        }
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
        await supabaseLoading; // Wait for Supabase to load
        if (!supabase) {
            return { 
                error: new Error('Supabase is not loaded. Please check your internet connection and refresh the page.') 
            };
        }
        try {
            const { error } = await supabase.auth.signOut();
            return { error };
        } catch (error) {
            return { error };
        }
    },

    /**
     * Get the current authenticated user
     * @returns {Promise<{data, error}>}
     */
    async getUser() {
        await supabaseLoading; // Wait for Supabase to load
        if (!supabase) {
            return { data: null, error: null }; // Silently fail for initial check
        }
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            return { data: user, error };
        } catch (error) {
            return { data: null, error };
        }
    }
};

/**
 * Database object with report management functions
 */
export const db = {
    /**
     * Get the Supabase client
     * @returns {Promise<Object>} Supabase client
     */
    async getClient() {
        await supabaseLoading; // Wait for Supabase to load
        return supabase;
    },

    /**
     * Save a CBAM report to the database
     * @param {Object} reportData - Report data containing calculation results
     * @returns {Promise<{data, error}>}
     */
    async saveReport(reportData) {
        await supabaseLoading; // Wait for Supabase to load
        if (!supabase) {
            return { 
                data: null, 
                error: new Error('Supabase is not loaded. Please check your internet connection and refresh the page.') 
            };
        }
        try {
            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                return { data: null, error: userError || new Error('User not authenticated') };
            }

            // Prepare data for cbam_reports table
            const payload = {
                user_id: user.id,
                cn_code: reportData.cnCode,
                product_type: reportData.productType || 'Unknown',
                production_qty: reportData.productionQty,
                input_data: {
                    electricity: reportData.electricity || 0,
                    diesel: reportData.diesel || 0,
                    coal: reportData.coal || 0,
                    precursors: reportData.precursors || []
                },
                total_emissions: reportData.total,
                intensity: reportData.intensity
            };

            // Insert into cbam_reports table
            const { data, error } = await supabase
                .from('cbam_reports')
                .insert([payload])
                .select()
                .single();

            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    }
};
