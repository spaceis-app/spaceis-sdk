<script setup lang="ts">
import type { IndexShopProduct } from '@spaceis/vue';
import { fp } from '~/utils/helpers';

const props = defineProps<{
  product: IndexShopProduct;
  index: number;
}>();

const priceField = computed(() => props.product.minimal_price);
</script>

<template>
  <NuxtLink
    :to="`/product/${product.slug}`"
    class="product-card"
    :style="{ animationDelay: `${index * 0.04}s`, textDecoration: 'none' }"
  >
    <div class="product-img-wrap">
      <img
        v-if="product.image"
        class="product-img"
        :src="product.image"
        :alt="product.name"
        loading="lazy"
      />
      <div v-else class="product-img-placeholder">
        <PlaceholderSvg :size="32" />
      </div>
      <div v-if="product.percentage_discount" class="product-discount-badge">
        -{{ product.percentage_discount }}%
      </div>
    </div>
    <div class="product-body">
      <div class="product-name">{{ product.name }}</div>
      <div class="product-footer">
        <div>
          <span class="product-price">{{ fp(priceField) }}</span>
        </div>
        <span class="view-btn">View</span>
      </div>
    </div>
  </NuxtLink>
</template>
