<script setup lang="ts">
import { useCart } from '@spaceis/vue';

const SHOP_PAGES = ['/', '/packages', '/sales'];

const SHOP_TABS = [
  { href: '/', label: 'Products' },
  { href: '/packages', label: 'Packages' },
  { href: '/sales', label: 'Sales' },
];

const NAV_LINKS = [
  { href: '/', label: 'Shop', matchPaths: SHOP_PAGES },
  { href: '/voucher', label: 'Voucher' },
  { href: '/daily-reward', label: 'Daily Reward' },
  { href: '/page', label: 'Pages' },
  { href: '/statute', label: 'Terms' },
];

const route = useRoute();
const { toggle } = useCartDrawer();
const mobileMenuOpen = ref(false);
const mounted = ref(false);

const { totalQuantity } = useCart();

onMounted(() => {
  mounted.value = true;
});

const pathname = computed(() => route.path);

const isShopPage = computed(() => SHOP_PAGES.includes(pathname.value));

function isActive(link: typeof NAV_LINKS[number]) {
  if (link.matchPaths) return link.matchPaths.includes(pathname.value);
  return pathname.value === link.href || pathname.value.startsWith(link.href + '/');
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
  document.body.style.overflow = '';
}

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  document.body.style.overflow = mobileMenuOpen.value ? 'hidden' : '';
}
</script>

<template>
  <header class="header">
    <div class="container">
      <div class="header-inner">
        <NuxtLink to="/" class="nav-logo">SpaceIS</NuxtLink>

        <ul class="nav-links">
          <li v-for="link in NAV_LINKS" :key="link.href">
            <NuxtLink
              :to="link.href"
              :class="{ active: isActive(link) }"
            >
              {{ link.label }}
            </NuxtLink>
          </li>
        </ul>

        <div class="header-actions">
          <button class="btn-cart-icon" aria-label="Cart" @click="toggle">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span :class="['cart-badge-dot', { visible: totalQuantity > 0 }]">
              {{ totalQuantity > 0 ? totalQuantity : '' }}
            </span>
          </button>

          <button
            :class="['mobile-menu-btn', { active: mobileMenuOpen }]"
            aria-label="Menu"
            @click="toggleMobileMenu"
          >
            <span class="hamburger-line" />
            <span class="hamburger-line" />
            <span class="hamburger-line" />
          </button>
        </div>
      </div>
    </div>

    <!-- Shop sub-tabs -->
    <div v-if="isShopPage" class="sub-tabs-bar">
      <div class="container">
        <div class="sub-tabs">
          <NuxtLink
            v-for="tab in SHOP_TABS"
            :key="tab.href"
            :to="tab.href"
            :class="['sub-tab', { active: pathname === tab.href }]"
          >
            {{ tab.label }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </header>

  <!-- Mobile overlay + menu teleported to body -->
  <Teleport v-if="mounted" to="body">
    <div
      :class="['mobile-menu-overlay', { open: mobileMenuOpen }]"
      @click="closeMobileMenu"
    />
    <nav :class="['mobile-menu', { open: mobileMenuOpen }]">
      <ul class="mobile-menu-links">
        <li v-for="link in NAV_LINKS" :key="link.href">
          <NuxtLink
            :to="link.href"
            :class="{ active: isActive(link) }"
            @click="closeMobileMenu"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </Teleport>
</template>
