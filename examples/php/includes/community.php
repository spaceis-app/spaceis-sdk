<?php
/**
 * Community section partial — top customers, latest orders, goals.
 *
 * Expected variables:
 *   $topCustomers — array of top customers
 *   $latestOrders — array of latest orders
 *   $goals        — array of community goals
 */

$topCustomers = $topCustomers ?? [];
$latestOrders = $latestOrders ?? [];
$goals = $goals ?? [];
?>

<section class="section community-section">
    <div class="community-grid">
        <!-- Top Customers -->
        <div class="community-card">
            <div class="community-card-header">Top customers</div>
            <div class="community-card-body">
                <?php if (empty($topCustomers)): ?>
                    <div class="community-empty">No data yet.</div>
                <?php else: ?>
                    <?php foreach ($topCustomers as $i => $c): ?>
                        <div class="rank-row">
                            <span class="rank-pos">#<?= $i + 1 ?></span>
                            <span class="rank-name"><?= e($c['first_name'] ?? '') ?></span>
                            <span class="rank-value"><?= fp($c['total_spent'] ?? 0) ?></span>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

        <!-- Latest Orders -->
        <div class="community-card">
            <div class="community-card-header">Latest orders</div>
            <div class="community-card-body">
                <?php if (empty($latestOrders)): ?>
                    <div class="community-empty">No orders yet.</div>
                <?php else: ?>
                    <?php foreach ($latestOrders as $o): ?>
                        <div class="latest-row">
                            <span class="latest-name"><?= e($o['first_name'] ?? '') ?></span>
                            <span class="latest-time"><?= timeAgo($o['completed_at'] ?? 'now') ?></span>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Community Goals -->
    <div class="community-card">
        <div class="community-card-header">Community goals</div>
        <div class="community-card-body">
            <?php if (empty($goals)): ?>
                <div class="community-empty">No active goals.</div>
            <?php else: ?>
                <?php foreach ($goals as $g): ?>
                    <?php
                        $progress = min($g['progress'] ?? 0, 100);
                        $target = isset($g['target']) ? fp($g['target']) : '—';
                    ?>
                    <div class="goal-item">
                        <div class="goal-header">
                            <span class="goal-name"><?= e($g['name'] ?? '') ?></span>
                            <span class="goal-progress-text"><?= $progress ?>%</span>
                        </div>
                        <div class="goal-bar">
                            <div class="goal-bar-fill" style="width: <?= $progress ?>%"></div>
                        </div>
                        <div class="goal-amounts">
                            <span><?= fp($g['collected'] ?? 0) ?></span>
                            <span><?= $target ?></span>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>
</section>
