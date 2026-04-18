<script setup lang="ts">
import type { PaginationMeta } from '@spaceis/vue';

const props = defineProps<{
  meta: PaginationMeta | undefined;
}>();

const emit = defineEmits<{
  pageChange: [page: number];
}>();

function changePage(page: number) {
  emit('pageChange', page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <div v-if="meta && meta.last_page > 1" class="pagination">
    <button
      class="page-btn"
      :disabled="meta.current_page <= 1"
      @click="changePage(meta.current_page - 1)"
    >
      &larr; Previous
    </button>
    <span class="page-info">
      {{ meta.current_page }} / {{ meta.last_page }}
    </span>
    <button
      class="page-btn"
      :disabled="meta.current_page >= meta.last_page"
      @click="changePage(meta.current_page + 1)"
    >
      Next &rarr;
    </button>
  </div>
</template>
