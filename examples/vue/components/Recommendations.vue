<script setup lang="ts">
import { useProductRecommendations, useCart, fromApiQty, type PackageRecommendation } from '@spaceis/vue';
import { fp, getErrorMessage } from '~/utils/helpers';

const props = withDefaults(
  defineProps<{
    slug: string | null;
    title?: string;
  }>(),
  { title: 'Recommended' },
);

const slugRef = computed(() => props.slug);
const { data: recs } = useProductRecommendations(slugRef);
const { add } = useCart();
const { success: toastSuccess, error: toastError } = useToast();

const addingMap = reactive<Record<string, boolean>>({});
const addedMap = reactive<Record<string, boolean>>({});

async function handleAdd(rec: PackageRecommendation) {
  const variantUuid = rec.variant?.uuid;
  if (!variantUuid || addingMap[variantUuid]) return;

  const minQty = rec.shop_product?.min_quantity ? fromApiQty(rec.shop_product.min_quantity) : 1;

  addingMap[variantUuid] = true;
  try {
    await add(variantUuid, minQty);
    toastSuccess('Added to cart!');
    addedMap[variantUuid] = true;
    setTimeout(() => { addedMap[variantUuid] = false; }, 1500);
  } catch (err) {
    toastError(getErrorMessage(err));
  } finally {
    addingMap[variantUuid] = false;
  }
}
</script>

<template>
  <div v-if="recs && recs.length > 0" class="recs-section">
    <div class="recs-section-title">{{ title }}</div>
    <div class="recs-grid">
      <div
        v-for="rec in recs"
        :key="rec.variant?.uuid ?? rec.name"
        class="rec-card"
      >
        <img
          v-if="rec.variant?.image || rec.shop_product?.image"
          class="rec-img"
          :src="rec.variant?.image || rec.shop_product?.image"
          alt=""
        />
        <div v-else class="rec-img-placeholder">
          <PlaceholderSvg :size="16" />
        </div>
        <div class="rec-info">
          <div class="rec-name">{{ rec.name || rec.shop_product?.name || '' }}</div>
          <div class="rec-price-row">
            <span class="rec-price">
              {{ fp(rec.price * (rec.shop_product?.min_quantity ? fromApiQty(rec.shop_product.min_quantity) : 1)) }}
            </span>
            <span v-if="rec.base_price !== rec.price" class="rec-old-price">
              {{ fp(rec.base_price * (rec.shop_product?.min_quantity ? fromApiQty(rec.shop_product.min_quantity) : 1)) }}
            </span>
            <span
              v-if="(rec.shop_product?.min_quantity ? fromApiQty(rec.shop_product.min_quantity) : 1) > 1"
              class="rec-qty-label"
            >
              ({{ rec.shop_product?.min_quantity ? fromApiQty(rec.shop_product.min_quantity) : 1 }} pcs.)
            </span>
          </div>
        </div>
        <button
          class="rec-add-btn"
          :disabled="addingMap[rec.variant?.uuid] || !rec.variant?.uuid"
          title="Add to cart"
          aria-label="Add to cart"
          @click="handleAdd(rec)"
        >
          {{ addingMap[rec.variant?.uuid] ? '...' : addedMap[rec.variant?.uuid] ? '\u2713' : '+' }}
        </button>
      </div>
    </div>
  </div>
</template>
