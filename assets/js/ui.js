/**
 * CBAM Calculator - UI Control & Interactions
 */

import { CONSTANTS, incrementPrecursorCount } from './config.js';
import { validateCNCode } from './calculator.js';
import { auth, db } from './supabase-client.js';

// Global state for current user
let currentUser = null;

/**
 * Initialize authentication state on page load
 * Uses the new checkSession() method for proper session persistence
 */
export async function initAuth() {
    console.log('🔍 Initializing auth state...');
    const session = await auth.checkSession();
    if (session) {
        currentUser = session.user;
        updateAuthButton(true);
        console.log('✅ User authenticated:', session.user?.email);
    } else {
        console.log('📌 No authenticated user');
    }
    
    // Listen for auth state changes
    window.addEventListener('authStateChange', (event) => {
        const { user, session } = event.detail;
        currentUser = user;
        updateAuthButton(!!session);
    });
}

/**
 * Update auth button based on login state
 * @param {boolean} isLoggedIn - Whether user is logged in
 */
function updateAuthButton(isLoggedIn) {
    const authBtn = document.getElementById('authBtn');
    if (!authBtn) return;
    
    if (isLoggedIn) {
        authBtn.textContent = 'Dashboard';
        authBtn.href = '/dashboard.html';
        // Remove onclick handler if it exists
        authBtn.onclick = null;
    } else {
        authBtn.textContent = 'Login';
        authBtn.href = '/login.html';
        authBtn.onclick = null;
    }
}

/**
 * Open authentication modal
 */
export function openAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('hidden');
    // Clear form
    document.getElementById('authForm').reset();
    document.getElementById('authError').classList.add('hidden');
    document.getElementById('authSuccess').classList.add('hidden');
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Close authentication modal
 */
export function closeAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.add('hidden');
}

/**
 * Handle user login (modal flow - legacy)
 * Redirects to dashboard after successful login
 */
export async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const errorDiv = document.getElementById('authError');
    const successDiv = document.getElementById('authSuccess');
    
    // Hide previous messages
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    
    // Show loading state
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;
    
    const { data, error } = await auth.signIn(email, password);
    
    if (error) {
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
        errorDiv.textContent = error.message || 'Login failed. Please check your credentials.';
        errorDiv.classList.remove('hidden');
    } else {
        currentUser = data.user;
        successDiv.textContent = 'Login successful! Redirecting...';
        successDiv.classList.remove('hidden');
        
        // Verify session and redirect to dashboard
        const session = await auth.checkSession();
        if (session) {
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 500);
        } else {
            loginBtn.textContent = originalText;
            loginBtn.disabled = false;
            errorDiv.textContent = 'Session could not be verified. Please try again.';
            errorDiv.classList.remove('hidden');
            successDiv.classList.add('hidden');
        }
    }
}

/**
 * Handle user signup (modal flow - legacy)
 * Redirects to login page after successful signup
 */
export async function handleSignup() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    const errorDiv = document.getElementById('authError');
    const successDiv = document.getElementById('authSuccess');
    
    // Validate
    if (!email || !password) {
        errorDiv.textContent = 'Please enter both email and password.';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters.';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Hide previous messages
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    
    // Show loading state
    const signupBtn = document.getElementById('signupBtn');
    const originalText = signupBtn.textContent;
    signupBtn.textContent = 'Creating account...';
    signupBtn.disabled = true;
    
    const { data, error } = await auth.signUp(email, password);
    
    signupBtn.textContent = originalText;
    signupBtn.disabled = false;
    
    if (error) {
        errorDiv.textContent = error.message || 'Signup failed. Please try again.';
        errorDiv.classList.remove('hidden');
    } else {
        // Check if email confirmation is required
        if (data.user && !data.session) {
            successDiv.textContent = 'Account created! Please check your email to verify, then login.';
            successDiv.classList.remove('hidden');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 3000);
        } else if (data.session) {
            // Auto-login successful
            successDiv.textContent = 'Account created! Redirecting to dashboard...';
            successDiv.classList.remove('hidden');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            successDiv.textContent = 'Account created! Please login to continue.';
            successDiv.classList.remove('hidden');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        }
    }
}

/**
 * Handle user logout
 * Redirects to login page after successful logout
 */
export async function handleLogout() {
    const { error } = await auth.signOut();
    if (!error) {
        currentUser = null;
        window.location.href = '/login.html';
    } else {
        console.error('Logout error:', error.message);
        alert('Logout failed. Please try again.');
    }
}

/**
 * Handle download with Supabase save flow
 */
export async function handleDownload(calculationData) {
    // Step 1: Check if user is logged in
    const session = await auth.checkSession();
    if (!session) {
        alert('Please login to save and download your report');
        window.location.href = '/login.html';
        return;
    }
    currentUser = session.user;
    
    const downloadBtn = document.getElementById('downloadPDFBtn');
    const originalText = downloadBtn.textContent;
    
    try {
        // Step 2: Show saving state
        downloadBtn.textContent = 'Saving to database...';
        downloadBtn.disabled = true;
        
        // Step 3: Save to Supabase
        const { data, error } = await db.saveReport(calculationData);
        
        if (error) {
            throw error;
        }
        
        if (!data || !data.id) {
            throw new Error('Failed to save report');
        }
        
        // Step 4: Get the UUID
        const reportId = data.id;
        
        // Step 5: Generate PDF with UUID
        downloadBtn.textContent = 'Generating PDF...';
        const { generatePDF } = await import('./export.js');
        await generatePDF(calculationData, reportId);
        
        // Step 6: Reset button
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
        
        alert('Report saved successfully!');
    } catch (error) {
        console.error('Error saving report:', error);
        alert('Failed to save report: ' + (error.message || 'Unknown error'));
        downloadBtn.textContent = originalText;
        downloadBtn.disabled = false;
    }
}

/**
 * Open the calculator modal
 */
export function openCalculator() {
    const modal = document.getElementById('calculatorModal');
    modal.classList.remove('hidden');
    loadState();
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Close the calculator modal
 */
export function closeCalculator() {
    const modal = document.getElementById('calculatorModal');
    modal.classList.add('hidden');
}

/**
 * Toggle precursor section visibility
 */
export function togglePrecursorSection() {
    const precursorToggle = document.getElementById('precursorToggle');
    const precursorInputs = document.getElementById('precursorInputs');
    const isActive = precursorToggle.dataset.active === 'true';
    
    precursorToggle.dataset.active = !isActive;
    
    if (!isActive) {
        precursorToggle.classList.add('bg-emerald-500');
        precursorToggle.querySelector('div').style.transform = 'translateX(1.5rem)';
        precursorInputs.classList.remove('hidden');
    } else {
        precursorToggle.classList.remove('bg-emerald-500');
        precursorToggle.querySelector('div').style.transform = 'translateX(0)';
        precursorInputs.classList.add('hidden');
    }
    saveState();
}

/**
 * Add a new precursor material row
 */
export function addPrecursorRow() {
    incrementPrecursorCount();
    const precursorList = document.getElementById('precursorList');
    
    const precursorItem = document.createElement('div');
    precursorItem.className = 'flex gap-2';
    precursorItem.innerHTML = `
        <select class="flex-1 px-3 py-2 rounded bg-[#050505] border border-white/20 text-white text-xs focus:border-emerald-400 focus:outline-none transition precursor-type">
            <option value="">Select Material</option>
            ${Object.keys(CONSTANTS.PRECURSORS).map(p => `<option value="${p}">${p}</option>`).join('')}
        </select>
        <input 
            type="number" 
            placeholder="Tonnes"
            class="w-24 px-3 py-2 rounded bg-[#050505] border border-white/20 text-white text-xs focus:border-emerald-400 focus:outline-none transition precursor-qty"
        >
        <button class="text-red-400 hover:text-red-300 transition remove-precursor">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
    `;
    precursorList.appendChild(precursorItem);
    
    precursorItem.querySelector('.remove-precursor').addEventListener('click', () => {
        precursorItem.remove();
        saveState();
    });

    precursorItem.querySelector('.precursor-type').addEventListener('change', saveState);
    precursorItem.querySelector('.precursor-qty').addEventListener('input', saveState);
    
    if (window.lucide) window.lucide.createIcons();
    saveState();
}

/**
 * Save calculator state to localStorage
 */
export function saveState() {
    const precursorToggle = document.getElementById('precursorToggle');
    const state = {
        cnCode: document.getElementById('cnCode').value,
        productionQty: document.getElementById('productionQty').value,
        electricity: document.getElementById('electricity').value,
        diesel: document.getElementById('diesel').value,
        coal: document.getElementById('coal').value,
        precursorActive: precursorToggle.dataset.active,
        precursors: []
    };

    const precursorItems = document.querySelectorAll('#precursorList > div');
    precursorItems.forEach(item => {
        state.precursors.push({
            type: item.querySelector('.precursor-type').value,
            qty: item.querySelector('.precursor-qty').value
        });
    });

    localStorage.setItem('cbamCalculatorState', JSON.stringify(state));
}

/**
 * Load calculator state from localStorage
 */
export function loadState() {
    const saved = localStorage.getItem('cbamCalculatorState');
    if (!saved) return;

    const state = JSON.parse(saved);
    document.getElementById('cnCode').value = state.cnCode || '';
    document.getElementById('productionQty').value = state.productionQty || '';
    document.getElementById('electricity').value = state.electricity || '';
    document.getElementById('diesel').value = state.diesel || '';
    document.getElementById('coal').value = state.coal || '';

    if (state.cnCode) validateCNCode(state.cnCode);

    const precursorToggle = document.getElementById('precursorToggle');
    if (state.precursorActive === 'true' && precursorToggle.dataset.active !== 'true') {
        precursorToggle.click();
        state.precursors.forEach(p => {
            addPrecursorRow();
            const precursorList = document.getElementById('precursorList');
            const lastItem = precursorList.lastElementChild;
            lastItem.querySelector('.precursor-type').value = p.type;
            lastItem.querySelector('.precursor-qty').value = p.qty;
        });
    }
}
