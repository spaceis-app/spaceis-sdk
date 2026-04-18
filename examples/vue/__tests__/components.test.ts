import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { computed } from "vue";
import PlaceholderSvg from "../components/PlaceholderSvg.vue";
import AppPagination from "../components/layout/AppPagination.vue";
import ProductCard from "../components/products/ProductCard.vue";

// Stub Nuxt auto-imports
vi.stubGlobal("computed", computed);

describe("PlaceholderSvg", () => {
  it("renders an SVG element", () => {
    const wrapper = mount(PlaceholderSvg);
    expect(wrapper.find("svg").exists()).toBe(true);
  });

  it("uses default size of 32", () => {
    const wrapper = mount(PlaceholderSvg);
    const svg = wrapper.find("svg");
    expect(svg.attributes("width")).toBe("32");
    expect(svg.attributes("height")).toBe("32");
  });

  it("accepts a custom size prop", () => {
    const wrapper = mount(PlaceholderSvg, { props: { size: 64 } });
    const svg = wrapper.find("svg");
    expect(svg.attributes("width")).toBe("64");
    expect(svg.attributes("height")).toBe("64");
  });
});

describe("AppPagination", () => {
  const baseMeta = {
    current_page: 2,
    last_page: 5,
    from: 11,
    links: [],
    path: null,
    per_page: 10,
    to: 20,
    total: 50,
  };

  it("renders when there are multiple pages", () => {
    const wrapper = mount(AppPagination, {
      props: { meta: baseMeta },
    });
    expect(wrapper.find(".pagination").exists()).toBe(true);
  });

  it("does not render when meta is undefined", () => {
    const wrapper = mount(AppPagination, {
      props: { meta: undefined },
    });
    expect(wrapper.find(".pagination").exists()).toBe(false);
  });

  it("does not render when last_page is 1", () => {
    const wrapper = mount(AppPagination, {
      props: { meta: { ...baseMeta, last_page: 1 } },
    });
    expect(wrapper.find(".pagination").exists()).toBe(false);
  });

  it("shows current page / last page", () => {
    const wrapper = mount(AppPagination, {
      props: { meta: baseMeta },
    });
    expect(wrapper.find(".page-info").text()).toBe("2 / 5");
  });

  it("disables previous button on first page", () => {
    const wrapper = mount(AppPagination, {
      props: { meta: { ...baseMeta, current_page: 1 } },
    });
    const prevBtn = wrapper.findAll(".page-btn")[0]!;
    expect(prevBtn.attributes("disabled")).toBeDefined();
  });

  it("disables next button on last page", () => {
    const wrapper = mount(AppPagination, {
      props: { meta: { ...baseMeta, current_page: 5 } },
    });
    const nextBtn = wrapper.findAll(".page-btn")[1]!;
    expect(nextBtn.attributes("disabled")).toBeDefined();
  });

  it("emits pageChange on prev click", async () => {
    const wrapper = mount(AppPagination, {
      props: { meta: baseMeta },
    });
    await wrapper.findAll(".page-btn")[0]!.trigger("click");
    expect(wrapper.emitted("pageChange")).toEqual([[1]]);
  });

  it("emits pageChange on next click", async () => {
    const wrapper = mount(AppPagination, {
      props: { meta: baseMeta },
    });
    await wrapper.findAll(".page-btn")[1]!.trigger("click");
    expect(wrapper.emitted("pageChange")).toEqual([[3]]);
  });
});

describe("ProductCard", () => {
  const product = {
    uuid: "abc-123",
    name: "VIP Rank",
    slug: "vip-rank",
    image: "https://example.com/vip.png",
    percentage_discount: 20,
    minimal_price: 1299,
  };

  const stubs = {
    NuxtLink: {
      template: '<a :href="to"><slot /></a>',
      props: ["to"],
    },
    PlaceholderSvg: true,
  };

  it("renders the product name", () => {
    const wrapper = mount(ProductCard, {
      props: { product, index: 0 },
      global: { stubs },
    });
    expect(wrapper.find(".product-name").text()).toBe("VIP Rank");
  });

  it("renders the product image", () => {
    const wrapper = mount(ProductCard, {
      props: { product, index: 0 },
      global: { stubs },
    });
    const img = wrapper.find(".product-img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("https://example.com/vip.png");
  });

  it("shows discount badge", () => {
    const wrapper = mount(ProductCard, {
      props: { product, index: 0 },
      global: { stubs },
    });
    const badge = wrapper.find(".product-discount-badge");
    expect(badge.exists()).toBe(true);
    expect(badge.text()).toBe("-20%");
  });

  it("hides discount badge when no discount", () => {
    const wrapper = mount(ProductCard, {
      props: { product: { ...product, percentage_discount: null }, index: 0 },
      global: { stubs },
    });
    expect(wrapper.find(".product-discount-badge").exists()).toBe(false);
  });

  it("shows placeholder when no image", () => {
    const wrapper = mount(ProductCard, {
      props: { product: { ...product, image: null }, index: 0 },
      global: { stubs },
    });
    expect(wrapper.find(".product-img").exists()).toBe(false);
    expect(wrapper.find(".product-img-placeholder").exists()).toBe(true);
  });

  it("links to correct product page", () => {
    const wrapper = mount(ProductCard, {
      props: { product, index: 0 },
      global: { stubs },
    });
    expect(wrapper.find("a").attributes("href")).toBe("/product/vip-rank");
  });

  it("displays formatted price containing '12'", () => {
    const wrapper = mount(ProductCard, {
      props: { product, index: 0 },
      global: { stubs },
    });
    expect(wrapper.find(".product-price").text()).toContain("12");
  });
});
