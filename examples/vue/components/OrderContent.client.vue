<script setup lang="ts">
import { useSpaceIS, fromApiQty } from '@spaceis/vue';
import { fp, getErrorMessage } from '~/utils/helpers';

const props = defineProps<{ codeFromUrl?: string }>();
const { client } = useSpaceIS();
const { error: toastError } = useToast();

const code = ref(props.codeFromUrl || '');
const order = ref<any>(null);
const loading = ref(false);

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

async function loadOrder(orderCode: string) {
  if (!orderCode.trim()) {
    toastError('Enter order code');
    return;
  }
  loading.value = true;
  try {
    const result = await client.orders.summary(orderCode.trim());
    order.value = result;
  } catch (err) {
    toastError(getErrorMessage(err));
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (props.codeFromUrl) {
    loadOrder(props.codeFromUrl);
  }
});

const status = computed(() => order.value?.status || 'pending');
const statusLabel = computed(() => statusLabels[status.value] || status.value);
</script>

<template>
  <div class="order-wrapper">
    <div class="order-card">
      <div class="order-card-title">Check order</div>
      <p style="color: var(--txt-3); font-size: 13px; margin-bottom: 16px">
        Enter an order code to view its status and details.
      </p>
      <div class="order-input-row">
        <input
          v-model="code"
          type="text"
          placeholder="e.g. ABC123DEF"
          autocomplete="off"
          @keydown.enter="loadOrder(code)"
        />
        <button :disabled="loading" @click="loadOrder(code)">
          {{ loading ? '...' : 'Check' }}
        </button>
      </div>
    </div>

    <template v-if="order">
      <div :class="['order-alert', `order-alert-${status}`]">
        <div class="order-alert-top">
          <span class="order-alert-label">{{ statusLabel }}</span>
          <span v-if="order.code" class="order-alert-code">{{ order.code }}</span>
        </div>
      </div>

      <div class="order-card">
        <div class="order-card-title">Order items</div>
        <div v-for="(item, idx) in (order.items || [])" :key="idx" class="order-item">
          <img v-if="item.image" class="order-item-img" :src="item.image" alt="" />
          <div class="order-item-info">
            <div class="order-item-name">{{ item.title }}</div>
            <div v-if="item.subtitle" class="order-item-qty">{{ item.subtitle }}</div>
            <div class="order-item-qty">Quantity: {{ fromApiQty(item.quantity || 0) }}</div>
          </div>
          <div class="order-item-price">{{ fp(item.final_price) }}</div>
        </div>
      </div>

      <div class="order-card">
        <div class="order-card-title">Summary</div>
        <div v-if="order.regular_total_price !== order.final_total_price" class="order-total-row">
          <span>Regular price</span>
          <span style="text-decoration: line-through">{{ fp(order.regular_total_price) }}</span>
        </div>
        <div v-if="order.discount?.totalDiscountedValue > 0" class="order-total-row discount">
          <span>Discount{{ order.discount.code ? ` (${order.discount.code})` : '' }}</span>
          <span>-{{ fp(order.discount.totalDiscountedValue) }}</span>
        </div>
        <div v-if="order.sale?.totalDiscountedValue > 0" class="order-total-row discount">
          <span>Sale</span>
          <span>-{{ fp(order.sale.totalDiscountedValue) }}</span>
        </div>
        <div v-if="order.package_included?.totalDiscountedValue > 0" class="order-total-row discount">
          <span>Package discount</span>
          <span>-{{ fp(order.package_included.totalDiscountedValue) }}</span>
        </div>
        <div class="order-total-row final">
          <span>Total</span>
          <span>{{ fp(order.final_total_price) }}</span>
        </div>
      </div>

      <NuxtLink to="/" class="back-link">&larr; Back to shop</NuxtLink>
    </template>
  </div>
</template>