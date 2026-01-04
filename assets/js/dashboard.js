/**
 * Dashboard Module - Production-Grade Session Management
 * Handles robust authentication, profile display, and dynamic report rendering
 */

import { auth, db } from './supabase-client.js';

// Supabase client reference
let supabase = null;

// Session state
let authStateListener = null;
let currentSession = null;
let currentUser = null;

/**
 * Initialize Supabase client
 */
async function initSupabase() {
    try {
        supabase = await db.getClient();
        if (supabase) {
            console.log('✅ Supabase client initialized for dashboard');
            return true;
        } else {
            console.error('❌ Failed to get Supabase client');
            return false;
        }
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        return false;
    }
}

/**
 * Show loading screen
 */
function showLoadingScreen() {
    const loadingScreen = document.getElementById('authLoadingScreen');
    const dashboardContent = document.getElementById('dashboardContent');
    
    if (loadingScreen) loadingScreen.classList.remove('hidden');
    if (dashboardContent) dashboardContent.classList.add('hidden');
}

/**
 * Hide loading screen and show dashboard
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('authLoadingScreen');
    const dashboardContent = document.getElementById('dashboardContent');
    
    if (loadingScreen) loadingScreen.classList.add('hidden');
    if (dashboardContent) dashboardContent.classList.remove('hidden');
}

/**
 * Redirect to index page
 */
function redirectToIndex() {
    console.log('No valid session found, redirecting to index.html');
    window.location.href = 'index.html';
}

/**
 * Check session using getSession (more reliable than getUser)
 */
async function checkSession() {
    if (!supabase) {
        console.error('Supabase not initialized');
        return null;
    }

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            return null;
        }
        
        if (session) {
            console.log('✅ Valid session found');
            currentSession = session;
            currentUser = session.user;
            return session;
        } else {
            console.log('No session found');
            return null;
        }
    } catch (error) {
        console.error('Exception checking session:', error);
        return null;
    }
}

/**
 * Setup auth state listener
 */
function setupAuthStateListener() {
    if (!supabase) return;

    try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth state changed:', event);
                
                if (event === 'SIGNED_OUT') {
                    console.log('User signed out, redirecting...');
                    redirectToIndex();
                } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    console.log('User signed in or token refreshed');
                    currentSession = session;
                    currentUser = session?.user || null;
                    
                    // If dashboard content is hidden, load it
                    if (currentUser && document.getElementById('dashboardContent').classList.contains('hidden')) {
                        await loadDashboardData(currentUser);
                    }
                } else if (event === 'USER_UPDATED') {
                    console.log('User data updated');
                    currentUser = session?.user || null;
                }
            }
        );
        
        authStateListener = subscription;
        console.log('✅ Auth state listener setup complete');
    } catch (error) {
        console.error('Error setting up auth state listener:', error);
    }
}

/**
 * Fetch profile details from profiles table
 */
async function fetchProfile(userId) {
    if (!supabase) return null;
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) {
            console.warn('Profile not found, will use defaults:', error.message);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

/**
 * Update profile UI elements
 */
function updateProfileUI(user, profile) {
    try {
        // Update user name
        const userName = document.getElementById('userName');
        if (userName) {
            const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
            userName.textContent = displayName;
        }
        
        // Update company name
        const userCompany = document.getElementById('userCompany');
        if (userCompany) {
            const companyName = profile?.company_name || 'Independent Exporter';
            userCompany.textContent = companyName;
        }
        
        // Update avatar with first letter
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            const displayName = profile?.full_name || user.email?.split('@')[0] || 'User';
            const initial = displayName.charAt(0).toUpperCase();
            userAvatar.textContent = initial;
        }
    } catch (error) {
        console.error('Error updating profile UI:', error);
    }
}

/**
 * Fetch reports for the current user
 */
async function fetchReports(userId) {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('cbam_reports')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching reports:', error);
            return [];
        }
        
        return data || [];
    } catch (error) {
        console.error('Error fetching reports:', error);
        return [];
    }
}

/**
 * Calculate and update KPI values
 */
function updateKPIs(reports) {
    try {
        // Total Reports
        const totalReports = reports.length;
        const kpiTotalReportsEl = document.getElementById('kpiTotalReports');
        if (kpiTotalReportsEl) {
            kpiTotalReportsEl.textContent = totalReports;
        }
        
        // Average Intensity
        const kpiAvgIntensityEl = document.getElementById('kpiAvgIntensity');
        if (kpiAvgIntensityEl) {
            if (totalReports > 0) {
                const totalIntensity = reports.reduce((sum, report) => {
                    return sum + (parseFloat(report.intensity) || 0);
                }, 0);
                const avgIntensity = totalIntensity / totalReports;
                kpiAvgIntensityEl.textContent = avgIntensity.toFixed(3);
            } else {
                kpiAvgIntensityEl.textContent = '--';
            }
        }
    } catch (error) {
        console.error('Error updating KPIs:', error);
    }
}

/**
 * Get status badge HTML based on intensity
 */
function getStatusBadge(intensity) {
    const intensityValue = parseFloat(intensity);
    
    if (intensityValue < 1.0) {
        return \`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></span>
            Low Impact
        </span>\`;
    } else {
        return \`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
            High Impact
        </span>\`;
    }
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Invalid Date';
    }
}

/**
 * Render reports table
 */
function renderReportsTable(reports) {
    try {
        const tableBody = document.getElementById('reportsTableBody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        reports.forEach(report => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-white/5 transition';
            
            row.innerHTML = \`
                <td class="px-6 py-4 text-sm text-white font-mono">\${report.cn_code || 'N/A'}</td>
                <td class="px-6 py-4 text-sm text-textMuted">\${report.product_type || 'Unknown'}</td>
                <td class="px-6 py-4 text-sm text-white">\${parseFloat(report.intensity || 0).toFixed(3)} kg/kg</td>
                <td class="px-6 py-4 text-sm">\${getStatusBadge(report.intensity)}</td>
                <td class="px-6 py-4 text-sm text-textMuted">\${formatDate(report.created_at)}</td>
            \`;
            
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error rendering reports table:', error);
    }
}

/**
 * Handle empty state vs active state
 */
function handleReportsDisplay(reports) {
    try {
        const tableContainer = document.getElementById('reportsTableContainer');
        const emptyStateContainer = document.getElementById('emptyStateContainer');
        
        if (!tableContainer || !emptyStateContainer) return;
        
        if (reports.length === 0) {
            // Show empty state
            tableContainer.classList.add('hidden');
            emptyStateContainer.classList.remove('hidden');
        } else {
            // Show reports table
            tableContainer.classList.remove('hidden');
            emptyStateContainer.classList.add('hidden');
            renderReportsTable(reports);
        }
    } catch (error) {
        console.error('Error handling reports display:', error);
    }
}

/**
 * Load all dashboard data for authenticated user
 */
async function loadDashboardData(user) {
    try {
        console.log('Loading dashboard data for user:', user.id);
        
        // Fetch and display profile
        const profile = await fetchProfile(user.id);
        updateProfileUI(user, profile);
        
        // Fetch reports
        const reports = await fetchReports(user.id);
        
        // Update KPIs
        updateKPIs(reports);
        
        // Handle display state
        handleReportsDisplay(reports);
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Hide loading screen and show dashboard
        hideLoadingScreen();
        
        console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        hideLoadingScreen();
        
        // Show error message to user
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            dashboardContent.innerHTML = \`
                <div class="flex items-center justify-center min-h-screen w-full">
                    <div class="text-center">
                        <div class="text-red-400 text-lg font-medium mb-2">Failed to load dashboard</div>
                        <div class="text-textMuted text-sm mb-4">Please refresh the page or try again later</div>
                        <button onclick="window.location.reload()" class="px-4 py-2 rounded bg-primary hover:bg-primary/90 text-black text-sm font-medium transition">
                            Refresh Page
                        </button>
                    </div>
                </div>
            \`;
        }
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    try {
        showLoadingScreen();
        
        // Sign out using auth helper
        const { error } = await auth.signOut();
        
        if (error) {
            console.error('Logout error:', error);
            hideLoadingScreen();
            alert('Failed to logout. Please try again.');
            return;
        }
        
        // Clear local session state
        currentSession = null;
        currentUser = null;
        
        console.log('✅ User logged out successfully');
        
        // Redirect will happen via auth state listener
        // But do it manually as backup
        setTimeout(() => {
            redirectToIndex();
        }, 500);
    } catch (error) {
        console.error('Exception during logout:', error);
        hideLoadingScreen();
        alert('An error occurred during logout. Please try again.');
    }
}

/**
 * Handle navigation to calculator
 */
function navigateToCalculator() {
    window.location.href = 'index.html?action=openCalculator';
}

/**
 * Initialize dashboard with robust session management
 */
async function initDashboard() {
    try {
        console.log('🚀 Initializing dashboard with robust session management...');
        
        // Show loading screen
        showLoadingScreen();
        
        // Step 1: Initialize Supabase
        const supabaseReady = await initSupabase();
        if (!supabaseReady) {
            console.error('Failed to initialize Supabase');
            hideLoadingScreen();
            alert('Failed to connect to authentication service. Please refresh the page.');
            return;
        }
        
        // Step 2: Setup auth state listener BEFORE checking session
        setupAuthStateListener();
        
        // Step 3: Check for existing session
        const session = await checkSession();
        
        // Step 4: If session exists, load dashboard data
        if (session && session.user) {
            await loadDashboardData(session.user);
        } else {
            // No session found - redirect to login
            console.log('No active session found');
            redirectToIndex();
        }
    } catch (error) {
        console.error('Critical error initializing dashboard:', error);
        hideLoadingScreen();
        
        // Show error screen
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            dashboardContent.innerHTML = \`
                <div class="flex items-center justify-center min-h-screen w-full">
                    <div class="text-center">
                        <div class="text-red-400 text-lg font-medium mb-2">Critical Error</div>
                        <div class="text-textMuted text-sm mb-4">Failed to initialize dashboard</div>
                        <button onclick="window.location.href='index.html'" class="px-4 py-2 rounded bg-primary hover:bg-primary/90 text-black text-sm font-medium transition">
                            Go to Home
                        </button>
                    </div>
                </div>
            \`;
            dashboardContent.classList.remove('hidden');
        }
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    try {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Create report buttons
        const createReportBtn = document.getElementById('createReportBtn');
        if (createReportBtn) {
            createReportBtn.addEventListener('click', navigateToCalculator);
        }
        
        const emptyStateCreateBtn = document.getElementById('emptyStateCreateBtn');
        if (emptyStateCreateBtn) {
            emptyStateCreateBtn.addEventListener('click', navigateToCalculator);
        }
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

/**
 * Cleanup function for auth listener
 */
function cleanup() {
    if (authStateListener) {
        authStateListener.unsubscribe();
        console.log('Auth state listener unsubscribed');
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setupEventListeners();
        initDashboard();
    });
} else {
    setupEventListeners();
    initDashboard();
}
