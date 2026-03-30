<?php
/**
 * CMS pages — SSR: list all pages or show a single page by slug.
 */

require_once __DIR__ . '/includes/spaceis-api.php';
require_once __DIR__ . '/includes/helpers.php';

$api = new SpaceISApi();

$slug = $_GET['slug'] ?? '';

if ($slug) {
    // ── Single page ──
    $page = $api->getPage($slug);

    if (!$page) {
        $pageTitle = 'Page not found — SpaceIS Shop';
        $metaDesc = 'The requested page does not exist.';
        $isShopPage = false;
        require __DIR__ . '/includes/header.php';
        ?>
        <div class="page-content">
            <div class="page-not-found">
                <div class="icon" style="font-size: 40px">?</div>
                <h2>Page not found</h2>
                <p>The requested page does not exist.</p>
                <a href="/page.php" class="back-link">&larr; All pages</a>
            </div>
        </div>
        <?php
        require __DIR__ . '/includes/footer.php';
        exit;
    }

    $pageTitle = e($page['title'] ?? 'Page') . ' — SpaceIS Shop';
    $metaDesc = strip_tags(mb_substr($page['content'] ?? '', 0, 160));
    $isShopPage = false;
    require __DIR__ . '/includes/header.php';
    ?>
    <div class="page-content">
        <div class="page-content-panel">
            <?php if (!empty($page['title'])): ?>
                <h1 class="page-title"><?= e($page['title']) ?></h1>
            <?php endif; ?>
            <div class="page-body">
                <?= $page['content'] ?? '' ?>
            </div>
            <div class="page-meta">
                <span>Last updated: <?= formatDate($page['updated_at'] ?? '') ?></span>
            </div>
        </div>
    </div>
    <?php
    require __DIR__ . '/includes/footer.php';
    exit;
}

// ── Pages list ──
$pages = $api->getPages();

$pageTitle = 'Pages — SpaceIS Shop';
$metaDesc = 'Information pages.';
$isShopPage = false;
require __DIR__ . '/includes/header.php';
?>

<div class="page-content">
    <h1 class="page-heading">Pages</h1>

    <?php if (empty($pages)): ?>
        <div class="empty-state">
            <p>No pages available.</p>
        </div>
    <?php else: ?>
        <?php foreach ($pages as $p): ?>
            <a href="/page.php?slug=<?= e($p['slug']) ?>" class="pages-list-item">
                <?= e($p['title'] ?? $p['slug']) ?>
                <span class="pages-list-item-slug"><?= e($p['slug']) ?></span>
            </a>
        <?php endforeach; ?>
    <?php endif; ?>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
