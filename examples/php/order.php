<?php
/**
 * Order summary lookup — client-side form + order display.
 */

require_once __DIR__ . '/includes/spaceis-api.php';
require_once __DIR__ . '/includes/helpers.php';

$api = new SpaceISApi();

$codeFromUrl = $_GET['code'] ?? '';

$pageTitle = 'Order Summary — SpaceIS Shop';
$metaDesc = 'Check the status of your order.';
$isShopPage = false;
require __DIR__ . '/includes/header.php';
?>

<div class="order-wrapper" id="order-root">
    <!-- Code input card -->
    <div class="order-card">
        <div class="order-card-title">Check order</div>
        <p style="color: var(--txt-3); font-size: 13px; margin-bottom: 16px;">
            Enter an order code to view its status and details.
        </p>
        <div class="order-input-row">
            <input type="text" id="order-code-input" placeholder="e.g. ABC123DEF" autocomplete="off"
                   value="<?= e($codeFromUrl) ?>"
                   onkeydown="if(event.key==='Enter')lookupOrder()">
            <button id="order-lookup-btn" onclick="lookupOrder()">Check</button>
        </div>
    </div>

    <div id="order-details"></div>
</div>

<script>
(() => {
    const statusLabels = {
        pending: 'Pending',
        completed: 'Completed',
        cancelled: 'Cancelled'
    };

    async function lookupOrder() {
        const input = document.getElementById('order-code-input');
        const btn = document.getElementById('order-lookup-btn');
        const details = document.getElementById('order-details');
        const code = input.value.trim();

        if (!code) { SpaceISApp.showToast('Enter order code','error'); return; }

        btn.disabled = true;
        btn.textContent = '...';
        details.innerHTML = '';

        try {
            const order = await SpaceISApp.client.orders.summary(code);
            renderOrder(order, details);
        } catch (err) {
            SpaceISApp.showToast(SpaceISApp.getErrorMessage(err), 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Check';
        }
    }

    function renderOrder(order, container) {
        const fp = SpaceISApp.fp;
        const esc = SpaceISApp.esc;
        const status = order.status || 'pending';
        const statusLabel = statusLabels[status] || status;
        let html = '';

        // Status alert
        html += `<div class="order-alert order-alert-${status}">`;
        html += '<div class="order-alert-top">';
        html += `<span class="order-alert-label">${esc(statusLabel)}</span>`;
        if (order.code) {
            html += `<span class="order-alert-code">${esc(order.code)}</span>`;
        }
        html += '</div></div>';

        // Items
        html += '<div class="order-card"><div class="order-card-title">Order items</div>';
        (order.items || []).forEach((item) => {
            html += '<div class="order-item">';
            if (item.image) {
                html += `<img class="order-item-img" src="${esc(item.image)}" alt="">`;
            }
            html += '<div class="order-item-info">';
            html += `<div class="order-item-name">${esc(item.title)}</div>`;
            if (item.subtitle) {
                html += `<div class="order-item-qty">${esc(item.subtitle)}</div>`;
            }
            html += `<div class="order-item-qty">Quantity: ${SpaceIS.fromApiQty(item.quantity || 0)}</div>`;
            html += '</div>';
            html += `<div class="order-item-price">${fp(item.final_price)}</div>`;
            html += '</div>';
        });
        html += '</div>';

        // Summary
        html += '<div class="order-card"><div class="order-card-title">Summary</div>';

        if (order.regular_total_price !== order.final_total_price) {
            html += `<div class="order-total-row"><span>Regular price</span><span style="text-decoration:line-through">${fp(order.regular_total_price)}</span></div>`;
        }
        if (order.discount?.totalDiscountedValue > 0) {
            html += `<div class="order-total-row discount"><span>Discount${order.discount.code ? ` (${esc(order.discount.code)})` : ''}</span><span>-${fp(order.discount.totalDiscountedValue)}</span></div>`;
        }
        if (order.sale?.totalDiscountedValue > 0) {
            html += `<div class="order-total-row discount"><span>Sale</span><span>-${fp(order.sale.totalDiscountedValue)}</span></div>`;
        }
        if (order.package_included?.totalDiscountedValue > 0) {
            html += `<div class="order-total-row discount"><span>Package discount</span><span>-${fp(order.package_included.totalDiscountedValue)}</span></div>`;
        }
        html += `<div class="order-total-row final"><span>Total</span><span>${fp(order.final_total_price)}</span></div>`;
        html += '</div>';

        html += '<a href="/index.php" class="back-link">&larr; Back to shop</a>';

        container.innerHTML = html;
    }

    window.lookupOrder = lookupOrder;

    // Auto-lookup if code in URL
    const urlCode = '<?= e($codeFromUrl) ?>';
    if (urlCode) {
        lookupOrder();
    }
})();
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
