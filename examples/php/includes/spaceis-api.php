<?php
/**
 * SpaceIS API Client — simple PHP wrapper for the SpaceIS storefront API.
 *
 * Reads config from .env file or falls back to constants.
 */

class SpaceISApi
{
    private string $baseUrl;
    private string $shopUuid;

    public function __construct()
    {
        $this->loadEnv();
        $this->baseUrl = rtrim(getenv('SPACEIS_API_URL') ?: 'https://storefront-api.spaceis.app', '/');
        $this->shopUuid = getenv('SPACEIS_SHOP_UUID') ?: '';
    }

    // ── Config ──

    public function getShopUuid(): string
    {
        return $this->shopUuid;
    }

    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    // ── Products ──

    /** @return array{data: array, meta: array} */
    public function getProducts(array $params = []): array
    {
        return $this->get('products', $params);
    }

    /** @return array Product detail */
    public function getProduct(string $slug): array
    {
        $res = $this->get('products/' . urlencode($slug));
        return $res['data'] ?? $res;
    }

    /** @return array Recommendations for a product */
    public function getProductRecommendations(string $slug): array
    {
        $res = $this->get('products/' . urlencode($slug) . '/package-recommendations');
        return $res['data'] ?? [];
    }

    // ── Categories ──

    /** @return array */
    public function getCategories(array $params = []): array
    {
        $res = $this->get('categories', $params);
        return $res['data'] ?? [];
    }

    // ── Packages ──

    /** @return array{data: array, meta: array} */
    public function getPackages(array $params = []): array
    {
        return $this->get('packages', $params);
    }

    // ── Sales ──

    /** @return array{data: array, meta: array} */
    public function getSales(array $params = []): array
    {
        return $this->get('sales', $params);
    }

    // ── Goals ──

    /** @return array{data: array, meta: array} */
    public function getGoals(array $params = []): array
    {
        return $this->get('goals', $params);
    }

    // ── Rankings ──

    /** @return array */
    public function getTopCustomers(array $params = []): array
    {
        $res = $this->get('customer-rankings/top', $params);
        return $res['data'] ?? [];
    }

    /** @return array */
    public function getLatestOrders(array $params = []): array
    {
        $res = $this->get('customer-rankings/latest', $params);
        return $res['data'] ?? [];
    }

    // ── Shop Config ──

    public function getShopConfig(): array
    {
        $res = $this->get('template');
        return $res['data'] ?? $res;
    }

    // ── Content ──

    /** @return array */
    public function getPages(array $params = []): array
    {
        $res = $this->get('pages', $params);
        return $res['data'] ?? [];
    }

    /** @return array|null */
    public function getPage(string $slug): ?array
    {
        $res = $this->get('pages/' . urlencode($slug));
        return $res['data'] ?? null;
    }

    /** @return array|null */
    public function getStatute(): ?array
    {
        $res = $this->get('statute');
        return $res['data'] ?? null;
    }

    // ── Checkout ──

    /** @return array */
    public function getPaymentMethods(array $params = []): array
    {
        $res = $this->get('payment-methods', $params);
        return $res['data'] ?? [];
    }

    /** @return array */
    public function getAgreements(): array
    {
        $res = $this->get('agreements');
        return $res['data'] ?? [];
    }

    // ── HTTP ──

    private function get(string $endpoint, array $params = []): array
    {
        $url = $this->baseUrl . '/' . $this->shopUuid . '/' . $endpoint;

        // Always add lang=pl
        $params['lang'] = $params['lang'] ?? 'pl';

        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "Accept: application/json\r\n",
                'timeout' => 10,
                'ignore_errors' => true,
            ],
        ]);

        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            return [];
        }

        $decoded = json_decode($response, true);
        return is_array($decoded) ? $decoded : [];
    }

    // ── Env loader ──

    private function loadEnv(): void
    {
        // .env.local takes priority over .env
        $envLocal = __DIR__ . '/../.env.local';
        $envFile = file_exists($envLocal) ? $envLocal : __DIR__ . '/../.env';
        if (!file_exists($envFile)) {
            return;
        }

        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            if (str_contains($line, '=')) {
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                // Remove surrounding quotes
                if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                    (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                    $value = substr($value, 1, -1);
                }
                putenv("$key=$value");
            }
        }
    }
}
