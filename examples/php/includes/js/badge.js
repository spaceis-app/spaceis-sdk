// badge.js — Cart badge counter update.

let _cart;

export function initBadge(cart) {
    _cart = cart;
}

export function updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const qty = _cart.totalQuantity;
    if (qty > 0) {
        badge.textContent = qty;
        badge.className = 'cart-badge-dot visible';
    } else {
        badge.textContent = '';
        badge.className = 'cart-badge-dot';
    }
}
