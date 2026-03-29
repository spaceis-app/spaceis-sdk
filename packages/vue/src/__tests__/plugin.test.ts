import { describe, it, expect, vi } from "vitest";
import { createApp, defineComponent, h, inject } from "vue";
import { SpaceISPlugin, SpaceISKey, type SpaceISContext } from "../plugin";

// Mock @tanstack/vue-query to avoid full setup
vi.mock("@tanstack/vue-query", () => ({
  VueQueryPlugin: { install: vi.fn() },
  QueryClient: vi.fn().mockImplementation(() => ({})),
}));

// Mock @spaceis/sdk
vi.mock("@spaceis/sdk", () => {
  const mockCartManager = {
    cart: null,
    onChange: vi.fn(() => vi.fn()),
    load: vi.fn(),
    add: vi.fn(),
  };

  const mockClient = {
    createCartManager: vi.fn(() => mockCartManager),
    products: {},
    categories: {},
    cart: {},
    checkout: {},
    orders: {},
    content: {},
    sales: {},
    goals: {},
    packages: {},
    vouchers: {},
    dailyRewards: {},
    rankings: {},
    shop: {},
    recaptcha: {},
  };

  return {
    createSpaceIS: vi.fn(() => mockClient),
  };
});

describe("SpaceISPlugin", () => {
  it("provides SpaceIS context when installed", () => {
    let injected: SpaceISContext | undefined;

    const Child = defineComponent({
      setup() {
        injected = inject(SpaceISKey);
        return () => h("div");
      },
    });

    const app = createApp(Child);

    app.use(SpaceISPlugin, {
      config: {
        baseUrl: "https://api.example.com",
        shopUuid: "test-uuid",
      },
    });

    // Mount to a detached element to trigger setup
    const root = document.createElement("div");
    app.mount(root);

    expect(injected).toBeDefined();
    expect(injected!.client).toBeDefined();
    expect(injected!.cartManager).toBeDefined();

    app.unmount();
  });

  it("throws if useSpaceIS is called without plugin", async () => {
    // Dynamically import to get the real function
    const { useSpaceIS } = await import("../composables/use-spaceis");

    const Child = defineComponent({
      setup() {
        // This should throw because plugin is not installed
        expect(() => useSpaceIS()).toThrow("SpaceISPlugin");
        return () => h("div");
      },
    });

    const app = createApp(Child);
    const root = document.createElement("div");
    app.mount(root);
    app.unmount();
  });
});
