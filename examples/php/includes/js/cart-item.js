// cart-item.js — Shared cart-item HTML renderer for drawer, cart page, and checkout.

import { fp, esc, placeholderSvg } from './format.js';

/**
 * Extract common item data used by all three layouts.
 * @param {object} item - Cart item from SpaceIS CartManager
 */
function extractItemData(item) {
    return {
        variantUuid: item.variant?.uuid ?? '',
        imgSrc: window.SpaceIS.getCartItemImage(item),
        displayQty: window.SpaceIS.getItemQty(item),
        showVariant: !!(item.variant && item.shop_product && item.variant.name !== item.shop_product.name),
    };
}

/** SVG icons shared across layouts */
const ICON_REMOVE_SM = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const ICON_REMOVE_MD = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const ICON_MINUS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
const ICON_PLUS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';

/** Qty stepper HTML — identical across all three layouts */
function renderQtyStepper(variantUuid) {
    let h = '<div class="qty-stepper">';
    h += `<button class="qty-step-btn" onclick="SpaceISApp.decrementItem('${esc(variantUuid)}')">${ICON_MINUS}</button>`;
    h += `<input class="qty-input" type="text" inputmode="numeric" value="__QTY__" onblur="SpaceISApp.setItemQty('${esc(variantUuid)}',this.value,this)" onkeydown="if(event.key==='Enter')this.blur()">`;
    h += `<button class="qty-step-btn" onclick="SpaceISApp.incrementItem('${esc(variantUuid)}')">${ICON_PLUS}</button>`;
    h += '</div>';
    return h;
}

/**
 * Drawer layout — <li class="cart-item"> inside <ul class="cart-items-list">
 * CSS prefix: cart-item-*
 */
function renderDrawerItem(item) {
    const { variantUuid, imgSrc, displayQty, showVariant } = extractItemData(item);

    let h = '<li class="cart-item">';
    h += '<div class="cart-item-img-wrap">';
    if (imgSrc) {
        h += `<img class="cart-item-img" src="${esc(imgSrc)}" alt="">`;
    } else {
        h += `<div class="cart-item-img-placeholder">${placeholderSvg(24)}</div>`;
    }
    h += '</div>';

    h += '<div class="cart-item-details">';
    h += '<div class="cart-item-top">';
    h += '<div class="cart-item-info">';
    h += `<div class="cart-item-name">${esc(item.shop_product?.name ?? '')}</div>`;
    if (showVariant) {
        h += `<div class="cart-item-variant">${esc(item.variant.name)}</div>`;
    }
    if (item.package) {
        h += `<div class="cart-item-package">Package: ${esc(item.package.name)}</div>`;
    }
    h += '</div>';
    h += `<button class="cart-item-remove" aria-label="Remove" onclick="SpaceISApp.removeItem('${esc(variantUuid)}')">${ICON_REMOVE_MD}</button>`;
    h += '</div>';

    h += '<div class="cart-item-bottom">';
    h += '<div class="cart-item-prices">';
    h += `<span class="cart-item-price-current">${fp(item.final_price_value)}</span>`;
    if (item.regular_price_value !== item.final_price_value) {
        h += `<span class="cart-item-price-old">${fp(item.regular_price_value)}</span>`;
    }
    h += '</div>';
    h += renderQtyStepper(variantUuid).replace('__QTY__', displayQty);
    h += '</div>';
    h += '</div>';
    h += '</li>';
    return h;
}

/**
 * Cart page layout — <div class="cp-item" data-uuid="...">
 * CSS prefix: cp-item-*
 * Note: prices live inside cp-item-top (not in bottom), stepper is in bottom.
 */
function renderCartPageItem(item) {
    const { variantUuid, imgSrc, displayQty, showVariant } = extractItemData(item);

    let h = `<div class="cp-item" data-uuid="${esc(variantUuid)}">`;
    h += '<div class="cp-item-img-wrap">';
    if (imgSrc) {
        h += `<img class="cp-item-img" src="${esc(imgSrc)}" alt="">`;
    } else {
        h += `<div class="cp-item-img cp-item-img-ph">${placeholderSvg(28)}</div>`;
    }
    h += '</div>';

    h += '<div class="cp-item-body">';
    h += '<div class="cp-item-top">';
    h += '<div class="cp-item-info">';
    h += `<div class="cp-item-name">${esc(item.shop_product?.name ?? '')}</div>`;
    if (showVariant) {
        h += `<div class="cp-item-variant">${esc(item.variant.name)}</div>`;
    }
    if (item.package) {
        h += `<div class="cp-item-package">Package: ${esc(item.package.name)}</div>`;
    }
    h += '<div class="cp-item-prices">';
    h += `<span class="cp-item-price">${fp(item.final_price_value)}</span>`;
    if (item.regular_price_value !== item.final_price_value) {
        h += `<span class="cp-item-price-old">${fp(item.regular_price_value)}</span>`;
    }
    h += '</div>';
    h += '</div>';
    h += `<button class="cp-item-remove" aria-label="Remove" onclick="SpaceISApp.removeItem('${esc(variantUuid)}')">${ICON_REMOVE_MD}</button>`;
    h += '</div>';

    h += '<div class="cp-item-bottom">';
    h += renderQtyStepper(variantUuid).replace('__QTY__', displayQty);
    h += '</div>';
    h += '</div>';
    h += '</div>';
    return h;
}

/**
 * Checkout layout — <div class="checkout-item">
 * CSS prefix: checkout-item-*
 * Note: no img wrapper div, remove icon is smaller (14px, stroke-width 2),
 * old price class is checkout-item-old-price (not -price-old).
 */
function renderCheckoutItem(item) {
    const { variantUuid, imgSrc, displayQty, showVariant } = extractItemData(item);

    let h = '<div class="checkout-item">';
    if (imgSrc) {
        h += `<img class="checkout-item-img" src="${esc(imgSrc)}" alt="">`;
    } else {
        h += `<div class="checkout-item-img-placeholder">${placeholderSvg(18)}</div>`;
    }

    h += '<div class="checkout-item-details">';
    h += '<div class="checkout-item-top">';
    h += '<div class="checkout-item-info">';
    h += `<div class="checkout-item-name">${esc(item.shop_product?.name ?? '')}</div>`;
    if (showVariant) {
        h += `<div class="checkout-item-variant">${esc(item.variant.name)}</div>`;
    }
    if (item.package) {
        h += `<div class="checkout-item-package">Package: ${esc(item.package.name)}</div>`;
    }
    h += '</div>';
    h += `<button class="checkout-item-remove" aria-label="Remove" onclick="SpaceISApp.removeItem('${esc(variantUuid)}')">${ICON_REMOVE_SM}</button>`;
    h += '</div>';

    h += '<div class="checkout-item-bottom">';
    h += '<div class="checkout-item-prices">';
    h += `<span class="checkout-item-price">${fp(item.final_price_value)}</span>`;
    if (item.regular_price_value !== item.final_price_value) {
        h += `<span class="checkout-item-old-price">${fp(item.regular_price_value)}</span>`;
    }
    h += '</div>';
    h += renderQtyStepper(variantUuid).replace('__QTY__', displayQty);
    h += '</div>';
    h += '</div>';
    h += '</div>';
    return h;
}

/**
 * Render a single cart item HTML string for a given layout.
 *
 * @param {object} item - Cart item from SpaceIS CartManager
 * @param {'drawer'|'cart-page'|'checkout'} layout - Target surface
 * @returns {string} HTML string
 *
 * @example
 * items.map((item) => renderCartItemHtml(item, 'drawer')).join('')
 */
export function renderCartItemHtml(item, layout) {
    switch (layout) {
        case 'drawer': return renderDrawerItem(item);
        case 'cart-page': return renderCartPageItem(item);
        case 'checkout': return renderCheckoutItem(item);
        default: return '';
    }
}
