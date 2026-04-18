<script setup lang="ts">
import { useSpaceIS, useRecaptcha } from '@spaceis/vue';
import { getErrorMessage } from '~/utils/helpers';

const { client } = useSpaceIS();
const { execute: executeRecaptcha } = useRecaptcha();
const { success: toastSuccess, error: toastError } = useToast();

const nick = ref('');
const loading = ref(false);
const result = ref<{ message: string; type: 'success' | 'error' } | null>(null);

async function handleClaim() {
  if (!nick.value.trim()) {
    toastError('Player nickname is required');
    return;
  }

  result.value = null;
  loading.value = true;

  try {
    const token = await executeRecaptcha('daily_reward');
    const res = await client.dailyRewards.claim({
      nick: nick.value.trim(),
      'g-recaptcha-response': token,
    });
    const msg = res.message || 'Daily reward claimed!';
    result.value = { message: msg, type: 'success' };
    toastSuccess(msg);
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
        <div class="voucher-card-title">Daily reward</div>
        <div class="voucher-card-desc">
          Claim a free reward — resets every 24 hours.
        </div>

        <div class="voucher-form">
          <div class="form-field">
            <label class="form-label" for="daily-nick">Player nickname *</label>
            <input
              id="daily-nick"
              v-model="nick"
              type="text"
              placeholder="Steve"
              autocomplete="off"
              @keydown.enter="handleClaim"
            />
          </div>
          <button
            class="voucher-submit success-btn"
            :disabled="loading"
            @click="handleClaim"
          >
            {{ loading ? 'Claiming...' : 'Claim reward' }}
          </button>
        </div>

        <div v-if="result" :class="['result-box', 'show', result.type]">
          {{ result.message }}
        </div>
      </div>
    </div>
  </div>
</template>
