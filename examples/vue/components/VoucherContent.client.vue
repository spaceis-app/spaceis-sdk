<script setup lang="ts">
import { useSpaceIS, useRecaptcha } from '@spaceis/vue';
import { getErrorMessage } from '~/utils/helpers';

const { client } = useSpaceIS();
const { execute: executeRecaptcha } = useRecaptcha();
const { success: toastSuccess, error: toastError } = useToast();

const nick = ref('');
const code = ref('');
const loading = ref(false);
const result = ref<{ message: string; type: 'success' | 'error' } | null>(null);

async function handleRedeem() {
  if (!nick.value.trim()) {
    toastError('Player nickname is required');
    return;
  }
  if (!code.value.trim()) {
    toastError('Voucher code is required');
    return;
  }

  result.value = null;
  loading.value = true;

  try {
    const token = await executeRecaptcha('voucher');
    const res = await client.vouchers.redeem({
      nick: nick.value.trim(),
      code: code.value.trim(),
      'g-recaptcha-response': token,
    });
    const msg = res.message || 'Voucher redeemed!';
    result.value = { message: msg, type: 'success' };
    toastSuccess(msg);
    code.value = '';
  } catch (err) {
    const msg = getErrorMessage(err);
    result.value = { message: msg, type: 'error' };
    toastError(msg);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <div class="container voucher-layout">
      <div class="voucher-card">
        <div class="voucher-card-title">Redeem voucher</div>
        <div class="voucher-card-desc">
          Enter your player nickname and voucher code to redeem it.
        </div>

        <div class="voucher-form">
          <div class="form-field">
            <label class="form-label" for="voucher-nick">Player nickname *</label>
            <input
              id="voucher-nick"
              v-model="nick"
              type="text"
              placeholder="Steve"
              autocomplete="off"
            />
          </div>
          <div class="form-field">
            <label class="form-label" for="voucher-code">Voucher code *</label>
            <input
              id="voucher-code"
              v-model="code"
              type="text"
              placeholder="ABCD-1234-EFGH"
              autocomplete="off"
              style="letter-spacing: 0.1em; text-transform: uppercase; font-family: var(--mono)"
              @keydown.enter="handleRedeem"
            />
          </div>
          <button
            class="voucher-submit"
            :disabled="loading"
            @click="handleRedeem"
          >
            {{ loading ? 'Checking...' : 'Redeem voucher' }}
          </button>
        </div>

        <div v-if="result" :class="['result-box', 'show', result.type]">
          {{ result.message }}
        </div>
      </div>
    </div>
  </div>
</template>
