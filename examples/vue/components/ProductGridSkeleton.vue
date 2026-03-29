<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 8 });
</script>

<template>
  <div class="products-grid">
    <div v-for="i in count" :key="i" class="skeleton-card">
      <div class="skeleton skeleton-img" />
      <div class="skeleton-body">
        <div class="skeleton skeleton-line" />
        <div class="skeleton skeleton-line short" />
        <div class="skeleton skeleton-line price" />
      </div>
    </div>
  </div>
</template>
