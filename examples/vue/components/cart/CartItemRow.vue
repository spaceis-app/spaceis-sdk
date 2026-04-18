<script setup lang="ts">
import {
  useCart,
  getItemQty,
  getCartItemImage,
  type CartItem,
} from '@spaceis/vue';
import { fp, getErrorMessage } from '~/utils/helpers';

type Layout = 'drawer' | 'cart' | 'checkout';

const props = defineProps<{
  item: CartItem;
  layout: Layout;
}>();

const { increment, decrement, remove, setQuantity } = useCart();
const { error: toastError } = useToast();

const variantUuid = computed(() => props.item.variant?.uuid ?? '');
const imgSrc = computed(() => getCartItemImage(props.item));
const displayQty = computed(() => getItemQty(props.item));
const productName = computed(() => props.item.shop_product?.name ?? '');
const showVariant = computed(
  () =>
    !!props.item.variant &&
    !!props.item.shop_product &&
    props.item.variant.name !== props.item.shop_product.name,
);
const unitLabel = computed(() => (props.item.shop_product as { unit?: string })?.unit || 'szt');
const slug = computed(
  () => (props.item.shop_product as { slug?: string })?.slug || props.item.shop_product?.uuid || '',
);

function toastIfError(p: Promise<unknown>) {
  p.catch((err) => toastError(getErrorMessage(err)));
}

// Class maps per layout — keeps CSS for drawer/cart/checkout scoped to each surface.
const rootClass = computed(
  () =>
    ({ drawer: 'cart-item', cart: 'cp-item', checkout: 'checkout-item' })[props.layout],
);
const imgClass = computed(
  () =>
    ({ drawer: 'cart-item-img', cart: 'cp-item-img', checkout: 'checkout-item-img' })[props.layout],
);
const phClass = computed(
  () =>
    ({
      drawer: 'cart-item-img-placeholder',
      cart: 'cp-item-img cp-item-img-ph',
      checkout: 'checkout-item-img-placeholder',
    })[props.layout],
);
const phSize = computed(() => ({ drawer: 24, cart: 28, checkout: 18 })[props.layout]);
const imgWrapClass = computed(
  () => ({ drawer: 'cart-item-img-wrap', cart: 'cp-item-img-wrap', checkout: '' })[props.layout],
);
const detailsClass = computed(
  () =>
    ({ drawer: 'cart-item-details', cart: 'cp-item-body', checkout: 'checkout-item-details' })[
      props.layout
    ],
);
const topClass = computed(
  () =>
    ({ drawer: 'cart-item-top', cart: 'cp-item-top', checkout: 'checkout-item-top' })[props.layout],
);
const infoClass = computed(
  () =>
    ({ drawer: 'cart-item-info', cart: 'cp-item-info', checkout: 'checkout-item-info' })[
      props.layout
    ],
);
const nameClass = computed(
  () =>
    ({ drawer: 'cart-item-name', cart: 'cp-item-name', checkout: 'checkout-item-name' })[
      props.layout
    ],
);
const variantClass = computed(
  () =>
    ({
      drawer: 'cart-item-variant',
      cart: 'cp-item-variant',
      checkout: 'checkout-item-variant',
    })[props.layout],
);
const pkgClass = computed(
  () =>
    ({
      drawer: 'cart-item-package',
      cart: 'cp-item-package',
      checkout: 'checkout-item-package',
    })[props.layout],
);
const removeBtnClass = computed(
  () =>
    ({ drawer: 'cart-item-remove', cart: 'cp-item-remove', checkout: 'checkout-item-remove' })[
      props.layout
    ],
);
const bottomClass = computed(
  () =>
    ({ drawer: 'cart-item-bottom', cart: 'cp-item-bottom', checkout: 'checkout-item-bottom' })[
      props.layout
    ],
);
const pricesClass = computed(
  () =>
    ({ drawer: 'cart-item-prices', cart: 'cp-item-prices', checkout: 'checkout-item-prices' })[
      props.layout
    ],
);
const priceClass = computed(
  () =>
    ({
      drawer: 'cart-item-price-current',
      cart: 'cp-item-price',
      checkout: 'checkout-item-price',
    })[props.layout],
);
const oldPriceClass = computed(
  () =>
    ({
      drawer: 'cart-item-price-old',
      cart: 'cp-item-price-old',
      checkout: 'checkout-item-old-price',
    })[props.layout],
);
const removeLabel = computed(() =>
  productName.value ? `Remove ${productName.value}` : 'Remove',
);
const removeIconSize = computed(() => (props.layout === 'checkout' ? 14 : 16));
const removeIconStroke = computed(() => (props.layout === 'checkout' ? 2 : 1.5));
// Cart page shows price inside the info column; drawer/checkout show it next to qty.
const priceBeforeQty = computed(() => props.layout !== 'cart');
</script>

<template>
  <component :is="layout === 'drawer' ? 'li' : 'div'" :class="rootClass">
    <div v-if="imgWrapClass" :class="imgWrapClass">
      <img v-if="imgSrc" :class="imgClass" :src="imgSrc" alt="" />
      <div v-else :class="phClass">
        <PlaceholderSvg :size="phSize" />
      </div>
    </div>
    <template v-else>
      <img v-if="imgSrc" :class="imgClass" :src="imgSrc" alt="" />
      <div v-else :class="phClass">
        <PlaceholderSvg :size="phSize" />
      </div>
    </template>
    <div :class="detailsClass">
      <div :class="topClass">
        <div :class="infoClass">
          <div :class="nameClass">{{ productName }}</div>
          <div v-if="showVariant && item.variant" :class="variantClass">
            {{ item.variant.name }}
          </div>
          <div v-if="item.package" :class="pkgClass">Package: {{ item.package.name }}</div>
          <div v-if="layout === 'cart'" :class="pricesClass">
            <span :class="priceClass">{{ fp(item.final_price_value) }}</span>
            <span
              v-if="item.regular_price_value !== item.final_price_value"
              :class="oldPriceClass"
            >
              {{ fp(item.regular_price_value) }}
            </span>
          </div>
        </div>
        <button
          :class="removeBtnClass"
          :aria-label="removeLabel"
          @click="toastIfError(remove(variantUuid))"
        >
          <svg
            :width="removeIconSize"
            :height="removeIconSize"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            :stroke-width="removeIconStroke"
          >
            <polyline points="3 6 5 6 21 6" />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            />
          </svg>
        </button>
      </div>
      <div :class="bottomClass">
        <div v-if="priceBeforeQty" :class="pricesClass">
          <span :class="priceClass">{{ fp(item.final_price_value) }}</span>
          <span
            v-if="item.regular_price_value !== item.final_price_value"
            :class="oldPriceClass"
          >
            {{ fp(item.regular_price_value) }}
          </span>
        </div>
        <div class="qty-stepper">
          <button
            class="qty-step-btn"
            :aria-label="`Decrease quantity of ${productName}`"
            @click="toastIfError(decrement(variantUuid))"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <QtyInput
            :value="displayQty"
            :slug="slug"
            :on-set="(q: number) => toastIfError(setQuantity(variantUuid, q))"
          />
          <button
            class="qty-step-btn"
            :aria-label="`Increase quantity of ${productName}`"
            @click="toastIfError(increment(variantUuid))"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
        <span class="qty-unit">{{ unitLabel }}</span>
      </div>
    </div>
  </component>
</template>
