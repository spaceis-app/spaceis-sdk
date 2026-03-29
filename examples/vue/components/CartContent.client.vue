<script setup lang="ts">
import { useCart, getItemQty, getCartItemImage } from '@spaceis/vue';
import { fp, getErrorMessage } from '~/utils/helpers';

const {
  items,
  totalQuantity,
  finalPrice,
  regularPrice,
  hasDiscount,
  discount,
  isEmpty,
  cart,
  increment,
  decrement,
  remove,
  setQuantity,
  applyDiscount,
  removeDiscount,
} = useCart();
const { success: toastSuccess, error: toastError } = useToast();

const discountCode = ref('');
const discountAmount = computed(() => regularPrice.value - finalPrice.value);

function handleApplyDiscount() {
  const code = discountCode.value.trim();
  if (!code) return;
  applyDiscount(code)
    .then(() => {
      toastSuccess('Discount applied!');
      discountCode.value = '';
    })
    .catch((err) => toastError(getErrorMessage(err)));
}
</script>

<template>
  <div v-if="isEmpty" class="container cart-container">
      <div class="empty-state">
        <div class="icon">&#128722;</div>
        <p>Your cart is empty.</p>
        <br />
        <NuxtLink to="/" class="back-link">&larr; Back to shop</NuxtLink>
      </div>
    </div>

    <div v-else class="container cart-container">
      <h1 class="cart-section-title">Your cart ({{ totalQuantity }})</h1>

      <div class="cart-page-layout">
        <!-- Left: items -->
        <div>
          <div v-for="item in items" :key="item.variant?.uuid ?? ''" class="cp-item">
            <div class="cp-item-img-wrap">
              <img
                v-if="getCartItemImage(item)"
                class="cp-item-img"
                :src="getCartItemImage(item)!"
                alt=""
              />
              <div v-else class="cp-item-img cp-item-img-ph">
                <PlaceholderSvg :size="28" />
              </div>
            </div>
            <div class="cp-item-body">
              <div class="cp-item-top">
                <div class="cp-item-info">
                  <div class="cp-item-name">{{ item.shop_product?.name }}</div>
                  <div
                    v-if="item.variant && item.shop_product && item.variant.name !== item.shop_product.name"
                    class="cp-item-variant"
                  >
                    {{ item.variant.name }}
                  </div>
                  <div v-if="item.package" class="cp-item-package">
                    Package: {{ item.package.name }}
                  </div>
                  <div class="cp-item-prices">
                    <span class="cp-item-price">{{ fp(item.final_price_value) }}</span>
                    <span
                      v-if="item.regular_price_value !== item.final_price_value"
                      class="cp-item-price-old"
                    >
                      {{ fp(item.regular_price_value) }}
                    </span>
                  </div>
                </div>
                <button
                  class="cp-item-remove"
                  aria-label="Remove"
                  @click="remove(item.variant?.uuid ?? '').catch(() => {})"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
              <div class="cp-item-bottom">
                <div class="qty-stepper">
                  <button
                    class="qty-step-btn"
                    @click="decrement(item.variant?.uuid ?? '').catch(() => {})"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <QtyInput
                    :value="getItemQty(item)"
                    :slug="(item.shop_product as any)?.slug || item.shop_product?.uuid || ''"
                    :on-set="(qty: number) => setQuantity(item.variant?.uuid ?? '', qty).catch(() => {})"
                  />
                  <button
                    class="qty-step-btn"
                    @click="increment(item.variant?.uuid ?? '').catch(() => {})"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: sidebar -->
        <div class="cart-page-sidebar">
          <!-- Discount -->
          <div v-if="hasDiscount && discount" class="discount-active">
            <span>Code: <strong>{{ discount.code }}</strong></span>
            <span class="discount-active-pct">-{{ discount.percentage_discount }}%</span>
            <button class="discount-remove" @click="removeDiscount().catch(() => {})">Remove</button>
          </div>
          <div v-else class="discount-row">
            <input
              v-model="discountCode"
              type="text"
              placeholder="Discount code"
              @keydown.enter="handleApplyDiscount"
            />
            <button class="discount-apply" @click="handleApplyDiscount">Apply</button>
          </div>

          <!-- Summary -->
          <div class="cart-page-summary">
            <div class="cart-summary-header">Subtotal ({{ totalQuantity }})</div>
            <div class="cart-summary-row">
              <span>Subtotal</span>
              <span>{{ fp(regularPrice) }}</span>
            </div>
            <div v-if="discountAmount > 0" class="cart-summary-row cart-summary-discount">
              <span>
                Discount{{ hasDiscount && discount ? ` (${discount.percentage_discount}%)` : '' }}
              </span>
              <span>-{{ fp(discountAmount) }}</span>
            </div>
            <div class="cart-summary-total">
              <span>Total</span>
              <span>{{ fp(finalPrice) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="cart-page-actions">
            <NuxtLink to="/checkout" class="cart-page-checkout-btn">
              Proceed to checkout
            </NuxtLink>
            <NuxtLink to="/" class="cart-page-continue-btn">
              Continue shopping
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

</template>
