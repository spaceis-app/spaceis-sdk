<script setup lang="ts">
import DOMPurify from 'isomorphic-dompurify';
import { usePage } from '@spaceis/vue';

const route = useRoute();
const slug = computed(() => route.params.slug as string);

const { data: page, isLoading, error } = usePage(slug);

useSeoMeta({
  title: () => page.value?.title || 'Page',
});

const sanitizedContent = computed(() => DOMPurify.sanitize(page.value?.content ?? ''));

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}
</script>

<template>
  <div class="page-content">
    <div v-if="isLoading" class="spinner" />

    <div v-else-if="error || !page" class="page-not-found">
      <div class="icon" style="font-size: 40px">?</div>
      <h2>Page not found</h2>
      <p>The requested page does not exist.</p>
      <NuxtLink to="/page" class="back-link">&larr; All pages</NuxtLink>
    </div>

    <div v-else class="page-content-panel">
      <h1 v-if="page.title" class="page-title">{{ page.title }}</h1>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="page-body" v-html="sanitizedContent" />
      <div class="page-meta">
        <span>Last updated: {{ formatDate(page.updated_at) }}</span>
      </div>
    </div>
  </div>
</template>
