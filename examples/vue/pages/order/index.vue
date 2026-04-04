<script setup lang="ts">
useHead({ title: 'Order Summary' });

const route = useRoute();
const codeFromUrl = computed(() => (route.query.order as string) || '');
</script>

<template>
  <OrderContent :code-from-url="codeFromUrl" />
</template>