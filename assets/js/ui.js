/**
 * CBAM Calculator - UI Control & Interactions
 */

import { CONSTANTS, incrementPrecursorCount } from './config.js';
import { validateCNCode } from './calculator.js';
import { auth, db } from './supabase-client.js';

// Store current user state
let currentUser = null;

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

/**
 * Initialize authentication state on page load
 */
export async function initAuth() {
    const { data: user, error } = await auth.getUser();
    
    if (user && !error) {
        currentUser = user;
        updateAuthButton(true, user.email);
    } else {
        currentUser = null;
        updateAuthButton(false);
    }
}

/**
 * Update the auth button based on login state
 */
function updateAuthButton(isLoggedIn, email = '') {
    const authBtn = document.getElementById('authBtn');
    const signUpNavBtn = document.getElementById('signUpNavBtn');
    const authButtons = document.getElementById('authButtons');
    
    if (!authBtn) return;

    if (isLoggedIn) {
        // Hide sign up button and update login button to logout
        if (signUpNavBtn) signUpNavBtn.style.display = 'none';
        authBtn.textContent = 'Logout';
        authBtn.title = `Logged in as ${email}`;
        authBtn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
        authBtn.classList.add('bg-white/10', 'hover:bg-white/15');
    } else {
        // Show both buttons when logged out
        if (signUpNavBtn) signUpNavBtn.style.display = 'block';
        authBtn.textContent = 'Login';
        authBtn.title = '';
        authBtn.classList.remove('bg-white/10', 'hover:bg-white/15');
        authBtn.classList.add('bg-emerald-500', 'hover:bg-emerald-600');
    }
}

/**
 * Open the auth modal in specified mode
 * @param {string} mode - 'login' or 'signup'
 */
export function openAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Update modal header based on mode
        const modalTitle = modal.querySelector('h2');
        const modalSubtitle = modal.querySelector('p');
        
        if (mode === 'signup') {
            if (modalTitle) modalTitle.textContent = 'Create Account';
            if (modalSubtitle) modalSubtitle.textContent = 'Sign up to save and manage your CBAM reports';
        } else {
            if (modalTitle) modalTitle.textContent = 'Welcome Back';
            if (modalSubtitle) modalSubtitle.textContent = 'Sign in to save and manage your CBAM reports';
        }
        
        // Clear previous messages
        hideAuthMessages();
        if (window.lucide) window.lucide.createIcons();
    }
}
}

/**
 * Close the auth modal
 */
export function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('hidden');
        // Clear form
        document.getElementById('authEmail').value = '';
        document.getElementById('authPassword').value = '';
        hideAuthMessages();
    }
}

/**
 * Handle auth button click (Login or Logout)
 */
export async function handleAuthButtonClick() {
    if (currentUser) {
        // Logout
        const { error } = await auth.signOut();
        if (!error) {
            currentUser = null;
            updateAuthButton(false);
            alert('Logged out successfully');
        } else {
            alert('Error logging out: ' + error.message);
        }
    } else {
        // Open login modal
        openAuthModal();
    }
}

/**
 * Handle login
 */
export async function handleLogin() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    if (!email || !password) {
        showAuthError('Please enter both email and password');
        return;
    }

    // Show loading state
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.textContent;
    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;

    const { data, error } = await auth.signIn(email, password);

    loginBtn.textContent = originalText;
    loginBtn.disabled = false;

    if (error) {
        showAuthError(error.message || 'Login failed');
    } else if (data?.user) {
        currentUser = data.user;
        updateAuthButton(true, email);
        showAuthSuccess('Logged in successfully!');
        setTimeout(() => {
            closeAuthModal();
        }, 1000);
    }
}

/**
 * Handle signup
 */
export async function handleSignup() {
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;

    if (!email || !password) {
        showAuthError('Please enter both email and password');
        return;
    }

    if (password.length < 12) {
        showAuthError('Password must be at least 12 characters');
        return;
    }

    // Show loading state
    const signupBtn = document.getElementById('signupBtn');
    const originalText = signupBtn.textContent;
    signupBtn.textContent = 'Signing up...';
    signupBtn.disabled = true;

    const { data, error } = await auth.signUp(email, password);

    signupBtn.textContent = originalText;
    signupBtn.disabled = false;

    if (error) {
        showAuthError(error.message || 'Signup failed');
    } else {
        showAuthSuccess('Account created! Please check your email to verify, then login.');
    }
}

/**
 * Show error message in auth modal
 */
function showAuthError(message) {
    const errorEl = document.getElementById('authError');
    const successEl = document.getElementById('authSuccess');
    
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
    if (successEl) {
        successEl.classList.add('hidden');
    }
}

/**
 * Show success message in auth modal
 */
function showAuthSuccess(message) {
    const errorEl = document.getElementById('authError');
    const successEl = document.getElementById('authSuccess');
    
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.remove('hidden');
    }
    if (errorEl) {
        errorEl.classList.add('hidden');
    }
}

/**
 * Hide all auth messages
 */
function hideAuthMessages() {
    const errorEl = document.getElementById('authError');
    const successEl = document.getElementById('authSuccess');
    
    if (errorEl) errorEl.classList.add('hidden');
    if (successEl) successEl.classList.add('hidden');
}

/**
 * Check if user is logged in
 */
export function isUserLoggedIn() {
    return currentUser !== null;
}

/**
 * Get current user
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Export db for use in other modules
 */
export { db };
