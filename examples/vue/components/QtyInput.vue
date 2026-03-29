<script setup lang="ts">
import { useProduct, getProductLimits, snapQuantity } from '@spaceis/vue';

const props = defineProps<{
  value: number;
  slug: string;
  onSet: (qty: number) => void;
}>();

const slugRef = computed(() => props.slug); const { data: product } = useProduct(slugRef);

const limits = computed(() =>
  product.value ? getProductLimits(product.value) : { min: 1, max: 99, step: 1 },
);

const inputVal = ref(String(props.value));

watch(
  () => props.value,
  (v) => {
    inputVal.value = String(v);
  },
);

function commit() {
  // Don't commit until product limits are loaded
  if (!product.value) {
    inputVal.value = String(props.value);
    return;
  }
  let n = parseInt(inputVal.value, 10);
  if (isNaN(n)) n = props.value;
  n = snapQuantity(n, limits.value);
  inputVal.value = String(n);
  if (n !== props.value) {
    props.onSet(n);
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
}
</script>

<template>
  <input
    class="qty-input"
    type="text"
    inputmode="numeric"
    :value="inputVal"
    @input="inputVal = ($event.target as HTMLInputElement).value"
    @blur="commit"
    @keydown="handleKeydown"
  />
</template>
