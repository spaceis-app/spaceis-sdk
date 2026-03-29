import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { createSpaceIS } from '@spaceis/sdk';
import { SpaceISKey, type SpaceISContext } from '@spaceis/vue';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  const client = createSpaceIS({
    baseUrl: (config.public.spaceisApiUrl as string) || 'https://storefront-api.spaceis.app',
    shopUuid: (config.public.spaceisShopUuid as string) || '',
    lang: 'pl',
  });

  const qc = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
  });

  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient: qc });

  // CartManager only on client (needs localStorage)
  const cartManager = import.meta.client
    ? client.createCartManager({ autoLoad: true })
    : (null as any);

  nuxtApp.vueApp.provide(SpaceISKey, { client, cartManager } as SpaceISContext);
});
