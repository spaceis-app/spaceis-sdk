// cart-drawer.js — Cart drawer render, open/close, incremental patching.

import { fp, esc } from './format.js';
import { renderCartItemHtml } from './cart-item.js';

let _cart;
let drawerOpen = false;
let prevDrawerUuids = [];
let prevDrawerDiscount = null;

export function initCartDrawer(cart) {
    _cart = cart;
}

export function renderDrawer() {
    const drawer = document.getElementById('cart-drawer');
    if (!drawer) return;

    const items = _cart.items || [];
    const totalQuantity = _cart.totalQuantity || 0;
    const finalPrice = _cart.finalPrice || 0;
    const regularPrice = _cart.regularPrice || 0;
    const hasDiscount = _cart.hasDiscount || false;
    const discount = _cart.discount || null;
    const isEmpty = _cart.isEmpty;
    const isLoading = _cart.isLoading;
    const discountAmount = regularPrice - finalPrice;

    const currentUuids = items.map((i) => i.variant?.uuid ?? '');
    const discountCode = discount ? discount.code : null;
    const sameItems = currentUuids.length === prevDrawerUuids.length &&
        currentUuids.every((uuid, i) => uuid === prevDrawerUuids[i]);
    const sameDiscount = discountCode === prevDrawerDiscount;

    // Incremental update — same items AND same discount, just patch qty/prices
    if (sameItems && sameDiscount && currentUuids.length > 0 && drawer.querySelector('.cart-items-list')) {
        const titleEl = drawer.querySelector('.drawer-title');
        if (titleEl) titleEl.textContent = `CART${totalQuantity > 0 ? ` (${totalQuantity})` : ''}`;

        const itemEls = drawer.querySelectorAll('.cart-item');
        items.forEach((item, i) => {
            if (!itemEls[i]) return;
            const displayQty = window.SpaceIS.getItemQty(item);
            const qtyInput = itemEls[i].querySelector('.qty-input');
            if (qtyInput && document.activeElement !== qtyInput) {
                qtyInput.value = displayQty;
            }
            const pricesEl = itemEls[i].querySelector('.cart-item-prices');
            if (pricesEl) {
                let ph = `<span class="cart-item-price-current">${fp(item.final_price_value)}</span>`;
                if (item.regular_price_value !== item.final_price_value) {
                    ph += `<span class="cart-item-price-old">${fp(item.regular_price_value)}</span>`;
                }
                pricesEl.innerHTML = ph;
            }
        });

        const summaryHeader = drawer.querySelector('.cart-summary-header');
        if (summaryHeader) summaryHeader.textContent = `Subtotal (${totalQuantity})`;
        const summaryTotal = drawer.querySelector('.cart-summary-total span:last-child');
        if (summaryTotal) summaryTotal.textContent = fp(finalPrice);
        const summarySubtotal = drawer.querySelector('.cart-summary-row:not(.cart-summary-discount) span:last-child');
        if (summarySubtotal) summarySubtotal.textContent = fp(regularPrice);

        return;
    }

    // Full rebuild
    prevDrawerUuids = currentUuids;
    prevDrawerDiscount = discountCode;
    let html = '';

    html += '<div class="drawer-header">';
    html += `<span class="drawer-title">CART${totalQuantity > 0 ? ` (${totalQuantity})` : ''}</span>`;
    html += '<button class="close-btn" onclick="SpaceISApp.closeDrawer()" aria-label="Close">&#10005;</button>';
    html += '</div>';

    html += '<div class="drawer-body">';
    if (isLoading && !_cart.cart) {
        html += '<div class="spinner"></div>';
    } else if (isEmpty) {
        html += '<div class="empty-state">';
        html += '<div class="icon">&#128722;</div>';
        html += '<p>Your cart is empty</p>';
        html += '<button class="cart-action-secondary" onclick="SpaceISApp.closeDrawer()" style="margin-top:16px">Continue Shopping</button>';
        html += '</div>';
    } else {
        html += '<ul class="cart-items-list">';
        html += items.map((item) => renderCartItemHtml(item, 'drawer')).join('');
        html += '</ul>';
    }
    html += '</div>';

    if (!isEmpty) {
        html += '<div class="drawer-footer">';

        if (hasDiscount && discount) {
            html += '<div class="discount-active">';
            html += `<span>Code: <strong>${esc(discount.code)}</strong></span>`;
            html += `<span class="discount-active-pct">-${discount.percentage_discount}%</span>`;
            html += '<button class="discount-remove" onclick="SpaceISApp.removeDiscount()">Remove</button>';
            html += '</div>';
        } else {
            html += '<div class="discount-row">';
            html += '<input type="text" id="drawer-discount-input" placeholder="Discount code" onkeydown="if(event.key===\'Enter\')SpaceISApp.applyDrawerDiscount()">';
            html += '<button class="discount-apply" onclick="SpaceISApp.applyDrawerDiscount()">Apply</button>';
            html += '</div>';
        }

        html += '<div class="cart-summary-panel">';
        html += `<div class="cart-summary-header">Subtotal (${totalQuantity})</div>`;
        html += `<div class="cart-summary-row"><span>Subtotal</span><span>${fp(regularPrice)}</span></div>`;
        if (discountAmount > 0) {
            html += '<div class="cart-summary-row cart-summary-discount"><span>Discount';
            if (hasDiscount && discount) html += ` (${discount.percentage_discount}%)`;
            html += `</span><span>-${fp(discountAmount)}</span></div>`;
        }
        html += `<div class="cart-summary-total"><span>Total</span><span>${fp(finalPrice)}</span></div>`;
        html += '</div>';

        html += '<div class="cart-actions">';
        html += '<button class="cart-action-primary" onclick="SpaceISApp.closeDrawer();window.location.href=\'/checkout.php\'">Proceed to checkout <span style="margin-left:6px">&rarr;</span></button>';
        html += '<button class="cart-action-secondary" onclick="SpaceISApp.closeDrawer();window.location.href=\'/cart.php\'">View cart</button>';
        html += '</div>';

        html += '</div>';
    }

    drawer.innerHTML = html;
}

export function openDrawer() {
    drawerOpen = true;
    document.getElementById('cart-overlay').classList.add('open');
    document.getElementById('cart-drawer').classList.add('open');
    renderDrawer();
}

export function closeDrawer() {
    drawerOpen = false;
    document.getElementById('cart-overlay').classList.remove('open');
    document.getElementById('cart-drawer').classList.remove('open');
}

export function toggleDrawer() {
    if (drawerOpen) closeDrawer();
    else openDrawer();
}
