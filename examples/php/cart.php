<?php
/**
 * Cart page — client-side rendering via SDK IIFE.
 */

require_once __DIR__ . '/includes/spaceis-api.php';
require_once __DIR__ . '/includes/helpers.php';

$api = new SpaceISApi();

$pageTitle = 'Cart — SpaceIS Shop';
$metaDesc = 'View your shopping cart.';
$isShopPage = false;
require __DIR__ . '/includes/header.php';
?>

<div class="container cart-container" id="cart-page-root">
    <div style="display:flex;justify-content:center;padding:60px 0"><div class="spinner"></div></div>
</div>

<script>
window.renderCartPage = () => {
    const root = document.getElementById('cart-page-root');
    if (!root) return;

    const cart = SpaceISApp.cart;
    const fp = SpaceISApp.fp;
    const esc = SpaceISApp.esc;
    const items = cart.items;
    const totalQuantity = cart.totalQuantity;
    const finalPrice = cart.finalPrice;
    const regularPrice = cart.regularPrice;
    const hasDiscount = cart.hasDiscount;
    const discount = cart.discount;
    const isEmpty = cart.isEmpty;
    const isLoading = cart.isLoading;
    const discountAmount = regularPrice - finalPrice;

    // Skip render during mutations to avoid flicker
    if (isLoading && cart.cart) return;

    if (isLoading) {
        root.innerHTML = '<div style="display:flex;justify-content:center;padding:60px 0"><div class="spinner"></div></div>';
        return;
    }

    if (isEmpty) {
        root.innerHTML = '<div class="empty-state"><div class="icon">&#128722;</div><p>Your cart is empty.</p><br><a href="/index.php" class="back-link">&larr; Back to shop</a></div>';
        return;
    }

    // Incremental update if same items AND same discount
    const currentUuids = items.map((i) => i.variant?.uuid ?? '');
    const currentDiscountCode = discount ? discount.code : null;
    const existingEls = root.querySelectorAll('.cp-item');
    const existingUuids = Array.from(existingEls).map((el) => el.dataset.uuid || '');
    const prevDiscountEl = root.querySelector('.discount-active');
    const prevDiscountCode = prevDiscountEl ? 'active' : null;
    const sameItems = currentUuids.length === existingUuids.length &&
        currentUuids.every((uuid, i) => uuid === existingUuids[i]);
    const sameDiscount = (currentDiscountCode ? 'active' : null) === prevDiscountCode;

    if (sameItems && sameDiscount && existingEls.length > 0) {
        // Patch title
        const titleEl = root.querySelector('.cart-section-title');
        if (titleEl) titleEl.textContent = `Your cart (${totalQuantity})`;

        // Patch qty + prices per item
        items.forEach((item, i) => {
            const el = existingEls[i];
            const displayQty = SpaceIS.getItemQty(item);
            const qtyInput = el.querySelector('.qty-input');
            if (qtyInput && document.activeElement !== qtyInput) qtyInput.value = displayQty;
            const pricesEl = el.querySelector('.cp-item-prices');
            if (pricesEl) {
                let ph = `<span class="cp-item-price">${fp(item.final_price_value)}</span>`;
                if (item.regular_price_value !== item.final_price_value) {
                    ph += `<span class="cp-item-price-old">${fp(item.regular_price_value)}</span>`;
                }
                pricesEl.innerHTML = ph;
            }
        });

        // Patch summary
        const summaryHeader = root.querySelector('.cart-summary-header');
        if (summaryHeader) summaryHeader.textContent = `Subtotal (${totalQuantity})`;
        const summaryTotal = root.querySelector('.cart-summary-total span:last-child');
        if (summaryTotal) summaryTotal.textContent = fp(finalPrice);

        return;
    }

    // Full rebuild
    let html = `<h1 class="cart-section-title">Your cart (${totalQuantity})</h1>`;
    html += '<div class="cart-page-layout">';

    // Left: items
    html += '<div>';
    html += items.map((item) => SpaceISApp.renderCartItemHtml(item, 'cart-page')).join('');
    html += '</div>';

    // Right: sidebar
    html += '<div class="cart-page-sidebar">';

    // Discount
    if (hasDiscount && discount) {
        html += '<div class="discount-active">';
        html += `<span>Code: <strong>${esc(discount.code)}</strong></span>`;
        html += `<span class="discount-active-pct">-${discount.percentage_discount}%</span>`;
        html += '<button class="discount-remove" onclick="SpaceISApp.removeDiscount()">Remove</button>';
        html += '</div>';
    } else {
        html += '<div class="discount-row">';
        html += '<input type="text" id="cart-page-discount" placeholder="Discount code" onkeydown="if(event.key===\'Enter\')applyCartPageDiscount()">';
        html += '<button class="discount-apply" onclick="applyCartPageDiscount()">Apply</button>';
        html += '</div>';
    }

    // Summary
    html += '<div class="cart-page-summary">';
    html += `<div class="cart-summary-header">Subtotal (${totalQuantity})</div>`;
    html += `<div class="cart-summary-row"><span>Subtotal</span><span>${fp(regularPrice)}</span></div>`;
    if (discountAmount > 0) {
        html += '<div class="cart-summary-row cart-summary-discount"><span>Discount';
        if (hasDiscount && discount) html += ` (${discount.percentage_discount}%)`;
        html += `</span><span>-${fp(discountAmount)}</span></div>`;
    }
    html += `<div class="cart-summary-total"><span>Total</span><span>${fp(finalPrice)}</span></div>`;
    html += '</div>';

    // Actions
    html += '<div class="cart-page-actions">';
    html += '<a href="/checkout.php" class="cart-page-checkout-btn">Proceed to checkout</a>';
    html += '<a href="/index.php" class="cart-page-continue-btn">Continue shopping</a>';
    html += '</div>';

    html += '</div>';
    html += '</div>';

    root.innerHTML = html;
};

async function applyCartPageDiscount() {
    const input = document.getElementById('cart-page-discount');
    if (!input) return;
    const code = input.value.trim();
    if (!code) return;
    try {
        await SpaceISApp.cart.applyDiscount(code);
        input.value = '';
    } catch (err) {
        SpaceISApp.showToast(SpaceISApp.getErrorMessage(err) || 'Invalid code', 'error');
    }
}
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
