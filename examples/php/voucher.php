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
async function redeemVoucher() {
    const nickInput = document.getElementById('voucher-nick');
    const codeInput = document.getElementById('voucher-code');
    const btn = document.getElementById('voucher-btn');
    const resultBox = document.getElementById('voucher-result');

    const nick = nickInput.value.trim();
    const code = codeInput.value.trim();

    if (!nick) { SpaceISApp.showToast('Player nickname is required','error'); return; }
    if (!code) { SpaceISApp.showToast('Voucher code is required','error'); return; }

    resultBox.className = 'result-box';
    btn.disabled = true;
    btn.textContent = 'Checking...';

    const client = SpaceISApp.client;

    try {
        // execute() handles load() internally
        let token = '';
        try {
            token = await client.recaptcha.execute('voucher');
        } catch {
            // fallback if recaptcha fails
        }

        const res = await client.vouchers.redeem({
            nick,
            code,
            'g-recaptcha-response': token || '',
        });

        const msg = res.message || 'Voucher redeemed!';
        resultBox.textContent = msg;
        resultBox.className = 'result-box show success';
        codeInput.value = '';
    } catch (err) {
        const msg = SpaceISApp.getErrorMessage(err);
        resultBox.textContent = msg;
        resultBox.className = 'result-box show error';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Redeem voucher';
    }
}
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
