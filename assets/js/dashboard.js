/**
 * Dashboard Module
 * Handles authentication, profile display, and dynamic report rendering
 */

import { auth, db } from './supabase-client.js';

// Supabase client reference
let supabase = null;

/**
 * Initialize Supabase client
 */
async function initSupabase() {
    supabase = await db.getClient();
    if (supabase) {
        console.log('✅ Supabase client initialized for dashboard');
        return true;
    } else {
        console.error('❌ Failed to get Supabase client');
        return false;
    }
}

/**
 * Check authentication and redirect if not logged in
 */
async function checkAuth() {
    const { data: user, error } = await auth.getUser();
    
    if (error || !user) {
        console.log('User not authenticated, redirecting to index.html');
        window.location.href = 'index.html';
        return null;
    }
    
    return user;
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
            console.warn('Profile not found, will use defaults:', error);
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
}

/**
 * Get status badge HTML based on intensity
 */
function getStatusBadge(intensity) {
    const intensityValue = parseFloat(intensity);
    
    if (intensityValue < 1.0) {
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></span>
            Low Impact
        </span>`;
    } else {
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5"></span>
            High Impact
        </span>`;
    }
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Render reports table
 */
function renderReportsTable(reports) {
    const tableBody = document.getElementById('reportsTableBody');
    tableBody.innerHTML = '';
    
    reports.forEach(report => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-white/5 transition';
        
        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-white font-mono">${report.cn_code || 'N/A'}</td>
            <td class="px-6 py-4 text-sm text-textMuted">${report.product_type || 'Unknown'}</td>
            <td class="px-6 py-4 text-sm text-white">${parseFloat(report.intensity || 0).toFixed(3)} kg/kg</td>
            <td class="px-6 py-4 text-sm">${getStatusBadge(report.intensity)}</td>
            <td class="px-6 py-4 text-sm text-textMuted">${formatDate(report.created_at)}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Handle empty state vs active state
 */
function handleReportsDisplay(reports) {
    const tableContainer = document.getElementById('reportsTableContainer');
    const emptyStateContainer = document.getElementById('emptyStateContainer');
    
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
}

/**
 * Handle logout
 */
async function handleLogout() {
    const { error } = await auth.signOut();
    
    if (!error) {
        console.log('User logged out successfully');
        window.location.href = 'index.html';
    } else {
        console.error('Logout error:', error);
        alert('Failed to logout. Please try again.');
    }
}

/**
 * Handle navigation to calculator
 */
function navigateToCalculator() {
    window.location.href = 'index.html?action=openCalculator';
}

/**
 * Initialize dashboard
 */
async function initDashboard() {
    try {
        // Initialize Supabase
        await initSupabase();
        
        // Check authentication
        const user = await checkAuth();
        if (!user) return;
        
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
        
        console.log('✅ Dashboard initialized successfully');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('Failed to load dashboard. Please refresh the page.');
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
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
}

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
