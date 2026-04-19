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
    const returnUrl = <?= json_encode(filter_var(getenv("RETURN_URL") ?: "", FILTER_VALIDATE_URL) ?: "") ?>;
    const cancelUrl = <?= json_encode(filter_var(getenv("CANCEL_URL") ?: "", FILTER_VALIDATE_URL) ?: "") ?>;
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
        // commission is a multiplier (e.g. 1.2 = 20% surcharge), not a percentage integer
        const commissionAmount = commission > 1 ? Math.round(finalPrice * commission - finalPrice) : 0;
        const totalWithCommission = finalPrice + commissionAmount;

        let html = '<div class="checkout-layout">';

        // Left: Order summary
        html += '<div>';
        html += '<h1 class="section-title">Order summary</h1>';

        // Cart items
        html += '<div>';
        html += items.map((item) => SpaceISApp.renderCartItemHtml(item, 'checkout')).join('');
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
                if (m.commission > 1) {
                    const pct = Math.round((m.commission - 1) * 100);
                    html += `<span class="payment-commission">(+${pct}%)</span>`;
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
        if (commission > 1 && selectedMethod) {
            const pct = Math.round((commission - 1) * 100);
            html += `<div class="cart-summary-row"><span>Fee (${esc(selectedMethod.name)} +${pct}%)</span><span>+${fp(commissionAmount)}</span></div>`;
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
                    return_url: returnUrl || undefined,
                    cancel_url: cancelUrl || undefined,
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
