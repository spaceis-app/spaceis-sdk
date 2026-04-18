<script setup lang="ts">
import {
  useCart,
  useCheckout,
  useRecaptcha,
} from '@spaceis/vue';
import { fp, getErrorMessage } from '~/utils/helpers';
import { calcPaymentFee, commissionPercent, isSafeRedirect } from '~/utils/checkout-utils';


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
const { methods, agreements, placeOrder } = useCheckout();
const { execute: executeRecaptcha } = useRecaptcha();
const { success: toastSuccess, error: toastError } = useToast();

const nick = ref('');
const email = ref('');
const selectedMethodUuid = ref<string | null>(null);
const checkedAgreements = ref(new Set<string>());

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
  methods.data.value?.find((m) => m.uuid === selectedMethodUuid.value),
);
const commission = computed(() => selectedMethod.value?.commission ?? 1);
const commissionAmount = computed(() => calcPaymentFee(finalPrice.value, commission.value));
const commissionPct = computed(() => commissionPercent(commission.value));
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
    const config = useRuntimeConfig();
    const result = await placeOrder.mutateAsync({
      email: email.value.trim(),
      first_name: nick.value.trim(),
      payment_method_uuid: selectedMethodUuid.value!,
      'g-recaptcha-response': recaptchaToken,
      agreements: Array.from(checkedAgreements.value),
      return_url: (config.public.returnUrl as string) || undefined,
      cancel_url: (config.public.cancelUrl as string) || undefined,
    });

    if (isSafeRedirect(result.redirect_url)) {
      window.location.href = result.redirect_url;
    }
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
            <CartItemRow
              v-for="item in items"
              :key="item.variant?.uuid ?? ''"
              :item="item"
              layout="checkout"
            />
          </div>

          <!-- Discount -->
          <div class="checkout-card">
            <div class="checkout-card-title">Discount code</div>
            <DiscountSection />
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
                  maxlength="32"
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
                  maxlength="255"
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
                  <span v-if="commissionPercent(m.commission) > 0" class="payment-commission">(+{{ commissionPercent(m.commission) }}%)</span>
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
            <div v-if="commissionPct > 0 && selectedMethod" class="cart-summary-row">
              <span>Fee ({{ selectedMethod.name }} +{{ commissionPct }}%)</span>
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
