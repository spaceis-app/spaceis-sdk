# SpaceIS SDK — PHP SSR Example

A complete shop storefront built with PHP server-side rendering and the SpaceIS SDK IIFE for client-side interactivity.

## Requirements

- PHP 8.0 or higher
- `allow_url_fopen` enabled in php.ini (for `file_get_contents` to call the API)

## Setup

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Edit `.env` and set your shop UUID:

```
SPACEIS_API_URL=https://storefront-api.spaceis.app
SPACEIS_SHOP_UUID=your-shop-uuid-here
```

3. Start the PHP built-in server:

```bash
php -S localhost:8080
```

4. Open `http://localhost:8080/index.php` in your browser.

## Architecture

### Server-side (PHP)

Each page fetches data from the SpaceIS API using the `SpaceISApi` class (`includes/spaceis-api.php`) and renders HTML with the same CSS class names as the React example. This gives you:

- Fast initial page load with fully rendered HTML
- SEO-friendly content (products, categories, pages, statute)
- No JavaScript required for reading content

### Client-side (SDK IIFE)

Interactive features use the SpaceIS SDK loaded via CDN (`window.SpaceIS`):

- **Cart operations**: add, remove, increment, decrement items
- **Cart drawer**: slide-in cart panel with live updates
- **Quantity steppers**: +/- buttons on product and cart pages
- **Discount codes**: apply/remove in cart drawer and checkout
- **Voucher redemption**: form submission via SDK
- **Daily rewards**: claim via SDK
- **Order lookup**: fetch order details via SDK
- **Checkout**: place orders with payment method selection

### File Structure

```
index.php              — Products page (SSR)
product.php            — Product detail (SSR + client-side cart)
packages.php           — Packages page (SSR)
sales.php              — Sales page (SSR + countdown timers)
cart.php               — Cart page (client-side)
checkout.php           — Checkout (SSR payment methods + client-side)
voucher.php            — Voucher form (client-side)
daily-reward.php       — Daily reward form (client-side)
order.php              — Order summary lookup (client-side)
page.php               — CMS pages (SSR)
statute.php            — Statute page (SSR)
styles.css             — Shared stylesheet (identical to React example)
includes/
  spaceis-api.php      — PHP API client class
  helpers.php          — Price formatting, HTML escaping, utilities
  header.php           — Shared header (nav, cart icon, mobile menu)
  footer.php           — Footer + SDK script + cart drawer JS
  community.php        — Community section partial (top customers, orders, goals)
```

## Customization

- **Styling**: Edit `styles.css` — uses CSS variables for easy theming
- **API URL**: Change `SPACEIS_API_URL` in `.env` for custom API endpoints
- **Language**: The API class sends `lang=pl` by default; change in `spaceis-api.php`
