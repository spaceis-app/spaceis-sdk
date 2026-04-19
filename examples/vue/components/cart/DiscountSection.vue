<script setup lang="ts">
import { useCart } from '@spaceis/vue';
import { getErrorMessage } from '~/utils/helpers';

const { hasDiscount, discount, applyDiscount, removeDiscount } = useCart();
const { success: toastSuccess, error: toastError } = useToast();

const code = ref('');
const pending = ref(false);

async function apply() {
  const trimmed = code.value.trim();
  if (!trimmed || pending.value) return;
  pending.value = true;
  try {
    await applyDiscount(trimmed);
    toastSuccess('Discount applied!');
    code.value = '';
  } catch (err) {
    toastError(getErrorMessage(err) || 'Invalid code');
  } finally {
    pending.value = false;
  }
}

async function remove() {
  if (pending.value) return;
  pending.value = true;
  try {
    await removeDiscount();
  } catch (err) {
    toastError(getErrorMessage(err));
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div v-if="hasDiscount && discount" class="discount-active">
    <span>
      Code: <strong>{{ discount.code }}</strong>
    </span>
    <span class="discount-active-pct">-{{ discount.percentage_discount }}%</span>
    <button class="discount-remove" :disabled="pending" @click="remove">Remove</button>
  </div>
  <div v-else class="discount-row">
    <input
      v-model="code"
      type="text"
      placeholder="Discount code"
      autocomplete="off"
      maxlength="64"
      @keydown.enter="apply"
    />
    <button class="discount-apply" :disabled="pending" @click="apply">
      {{ pending ? '...' : 'Apply' }}
    </button>
  </div>
</template>
