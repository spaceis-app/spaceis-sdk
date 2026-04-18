<script setup lang="ts">
import { useCart } from '@spaceis/vue';
import { fp } from '~/utils/helpers';

const {
  cart,
  items,
  totalQuantity,
  finalPrice,
  regularPrice,
  hasDiscount,
  discount,
  isEmpty,
} = useCart();

const { isOpen, close } = useCartDrawer();
const router = useRouter();

const drawerRef = ref<HTMLElement | null>(null);
useFocusTrap(drawerRef, isOpen);

// Escape closes the drawer while open
watch(isOpen, (open) => {
  if (!import.meta.client) return;
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };
  if (open) {
    window.addEventListener('keydown', onKey);
  }
  return () => window.removeEventListener('keydown', onKey);
});

const discountAmount = computed(() => regularPrice.value - finalPrice.value);

function goToCheckout() {
  close();
  router.push('/checkout');
}

function goToCart() {
  close();
  router.push('/cart');
}
</script>

<template>
  <div :class="['overlay', { open: isOpen }]" @click="close" />
  <div
    ref="drawerRef"
    :class="['drawer', { open: isOpen }]"
    role="dialog"
    aria-modal="true"
    aria-label="Cart"
  >
    <div class="drawer-header">
      <span class="drawer-title">
        CART{{ totalQuantity > 0 ? ` (${totalQuantity})` : '' }}
      </span>
      <button class="close-btn" aria-label="Close" @click="close">&#10005;</button>
    </div>

    <div class="drawer-body">
      <div v-if="!cart && isEmpty" class="empty-state">
        <div class="icon">&#128722;</div>
        <p>Your cart is empty</p>
        <button class="cart-action-secondary" style="margin-top: 16px" @click="close">
          Continue Shopping
        </button>
      </div>
      <ul v-else class="cart-items-list">
        <CartItemRow
          v-for="item in items"
          :key="item.variant?.uuid ?? ''"
          :item="item"
          layout="drawer"
        />
      </ul>
    </div>

    <div v-if="!isEmpty" class="drawer-footer">
      <!-- Discount -->
      <DiscountSection />

      <!-- Summary -->
      <div class="cart-summary-panel">
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
      <div class="cart-actions">
        <button class="cart-action-primary" @click="goToCheckout">
          Proceed to checkout <span style="margin-left: 6px">&rarr;</span>
        </button>
        <button class="cart-action-secondary" @click="goToCart">
          View cart
        </button>
      </div>
    </div>
  </div>
</template>
