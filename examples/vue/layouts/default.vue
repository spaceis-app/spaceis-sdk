<template>
  <AppHeader />
  <main>
    <slot />
  </main>
  <CartDrawer />
  <AppFooter />
  <ClientOnly>
    <ToastContainer />
  </ClientOnly>
</template>