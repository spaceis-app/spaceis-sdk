<?php
/**
 * Voucher page — client-side form to redeem voucher codes.
 */

require_once __DIR__ . '/includes/spaceis-api.php';
require_once __DIR__ . '/includes/helpers.php';

$api = new SpaceISApi();

$pageTitle = 'Redeem Voucher — SpaceIS Shop';
$metaDesc = 'Redeem a voucher code for your account.';
$isShopPage = false;
require __DIR__ . '/includes/header.php';
?>

<div class="container voucher-layout">
    <div class="voucher-card">
        <div class="voucher-card-title">Redeem voucher</div>
        <div class="voucher-card-desc">
            Enter your player nickname and voucher code to redeem it.
        </div>

        <div class="voucher-form">
            <div class="form-field">
                <label class="form-label" for="voucher-nick">Player nickname *</label>
                <input type="text" id="voucher-nick" placeholder="Steve" autocomplete="off">
            </div>
            <div class="form-field">
                <label class="form-label" for="voucher-code">Voucher code *</label>
                <input type="text" id="voucher-code" placeholder="ABCD-1234-EFGH" autocomplete="off"
                       style="letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--mono);"
                       onkeydown="if(event.key==='Enter')redeemVoucher()">
            </div>
            <button class="voucher-submit" id="voucher-btn" onclick="redeemVoucher()">
                Redeem voucher
            </button>
        </div>

        <div class="result-box" id="voucher-result"></div>
    </div>
</div>

<script>
function redeemVoucher() {
    var nickInput = document.getElementById('voucher-nick');
    var codeInput = document.getElementById('voucher-code');
    var btn = document.getElementById('voucher-btn');
    var resultBox = document.getElementById('voucher-result');

    var nick = nickInput.value.trim();
    var code = codeInput.value.trim();

    if (!nick) { SpaceISApp.showToast('Player nickname is required','error'); return; }
    if (!code) { SpaceISApp.showToast('Voucher code is required','error'); return; }

    resultBox.className = 'result-box';
    btn.disabled = true;
    btn.textContent = 'Checking...';

    var client = SpaceISApp.client;

    // execute() handles load() internally
    client.recaptcha.execute('voucher').catch(function() {
        return ''; // fallback if recaptcha fails
    }).then(function(token) {
        return client.vouchers.redeem({
            nick: nick,
            code: code,
            'g-recaptcha-response': token || '',
        });
    }).then(function(res) {
        var msg = res.message || 'Voucher redeemed!';
        resultBox.textContent = msg;
        resultBox.className = 'result-box show success';
        codeInput.value = '';
    }).catch(function(err) {
        var msg = SpaceISApp.getErrorMessage(err);
        resultBox.textContent = msg;
        resultBox.className = 'result-box show error';
    }).finally(function() {
        btn.disabled = false;
        btn.textContent = 'Redeem voucher';
    });
}
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
