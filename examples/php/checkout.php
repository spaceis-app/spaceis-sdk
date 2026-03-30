<?php
/**
 * Checkout page — SSR payment methods + agreements, client-side cart + form.
 */

require_once __DIR__ . '/includes/spaceis-api.php';
require_once __DIR__ . '/includes/helpers.php';

$api = new SpaceISApi();

// SSR: fetch payment methods and agreements
$paymentMethods = $api->getPaymentMethods();
$agreements = $api->getAgreements();

$pageTitle = 'Checkout — SpaceIS Shop';
$metaDesc = 'Complete your purchase.';
$isShopPage = false;
require __DIR__ . '/includes/header.php';
?>

<div class="container" id="checkout-root">
    <div style="display:flex;justify-content:center;padding:60px 0"><div class="spinner"></div></div>
</div>

<script>
(() => {
    const paymentMethods = <?= json_encode($paymentMethods, JSON_UNESCAPED_UNICODE) ?>;
    const agreements = <?= json_encode($agreements, JSON_UNESCAPED_UNICODE) ?>;
    let selectedMethodUuid = paymentMethods.length > 0 ? paymentMethods[0].uuid : null;
    const checkedAgreements = {};
    let nick = '';
    let email = '';
    let discountCode = '';
    let placing = false;

    const render = () => {
        const root = document.getElementById('checkout-root');
        if (!root) return;

        const cart = SpaceISApp.cart;
        const fp = SpaceISApp.fp;
        const esc = SpaceISApp.esc;
        const placeholderSvg = SpaceISApp.placeholderSvg;
        const items = cart.items;
        const totalQuantity = cart.totalQuantity;
        const finalPrice = cart.finalPrice;
        const regularPrice = cart.regularPrice;
        const hasDiscount = cart.hasDiscount;
        const discount = cart.discount;
        const isEmpty = cart.isEmpty;
        const isLoading = cart.isLoading;
        const discountAmount = regularPrice - finalPrice;

        if (isEmpty) {
            root.innerHTML = '<div class="empty-state"><div class="icon">&#128722;</div><p>Your cart is empty.</p><br><a href="/index.php" class="back-link">&larr; Back to shop</a></div>';
            return;
        }

        let selectedMethod = null;
        for (let i = 0; i < paymentMethods.length; i++) {
            if (paymentMethods[i].uuid === selectedMethodUuid) {
                selectedMethod = paymentMethods[i];
                break;
            }
        }
        const commission = selectedMethod?.commission || 0;
        const commissionAmount = commission > 0 ? Math.round((finalPrice * commission) / 100) : 0;
        const totalWithCommission = finalPrice + commissionAmount;

        let html = '<div class="checkout-layout">';

        // Left: Order summary
        html += '<div>';
        html += '<h1 class="section-title">Order summary</h1>';

        // Cart items
        html += '<div>';
        items.forEach((item) => {
            const variantUuid = item.variant?.uuid ?? '';
            const imgSrc = SpaceIS.getCartItemImage(item);
            const qty = SpaceIS.getItemQty(item);
            const showVariant = item.variant && item.shop_product && item.variant.name !== item.shop_product.name;

            html += '<div class="checkout-item">';
            if (imgSrc) {
                html += `<img class="checkout-item-img" src="${esc(imgSrc)}" alt="">`;
            } else {
                html += `<div class="checkout-item-img-placeholder">${placeholderSvg(18)}</div>`;
            }
            html += '<div class="checkout-item-details">';
            html += '<div class="checkout-item-top">';
            html += '<div class="checkout-item-info">';
            html += `<div class="checkout-item-name">${esc(item.shop_product?.name ?? '')}</div>`;
            if (showVariant) {
                html += `<div class="checkout-item-variant">${esc(item.variant.name)}</div>`;
            }
            if (item.package) {
                html += `<div class="checkout-item-package">Package: ${esc(item.package.name)}</div>`;
            }
            html += '</div>';
            html += `<button class="checkout-item-remove" aria-label="Remove" onclick="SpaceISApp.removeItem('${esc(variantUuid)}')">`;
            html += '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
            html += '</button>';
            html += '</div>';

            html += '<div class="checkout-item-bottom">';
            html += '<div class="checkout-item-prices">';
            html += `<span class="checkout-item-price">${fp(item.final_price_value)}</span>`;
            if (item.regular_price_value !== item.final_price_value) {
                html += `<span class="checkout-item-old-price">${fp(item.regular_price_value)}</span>`;
            }
            html += '</div>';
            html += '<div class="qty-stepper">';
            html += `<button class="qty-step-btn" onclick="SpaceISApp.decrementItem('${esc(variantUuid)}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>`;
            html += `<input class="qty-input" type="text" inputmode="numeric" value="${qty}" onblur="SpaceISApp.setItemQty('${esc(variantUuid)}',this.value,this)" onkeydown="if(event.key==='Enter')this.blur()">`;
            html += `<button class="qty-step-btn" onclick="SpaceISApp.incrementItem('${esc(variantUuid)}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>`;
            html += '</div>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';

        // Discount
        html += '<div class="checkout-card">';
        html += '<div class="checkout-card-title">Discount code</div>';
        if (hasDiscount && discount) {
            html += '<div class="discount-active">';
            html += `<span>Code: <strong>${esc(discount.code)}</strong></span>`;
            html += `<span class="discount-active-pct">-${discount.percentage_discount}%</span>`;
            html += '<button class="discount-remove" onclick="SpaceISApp.removeDiscount()">Remove</button>';
            html += '</div>';
        } else {
            html += '<div class="discount-row">';
            html += `<input type="text" id="checkout-discount" placeholder="Discount code" value="${esc(discountCode)}" oninput="checkoutState.discountCode=this.value" onkeydown="if(event.key==='Enter')applyCheckoutDiscount()">`;
            html += '<button class="discount-apply" onclick="applyCheckoutDiscount()">Apply</button>';
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';

        // Right: Form
        html += '<div class="checkout-form-col">';
        html += '<h1 class="section-title">Transaction details</h1>';

        // Contact
        html += '<div class="checkout-card">';
        html += '<div class="form-grid">';
        html += '<div class="form-field">';
        html += '<label class="form-label" for="checkout-nick">Minecraft username</label>';
        html += `<input type="text" id="checkout-nick" placeholder="Steve" autocomplete="nickname" value="${esc(nick)}" oninput="checkoutState.nick=this.value">`;
        html += '</div>';
        html += '<div class="form-field">';
        html += '<label class="form-label" for="checkout-email">Email</label>';
        html += `<input type="email" id="checkout-email" placeholder="you@email.com" autocomplete="email" value="${esc(email)}" oninput="checkoutState.email=this.value">`;
        html += '</div>';
        html += '</div>';
        html += '</div>';

        // Payment methods
        html += '<div class="checkout-card">';
        html += '<div class="checkout-card-title">Payment method</div>';
        html += '<div class="payment-methods">';
        if (paymentMethods.length === 0) {
            html += '<p style="color:var(--txt-3);font-size:13px">No payment methods available.</p>';
        } else {
            paymentMethods.forEach((m) => {
                const sel = selectedMethodUuid === m.uuid;
                html += `<label class="payment-method ${sel ? 'selected' : ''}" onclick="checkoutState.selectMethod('${esc(m.uuid)}')">`;
                html += `<input type="radio" name="payment_method" value="${esc(m.uuid)}"${sel ? ' checked' : ''}>`;
                html += `<span class="payment-method-name">${esc(m.name)}</span>`;
                if (m.commission) {
                    html += `<span class="payment-commission">(+${m.commission}%)</span>`;
                }
                html += '</label>';
            });
        }
        html += '</div>';
        html += '</div>';

        // Agreements
        if (agreements.length > 0) {
            html += '<div style="margin-bottom:16px"><div class="agreements">';
            agreements.forEach((a) => {
                const checked = !!checkedAgreements[a.uuid];
                html += '<label class="agreement-item">';
                html += `<input type="checkbox"${checked ? ' checked' : ''} onchange="checkoutState.toggleAgreement('${esc(a.uuid)}', this.checked)">`;
                html += `<span>${esc(a.name)}</span>`;
                html += '</label>';
            });
            html += '</div></div>';
        }

        // Price summary
        html += '<div class="cart-page-summary">';
        html += '<div class="cart-summary-header">Order summary</div>';
        html += `<div class="cart-summary-row"><span>Subtotal</span><span>${fp(regularPrice)}</span></div>`;
        if (discountAmount > 0) {
            html += '<div class="cart-summary-row cart-summary-discount"><span>Discount';
            if (hasDiscount && discount) html += ` (${discount.percentage_discount}%)`;
            html += `</span><span>-${fp(discountAmount)}</span></div>`;
        }
        if (commission > 0 && selectedMethod) {
            html += `<div class="cart-summary-row"><span>Fee (${esc(selectedMethod.name)} +${commission}%)</span><span>+${fp(commissionAmount)}</span></div>`;
        }
        html += `<div class="cart-summary-total"><span>Total</span><span>${fp(totalWithCommission)}</span></div>`;
        html += '</div>';

        // Place order button
        html += `<button class="place-order-btn" id="place-order-btn"${placing ? ' disabled' : ''} onclick="checkoutState.placeOrder()">`;
        html += placing ? 'Processing...' : `Place order ${fp(totalWithCommission)}`;
        html += '</button>';

        html += '</div>';
        html += '</div>';

        root.innerHTML = html;
    };

    window.renderCheckoutPage = render;

    window.checkoutState = {
        get nick() { return nick; },
        set nick(v) { nick = v; },
        get email() { return email; },
        set email(v) { email = v; },
        get discountCode() { return discountCode; },
        set discountCode(v) { discountCode = v; },
        selectMethod: (uuid) => {
            selectedMethodUuid = uuid;
            render();
        },
        toggleAgreement: (uuid, checked) => {
            if (checked) checkedAgreements[uuid] = true;
            else delete checkedAgreements[uuid];
        },
        placeOrder: async () => {
            // Read current values from inputs
            const nickInput = document.getElementById('checkout-nick');
            const emailInput = document.getElementById('checkout-email');
            if (nickInput) nick = nickInput.value;
            if (emailInput) email = emailInput.value;

            const errors = [];
            if (!nick.trim()) errors.push('Player nickname is required');
            if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.push('Enter a valid email');
            if (!selectedMethodUuid) errors.push('Choose payment method');

            if (errors.length > 0) {
                errors.forEach((e) => { SpaceISApp.showToast(e, 'error'); });
                return;
            }

            placing = true;
            render();

            const client = SpaceISApp.client;
            const agreementUuids = Object.keys(checkedAgreements);

            try {
                // Execute recaptcha, then place order
                let token;
                try {
                    token = await client.recaptcha.execute('checkout');
                } catch {
                    token = '';
                }

                const result = await client.checkout.placeOrder({
                    email: email.trim(),
                    first_name: nick.trim(),
                    payment_method_uuid: selectedMethodUuid,
                    'g-recaptcha-response': token || '',
                    agreements: agreementUuids,
                });

                if (result.redirect_url) {
                    window.location.href = result.redirect_url;
                }
            } catch (err) {
                SpaceISApp.showToast(SpaceISApp.getErrorMessage(err), 'error');
                placing = false;
                render();
            }
        }
    };

    window.applyCheckoutDiscount = async () => {
        const input = document.getElementById('checkout-discount');
        if (!input) return;
        const code = input.value.trim();
        if (!code) return;
        try {
            await SpaceISApp.cart.applyDiscount(code);
            SpaceISApp.showToast('Discount applied!', 'success');
            discountCode = '';
        } catch (err) {
            SpaceISApp.showToast(SpaceISApp.getErrorMessage(err) || 'Invalid code', 'error');
        }
    };

    // render() will be called by footer.php's onChange callback
})();
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
