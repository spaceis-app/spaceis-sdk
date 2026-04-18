<script setup lang="ts">
import { useCart } from '@spaceis/vue';
import { fp } from '~/utils/helpers';

const {
  items,
  totalQuantity,
  finalPrice,
  regularPrice,
  hasDiscount,
  discount,
  isEmpty,
  cart,
} = useCart();

const discountAmount = computed(() => regularPrice.value - finalPrice.value);
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
          <CartItemRow
            v-for="item in items"
            :key="item.variant?.uuid ?? ''"
            :item="item"
            layout="cart"
          />
        </div>

        <!-- Right: sidebar -->
        <div class="cart-page-sidebar">
          <!-- Discount -->
          <DiscountSection />

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
