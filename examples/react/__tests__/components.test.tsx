import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ProductCard, ProductGridSkeleton } from "@/features/products/ProductCard";
import { Pagination } from "@/components/Pagination";
import { PlaceholderSVG } from "@/lib/helpers";
import { Footer } from "@/components/layout/Footer";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("PlaceholderSVG", () => {
  it("renders an SVG", () => {
    const { container } = render(<PlaceholderSVG />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("uses default size of 32", () => {
    const { container } = render(<PlaceholderSVG />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("32");
    expect(svg?.getAttribute("height")).toBe("32");
  });

  it("accepts custom size", () => {
    const { container } = render(<PlaceholderSVG size={64} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("64");
  });
});

describe("Footer", () => {
  it("renders SDK version", () => {
    const { container } = render(<Footer />);
    expect(container.textContent).toContain("v0.1.4");
  });

  it("renders SpaceIS SDK text", () => {
    const { container } = render(<Footer />);
    expect(container.textContent).toContain("SpaceIS SDK");
  });
});

describe("Pagination", () => {
  const baseMeta = {
    current_page: 2,
    last_page: 5,
    from: 11,
    links: [],
    path: "",
    per_page: 10,
    to: 20,
    total: 50,
  };

  it("renders when multiple pages", () => {
    const { container } = render(
      <Pagination meta={baseMeta} onPageChange={() => {}} />
    );
    expect(container.querySelector(".pagination")).toBeTruthy();
  });

  it("does not render when undefined", () => {
    const { container } = render(
      <Pagination meta={undefined} onPageChange={() => {}} />
    );
    expect(container.querySelector(".pagination")).toBeFalsy();
  });

  it("does not render when single page", () => {
    const { container } = render(
      <Pagination meta={{ ...baseMeta, last_page: 1 }} onPageChange={() => {}} />
    );
    expect(container.querySelector(".pagination")).toBeFalsy();
  });

  it("shows page info", () => {
    const { container } = render(
      <Pagination meta={baseMeta} onPageChange={() => {}} />
    );
    expect(container.querySelector(".page-info")?.textContent).toBe("2 / 5");
  });
});

describe("ProductCard", () => {
  const product = {
    uuid: "abc",
    name: "VIP Rank",
    slug: "vip-rank",
    image: "https://example.com/vip.png",
    percentage_discount: 20,
    minimal_price: 1299,
  } as any;

  it("renders product name", () => {
    const { container } = render(<ProductCard product={product} index={0} />);
    expect(container.querySelector(".product-name")?.textContent).toBe("VIP Rank");
  });

  it("renders product image", () => {
    const { container } = render(<ProductCard product={product} index={0} />);
    const img = container.querySelector(".product-img") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toBe("https://example.com/vip.png");
  });

  it("shows discount badge", () => {
    const { container } = render(<ProductCard product={product} index={0} />);
    const badge = container.querySelector(".product-discount-badge");
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toBe("-20%");
  });

  it("hides discount badge when no discount", () => {
    const { container } = render(
      <ProductCard product={{ ...product, percentage_discount: null }} index={0} />
    );
    expect(container.querySelector(".product-discount-badge")).toBeFalsy();
  });

  it("shows placeholder when no image", () => {
    const { container } = render(
      <ProductCard product={{ ...product, image: null }} index={0} />
    );
    expect(container.querySelector(".product-img")).toBeFalsy();
    expect(container.querySelector(".product-img-placeholder")).toBeTruthy();
  });

  it("links to product page", () => {
    const { container } = render(<ProductCard product={product} index={0} />);
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/product/vip-rank");
  });

  it("displays formatted price", () => {
    const { container } = render(<ProductCard product={product} index={0} />);
    expect(container.querySelector(".product-price")?.textContent).toContain("12");
  });
});

describe("ProductGridSkeleton", () => {
  it("renders default 8 skeleton cards", () => {
    const { container } = render(<ProductGridSkeleton />);
    expect(container.querySelectorAll(".skeleton-card").length).toBe(8);
  });

  it("renders custom count", () => {
    const { container } = render(<ProductGridSkeleton count={3} />);
    expect(container.querySelectorAll(".skeleton-card").length).toBe(3);
  });
});
