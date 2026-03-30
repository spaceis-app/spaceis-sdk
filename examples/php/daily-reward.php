<?php
/**
 * Daily reward page — client-side form to claim daily rewards.
 */

require_once __DIR__ . '/includes/spaceis-api.php';
require_once __DIR__ . '/includes/helpers.php';

$api = new SpaceISApi();

$pageTitle = 'Daily Reward — SpaceIS Shop';
$metaDesc = 'Claim your free daily reward.';
$isShopPage = false;
require __DIR__ . '/includes/header.php';
?>

<div class="container voucher-layout">
    <div class="voucher-card">
        <div class="voucher-card-title">Daily reward</div>
        <div class="voucher-card-desc">
            Claim a free reward — resets every 24 hours.
        </div>

        <div class="voucher-form">
            <div class="form-field">
                <label class="form-label" for="daily-nick">Player nickname *</label>
                <input type="text" id="daily-nick" placeholder="Steve" autocomplete="off"
                       onkeydown="if(event.key==='Enter')claimReward()">
            </div>
            <button class="voucher-submit success-btn" id="daily-btn" onclick="claimReward()">
                Claim reward
            </button>
        </div>

        <div class="result-box" id="daily-result"></div>
    </div>
</div>

<script>
async function claimReward() {
    const nickInput = document.getElementById('daily-nick');
    const btn = document.getElementById('daily-btn');
    const resultBox = document.getElementById('daily-result');

    const nick = nickInput.value.trim();
    if (!nick) { SpaceISApp.showToast('Player nickname is required','error'); return; }

    resultBox.className = 'result-box';
    btn.disabled = true;
    btn.textContent = 'Claiming...';

    const client = SpaceISApp.client;

    try {
        let token = '';
        try {
            token = await client.recaptcha.execute('daily_reward');
        } catch {
            // fallback if recaptcha fails
        }

        const res = await client.dailyRewards.claim({
            nick,
            'g-recaptcha-response': token || '',
        });

        const msg = res.message || 'Daily reward claimed!';
        resultBox.textContent = msg;
        resultBox.className = 'result-box show success';
    } catch (err) {
        const msg = SpaceISApp.getErrorMessage(err);
        resultBox.textContent = msg;
        resultBox.className = 'result-box show error';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Claim reward';
    }
}
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
