import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SafeHtml } from "@/components/SafeHtml";

describe("SafeHtml", () => {
  it("renders safe HTML through dangerouslySetInnerHTML", () => {
    const { container } = render(<SafeHtml html="<p>Hello</p>" />);
    expect(container.querySelector("p")?.textContent).toBe("Hello");
  });

  it("strips script tags", () => {
    const { container } = render(
      <SafeHtml html="<script>alert(1)</script><b>ok</b>" />
    );
    expect(container.querySelector("script")).toBeFalsy();
    expect(container.querySelector("b")?.textContent).toBe("ok");
  });

  it("strips onerror handler but keeps img element", () => {
    const { container } = render(
      <SafeHtml html='<img src="x" onerror="alert(1)">' />
    );
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("onerror")).toBeNull();
  });

  it("renders empty div when html is null", () => {
    const { container } = render(<SafeHtml html={null} />);
    const div = container.querySelector("div");
    expect(div).toBeTruthy();
    expect(div?.innerHTML).toBe("");
  });

  it("renders empty div when html is undefined", () => {
    const { container } = render(<SafeHtml html={undefined} />);
    const div = container.querySelector("div");
    expect(div).toBeTruthy();
    expect(div?.innerHTML).toBe("");
  });

  it("applies className to wrapper div", () => {
    const { container } = render(
      <SafeHtml html="<p>text</p>" className="prose" />
    );
    expect(container.querySelector("div.prose")).toBeTruthy();
  });
});
