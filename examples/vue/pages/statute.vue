<script setup lang="ts">
import DOMPurify from 'isomorphic-dompurify';
import { useStatute } from '@spaceis/vue';

useHead({ title: 'Terms' });

const { data: statute, isLoading } = useStatute();

const sanitizedContent = computed(() => DOMPurify.sanitize(statute.value?.content ?? ''));

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}
</script>

<template>
  <div class="statute-content">
    <div v-if="isLoading" class="spinner" />

    <div v-else-if="!statute" class="empty-state">
      <p>No statute available.</p>
    </div>

    <div v-else class="statute-content-panel">
      <h1 v-if="statute.title" class="statute-title">{{ statute.title }}</h1>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="statute-body" v-html="sanitizedContent" />
      <div class="statute-meta">
        <span>Created: {{ formatDate(statute.created_at) }}</span>
        <span>Last updated: {{ formatDate(statute.updated_at) }}</span>
      </div>
    </div>
  </div>
</template>
