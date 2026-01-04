/**
 * CBAM Calculator - UI Control & Interactions
 */

import { CONSTANTS, incrementPrecursorCount } from './config.js';
import { validateCNCode } from './calculator.js';

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
