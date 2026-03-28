<?php
/**
 * Products page — SSR: categories + products grid + community section.
 */

require_once __DIR__ . '/includes/spaceis-api.php';
require_once __DIR__ . '/includes/helpers.php';

$api = new SpaceISApi();

// ── Fetch data ──
$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
$categoryUuid = $_GET['category_uuid'] ?? null;
$saleSlug = $_GET['sale'] ?? null;

$params = ['page' => $page];
if ($categoryUuid) $params['category_uuid'] = $categoryUuid;
if ($saleSlug) $params['sale_slug'] = $saleSlug;

$productsData = $api->getProducts($params);
$products = $productsData['data'] ?? [];
$meta = $productsData['meta'] ?? [];

$categories = $api->getCategories();
$activeCategories = array_filter($categories, fn($c) => !empty($c['is_active']));

// Community data
$topCustomers = $api->getTopCustomers(['limit' => 10, 'sort' => '-total_spent']);
$latestOrders = $api->getLatestOrders(['limit' => 10, 'sort' => '-completed_at']);
$goalsData = $api->getGoals(['per_page' => 10]);
$goals = $goalsData['data'] ?? [];

// ── Render ──
$pageTitle = 'Products — SpaceIS Shop';
$metaDesc = 'Browse products in our store.';
$isShopPage = true;
require __DIR__ . '/includes/header.php';
?>

<div class="container">
    <section class="section">
        <!-- Category filters -->
        <div class="categories">
            <a href="/index.php" class="cat-btn <?= !$categoryUuid ? 'active' : '' ?>">All</a>
            <?php foreach ($activeCategories as $cat): ?>
                <a href="/index.php?category_uuid=<?= e($cat['uuid']) ?>"
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
                    // Check if it's a child
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
                <a href="/index.php?category_uuid=<?= e($selectedParent['uuid']) ?>"
                   class="cat-btn cat-child <?= $categoryUuid === $selectedParent['uuid'] ? 'active' : '' ?>">All</a>
                <?php foreach ($activeChildren as $child): ?>
                    <a href="/index.php?category_uuid=<?= e($child['uuid']) ?>"
                       class="cat-btn cat-child <?= $categoryUuid === $child['uuid'] ? 'active' : '' ?>">
                        <?= e($child['name']) ?>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <!-- Products grid -->
        <?php if (empty($products)): ?>
            <div class="empty-state">
                <p>No products in this category.</p>
            </div>
        <?php else: ?>
            <div class="products-grid">
                <?php foreach ($products as $idx => $product): ?>
                    <?php
                        $priceField = $product['minimal_price'] ?? 0;
                        $delay = $idx * 0.04;
                    ?>
                    <a href="/product.php?slug=<?= e($product['slug']) ?>"
                       class="product-card"
                       style="animation-delay: <?= $delay ?>s; text-decoration: none;">
                        <div class="product-img-wrap">
                            <?php if (!empty($product['image'])): ?>
                                <img class="product-img" src="<?= e($product['image']) ?>" alt="<?= e($product['name']) ?>" loading="lazy">
                            <?php else: ?>
                                <div class="product-img-placeholder"><?= placeholderSvg(32) ?></div>
                            <?php endif; ?>
                            <?php if (!empty($product['percentage_discount'])): ?>
                                <div class="product-discount-badge">-<?= (int) $product['percentage_discount'] ?>%</div>
                            <?php endif; ?>
                        </div>
                        <div class="product-body">
                            <div class="product-name"><?= e($product['name']) ?></div>
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
