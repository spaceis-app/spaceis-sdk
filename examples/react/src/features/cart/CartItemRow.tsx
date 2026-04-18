"use client";

import {
  useCart,
  getItemQty,
  getCartItemImage,
  type CartItem,
} from "@spaceis/react";
import { toast } from "sonner";
import { fp, PlaceholderSVG, getErrorMessage } from "@/lib/helpers";
import { QtyInput } from "@/features/cart/QtyInput";

type Layout = "drawer" | "cart" | "checkout";

interface CartItemRowProps {
  item: CartItem;
  layout: Layout;
}

const ROOT_CLASS: Record<Layout, string> = {
  drawer: "cart-item",
  cart: "cp-item",
  checkout: "checkout-item",
};

const IMG_WRAP_CLASS: Record<Layout, string> = {
  drawer: "cart-item-img-wrap",
  cart: "cp-item-img-wrap",
  checkout: "",
};

const IMG_CLASS: Record<Layout, string> = {
  drawer: "cart-item-img",
  cart: "cp-item-img",
  checkout: "checkout-item-img",
};

const PH_CLASS: Record<Layout, string> = {
  drawer: "cart-item-img-placeholder",
  cart: "cp-item-img cp-item-img-ph",
  checkout: "checkout-item-img-placeholder",
};

const PH_SIZE: Record<Layout, number> = {
  drawer: 24,
  cart: 28,
  checkout: 18,
};

/**
 * Shared cart item row rendered in the drawer, cart page and checkout.
 * The visual skeleton is identical; layout-specific class names are resolved
 * via maps so CSS stays scoped to each surface.
 */
export function CartItemRow({ item, layout }: CartItemRowProps) {
  const { increment, decrement, remove, setQuantity } = useCart();

  const variantUuid = item.variant?.uuid ?? "";
  const imgSrc = getCartItemImage(item);
  const displayQty = getItemQty(item);
  const productName = item.shop_product?.name ?? "";
  const showVariant =
    !!item.variant &&
    !!item.shop_product &&
    item.variant.name !== item.shop_product.name;

  const toastIfError = (p: Promise<unknown>) => {
    p.catch((err) => toast.error(getErrorMessage(err)));
  };

  const imgEl = imgSrc ? (
    <img className={IMG_CLASS[layout]} src={imgSrc} alt="" />
  ) : (
    <div className={PH_CLASS[layout]}>
      <PlaceholderSVG size={PH_SIZE[layout]} />
    </div>
  );

  const wrappedImg = IMG_WRAP_CLASS[layout] ? (
    <div className={IMG_WRAP_CLASS[layout]}>{imgEl}</div>
  ) : (
    imgEl
  );

  // Checkout places price above the qty stepper, whereas drawer/cart put them
  // side-by-side. We keep a single JSX block and flip one flag.
  const priceBeforeQty = layout !== "cart";

  const priceBlock = (
    <div className={layout === "drawer" ? "cart-item-prices" : layout === "cart" ? "cp-item-prices" : "checkout-item-prices"}>
      <span
        className={
          layout === "drawer"
            ? "cart-item-price-current"
            : layout === "cart"
              ? "cp-item-price"
              : "checkout-item-price"
        }
      >
        {fp(item.final_price_value)}
      </span>
      {item.regular_price_value !== item.final_price_value && (
        <span
          className={
            layout === "drawer"
              ? "cart-item-price-old"
              : layout === "cart"
                ? "cp-item-price-old"
                : "checkout-item-old-price"
          }
        >
          {fp(item.regular_price_value)}
        </span>
      )}
    </div>
  );

  const qtyBlock = (
    <div className="qty-stepper">
      <button
        className="qty-step-btn"
        aria-label={`Decrease quantity of ${productName}`}
        onClick={() => toastIfError(decrement(variantUuid))}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <QtyInput
        value={displayQty}
        slug={item.shop_product?.slug || item.shop_product?.uuid || ""}
        onSet={(qty) => toastIfError(setQuantity(variantUuid, qty))}
      />
      <button
        className="qty-step-btn"
        aria-label={`Increase quantity of ${productName}`}
        onClick={() => toastIfError(increment(variantUuid))}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );

  const removeLabel = productName ? `Remove ${productName}` : "Remove";

  const detailsClass =
    layout === "drawer"
      ? "cart-item-details"
      : layout === "cart"
        ? "cp-item-body"
        : "checkout-item-details";

  const topClass =
    layout === "drawer"
      ? "cart-item-top"
      : layout === "cart"
        ? "cp-item-top"
        : "checkout-item-top";

  const infoClass =
    layout === "drawer"
      ? "cart-item-info"
      : layout === "cart"
        ? "cp-item-info"
        : "checkout-item-info";

  const nameClass =
    layout === "drawer"
      ? "cart-item-name"
      : layout === "cart"
        ? "cp-item-name"
        : "checkout-item-name";

  const variantClass =
    layout === "drawer"
      ? "cart-item-variant"
      : layout === "cart"
        ? "cp-item-variant"
        : "checkout-item-variant";

  const pkgClass =
    layout === "drawer"
      ? "cart-item-package"
      : layout === "cart"
        ? "cp-item-package"
        : "checkout-item-package";

  const removeBtnClass =
    layout === "drawer"
      ? "cart-item-remove"
      : layout === "cart"
        ? "cp-item-remove"
        : "checkout-item-remove";

  const bottomClass =
    layout === "drawer"
      ? "cart-item-bottom"
      : layout === "cart"
        ? "cp-item-bottom"
        : "checkout-item-bottom";

  const removeIconSize = layout === "checkout" ? 14 : 16;

  // drawer lives inside <ul>, so use <li>; cart/checkout are plain <div> grids
  const Root = layout === "drawer" ? "li" : "div";

  return (
    <Root className={ROOT_CLASS[layout]}>
      {wrappedImg}
      <div className={detailsClass}>
        <div className={topClass}>
          <div className={infoClass}>
            <div className={nameClass}>{productName}</div>
            {showVariant && item.variant && (
              <div className={variantClass}>{item.variant.name}</div>
            )}
            {item.package && (
              <div className={pkgClass}>Package: {item.package.name}</div>
            )}
            {layout === "cart" && priceBlock}
          </div>
          <button
            className={removeBtnClass}
            aria-label={removeLabel}
            onClick={() => toastIfError(remove(variantUuid))}
          >
            <svg
              width={removeIconSize}
              height={removeIconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={layout === "checkout" ? 2 : 1.5}
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
        <div className={bottomClass}>
          {priceBeforeQty && priceBlock}
          {qtyBlock}
        </div>
      </div>
    </Root>
  );
}
