<script setup lang="ts">
import { useProducts, useCategories, type ShopCategory } from '@spaceis/vue';

useHead({ title: 'Products' });

const route = useRoute();
const saleFilter = computed(() => (route.query.sale as string) || undefined);

const page = ref(1);
const categoryUuid = ref<string | null>(null);
const subCategoryUuid = ref<string | null>(null);
const selectedParent = ref<ShopCategory | null>(null);

const activeCategoryUuid = computed(() => subCategoryUuid.value ?? categoryUuid.value ?? undefined);

const { data: categoriesData } = useCategories();
const categories = computed(() => (categoriesData.value ?? []).filter((c: any) => c.is_active));

const { data: productsData, isLoading } = useProducts(
  computed(() => ({
    page: page.value,
    category_uuid: activeCategoryUuid.value,
    sale_slug: saleFilter.value,
  })),
);

function selectCategory(cat: ShopCategory | null) {
  if (cat === null) {
    categoryUuid.value = null;
    subCategoryUuid.value = null;
    selectedParent.value = null;
  } else {
    categoryUuid.value = cat.uuid;
    subCategoryUuid.value = null;
    selectedParent.value = cat;
  }
  page.value = 1;
}

function selectSubCategory(uuid: string | null) {
  subCategoryUuid.value = uuid;
  page.value = 1;
}

const activeChildren = computed(() =>
  (selectedParent.value?.children ?? []).filter((c: any) => c.is_active),
);
</script>

<template>
  <div class="container">
    <section class="section">
      <!-- Category filters -->
      <div class="categories">
        <button
          :class="['cat-btn', { active: categoryUuid === null }]"
          @click="selectCategory(null)"
        >
          All
        </button>
        <button
          v-for="cat in categories"
          :key="cat.uuid"
          :class="['cat-btn', { active: categoryUuid === cat.uuid }]"
          @click="selectCategory(cat)"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- Subcategories -->
      <div v-if="activeChildren.length > 0" class="categories subcategories">
        <button
          :class="['cat-btn', 'cat-child', { active: subCategoryUuid === null }]"
          @click="selectSubCategory(null)"
        >
          All
        </button>
        <button
          v-for="child in activeChildren"
          :key="child.uuid"
          :class="['cat-btn', 'cat-child', { active: subCategoryUuid === child.uuid }]"
          @click="selectSubCategory(child.uuid)"
        >
          {{ child.name }}
        </button>
      </div>

      <!-- Products grid -->
      <ProductGridSkeleton v-if="isLoading" />
      <div v-else-if="productsData && productsData.data.length > 0" class="products-grid">
        <ProductCard
          v-for="(product, idx) in productsData.data"
          :key="product.uuid"
          :product="product"
          :index="idx"
        />
      </div>
      <div v-else class="empty-state">
        <p>No products in this category.</p>
      </div>

      <!-- Pagination -->
      <AppPagination :meta="productsData?.meta" @page-change="page = $event" />
    </section>

    <ClientOnly>
      <CommunitySection />
    </ClientOnly>
  </div>
</template>
