<?php
/**
 * Statute / Terms page — SSR.
 */

require_once __DIR__ . '/includes/spaceis-api.php';
require_once __DIR__ . '/includes/helpers.php';

$api = new SpaceISApi();

$statute = $api->getStatute();

$pageTitle = ($statute['title'] ?? 'Terms') . ' — SpaceIS Shop';
$metaDesc = 'Terms and conditions.';
$isShopPage = false;
require __DIR__ . '/includes/header.php';
?>

<div class="statute-content">
    <?php if (!$statute): ?>
        <div class="empty-state">
            <p>No statute available.</p>
        </div>
    <?php else: ?>
        <div class="statute-content-panel">
            <?php if (!empty($statute['title'])): ?>
                <h1 class="statute-title"><?= e($statute['title']) ?></h1>
            <?php endif; ?>
            <div class="statute-body">
                <?= $statute['content'] ?? '' ?>
            </div>
            <div class="statute-meta">
                <span>Created: <?= formatDate($statute['created_at'] ?? '') ?></span>
                <span>Last updated: <?= formatDate($statute['updated_at'] ?? '') ?></span>
            </div>
        </div>
    <?php endif; ?>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
