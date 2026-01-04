/**
 * CBAM Calculator - Main Entry Point
 * Initializes all modules and binds event handlers
 */

import { validateCNCode, calculate } from './calculator.js';
import { generatePDF, generateXML } from './export.js';
import { 
    openCalculator, 
    closeCalculator, 
    togglePrecursorSection, 
    addPrecursorRow, 
    saveState,
    initAuth,
    openAuthModal,
    closeAuthModal,
    handleLogin,
    handleSignup,
    handleDownload
} from './ui.js';
import { calculationResults } from './config.js';

// Initialize authentication on page load
initAuth();

// Check URL parameters to auto-open calculator
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('action') === 'openCalculator') {
    // Wait a bit for DOM to be ready, then open calculator
    setTimeout(() => {
        openCalculator();
    }, 100);
}

// Initialize Lucide icons
if (window.lucide) {
    window.lucide.createIcons();
}

// Spotlight effect for cards
const cards = document.querySelectorAll('.spotlight-card');
cards.forEach(card => {
    card.onmousemove = e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    }
});

// Expose functions to window for HTML onclick handlers
window.openCalculator = openCalculator;
window.closeCalculator = closeCalculator;
window.togglePrecursorSection = togglePrecursorSection;
window.addPrecursorRow = addPrecursorRow;
window.saveState = saveState;
window.calculate = calculate;
window.generatePDF = generatePDF;
window.generateXML = generateXML;

// Modal Controls
const openBtn = document.getElementById('openCalculatorBtn');
const closeBtn = document.getElementById('closeCalculatorBtn');

if (openBtn) {
    openBtn.addEventListener('click', openCalculator);
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeCalculator);
}

// Auth Modal Controls
const closeAuthBtn = document.getElementById('closeAuthBtn');
if (closeAuthBtn) {
    closeAuthBtn.addEventListener('click', closeAuthModal);
}

// Auth Form
const authForm = document.getElementById('authForm');
if (authForm) {
    authForm.addEventListener('submit', handleLogin);
}

const signupBtn = document.getElementById('signupBtn');
if (signupBtn) {
    signupBtn.addEventListener('click', handleSignup);
}

// CN Code Validation
const cnCodeInput = document.getElementById('cnCode');
if (cnCodeInput) {
    cnCodeInput.addEventListener('input', (e) => {
        validateCNCode(e.target.value);
        saveState();
    });
}

// Precursor Toggle
const precursorToggle = document.getElementById('precursorToggle');
if (precursorToggle) {
    precursorToggle.addEventListener('click', togglePrecursorSection);
}

// Add Precursor Button
const addPrecursorBtn = document.getElementById('addPrecursorBtn');
if (addPrecursorBtn) {
    addPrecursorBtn.addEventListener('click', addPrecursorRow);
}

// Calculate Button
const calculateBtn = document.getElementById('calculateBtn');
if (calculateBtn) {
    calculateBtn.addEventListener('click', calculate);
}

// PDF Download Button - Updated to use new flow
const downloadPDFBtn = document.getElementById('downloadPDFBtn');
if (downloadPDFBtn) {
    downloadPDFBtn.addEventListener('click', () => {
        if (calculationResults) {
            // Get all input data for saving
            const inputData = {
                ...calculationResults,
                electricity: parseFloat(document.getElementById('electricity').value) || 0,
                diesel: parseFloat(document.getElementById('diesel').value) || 0,
                coal: parseFloat(document.getElementById('coal').value) || 0,
                precursors: []
            };
            
            // Collect precursor data
            const precursorItems = document.querySelectorAll('#precursorList > div');
            precursorItems.forEach(item => {
                const type = item.querySelector('.precursor-type').value;
                const qty = parseFloat(item.querySelector('.precursor-qty').value) || 0;
                if (type && qty > 0) {
                    inputData.precursors.push({ type, qty });
                }
            });
            
            handleDownload(inputData);
        } else {
            alert('Please calculate emissions first');
        }
    });
}

// XML Download Button
const downloadXMLBtn = document.getElementById('downloadXMLBtn');
if (downloadXMLBtn) {
    downloadXMLBtn.addEventListener('click', generateXML);
}

// Auto-save on input changes
['productionQty', 'electricity', 'diesel', 'coal'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('input', saveState);
    }
});

console.log('CBAM Calculator initialized successfully');
