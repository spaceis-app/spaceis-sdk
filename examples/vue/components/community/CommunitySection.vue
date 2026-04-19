<script setup lang="ts">
import { useTopCustomers, useLatestOrders, useGoals } from '@spaceis/vue';
import { fp } from '~/utils/helpers';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const { data: topCustomers, isLoading: loadingTop } = useTopCustomers({ limit: 10, sort: '-total_spent' });
const { data: latestOrders, isLoading: loadingLatest } = useLatestOrders({ limit: 10, sort: '-completed_at' });
const { data: goalsData, isLoading: loadingGoals } = useGoals({ per_page: 10 });

const goals = computed(() => goalsData.value?.data ?? []);
</script>

<template>
  <section class="section community-section">
    <div class="community-grid">
      <!-- Top Customers -->
      <div class="community-card">
        <div class="community-card-header">Top customers</div>
        <div class="community-card-body">
          <div v-if="loadingTop" class="spinner" />
          <div v-else-if="!topCustomers || topCustomers.length === 0" class="community-empty">
            No data yet.
          </div>
          <template v-else>
            <div v-for="(c, i) in topCustomers" :key="i" class="rank-row">
              <span class="rank-pos">#{{ i + 1 }}</span>
              <span class="rank-name">{{ c.first_name }}</span>
              <span class="rank-value">{{ fp(c.total_spent) }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Latest Orders -->
      <div class="community-card">
        <div class="community-card-header">Latest orders</div>
        <div class="community-card-body">
          <div v-if="loadingLatest" class="spinner" />
          <div v-else-if="!latestOrders || latestOrders.length === 0" class="community-empty">
            No orders yet.
          </div>
          <template v-else>
            <div v-for="(o, i) in latestOrders" :key="i" class="latest-row">
              <span class="latest-name">{{ o.first_name }}</span>
              <span class="latest-time">{{ timeAgo(o.completed_at) }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Community Goals -->
    <div class="community-card">
      <div class="community-card-header">Community goals</div>
      <div class="community-card-body">
        <div v-if="loadingGoals" class="spinner" />
        <div v-else-if="goals.length === 0" class="community-empty">
          No active goals.
        </div>
        <template v-else>
          <div v-for="g in goals" :key="g.uuid" class="goal-item">
            <div class="goal-header">
              <span class="goal-name">{{ g.name }}</span>
              <span class="goal-progress-text">{{ Math.min(g.progress, 100) }}%</span>
            </div>
            <div class="goal-bar">
              <div class="goal-bar-fill" :style="{ width: `${Math.min(g.progress, 100)}%` }" />
            </div>
            <div class="goal-amounts">
              <span>{{ fp(g.collected) }}</span>
              <span>{{ g.target ? fp(g.target) : '\u2014' }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>
