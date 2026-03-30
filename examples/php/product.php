<?php
/**
 * Product detail page (PDP) — SSR: product + recommendations.
 * Client-side: variant selection, quantity stepper, add to cart.
 */

require_once __DIR__ . '/includes/spaceis-api.php';
require_once __DIR__ . '/includes/helpers.php';

$api = new SpaceISApi();

$slug = $_GET['slug'] ?? '';
if (!$slug) {
    header('Location: /index.php');
    exit;
}

$product = $api->getProduct($slug);
$recommendations = $api->getProductRecommendations($slug);

if (empty($product)) {
    $pageTitle = 'Product not found — SpaceIS Shop';
    $metaDesc = 'Product not found.';
    $isShopPage = false;
    require __DIR__ . '/includes/header.php';
    echo '<div class="container pdp-container"><div class="empty-state"><p>Product not found.</p><a href="/index.php" class="back-link">&larr; Back to shop</a></div></div>';
    require __DIR__ . '/includes/footer.php';
    exit;
}

$variants = $product['variants'] ?? [];
$firstVariant = $variants[0] ?? null;

// Calculate limits from product
$minQty = isset($product['min_quantity']) ? fromApiQty($product['min_quantity']) : 1;
$maxQty = isset($product['max_quantity']) ? fromApiQty($product['max_quantity']) : 99;
$stepQty = isset($product['quantity_step']) ? fromApiQty($product['quantity_step']) : 1;
if ($minQty < 1) $minQty = 1;
if ($stepQty < 1) $stepQty = 1;
if ($maxQty < $minQty) $maxQty = 99;

$pageTitle = e($product['name']) . ' — SpaceIS Shop';
$metaDesc = 'Buy ' . e($product['name']) . ' in our store.';
$isShopPage = false;
require __DIR__ . '/includes/header.php';
?>

<div class="container pdp-container">
    <!-- Breadcrumb -->
    <nav class="pdp-breadcrumb">
        <a href="/index.php">Shop</a>
        <span class="pdp-breadcrumb-sep">/</span>
        <span><?= e($product['name']) ?></span>
    </nav>

    <div class="pdp-layout">
        <!-- Left: Image -->
        <div class="pdp-image-col">
            <?php if (!empty($product['image'])): ?>
                <img class="pdp-image" src="<?= e($product['image']) ?>" alt="<?= e($product['name']) ?>">
            <?php else: ?>
                <div class="pdp-image-placeholder"><?= placeholderSvg(64) ?></div>
            <?php endif; ?>
        </div>

        <!-- Right: Details -->
        <div class="pdp-details-col">
            <h1 class="pdp-title"><?= e($product['name']) ?></h1>

            <div class="pdp-price-block">
                <span class="pdp-price" id="pdp-price"><?= $firstVariant ? fp($firstVariant['price'] * $minQty) : '' ?></span>
                <?php if ($firstVariant && ($firstVariant['base_price'] ?? 0) > ($firstVariant['price'] ?? 0)): ?>
                    <span class="pdp-price-old" id="pdp-price-old"><?= fp($firstVariant['base_price'] * $minQty) ?></span>
                <?php else: ?>
                    <span class="pdp-price-old" id="pdp-price-old" style="display:none"></span>
                <?php endif; ?>
            </div>

            <div class="pdp-unit-price" id="pdp-unit-price">
                (<?= $firstVariant ? fp($firstVariant['price']) : '' ?>/<?= $stepQty > 1 ? $stepQty . ' pcs.' : '1 pcs.' ?>)
            </div>

            <!-- Variants -->
            <?php if (count($variants) > 1): ?>
                <div class="pdp-section">
                    <div class="pdp-label">Variant</div>
                    <div class="variants-grid" id="variants-grid">
                        <?php foreach ($variants as $i => $v): ?>
                            <button class="variant-btn <?= $i === 0 ? 'active' : '' ?>"
                                    data-uuid="<?= e($v['uuid']) ?>"
                                    data-price="<?= (int) $v['price'] ?>"
                                    data-base-price="<?= (int) $v['base_price'] ?>"
                                    onclick="selectVariant(this)">
                                <?= e($v['name']) ?>
                            </button>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Quantity -->
            <div class="pdp-section">
                <div class="pdp-qty-row">
                    <div class="pdp-qty-stepper">
                        <button class="qty-step-btn" id="qty-dec" onclick="changeQty(-1)">-</button>
                        <input class="pdp-qty-input" id="qty-val" type="text" inputmode="numeric"
                               value="<?= (int) $minQty ?>"
                               onblur="setQtyFromInput(this.value)"
                               onkeydown="if(event.key==='Enter'){this.blur()}"
                        >
                        <button class="qty-step-btn" id="qty-inc" onclick="changeQty(1)">+</button>
                    </div>
                </div>
            </div>

            <!-- Add to cart -->
            <button class="pdp-add-btn" id="pdp-add-btn" onclick="addProductToCart()">
                Add to cart
            </button>

            <!-- Recommendations -->
            <?php if (!empty($recommendations)): ?>
                <div class="recs-section">
                    <div class="recs-section-title">Recommended</div>
                    <div class="recs-grid">
                        <?php foreach ($recommendations as $rec): ?>
                            <?php
                                $recVariant = $rec['variant'] ?? null;
                                $recProduct = $rec['shop_product'] ?? null;
                                $recImg = ($recVariant ? ($recVariant['image'] ?? null) : null) ?? ($recProduct ? ($recProduct['image'] ?? null) : null);
                                $recName = $rec['name'] ?? ($recProduct ? ($recProduct['name'] ?? '') : '');
                                $recVarUuid = $recVariant ? ($recVariant['uuid'] ?? '') : '';
                                $recHasDiscount = ($rec['base_price'] ?? 0) !== ($rec['price'] ?? 0);
                                $recMinQty = ($recProduct && isset($recProduct['min_quantity'])) ? fromApiQty($recProduct['min_quantity']) : 1;
                                if ($recMinQty < 1) $recMinQty = 1;
                            ?>
                            <div class="rec-card">
                                <?php if ($recImg): ?>
                                    <img class="rec-img" src="<?= e($recImg) ?>" alt="">
                                <?php else: ?>
                                    <div class="rec-img-placeholder"><?= placeholderSvg(16) ?></div>
                                <?php endif; ?>
                                <div class="rec-info">
                                    <div class="rec-name"><?= e($recName) ?></div>
                                    <div class="rec-price-row">
                                        <span class="rec-price"><?= fp(($rec['price'] ?? 0) * $recMinQty) ?></span>
                                        <?php if ($recHasDiscount): ?>
                                            <span class="rec-old-price"><?= fp(($rec['base_price'] ?? 0) * $recMinQty) ?></span>
                                        <?php endif; ?>
                                        <?php if ($recMinQty > 1): ?>
                                            <span class="rec-qty-label">(<?= $recMinQty ?> pcs.)</span>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                <button class="rec-add-btn"
                                        <?= !$recVarUuid ? 'disabled' : '' ?>
                                        onclick="SpaceISApp.addToCart('<?= e($recVarUuid) ?>', <?= $recMinQty ?>).then(function(){this.textContent='\u2713';var b=this;setTimeout(function(){b.textContent='+'},1500)}.bind(this))"
                                        title="Add to cart" aria-label="Add to cart">+</button>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Description -->
            <?php if (!empty($product['description'])): ?>
                <div class="pdp-description">
                    <div class="pdp-label">Description</div>
                    <div class="pdp-desc-body">
                        <?= sanitizeHtml($product['description']) ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<script>
(function() {
    var variants = <?= json_encode($variants, JSON_UNESCAPED_UNICODE) ?>;
    var selectedVariantUuid = <?= $firstVariant ? json_encode($firstVariant['uuid']) : 'null' ?>;
    var quantity = <?= (int) $minQty ?>;
    var minQty = <?= (int) $minQty ?>;
    var maxQty = <?= (int) $maxQty ?>;
    var stepQty = <?= (int) $stepQty ?>;

    function getSelectedVariant() {
        for (var i = 0; i < variants.length; i++) {
            if (variants[i].uuid === selectedVariantUuid) return variants[i];
        }
        return variants[0] || null;
    }

    function updateDisplay() {
        var v = getSelectedVariant();
        if (!v) return;
        var fp = (typeof SpaceISApp !== 'undefined') ? SpaceISApp.fp : SpaceIS.formatPrice;

        var price = v.price * quantity;
        var basePrice = v.base_price * quantity;
        var hasDiscount = basePrice > price;

        document.getElementById('pdp-price').textContent = fp(price);
        var oldEl = document.getElementById('pdp-price-old');
        if (hasDiscount) {
            oldEl.textContent = fp(basePrice);
            oldEl.style.display = '';
        } else {
            oldEl.style.display = 'none';
        }
        document.getElementById('pdp-unit-price').textContent =
            '(' + fp(v.price) + '/' + (stepQty > 1 ? stepQty + ' pcs.' : '1 pcs.') + ')';
        document.getElementById('qty-val').value = quantity;
        document.getElementById('qty-dec').disabled = quantity <= minQty;
        document.getElementById('qty-inc').disabled = quantity >= maxQty;
    }

    window.selectVariant = function(btn) {
        selectedVariantUuid = btn.getAttribute('data-uuid');
        quantity = minQty;
        // Update active class
        var btns = document.querySelectorAll('#variants-grid .variant-btn');
        btns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        updateDisplay();
    };

    window.changeQty = function(dir) {
        var newQty = quantity + (dir * stepQty);
        if (newQty < minQty) newQty = minQty;
        if (newQty > maxQty) newQty = maxQty;
        quantity = newQty;
        updateDisplay();
    };

    window.setQtyFromInput = function(val) {
        var n = parseInt(val, 10);
        if (isNaN(n)) n = quantity;
        quantity = SpaceIS.snapQuantity(n, { min: minQty, max: maxQty, step: stepQty });
        updateDisplay();
    };

    window.addProductToCart = function() {
        if (!selectedVariantUuid) return;
        var btn = document.getElementById('pdp-add-btn');
        btn.disabled = true;
        btn.textContent = 'Adding...';
        SpaceISApp.addToCart(selectedVariantUuid, quantity).then(function() {
            btn.textContent = 'Added!';
            btn.classList.add('success');
            setTimeout(function() {
                btn.textContent = 'Add to cart';
                btn.classList.remove('success');
                btn.disabled = false;
            }, 1500);
        }).catch(function(err) {
            btn.textContent = 'Add to cart';
            btn.disabled = false;
        });
    };

    updateDisplay();
})();
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
