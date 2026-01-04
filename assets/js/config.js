/**
 * CBAM Calculator Configuration
 * Emission factors and constants for Jan 2026
 */

// Emission Factors (Jan 2026)
export const CONSTANTS = {
    GRID_FACTOR: 0.715,      // tCO2e per MWh (India CEA 2026)
    DIESEL_FACTOR: 3.16,      // tCO2e per 1000L
    COAL_FACTOR: 2.5,         // tCO2e per 1000kg
    PRECURSORS: {
        'Iron Ore': 0.8,
        'Scrap': 0.9,
        'Aluminum': 0.4,
        'Coke': 3.6
    }
};

// CBAM Goods Product Type Mapping
export const CBAM_GOODS = {
    '72': 'Iron & Steel',
    '76': 'Aluminum'
};

// Global state variables
export let precursorCount = 0;
export let calculationResults = null;

// Update calculation results
export function setCalculationResults(results) {
    calculationResults = results;
}

// Increment precursor count
export function incrementPrecursorCount() {
    precursorCount++;
}
