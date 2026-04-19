<script setup lang="ts">
import DOMPurify from 'isomorphic-dompurify';
import {
  useProduct,
  useCart,
  getProductLimits,
  snapQuantity,
  type ShowShopProductVariant,
} from '@spaceis/vue';
import { fp, getErrorMessage } from '~/utils/helpers';
import { formatUnitLabel } from '~/utils/unit-utils';

const route = useRoute();
const slug = computed(() => route.params.slug as string);

const { data: product, isLoading } = useProduct(slug);

const sanitizedDescription = computed(() => DOMPurify.sanitize(product.value?.description ?? ''));

useSeoMeta({
  title: () => product.value?.name || 'Product',
  description: () => product.value?.description?.replace(/<[^>]*>/g, '').slice(0, 160) || '',
  ogImage: () => product.value?.image || '',
});

const selectedVariant = ref<ShowShopProductVariant | null>(null);
const quantity = ref(1);
const qtyInput = ref('1');
const adding = ref(false);
const addSuccess = ref(false);

watch(product, (p) => {
  if (p && p.variants && p.variants.length > 0) {
    selectedVariant.value = p.variants[0] ?? null;
    const lim = getProductLimits(p);
    quantity.value = lim.min;
    qtyInput.value = String(lim.min);
  }
  addSuccess.value = false;
}, { immediate: true });

const limits = computed(() =>
  product.value ? getProductLimits(product.value) : { min: 1, max: 99, step: 1 },
);

const currentPrice = computed(() =>
  selectedVariant.value ? selectedVariant.value.price * quantity.value : 0,
);
const currentBasePrice = computed(() =>
  selectedVariant.value ? selectedVariant.value.base_price * quantity.value : 0,
);
const hasDiscount = computed(() => currentBasePrice.value > currentPrice.value);
const unitPrice = computed(() => selectedVariant.value ? selectedVariant.value.price : 0);

let add: ((uuid: string, qty?: number) => Promise<any>) | null = null;
let toastSuccess: ((m: string) => void) | null = null;
let toastError: ((m: string) => void) | null = null;
if (import.meta.client) {
  const cart = useCart();
  add = cart.add;
  const toast = useToast();
  toastSuccess = toast.success;
  toastError = toast.error;
}

async function handleAdd() {
  if (!selectedVariant.value || !add) return;
  adding.value = true;
  try {
    await add(selectedVariant.value.uuid, quantity.value);
    toastSuccess?.('Added to cart!');
    addSuccess.value = true;
    setTimeout(() => { addSuccess.value = false; }, 1500);
  } catch (err) {
    toastError?.(getErrorMessage(err));
  } finally {
    adding.value = false;
  }
}

function selectVariant(v: ShowShopProductVariant) {
  selectedVariant.value = v;
  quantity.value = limits.value.min;
  qtyInput.value = String(limits.value.min);
}

function decrementQty() {
  const q = Math.max(limits.value.min, quantity.value - limits.value.step);
  quantity.value = q;
  qtyInput.value = String(q);
}

function incrementQty() {
  const q = Math.min(limits.value.max, quantity.value + limits.value.step);
  quantity.value = q;
  qtyInput.value = String(q);
}

function commitQty() {
  let n = parseInt(qtyInput.value, 10);
  if (isNaN(n)) n = quantity.value;
  n = snapQuantity(n, limits.value);
  quantity.value = n;
  qtyInput.value = String(n);
}
</script>

<template>
  <div class="container pdp-container">
    <div v-if="isLoading" class="spinner" />

    <div v-else-if="!product" class="empty-state">
      <p>Product not found.</p>
      <NuxtLink to="/" class="back-link">&larr; Back to shop</NuxtLink>
    </div>

    <template v-else>
      <!-- Breadcrumb -->
      <nav class="pdp-breadcrumb">
        <NuxtLink to="/">Shop</NuxtLink>
        <span class="pdp-breadcrumb-sep">/</span>
        <span>{{ product.name }}</span>
      </nav>

      <div class="pdp-layout">
        <!-- Left: Image -->
        <div class="pdp-image-col">
          <img
            v-if="product.image"
            class="pdp-image"
            :src="product.image"
            :alt="product.name"
          />
          <div v-else class="pdp-image-placeholder">
            <PlaceholderSvg :size="64" />
          </div>
        </div>

        <!-- Right: Details -->
        <div class="pdp-details-col">
          <h1 class="pdp-title">{{ product.name }}</h1>

          <div class="pdp-price-block">
            <span class="pdp-price">{{ fp(currentPrice) }}</span>
            <span v-if="hasDiscount" class="pdp-price-old">{{ fp(currentBasePrice) }}</span>
          </div>

          <div class="pdp-unit-price">
            ({{ fp(unitPrice) }} / {{ formatUnitLabel(limits.step, (product as any)?.unit) }})
          </div>

          <!-- Variants -->
          <div v-if="product.variants && product.variants.length > 1" class="pdp-section">
            <div class="pdp-label">Variant</div>
            <div class="variants-grid">
              <button
                v-for="v in product.variants"
                :key="v.uuid"
                :class="['variant-btn', { active: selectedVariant?.uuid === v.uuid }]"
                @click="selectVariant(v)"
              >
                {{ v.name }}
              </button>
            </div>
          </div>

          <!-- Quantity -->
          <div class="pdp-section">
            <div class="pdp-qty-row">
              <div class="pdp-qty-stepper">
                <button
                  class="qty-step-btn"
                  :disabled="quantity <= limits.min"
                  @click="decrementQty"
                >
                  -
                </button>
                <input
                  class="pdp-qty-input"
                  type="text"
                  inputmode="numeric"
                  :value="qtyInput"
                  @input="qtyInput = ($event.target as HTMLInputElement).value"
                  @blur="commitQty"
                  @keydown.enter="($event.target as HTMLInputElement).blur()"
                />
                <button
                  class="qty-step-btn"
                  :disabled="quantity >= limits.max"
                  @click="incrementQty"
                >
                  +
                </button>
              </div>
              <span class="qty-unit">{{ (product as any)?.unit || 'szt' }}</span>
            </div>
          </div>

          <!-- Add to cart -->
          <ClientOnly>
            <button
              :class="['pdp-add-btn', { success: addSuccess }]"
              :disabled="adding || !selectedVariant"
              @click="handleAdd"
            >
              {{ adding ? 'Adding...' : addSuccess ? 'Added!' : 'Add to cart' }}
            </button>
          </ClientOnly>

          <!-- Recommendations -->
          <ClientOnly>
            <Recommendations :slug="slug" title="Recommended" />
          </ClientOnly>

          <!-- Description -->
          <div v-if="product.description" class="pdp-description">
            <div class="pdp-label">Description</div>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="pdp-desc-body" v-html="sanitizedDescription" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
