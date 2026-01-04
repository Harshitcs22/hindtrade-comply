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
    handleAuthButtonClick,
    handleLogin,
    handleSignup,
    isUserLoggedIn,
    db
} from './ui.js';
import { calculationResults } from './config.js';

// Initialize Lucide icons
if (window.lucide) {
    window.lucide.createIcons();
}

// Initialize authentication on page load
initAuth();

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
const authBtn = document.getElementById('authBtn');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');

if (authBtn) {
    authBtn.addEventListener('click', handleAuthButtonClick);
}

if (closeAuthBtn) {
    closeAuthBtn.addEventListener('click', closeAuthModal);
}

if (loginBtn) {
    loginBtn.addEventListener('click', handleLogin);
}

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

// PDF Download Button
const downloadPDFBtn = document.getElementById('downloadPDFBtn');
if (downloadPDFBtn) {
    downloadPDFBtn.addEventListener('click', handleDownload);
}

/**
 * Handle download - Save to Supabase first, then generate PDF with UUID
 */
async function handleDownload() {
    // Step 1: Check if user is logged in
    if (!isUserLoggedIn()) {
        alert('Please login to save and download your report');
        openAuthModal();
        return;
    }

    // Check if calculation has been done
    if (!calculationResults) {
        alert('Please calculate emissions first');
        return;
    }

    // Step 2: Show saving state
    const originalText = downloadPDFBtn.textContent;
    downloadPDFBtn.textContent = 'Saving...';
    downloadPDFBtn.disabled = true;

    try {
        // Step 3: Prepare report data
        const reportData = {
            cnCode: calculationResults.cnCode,
            productType: getProductType(calculationResults.cnCode),
            productionQty: calculationResults.productionQty,
            inputData: {
                electricity: parseFloat(document.getElementById('electricity').value) || 0,
                diesel: parseFloat(document.getElementById('diesel').value) || 0,
                coal: parseFloat(document.getElementById('coal').value) || 0,
                precursors: getPrecursorsData()
            },
            totalEmissions: calculationResults.total,
            intensity: calculationResults.intensity
        };

        // Step 4: Save to Supabase
        const { data, error } = await db.saveReport(reportData);

        if (error) {
            throw error;
        }

        // Step 5: Get the UUID from Supabase response
        const reportId = data?.id;

        if (!reportId) {
            throw new Error('Failed to get report ID from server');
        }

        // Step 6: Generate PDF with the UUID
        downloadPDFBtn.textContent = 'Generating PDF...';
        generatePDF(calculationResults, reportId);

        // Success message
        setTimeout(() => {
            downloadPDFBtn.textContent = originalText;
            downloadPDFBtn.disabled = false;
        }, 1000);

    } catch (error) {
        console.error('Error saving report:', error);
        alert('Error saving report: ' + (error.message || 'Unknown error'));
        downloadPDFBtn.textContent = originalText;
        downloadPDFBtn.disabled = false;
    }
}

/**
 * Get product type from CN code
 */
function getProductType(cnCode) {
    const prefix = cnCode?.substring(0, 2);
    const CBAM_GOODS = {
        '72': 'Iron & Steel',
        '76': 'Aluminum'
    };
    return CBAM_GOODS[prefix] || 'Unknown';
}

/**
 * Get precursors data from UI
 */
function getPrecursorsData() {
    const precursors = [];
    const precursorItems = document.querySelectorAll('#precursorList > div');
    precursorItems.forEach(item => {
        const type = item.querySelector('.precursor-type')?.value;
        const qty = parseFloat(item.querySelector('.precursor-qty')?.value) || 0;
        if (type && qty > 0) {
            precursors.push({ type, qty });
        }
    });
    return precursors;
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
