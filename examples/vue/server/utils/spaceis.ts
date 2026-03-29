import { createSpaceIS } from '@spaceis/sdk';

export function useServerSpaceIS() {
  const config = useRuntimeConfig();
  return createSpaceIS({
    baseUrl: config.public.spaceisApiUrl as string || 'https://storefront-api.spaceis.app',
    shopUuid: config.public.spaceisShopUuid as string || '',
    lang: 'pl',
  });
}
