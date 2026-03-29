<script setup lang="ts">
import { usePages } from '@spaceis/vue';

useHead({ title: 'Pages' });

const { data: pages, isLoading } = usePages();

const pageList = computed(() => (pages.value as any[]) ?? []);
</script>

<template>
  <div class="page-content">
    <h1 class="page-heading">Pages</h1>

    <div v-if="isLoading" class="spinner" />
    <div v-else-if="pageList.length === 0" class="empty-state">
      <p>No pages available.</p>
    </div>
    <template v-else>
      <NuxtLink
        v-for="page in pageList"
        :key="page.uuid"
        :to="`/page/${page.slug}`"
        class="pages-list-item"
      >
        {{ page.title }}
        <span class="pages-list-item-slug">{{ page.slug }}</span>
      </NuxtLink>
    </template>
  </div>
</template>
