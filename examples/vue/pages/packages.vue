<script setup lang="ts">
import { usePackages, useCategories, type ShopCategory } from '@spaceis/vue';

useHead({ title: 'Packages' });

const page = ref(1);
const categoryUuid = ref<string | null>(null);
const subCategoryUuid = ref<string | null>(null);
const selectedParent = ref<ShopCategory | null>(null);

const activeCategoryUuid = computed(() => subCategoryUuid.value ?? categoryUuid.value ?? undefined);

const { data: categoriesData } = useCategories();
const categories = computed(() => (categoriesData.value ?? []).filter((c: ShopCategory) => c.is_active));

const { data: packagesData, isLoading } = usePackages(
  computed(() => ({
    page: page.value,
    category_uuid: activeCategoryUuid.value,
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

const activeChildren = computed(() =>
  (selectedParent.value?.children ?? []).filter((c: ShopCategory) => c.is_active),
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
          @click="subCategoryUuid = null"
        >
          All
        </button>
        <button
          v-for="child in activeChildren"
          :key="child.uuid"
          :class="['cat-btn', 'cat-child', { active: subCategoryUuid === child.uuid }]"
          @click="() => { subCategoryUuid = child.uuid; page = 1; }"
        >
          {{ child.name }}
        </button>
      </div>

      <!-- Packages grid -->
      <ProductGridSkeleton v-if="isLoading" />
      <div v-else-if="packagesData && packagesData.data.length > 0" class="products-grid">
        <ProductCard
          v-for="(pkg, idx) in packagesData.data"
          :key="pkg.shop_product.uuid"
          :product="{
            ...pkg.shop_product,
            minimal_price: pkg.minimal_price,
            minimal_base_price: pkg.minimal_base_price,
            percentage_discount: pkg.percentage_discount,
          } as any"
          :index="idx"
        />
      </div>
      <div v-else class="empty-state">
        <p>No packages available.</p>
      </div>

      <AppPagination :meta="packagesData?.meta" @page-change="page = $event" />
    </section>

    <ClientOnly>
      <CommunitySection />
    </ClientOnly>
  </div>
</template>
