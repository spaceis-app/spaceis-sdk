<?php
/**
 * Shared header — nav, cart icon, mobile menu, sub-tabs.
 *
 * Expected variables:
 *   $pageTitle   — page <title>
 *   $metaDesc    — meta description
 *   $isShopPage  — bool, true for products/packages/sales pages
 *   $api         — SpaceISApi instance (for shop UUID/baseUrl)
 */

$pageTitle  = $pageTitle  ?? 'SpaceIS Shop';
$metaDesc   = $metaDesc   ?? 'shop powered by SpaceIS SDK';
$isShopPage = $isShopPage ?? false;

$navLinks = [
    ['href' => '/index.php', 'label' => 'Shop', 'matchPaths' => ['/index.php', '/', '/packages.php', '/sales.php']],
    ['href' => '/voucher.php', 'label' => 'Voucher'],
    ['href' => '/daily-reward.php', 'label' => 'Daily Reward'],
    ['href' => '/page.php', 'label' => 'Pages'],
    ['href' => '/statute.php', 'label' => 'Terms'],
];

$shopTabs = [
    ['href' => '/index.php', 'label' => 'Products'],
    ['href' => '/packages.php', 'label' => 'Packages'],
    ['href' => '/sales.php', 'label' => 'Sales'],
];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($pageTitle) ?></title>
    <meta name="description" content="<?= e($metaDesc) ?>">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <div class="header-inner">
                <a href="/index.php" class="nav-logo">SpaceIS</a>

                <ul class="nav-links">
                    <?php foreach ($navLinks as $link): ?>
                        <?php
                            $matchPaths = $link['matchPaths'] ?? [];
                            $active = isActive($link['href'], $matchPaths);
                        ?>
                        <li>
                            <a href="<?= e($link['href']) ?>"
                               class="<?= $active ? 'active' : '' ?>">
                                <?= e($link['label']) ?>
                            </a>
                        </li>
                    <?php endforeach; ?>
                </ul>

                <div class="header-actions">
                    <button class="btn-cart-icon" onclick="SpaceISApp.toggleDrawer()" aria-label="Cart">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                            <line x1="3" y1="6" x2="21" y2="6"/>
                            <path d="M16 10a4 4 0 01-8 0"/>
                        </svg>
                        <span class="cart-badge-dot" id="cart-badge"></span>
                    </button>

                    <button class="mobile-menu-btn" id="mobile-menu-btn" onclick="SpaceISApp.toggleMobileMenu()" aria-label="Menu">
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    </button>
                </div>
            </div>
        </div>

        <?php if ($isShopPage): ?>
        <div class="sub-tabs-bar">
            <div class="container">
                <div class="sub-tabs">
                    <?php foreach ($shopTabs as $tab): ?>
                        <?php $tabActive = isActive($tab['href']); ?>
                        <a href="<?= e($tab['href']) ?>"
                           class="sub-tab <?= $tabActive ? 'active' : '' ?>">
                            <?= e($tab['label']) ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </header>

    <!-- Mobile menu overlay + slide-in -->
    <div class="mobile-menu-overlay" id="mobile-menu-overlay" onclick="SpaceISApp.closeMobileMenu()"></div>
    <nav class="mobile-menu" id="mobile-menu">
        <ul class="mobile-menu-links">
            <?php foreach ($navLinks as $link): ?>
                <?php
                    $matchPaths = $link['matchPaths'] ?? [];
                    $active = isActive($link['href'], $matchPaths);
                ?>
                <li>
                    <a href="<?= e($link['href']) ?>"
                       class="<?= $active ? 'active' : '' ?>"
                       onclick="SpaceISApp.closeMobileMenu()">
                        <?= e($link['label']) ?>
                    </a>
                </li>
            <?php endforeach; ?>
        </ul>
    </nav>

    <!-- Cart drawer (injected by JS) -->
    <div id="cart-overlay" class="overlay" onclick="SpaceISApp.closeDrawer()"></div>
    <div id="cart-drawer" class="drawer" role="dialog" aria-modal="true" aria-label="Cart"></div>
