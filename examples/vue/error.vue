<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number;
    message: string;
  };
}>();

useHead({ title: `${props.error.statusCode} - Error` });

function handleClear() {
  clearError({ redirect: '/' });
}
</script>

<template>
  <div class="page-content">
    <div class="page-not-found">
      <div class="icon" style="font-size: 40px">{{ error.statusCode }}</div>
      <h2>{{ error.statusCode === 404 ? 'Page not found' : 'Something went wrong' }}</h2>
      <p>{{ error.message }}</p>
      <button class="back-link" style="margin-top: 16px" @click="handleClear">
        &larr; Back to shop
      </button>
    </div>
  </div>
</template>
