/**
 * Supabase Client Configuration
 * Authentication and Database functions
 */

// Initialize Supabase client with credentials
// Try environment variables first, fallback to hardcoded values with warning
const SUPABASE_URL = (typeof window !== 'undefined' && window.VITE_SUPABASE_URL) 
    || 'https://pcqsopnhpahcvpaxspik.supabase.co';
const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.VITE_SUPABASE_ANON_KEY) 
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjcXNvcG5ocGFoY3ZwYXhzcGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NzA2NTgsImV4cCI6MjA4MzA0NjY1OH0.e1L5khCp70kdYmR00aT-MfPhHDS_JeuZBW_a3lu5eC8';

// Warn if using fallback credentials
if (typeof window !== 'undefined' && !window.VITE_SUPABASE_URL) {
    console.warn('⚠️  Using fallback Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for production.');
}

// Supabase client and loading state
let supabase = null;
let supabaseLoading = null;

// Global auth state - persisted across the application
let currentUser = null;
let currentSession = null;

/**
 * Dispatch custom auth state change event
 * @param {Object} user - Current user object
 * @param {Object} session - Current session object
 */
function dispatchAuthEvent(user, session) {
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('authStateChange', {
            detail: { user, session }
        });
        window.dispatchEvent(event);
    }
}

/**
 * Setup auth state change listener
 * Called immediately after Supabase client is initialized
 */
function setupAuthListener() {
    if (!supabase) return;

    supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔐 Auth state changed:', event);
        console.log('📧 User:', session?.user?.email || 'None');
        
        currentSession = session;
        currentUser = session?.user || null;
        
        // Dispatch custom event for UI updates
        dispatchAuthEvent(currentUser, currentSession);
        
        // Log detailed auth events for debugging
        switch (event) {
            case 'INITIAL_SESSION':
                console.log('📌 Initial session loaded');
                break;
            case 'SIGNED_IN':
                console.log('✅ User signed in successfully');
                break;
            case 'SIGNED_OUT':
                console.log('👋 User signed out');
                break;
            case 'TOKEN_REFRESHED':
                console.log('🔄 Session token refreshed');
                break;
            case 'USER_UPDATED':
                console.log('👤 User data updated');
                break;
            case 'PASSWORD_RECOVERY':
                console.log('🔑 Password recovery initiated');
                break;
        }
    });
}

// Initialize Supabase dynamically
supabaseLoading = (async () => {
    try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        console.log('✅ Supabase client initialized successfully');
        
        // Setup auth listener immediately after client initialization
        setupAuthListener();
        
        // Check for existing session on load
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            console.log('📌 Existing session found for:', session.user?.email);
            currentSession = session;
            currentUser = session.user;
            dispatchAuthEvent(currentUser, currentSession);
        } else {
            console.log('📌 No existing session found');
        }
        
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
        console.log('🔑 Attempting signup for:', email);
        if (!supabase) {
            console.error('❌ Signup failed: Supabase not loaded');
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
            if (error) {
                console.error('❌ Signup error:', error.message);
            } else {
                console.log('✅ Signup successful for:', email);
            }
            return { data, error };
        } catch (error) {
            console.error('❌ Signup exception:', error.message);
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
        console.log('🔑 Attempting login for:', email);
        if (!supabase) {
            console.error('❌ Login failed: Supabase not loaded');
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
            if (error) {
                console.error('❌ Login error:', error.message);
            } else {
                console.log('✅ Login successful for:', email);
            }
            return { data, error };
        } catch (error) {
            console.error('❌ Login exception:', error.message);
            return { data: null, error };
        }
    },

    /**
     * Sign out the current user
     * @returns {Promise<{error}>}
     */
    async signOut() {
        await supabaseLoading; // Wait for Supabase to load
        console.log('🔑 Attempting logout');
        if (!supabase) {
            console.error('❌ Logout failed: Supabase not loaded');
            return { 
                error: new Error('Supabase is not loaded. Please check your internet connection and refresh the page.') 
            };
        }
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('❌ Logout error:', error.message);
            } else {
                console.log('✅ Logout successful');
                currentUser = null;
                currentSession = null;
            }
            return { error };
        } catch (error) {
            console.error('❌ Logout exception:', error.message);
            return { error };
        }
    },

    /**
     * Get the current authenticated user (from Supabase)
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
    },

    /**
     * Check and get the current session
     * Restores session from storage if available
     * @returns {Promise<Object|null>} Session object or null
     */
    async checkSession() {
        await supabaseLoading; // Wait for Supabase to load
        console.log('🔍 Checking session...');
        if (!supabase) {
            console.log('❌ Session check failed: Supabase not loaded');
            return null;
        }
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('❌ Session check error:', error.message);
                return null;
            }
            if (session) {
                console.log('✅ Session found for:', session.user?.email);
                currentSession = session;
                currentUser = session.user;
                return session;
            } else {
                console.log('📌 No session found');
                currentSession = null;
                currentUser = null;
                return null;
            }
        } catch (error) {
            console.error('❌ Session check exception:', error.message);
            return null;
        }
    },

    /**
     * Get the current user from local state (synchronous)
     * @returns {Object|null} Current user object or null
     */
    getCurrentUser() {
        return currentUser;
    },

    /**
     * Get the current session from local state (synchronous)
     * @returns {Object|null} Current session object or null
     */
    getCurrentSession() {
        return currentSession;
    }
};

/**
 * Database object with report management functions
 */
export const db = {
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

/**
 * Expose auth functions globally for non-module scripts
 * This allows HTML pages to use window.authFunctions.checkSession(), etc.
 */
if (typeof window !== 'undefined') {
    window.authFunctions = {
        signUp: auth.signUp.bind(auth),
        signIn: auth.signIn.bind(auth),
        signOut: auth.signOut.bind(auth),
        checkSession: auth.checkSession.bind(auth),
        getCurrentUser: auth.getCurrentUser.bind(auth),
        getCurrentSession: auth.getCurrentSession.bind(auth),
        getUser: auth.getUser.bind(auth)
    };
    console.log('📦 authFunctions exposed to window');
}
