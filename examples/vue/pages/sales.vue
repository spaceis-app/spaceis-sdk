<script setup lang="ts">
import { useSales } from '@spaceis/vue';

useHead({ title: 'Sales' });

const { data, isLoading } = useSales({ sort: 'expires_at' });
const sales = computed(() => (data.value as any)?.data ?? []);
</script>

<template>
  <div class="container">
    <section class="section">
      <h1 class="page-heading">Sales</h1>

      <ProductGridSkeleton v-if="isLoading" />
      <div v-else-if="sales.length === 0" class="empty-state">
        <p>No active sales right now.</p>
      </div>
      <div v-else class="products-grid">
        <SaleCard v-for="(sale, idx) in sales" :key="sale.uuid" :sale="sale" :index="Number(idx)" />
      </div>
    </section>

    <ClientOnly>
      <CommunitySection />
    </ClientOnly>
  </div>
</template>
