<script setup lang="ts">
import {
  useCart,
  useCheckout,
  useRecaptcha,
  getItemQty,
  getCartItemImage,
} from '@spaceis/vue';
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
const { methods, agreements, placeOrder } = useCheckout();
const { execute: executeRecaptcha } = useRecaptcha();
const { success: toastSuccess, error: toastError } = useToast();

const nick = ref('');
const email = ref('');
const selectedMethodUuid = ref<string | null>(null);
const checkedAgreements = ref(new Set<string>());
const discountCode = ref('');

// Auto-select first payment method
watch(
  () => methods.data.value,
  (data) => {
    if (data && data.length > 0 && !selectedMethodUuid.value) {
      selectedMethodUuid.value = data[0]!.uuid;
    }
  },
  { immediate: true },
);

const selectedMethod = computed(() =>
  methods.data.value?.find((m: any) => m.uuid === selectedMethodUuid.value),
);
const commission = computed(() => selectedMethod.value?.commission ?? 0);
const commissionAmount = computed(() =>
  commission.value > 0 ? Math.round((finalPrice.value * commission.value) / 100) : 0,
);
const totalWithCommission = computed(() => finalPrice.value + commissionAmount.value);
const discountAmount = computed(() => regularPrice.value - finalPrice.value);

async function handlePlaceOrder() {
  const errors: string[] = [];
  if (!nick.value.trim()) errors.push('Player nickname is required');
  if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) errors.push('Enter a valid email');
  if (!selectedMethodUuid.value) errors.push('Choose payment method');

  if (errors.length > 0) {
    errors.forEach((e) => toastError(e));
    return;
  }

  try {
    const recaptchaToken = await executeRecaptcha('checkout');
    const result = await placeOrder.mutateAsync({
      email: email.value.trim(),
      first_name: nick.value.trim(),
      payment_method_uuid: selectedMethodUuid.value!,
      'g-recaptcha-response': recaptchaToken,
      agreements: Array.from(checkedAgreements.value),
    });

    if (result.redirect_url) {
      window.location.href = result.redirect_url;
    }
  } catch (err) {
    toastError(getErrorMessage(err));
  }
}

async function handleApplyDiscount() {
  const code = discountCode.value.trim();
  if (!code) return;
  try {
    await applyDiscount(code);
    toastSuccess('Discount applied!');
    discountCode.value = '';
  } catch (err) {
    toastError(getErrorMessage(err));
  }
}

function toggleAgreement(uuid: string, checked: boolean) {
  const next = new Set(checkedAgreements.value);
  if (checked) {
    next.add(uuid);
  } else {
    next.delete(uuid);
  }
  checkedAgreements.value = next;
}
</script>

<template>
  <div>
    <div v-if="isEmpty && !items.length" class="container">
      <div class="empty-state">
        <div class="icon">&#128722;</div>
        <p>Your cart is empty.</p>
        <br />
        <NuxtLink to="/" class="back-link">&larr; Back to shop</NuxtLink>
      </div>
    </div>

    <div v-else class="container">
      <div class="checkout-layout">
        <!-- Left: Order summary -->
        <div>
          <h1 class="section-title">Order summary</h1>

          <!-- Cart items -->
          <div>
            <div v-for="item in items" :key="item.variant?.uuid ?? ''" class="checkout-item">
              <img
                v-if="getCartItemImage(item)"
                class="checkout-item-img"
                :src="getCartItemImage(item)!"
                alt=""
              />
              <div v-else class="checkout-item-img-placeholder">
                <PlaceholderSvg :size="18" />
              </div>
              <div class="checkout-item-details">
                <div class="checkout-item-top">
                  <div class="checkout-item-info">
                    <div class="checkout-item-name">{{ item.shop_product?.name }}</div>
                    <div
                      v-if="item.variant && item.shop_product && item.variant.name !== item.shop_product.name"
                      class="checkout-item-variant"
                    >
                      {{ item.variant.name }}
                    </div>
                    <div v-if="item.package" class="checkout-item-package">
                      Package: {{ item.package.name }}
                    </div>
                  </div>
                  <button
                    class="checkout-item-remove"
                    aria-label="Remove"
                    @click="remove(item.variant?.uuid ?? '').catch((err) => toastError(getErrorMessage(err)))"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
                <div class="checkout-item-bottom">
                  <div class="checkout-item-prices">
                    <span class="checkout-item-price">{{ fp(item.final_price_value) }}</span>
                    <span
                      v-if="item.regular_price_value !== item.final_price_value"
                      class="checkout-item-old-price"
                    >
                      {{ fp(item.regular_price_value) }}
                    </span>
                  </div>
                  <div class="qty-stepper">
                    <button
                      class="qty-step-btn"
                      @click="decrement(item.variant?.uuid ?? '').catch((err) => toastError(getErrorMessage(err)))"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                    <QtyInput
                      :value="getItemQty(item)"
                      :slug="(item.shop_product as any)?.slug || item.shop_product?.uuid || ''"
                      :on-set="(q: number) => setQuantity(item.variant?.uuid ?? '', q).catch((err) => toastError(getErrorMessage(err)))"
                    />
                    <button
                      class="qty-step-btn"
                      @click="increment(item.variant?.uuid ?? '').catch((err) => toastError(getErrorMessage(err)))"
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

          <!-- Discount -->
          <div class="checkout-card">
            <div class="checkout-card-title">Discount code</div>
            <div v-if="hasDiscount && discount" class="discount-active">
              <span>Code: <strong>{{ discount.code }}</strong></span>
              <span class="discount-active-pct">-{{ discount.percentage_discount }}%</span>
              <button class="discount-remove" @click="removeDiscount().catch((err) => toastError(getErrorMessage(err)))">Remove</button>
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
          </div>
        </div>

        <!-- Right: Form -->
        <div class="checkout-form-col">
          <h1 class="section-title">Transaction details</h1>

          <!-- Contact -->
          <div class="checkout-card">
            <div class="form-grid">
              <div class="form-field">
                <label class="form-label" for="checkout-nick">Minecraft username</label>
                <input
                  id="checkout-nick"
                  v-model="nick"
                  type="text"
                  placeholder="Steve"
                  autocomplete="nickname"
                />
              </div>
              <div class="form-field">
                <label class="form-label" for="checkout-email">Email</label>
                <input
                  id="checkout-email"
                  v-model="email"
                  type="email"
                  placeholder="you@email.com"
                  autocomplete="email"
                />
              </div>
            </div>
          </div>

          <!-- Payment methods -->
          <div class="checkout-card">
            <div class="checkout-card-title">Payment method</div>
            <div class="payment-methods">
              <div v-if="methods.isLoading.value" class="spinner" />
              <template v-else-if="methods.data.value && methods.data.value.length > 0">
                <label
                  v-for="m in methods.data.value"
                  :key="m.uuid"
                  :class="['payment-method', { selected: selectedMethodUuid === m.uuid }]"
                  @click="selectedMethodUuid = m.uuid"
                >
                  <input
                    type="radio"
                    name="payment_method"
                    :value="m.uuid"
                    :checked="selectedMethodUuid === m.uuid"
                    @change="selectedMethodUuid = m.uuid"
                  />
                  <span class="payment-method-name">{{ m.name }}</span>
                  <span v-if="m.commission" class="payment-commission">(+{{ m.commission }}%)</span>
                </label>
              </template>
              <p v-else style="color: var(--txt-3); font-size: 13px">
                No payment methods available.
              </p>
            </div>
          </div>

          <!-- Agreements -->
          <div v-if="agreements.data.value && agreements.data.value.length > 0" style="margin-bottom: 16px">
            <div class="agreements">
              <label v-for="a in agreements.data.value" :key="a.uuid" class="agreement-item">
                <input
                  type="checkbox"
                  :checked="checkedAgreements.has(a.uuid)"
                  @change="toggleAgreement(a.uuid, ($event.target as HTMLInputElement).checked)"
                />
                <span>{{ a.name }}</span>
              </label>
            </div>
          </div>

          <!-- Price summary -->
          <div class="cart-page-summary">
            <div class="cart-summary-header">Order summary</div>
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
            <div v-if="commission > 0 && selectedMethod" class="cart-summary-row">
              <span>Fee ({{ selectedMethod.name }} +{{ commission }}%)</span>
              <span>+{{ fp(commissionAmount) }}</span>
            </div>
            <div class="cart-summary-total">
              <span>Total</span>
              <span>{{ fp(totalWithCommission) }}</span>
            </div>
          </div>

          <button
            class="place-order-btn"
            :disabled="placeOrder.isPending.value"
            @click="handlePlaceOrder"
          >
            {{ placeOrder.isPending.value ? 'Processing...' : `Place order ${fp(totalWithCommission)}` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
