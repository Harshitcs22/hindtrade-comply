/**
 * CBAM Calculator - Core Calculation Logic
 */

import { CONSTANTS, CBAM_GOODS, setCalculationResults } from './config.js';

/**
 * Validate CN Code (8-digit format)
 * @param {string} code - CN code to validate
 * @returns {boolean} - Whether the code is valid
 */
export function validateCNCode(code) {
    const regex = /^[0-9]{8}$/;
    const isValid = regex.test(code);
    
    const cnFeedback = document.getElementById('cnFeedback');
    const productType = document.getElementById('productType');
    
    if (isValid) {
        cnFeedback.classList.remove('hidden');
        cnFeedback.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i>';
        
        // Auto-detect product type
        const prefix = code.substring(0, 2);
        if (CBAM_GOODS[prefix]) {
            productType.textContent = `✓ Detected: ${CBAM_GOODS[prefix]}`;
            productType.classList.add('text-emerald-400');
        } else {
            productType.textContent = '✓ Valid CN Code';
            productType.classList.add('text-emerald-400');
        }
        if (window.lucide) window.lucide.createIcons();
    } else if (code.length > 0) {
        cnFeedback.classList.remove('hidden');
        cnFeedback.innerHTML = '<i data-lucide="x-circle" class="w-5 h-5 text-red-400"></i>';
        productType.textContent = '✗ Must be exactly 8 digits';
        productType.classList.remove('text-emerald-400');
        productType.classList.add('text-red-400');
        if (window.lucide) window.lucide.createIcons();
    } else {
        cnFeedback.classList.add('hidden');
        productType.textContent = '';
    }
    
    return isValid;
}

/**
 * Run the main emission calculation
 */
export function calculate() {
    // Get inputs
    const cnCode = document.getElementById('cnCode').value;
    const productionQty = parseFloat(document.getElementById('productionQty').value) || 0;
    const electricity = parseFloat(document.getElementById('electricity').value) || 0;
    const diesel = parseFloat(document.getElementById('diesel').value) || 0;
    const coal = parseFloat(document.getElementById('coal').value) || 0;

    // Validate
    if (!validateCNCode(cnCode)) {
        alert('Please enter a valid 8-digit CN Code');
        return;
    }
    if (productionQty <= 0) {
        alert('Please enter production quantity');
        return;
    }

    // Calculate Scope 1 (Direct Fuel)
    const scope1Diesel = (diesel / 1000) * CONSTANTS.DIESEL_FACTOR;
    const scope1Coal = (coal / 1000) * CONSTANTS.COAL_FACTOR;
    const scope1Total = scope1Diesel + scope1Coal;

    // Calculate Scope 2 (Electricity)
    const scope2Total = (electricity / 1000) * CONSTANTS.GRID_FACTOR;

    // Calculate Scope 3 (Precursors)
    let scope3Total = 0;
    const precursorItems = document.querySelectorAll('#precursorList > div');
    precursorItems.forEach(item => {
        const type = item.querySelector('.precursor-type').value;
        const qty = parseFloat(item.querySelector('.precursor-qty').value) || 0;
        if (type && qty > 0) {
            scope3Total += qty * CONSTANTS.PRECURSORS[type];
        }
    });

    // Total emissions and embedded intensity
    const totalEmissions = scope1Total + scope2Total + scope3Total;
    const embeddedIntensity = totalEmissions / productionQty;

    // Store results
    const results = {
        scope1: scope1Total,
        scope2: scope2Total,
        scope3: scope3Total,
        total: totalEmissions,
        intensity: embeddedIntensity,
        cnCode: cnCode,
        productionQty: productionQty
    };
    setCalculationResults(results);

    // Update UI
    document.getElementById('mainResult').textContent = embeddedIntensity.toFixed(3);
    document.getElementById('scope1Result').textContent = scope1Total.toFixed(2) + ' tCO₂e';
    document.getElementById('scope2Result').textContent = scope2Total.toFixed(2) + ' tCO₂e';
    document.getElementById('scope3Result').textContent = scope3Total.toFixed(2) + ' tCO₂e';
    document.getElementById('totalResult').textContent = totalEmissions.toFixed(2) + ' tCO₂e';

    // Save state
    if (window.saveState) window.saveState();
}
