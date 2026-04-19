    <footer class="site-footer">
        <div class="container">
            <span class="footer-text">
                Powered by <strong>SpaceIS SDK</strong> v0.1.5
            </span>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/@spaceis/sdk@0.1.5/dist/spaceis.global.js" integrity="sha384-DJRxH7IjY+WUtTa16M0CizszmJHmweQTCNXnI6OfFN5q/Vi9ejyqQ7oZ8V1Ouokq" crossorigin="anonymous"></script>
    <script type="application/json" id="spaceis-config"><?= json_encode([
        'baseUrl' => $api->getBaseUrl(),
        'shopUuid' => $api->getShopUuid(),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?></script>
    <script type="module" src="/includes/js/app.js"></script>
</body>
</html>
