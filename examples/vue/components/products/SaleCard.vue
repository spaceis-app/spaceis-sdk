<script setup lang="ts">
import type { Sale } from '@spaceis/vue';

const props = defineProps<{
  sale: Sale;
  index: number;
}>();

const countdown = ref('');
const endsAt = computed(() => props.sale.expires_at);

let interval: ReturnType<typeof setInterval> | null = null;

function pad(n: number) {
  return n < 10 ? '0' + n : '' + n;
}

function update() {
  if (!endsAt.value) return;
  const diff = new Date(endsAt.value).getTime() - Date.now();
  if (diff <= 0) {
    countdown.value = 'Ended';
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const parts: string[] = [];
  if (d > 0) parts.push(d + 'd');
  parts.push(pad(h) + ':' + pad(m) + ':' + pad(s));
  countdown.value = parts.join(' ') + ' left';
}

onMounted(() => {
  update();
  interval = setInterval(update, 1000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});
</script>

<template>
  <NuxtLink
    :to="`/?sale=${sale.slug || sale.uuid}`"
    class="product-card"
    :style="{ animationDelay: `${index * 0.04}s`, cursor: 'pointer', textDecoration: 'none' }"
  >
    <div class="product-img-wrap">
      <img
        v-if="sale.image"
        class="product-img"
        :src="sale.image"
        :alt="sale.name"
        loading="lazy"
      />
      <div v-else class="product-img-placeholder">
        <PlaceholderSvg :size="32" />
      </div>
      <div v-if="sale.percentage_discount" class="product-discount-badge">
        -{{ sale.percentage_discount }}%
      </div>
    </div>
    <div class="product-body">
      <div class="product-name">{{ sale.name }}</div>
      <div class="product-footer">
        <div>
          <span v-if="sale.percentage_discount" class="product-price" style="color: var(--red)">
            -{{ sale.percentage_discount }}%
          </span>
        </div>
        <span class="view-btn">View</span>
      </div>
      <div v-if="countdown" class="sale-timer">{{ countdown }}</div>
    </div>
  </NuxtLink>
</template>
