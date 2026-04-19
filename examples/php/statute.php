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
$loadDOMPurify = !empty($statute);
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
            <!--
                statute.content is raw HTML from the API. Rendered in an inert
                <template>, then DOMPurify-sanitised into #statute-body.
            -->
            <template id="statute-content-raw"><?= $statute['content'] ?? '' ?></template>
            <div class="statute-body" id="statute-body"></div>
            <div class="statute-meta">
                <span>Created: <?= formatDate($statute['created_at'] ?? '') ?></span>
                <span>Last updated: <?= formatDate($statute['updated_at'] ?? '') ?></span>
            </div>
        </div>
    <?php endif; ?>
</div>

<?php if (!empty($statute)): ?>
<script>
    (() => {
        const tpl = document.getElementById('statute-content-raw');
        const dst = document.getElementById('statute-body');
        if (!tpl || !dst) return;
        dst.innerHTML = window.DOMPurify ? window.DOMPurify.sanitize(tpl.innerHTML) : '';
    })();
</script>
<?php endif; ?>

<?php require __DIR__ . '/includes/footer.php'; ?>
