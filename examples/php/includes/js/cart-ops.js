// cart-ops.js — Cart mutation operations (add, remove, qty, discount).

import { getErrorMessage } from './format.js';
import { showToast } from './toast.js';

let _client;
let _cart;
const _limitsCache = {};

export function initCartOps(client, cart) {
    _client = client;
    _cart = cart;
}

export async function addToCart(variantUuid, quantity) {
    try {
        return await _cart.add(variantUuid, quantity || 1);
    } catch (err) {
        showToast(getErrorMessage(err), 'error');
    }
}

export async function removeItem(variantUuid) {
    try {
        await _cart.remove(variantUuid);
    } catch (err) {
        showToast(getErrorMessage(err), 'error');
    }
}

export async function incrementItem(variantUuid) {
    try {
        await _cart.increment(variantUuid);
    } catch (err) {
        showToast(getErrorMessage(err), 'error');
    }
}

export async function decrementItem(variantUuid) {
    try {
        await _cart.decrement(variantUuid);
    } catch (err) {
        showToast(getErrorMessage(err), 'error');
    }
}

export async function applyDrawerDiscount() {
    const input = document.getElementById('drawer-discount-input');
    if (!input) return;
    const code = input.value.trim();
    if (!code) return;
    try {
        await _cart.applyDiscount(code);
        input.value = '';
        showToast('Discount applied!', 'success');
    } catch (err) {
        showToast(getErrorMessage(err) || 'Invalid code', 'error');
    }
}

export async function removeDiscount() {
    try {
        await _cart.removeDiscount();
    } catch (err) {
        showToast(getErrorMessage(err), 'error');
    }
}

export async function fetchProductLimits(slug) {
    if (_limitsCache[slug]) return _limitsCache[slug];
    try {
        const product = await _client.products.get(slug);
        const limits = window.SpaceIS.getProductLimits(product);
        _limitsCache[slug] = limits;
        return limits;
    } catch {
        return { min: 1, max: 99, step: 1 };
    }
}

export async function setItemQty(variantUuid, val, inputEl) {
    const n = parseInt(val, 10);
    const item = _cart.findItem(variantUuid);
    if (!item) return;
    const currentQty = window.SpaceIS.fromApiQty(item.quantity);
    if (isNaN(n)) { if (inputEl) inputEl.value = currentQty; return; }
    if (n === currentQty) return;

    const slug = item.shop_product ? (item.shop_product.slug || item.shop_product.uuid) : null;
    if (!slug) {
        try {
            await _cart.setQuantity(variantUuid, Math.max(1, n));
            showToast('Quantity updated', 'success');
        } catch (err) {
            showToast(getErrorMessage(err), 'error');
            if (inputEl) inputEl.value = currentQty;
        }
        return;
    }

    try {
        const limits = await fetchProductLimits(slug);
        const snapped = window.SpaceIS.snapQuantity(n, limits);
        if (inputEl) inputEl.value = snapped;
        if (snapped === currentQty) return;
        await _cart.setQuantity(variantUuid, snapped);
        showToast('Quantity updated', 'success');
    } catch (err) {
        showToast(getErrorMessage(err), 'error');
        if (inputEl) inputEl.value = currentQty;
    }
}
