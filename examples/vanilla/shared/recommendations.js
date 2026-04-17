// examples/vanilla/shared/recommendations.js
// Shared recommendation rendering used by product modal, cart drawer, and checkout.

import { esc, fp, getErrorMessage, PLACEHOLDER_SVG_SM } from "./format.js";
import { showToast } from "./toast.js";

let _client;
let _cartMgr;

export function initRecommendations(client, cartMgr) {
  _client = client;
  _cartMgr = cartMgr;
}

export function renderRecsHtml(recs, title) {
  let html = '<div class="recs-section">';
  html += `<div class="recs-section-title">${esc(title || "Recommended")}</div>`;
  html += '<div class="recs-grid">';
  (recs || []).forEach((rec) => {
    const minQty = rec.shop_product?.min_quantity
      ? window.SpaceIS.fromApiQty(rec.shop_product.min_quantity)
      : 1;
    const imgSrc = rec.variant?.image || rec.shop_product?.image || null;
    const imgHtml = imgSrc
      ? `<img class="rec-img" src="${esc(imgSrc)}" alt="">`
      : `<div class="rec-img-placeholder">${PLACEHOLDER_SVG_SM}</div>`;

    html +=
      `<div class="rec-card" data-variant-uuid="${esc(rec.variant?.uuid ?? "")}">` +
      imgHtml +
      '<div class="rec-info">' +
      `<div class="rec-name">${esc(rec.name || rec.shop_product?.name || "")}</div>` +
      '<div class="rec-price-row">' +
      `<span class="rec-price">${fp(rec.price * minQty)}</span>` +
      (rec.base_price !== rec.price
        ? `<span class="rec-old-price">${fp(rec.base_price * minQty)}</span>`
        : "") +
      (minQty > 1 ? `<span class="rec-qty-label">(${minQty} pcs.)</span>` : "") +
      "</div>" +
      "</div>" +
      '<button class="rec-add-btn" title="Add to cart" aria-label="Add to cart">+</button>' +
      "</div>";
  });
  html += "</div></div>";
  return html;
}

export function attachRecsClickHandler(container, recs) {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".rec-add-btn");
    if (!btn) return;
    const card = btn.closest(".rec-card");
    const variantUuid = card ? card.dataset.variantUuid : null;
    if (!variantUuid) return;

    let minQty = 1;
    (recs || []).forEach((r) => {
      if (
        r.variant &&
        r.variant.uuid === variantUuid &&
        r.shop_product &&
        r.shop_product.min_quantity
      ) {
        minQty = window.SpaceIS.fromApiQty(r.shop_product.min_quantity);
      }
    });

    btn.disabled = true;
    btn.textContent = "...";
    _cartMgr
      .add(variantUuid, minQty)
      .then(() => {
        showToast("Added to cart!", "success");
        btn.textContent = "\u2713";
        setTimeout(() => {
          btn.textContent = "+";
          btn.disabled = false;
        }, 1500);
      })
      .catch((err) => {
        showToast(getErrorMessage(err), "error");
        btn.textContent = "+";
        btn.disabled = false;
      });
  });
}

export async function loadCartRecommendations() {
  let container = document.getElementById("cart-recommendations");
  if (!container) {
    // Create container in drawer body if it doesn't exist
    const body = document.getElementById("cart-items");
    if (!body) return;
    const div = document.createElement("div");
    div.id = "cart-recommendations";
    div.className = "cart-recs";
    body.parentNode.insertBefore(div, document.getElementById("cart-footer"));
    container = div;
  }

  if (_cartMgr.isEmpty) {
    container.innerHTML = "";
    return;
  }

  const firstItem = _cartMgr.items[0];
  if (!firstItem?.shop_product) {
    container.innerHTML = "";
    return;
  }

  try {
    const recs = await _client.products.recommendations(firstItem.shop_product.uuid);
    if (!recs?.length) {
      container.innerHTML = "";
      return;
    }
    const sliced = recs.slice(0, 4);
    container.innerHTML = renderRecsHtml(sliced, "You might also like");
    attachRecsClickHandler(container, sliced);
  } catch {
    container.innerHTML = "";
  }
}
