<?php
/**
 * Sales page — SSR: active sales + community section.
 */

require_once __DIR__ . '/includes/spaceis-api.php';
require_once __DIR__ . '/includes/helpers.php';

$api = new SpaceISApi();

$salesData = $api->getSales(['sort' => 'expires_at']);
$sales = $salesData['data'] ?? [];

// Community data
$topCustomers = $api->getTopCustomers(['limit' => 10, 'sort' => '-total_spent']);
$latestOrders = $api->getLatestOrders(['limit' => 10, 'sort' => '-completed_at']);
$goalsData = $api->getGoals(['per_page' => 10]);
$goals = $goalsData['data'] ?? [];

$pageTitle = 'Sales — SpaceIS Shop';
$metaDesc = 'Active sales and promotions in our store.';
$isShopPage = true;
require __DIR__ . '/includes/header.php';
?>

<div class="container">
    <section class="section">
        <h1 class="page-heading">Sales</h1>

        <?php if (empty($sales)): ?>
            <div class="empty-state">
                <p>No active sales right now.</p>
            </div>
        <?php else: ?>
            <div class="products-grid">
                <?php foreach ($sales as $idx => $sale): ?>
                    <?php
                        $delay = $idx * 0.04;
                        $endsAt = $sale['expires_at'] ?? ($sale['ends_at'] ?? '');
                    ?>
                    <a href="/index.php?sale=<?= e($sale['slug'] ?? $sale['uuid'] ?? '') ?>"
                       class="product-card"
                       style="animation-delay: <?= $delay ?>s; cursor: pointer; text-decoration: none;">
                        <div class="product-img-wrap">
                            <?php if (!empty($sale['image'])): ?>
                                <img class="product-img" src="<?= e($sale['image']) ?>" alt="<?= e($sale['name'] ?? '') ?>" loading="lazy">
                            <?php else: ?>
                                <div class="product-img-placeholder"><?= placeholderSvg(32) ?></div>
                            <?php endif; ?>
                            <?php if (!empty($sale['percentage_discount'])): ?>
                                <div class="product-discount-badge">-<?= (int) $sale['percentage_discount'] ?>%</div>
                            <?php endif; ?>
                        </div>
                        <div class="product-body">
                            <div class="product-name"><?= e($sale['name'] ?? '') ?></div>
                            <div class="product-footer">
                                <div>
                                    <?php if (!empty($sale['percentage_discount'])): ?>
                                        <span class="product-price" style="color: var(--red)">-<?= (int) $sale['percentage_discount'] ?>%</span>
                                    <?php endif; ?>
                                </div>
                                <span class="view-btn">View</span>
                            </div>
                            <?php if ($endsAt): ?>
                                <div class="sale-timer" data-ends="<?= e($endsAt) ?>"></div>
                            <?php endif; ?>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </section>

    <?php require __DIR__ . '/includes/community.php'; ?>
</div>

<script>
// Sale countdown timers
(function() {
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function updateTimers() {
        document.querySelectorAll('.sale-timer[data-ends]').forEach(function(el) {
            var ends = el.getAttribute('data-ends');
            var diff = new Date(ends).getTime() - Date.now();
            if (diff <= 0) {
                el.textContent = 'Ended';
                return;
            }
            var d = Math.floor(diff / 86400000);
            var h = Math.floor((diff % 86400000) / 3600000);
            var m = Math.floor((diff % 3600000) / 60000);
            var s = Math.floor((diff % 60000) / 1000);
            var parts = [];
            if (d > 0) parts.push(d + 'd');
            parts.push(pad(h) + ':' + pad(m) + ':' + pad(s));
            el.textContent = parts.join(' ') + ' left';
        });
    }
    updateTimers();
    setInterval(updateTimers, 1000);
})();
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
