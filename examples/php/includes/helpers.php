<?php
/**
 * Helper functions for the SpaceIS PHP example.
 */

/**
 * Format price from cents (grosze) to "12,99 zl".
 */
function formatPrice(int $cents): string
{
    $amount = $cents / 100;
    return number_format($amount, 2, ',', ' ') . ' zł';
}

/** Shorthand alias */
function fp(int $cents): string
{
    return formatPrice($cents);
}

/**
 * Convert API quantity (thousandths) to display quantity.
 */
function fromApiQty(int $q): float
{
    return $q / 1000;
}

/**
 * Convert display quantity to API quantity (thousandths).
 */
function toApiQty(float $q): int
{
    return (int) ($q * 1000);
}

/**
 * Escape HTML entities for safe output.
 */
function e(?string $str): string
{
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

/**
 * Time ago string from ISO date.
 */
function timeAgo(string $dateStr): string
{
    $diff = time() - strtotime($dateStr);
    $mins = (int) floor($diff / 60);

    if ($mins < 1) return 'just now';
    if ($mins < 60) return $mins . 'm ago';

    $hours = (int) floor($mins / 60);
    if ($hours < 24) return $hours . 'h ago';

    $days = (int) floor($hours / 24);
    if ($days < 30) return $days . 'd ago';

    return (int) floor($days / 30) . 'mo ago';
}

/**
 * Format date to Polish format.
 */
function formatDate(string $iso): string
{
    return date('d.m.Y', strtotime($iso));
}

/**
 * Get the current request path (without query string).
 */
function currentPath(): string
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    return $path ?: '/';
}

/**
 * Check if the given path matches the current page.
 */
function isActive(string $href, array $matchPaths = []): bool
{
    $current = currentPath();
    $currentBase = basename($current);

    if (!empty($matchPaths)) {
        foreach ($matchPaths as $p) {
            $pBase = basename($p);
            if ($currentBase === $pBase || $current === $p) {
                return true;
            }
        }
        return false;
    }

    return $currentBase === basename($href) || $current === $href;
}

/**
 * Render placeholder SVG for missing images.
 */
function placeholderSvg(int $size = 32): string
{
    return '<svg width="' . $size . '" height="' . $size . '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
}
