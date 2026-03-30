<script setup lang="ts">
import { useCart, getItemQty, getCartItemImage } from '@spaceis/vue';
import { fp, getErrorMessage } from '~/utils/helpers';

const {
  cart,
  items,
  totalQuantity,
  finalPrice,
  regularPrice,
  hasDiscount,
  discount,
  isEmpty,
  increment,
  decrement,
  remove,
  setQuantity,
  applyDiscount,
  removeDiscount,
} = useCart();

const { isOpen, close } = useCartDrawer();
const router = useRouter();
const { success: toastSuccess, error: toastError } = useToast();

const discountCode = ref('');

const discountAmount = computed(() => regularPrice.value - finalPrice.value);

async function handleApplyDiscount() {
  const code = discountCode.value.trim();
  if (!code) return;
  try {
    await applyDiscount(code);
    toastSuccess('Discount applied!');
    discountCode.value = '';
  } catch (err) {
    toastError(getErrorMessage(err) || 'Invalid code');
  }
}

async function handleRemoveDiscount() {
  try {
    await removeDiscount();
    toastSuccess('Discount removed');
  } catch (err) {
    toastError(getErrorMessage(err));
  }
}

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
  <div :class="['drawer', { open: isOpen }]" role="dialog" aria-modal="true" aria-label="Cart">
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
        <li v-for="item in items" :key="item.variant?.uuid ?? ''" class="cart-item">
          <div class="cart-item-img-wrap">
            <img
              v-if="getCartItemImage(item)"
              class="cart-item-img"
              :src="getCartItemImage(item)!"
              alt=""
            />
            <div v-else class="cart-item-img-placeholder">
              <PlaceholderSvg :size="24" />
            </div>
          </div>
          <div class="cart-item-details">
            <div class="cart-item-top">
              <div class="cart-item-info">
                <div class="cart-item-name">{{ item.shop_product?.name }}</div>
                <div
                  v-if="item.variant && item.shop_product && item.variant.name !== item.shop_product.name"
                  class="cart-item-variant"
                >
                  {{ item.variant.name }}
                </div>
                <div v-if="item.package" class="cart-item-package">
                  Package: {{ item.package.name }}
                </div>
              </div>
              <button
                class="cart-item-remove"
                aria-label="Remove"
                @click="remove(item.variant?.uuid ?? '').catch(() => {})"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
            <div class="cart-item-bottom">
              <div class="cart-item-prices">
                <span class="cart-item-price-current">{{ fp(item.final_price_value) }}</span>
                <span
                  v-if="item.regular_price_value !== item.final_price_value"
                  class="cart-item-price-old"
                >
                  {{ fp(item.regular_price_value) }}
                </span>
              </div>
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
        </li>
      </ul>
    </div>

    <div v-if="!isEmpty" class="drawer-footer">
      <!-- Discount -->
      <div v-if="hasDiscount && discount" class="discount-active">
        <span>Code: <strong>{{ discount.code }}</strong></span>
        <span class="discount-active-pct">-{{ discount.percentage_discount }}%</span>
        <button class="discount-remove" @click="handleRemoveDiscount">Remove</button>
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
