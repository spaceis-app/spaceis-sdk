<?php
/**
 * Packages page — SSR: categories + packages grid + community section.
 */

require_once __DIR__ . '/includes/spaceis-api.php';
require_once __DIR__ . '/includes/helpers.php';

$api = new SpaceISApi();

$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
$categoryUuid = $_GET['category_uuid'] ?? null;

$params = ['page' => $page];
if ($categoryUuid) $params['category_uuid'] = $categoryUuid;

$packagesData = $api->getPackages($params);
$packages = $packagesData['data'] ?? [];
$meta = $packagesData['meta'] ?? [];

$categories = $api->getCategories();
$activeCategories = array_filter($categories, fn($c) => !empty($c['is_active']));

// Community data
$topCustomers = $api->getTopCustomers(['limit' => 10, 'sort' => '-total_spent']);
$latestOrders = $api->getLatestOrders(['limit' => 10, 'sort' => '-completed_at']);
$goalsData = $api->getGoals(['per_page' => 10]);
$goals = $goalsData['data'] ?? [];

$pageTitle = 'Packages — SpaceIS Shop';
$metaDesc = 'Browse packages in our store.';
$isShopPage = true;
require __DIR__ . '/includes/header.php';
?>

<div class="container">
    <section class="section">
        <!-- Category filters -->
        <div class="categories">
            <a href="/packages.php" class="cat-btn <?= !$categoryUuid ? 'active' : '' ?>">All</a>
            <?php foreach ($activeCategories as $cat): ?>
                <a href="/packages.php?category_uuid=<?= e($cat['uuid']) ?>"
                   class="cat-btn <?= $categoryUuid === $cat['uuid'] ? 'active' : '' ?>">
                    <?= e($cat['name']) ?>
                </a>
            <?php endforeach; ?>
        </div>

        <!-- Subcategories -->
        <?php
            $selectedParent = null;
            if ($categoryUuid) {
                foreach ($activeCategories as $cat) {
                    if ($cat['uuid'] === $categoryUuid) { $selectedParent = $cat; break; }
                    foreach ($cat['children'] ?? [] as $child) {
                        if ($child['uuid'] === $categoryUuid) { $selectedParent = $cat; break 2; }
                    }
                }
            }
            $activeChildren = [];
            if ($selectedParent) {
                $activeChildren = array_filter($selectedParent['children'] ?? [], fn($c) => !empty($c['is_active']));
            }
        ?>
        <?php if (!empty($activeChildren)): ?>
            <div class="categories subcategories">
                <a href="/packages.php?category_uuid=<?= e($selectedParent['uuid']) ?>"
                   class="cat-btn cat-child <?= $categoryUuid === $selectedParent['uuid'] ? 'active' : '' ?>">All</a>
                <?php foreach ($activeChildren as $child): ?>
                    <a href="/packages.php?category_uuid=<?= e($child['uuid']) ?>"
                       class="cat-btn cat-child <?= $categoryUuid === $child['uuid'] ? 'active' : '' ?>">
                        <?= e($child['name']) ?>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <!-- Packages grid -->
        <?php if (empty($packages)): ?>
            <div class="empty-state">
                <p>No packages available.</p>
            </div>
        <?php else: ?>
            <div class="products-grid">
                <?php foreach ($packages as $idx => $pkg): ?>
                    <?php
                        $shopProduct = $pkg['shop_product'] ?? [];
                        $priceField = $pkg['minimal_price'] ?? 0;
                        $percentDiscount = $pkg['percentage_discount'] ?? 0;
                        $delay = $idx * 0.04;
                    ?>
                    <a href="/product.php?slug=<?= e($shopProduct['slug'] ?? '') ?>"
                       class="product-card"
                       style="animation-delay: <?= $delay ?>s; text-decoration: none;">
                        <div class="product-img-wrap">
                            <?php if (!empty($shopProduct['image'])): ?>
                                <img class="product-img" src="<?= e($shopProduct['image']) ?>" alt="<?= e($shopProduct['name'] ?? '') ?>" loading="lazy">
                            <?php else: ?>
                                <div class="product-img-placeholder"><?= placeholderSvg(32) ?></div>
                            <?php endif; ?>
                            <?php if ($percentDiscount): ?>
                                <div class="product-discount-badge">-<?= (int) $percentDiscount ?>%</div>
                            <?php endif; ?>
                        </div>
                        <div class="product-body">
                            <div class="product-name"><?= e($shopProduct['name'] ?? '') ?></div>
                            <div class="product-footer">
                                <div>
                                    <span class="product-price"><?= fp($priceField) ?></span>
                                </div>
                                <span class="view-btn">View</span>
                            </div>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <!-- Pagination -->
        <?php if (!empty($meta) && ($meta['last_page'] ?? 1) > 1): ?>
            <div class="pagination">
                <?php if ($meta['current_page'] > 1): ?>
                    <a href="?page=<?= $meta['current_page'] - 1 ?><?= $categoryUuid ? '&category_uuid=' . e($categoryUuid) : '' ?>"
                       class="page-btn">&larr; Previous</a>
                <?php else: ?>
                    <button class="page-btn" disabled>&larr; Previous</button>
                <?php endif; ?>

                <span class="page-info"><?= $meta['current_page'] ?> / <?= $meta['last_page'] ?></span>

                <?php if ($meta['current_page'] < $meta['last_page']): ?>
                    <a href="?page=<?= $meta['current_page'] + 1 ?><?= $categoryUuid ? '&category_uuid=' . e($categoryUuid) : '' ?>"
                       class="page-btn">Next &rarr;</a>
                <?php else: ?>
                    <button class="page-btn" disabled>Next &rarr;</button>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </section>

    <?php require __DIR__ . '/includes/community.php'; ?>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
