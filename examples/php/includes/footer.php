    <footer class="site-footer">
        <div class="container">
            <span class="footer-text">
                Powered by <strong>SpaceIS SDK</strong> v0.1.5
            </span>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/@spaceis/sdk@0.2.0/dist/spaceis.global.js" integrity="sha384-3aWl3Yi8pLHXKgJeSS5Q7kyF0jiu6UCBHqsyY8PFjBfpXKMePEK84jVOFxWxCLI0" crossorigin="anonymous"></script>
    <script type="application/json" id="spaceis-config"><?= json_encode([
        'baseUrl' => $api->getBaseUrl(),
        'shopUuid' => $api->getShopUuid(),
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?></script>
    <script type="module" src="/includes/js/app.js"></script>
</body>
</html>
