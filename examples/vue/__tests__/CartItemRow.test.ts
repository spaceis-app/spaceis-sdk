import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { computed, ref } from 'vue';

// Stub Nuxt auto-imports (globals injected by Nuxt at runtime)
vi.stubGlobal('computed', computed);
vi.stubGlobal('ref', ref);
vi.stubGlobal('useToast', () => ({ error: vi.fn(), success: vi.fn() }));

// Mock @spaceis/vue so useCart() doesn't require SpaceISPlugin
vi.mock('@spaceis/vue', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@spaceis/vue')>();
  return {
    ...actual,
    useCart: vi.fn(() => ({
      increment: vi.fn().mockResolvedValue(undefined),
      decrement: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
      setQuantity: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

import CartItemRow from '../components/cart/CartItemRow.vue';

const baseItem = {
  shop_product: { uuid: 'p1', name: 'VIP Rank', slug: 'vip', image: null, price: 1000 },
  variant: { uuid: 'v1', name: 'VIP Rank', image: null, price: 1000 },
  package: null,
  from_package: null,
  quantity: 1000,
  cart_item_sale: null,
  regular_price: 1000,
  regular_price_value: 1000,
  final_price: 1000,
  final_price_value: 1000,
};

function mountItem(
  item = baseItem,
  layout: 'drawer' | 'cart' | 'checkout' = 'drawer',
) {
  return mount(CartItemRow, {
    props: { item, layout },
    global: {
      stubs: {
        QtyInput: true,
        PlaceholderSvg: true,
      },
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CartItemRow', () => {
  it('renders product name', () => {
    const wrapper = mountItem();
    expect(wrapper.text()).toContain('VIP Rank');
  });

  it('renders variant name when differs from product name', () => {
    const item = {
      ...baseItem,
      variant: { ...baseItem.variant, name: 'Premium' },
    };
    const wrapper = mountItem(item);
    expect(wrapper.text()).toContain('Premium');
  });

  it('hides variant name when matches product name', () => {
    // variant.name === shop_product.name → showVariant computed is false
    const wrapper = mountItem();
    expect(wrapper.find('.cart-item-variant').exists()).toBe(false);
  });

  it('renders package badge when item.package is present', () => {
    const item = {
      ...baseItem,
      package: { uuid: 'pkg1', name: 'Bundle', included_variants: [] },
    };
    const wrapper = mountItem(item);
    expect(wrapper.text()).toContain('Bundle');
  });

  it('has aria-label with product name on remove button', () => {
    const wrapper = mountItem();
    const removeBtn = wrapper.find('[aria-label="Remove VIP Rank"]');
    expect(removeBtn.exists()).toBe(true);
  });

  it('drawer layout — root element is <li> with class cart-item', () => {
    const wrapper = mountItem(baseItem, 'drawer');
    expect(wrapper.element.tagName).toBe('LI');
    expect(wrapper.classes()).toContain('cart-item');
  });

  it('cart layout — root element is <div> with class cp-item', () => {
    const wrapper = mountItem(baseItem, 'cart');
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cp-item');
  });

  it('checkout layout — root element is <div> with class checkout-item', () => {
    const wrapper = mountItem(baseItem, 'checkout');
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('checkout-item');
  });

  it('renders price from final_price_value', () => {
    // fp(1000) formats 1000 cents — should contain "10"
    const wrapper = mountItem();
    expect(wrapper.text()).toContain('10');
  });

  it('does NOT render strikethrough regular price when equal to final price', () => {
    const wrapper = mountItem(baseItem, 'drawer');
    // regular_price_value === final_price_value → old price span hidden
    expect(wrapper.find('.cart-item-price-old').exists()).toBe(false);
  });

  it('renders strikethrough regular price when differs from final price', () => {
    const item = {
      ...baseItem,
      regular_price_value: 1500,
      final_price_value: 1000,
    };
    const wrapper = mountItem(item, 'drawer');
    expect(wrapper.find('.cart-item-price-old').exists()).toBe(true);
  });
});
