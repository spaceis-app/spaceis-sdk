// app.js — Entry point: SDK init, module wiring, SpaceISApp global, spaceis:ready.

import { fp, esc, getErrorMessage, placeholderSvg } from './format.js';
import { showToast } from './toast.js';
import { toggleMobileMenu, closeMobileMenu } from './mobile-menu.js';
import { updateBadge, initBadge } from './badge.js';
import {
    initCartOps, addToCart, removeItem, incrementItem, decrementItem,
    applyDrawerDiscount, removeDiscount, setItemQty,
} from './cart-ops.js';
import {
    initCartDrawer, renderDrawer, openDrawer, closeDrawer, toggleDrawer,
} from './cart-drawer.js';
import { renderCartItemHtml } from './cart-item.js';

const configEl = document.getElementById('spaceis-config');
const config = configEl ? JSON.parse(configEl.textContent) : {};

const client = window.SpaceIS.createSpaceIS({ baseUrl: config.baseUrl, shopUuid: config.shopUuid });
const cart = client.createCartManager({ autoLoad: true });

initCartOps(client, cart);
initCartDrawer(cart);
initBadge(cart);

window.SpaceISApp = {
    client, cart,
    fp, esc, getErrorMessage, placeholderSvg,
    showToast,
    toggleDrawer, openDrawer, closeDrawer,
    toggleMobileMenu, closeMobileMenu,
    addToCart, removeItem, incrementItem, decrementItem,
    applyDrawerDiscount, removeDiscount, setItemQty,
    renderCartItemHtml,
};

// Subscribe after SpaceISApp is set (P-04 fix)
cart.onChange(() => {
    updateBadge();
    renderDrawer();
    if (typeof window.renderCartPage === 'function') window.renderCartPage();
    if (typeof window.renderCheckoutPage === 'function') window.renderCheckoutPage();
});

// Initial render in case autoLoad fired before subscription
updateBadge();
renderDrawer();

window.dispatchEvent(new CustomEvent('spaceis:ready', { detail: { client, cart } }));
