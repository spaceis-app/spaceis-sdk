// examples/vanilla/shared/modal.js
// Product detail modal: open, close, render content, variant selection, qty stepper.

import { esc, fp, getErrorMessage, PLACEHOLDER_SVG_SM } from "./format.js";
import { showToast } from "./toast.js";
import { renderRecsHtml, attachRecsClickHandler } from "./recommendations.js";
import { isCartOpen } from "./cart.js";

let _client;
let _cartMgr;

export function initModal(client, cartMgr) {
  _client = client;
  _cartMgr = cartMgr;
}

const productModalState = {
  product: null,
  selectedVariantUuid: null,
  quantity: 1,
};

export function renderModalShell() {
  const existing = document.getElementById("modal-overlay");
  if (existing) return;
  const div = document.createElement("div");
  div.innerHTML =
    '<div class="modal-overlay" id="modal-overlay">' +
    '<div class="modal" id="product-modal" role="dialog" aria-modal="true">' +
    '<button class="modal-close" id="modal-close-btn" aria-label="Close">&#10005;</button>' +
    '<div id="modal-content"></div>' +
    "</div>" +
    "</div>";
  document.body.appendChild(div.firstChild);

  document.getElementById("modal-close-btn").addEventListener("click", () => {
    closeModal();
  });
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });
}

export async function openProductModal(slug) {
  renderModalShell();
  const overlay = document.getElementById("modal-overlay");
  const content = document.getElementById("modal-content");

  content.innerHTML = '<div style="padding:40px"><div class="spinner"></div></div>';
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";

  try {
    const product = await _client.products.get(slug);
    productModalState.product = product;
    const firstVariant = product.variants?.[0] ?? null;
    productModalState.selectedVariantUuid = firstVariant?.uuid ?? null;
    const limits = window.SpaceIS.getProductLimits(product);
    productModalState.quantity = limits.min;
    renderModalContent(product);
  } catch {
    content.innerHTML =
      '<div class="modal-body">' +
      '<div class="empty-state"><p style="color:var(--red)">Failed to load product.</p></div>' +
      "</div>";
  }
}

export function renderModalContent(product) {
  const content = document.getElementById("modal-content");

  const imgHtml = product.image
    ? `<img class="modal-img" src="${esc(product.image)}" alt="${esc(product.name)}">`
    : `<div class="modal-img-placeholder">${PLACEHOLDER_SVG_SM}</div>`;

  // product.description is rich HTML from the CMS — backend sanitizes before saving.
  // If using untrusted content, sanitize with DOMPurify before rendering.
  const descHtml = product.description
    ? `<div class="modal-desc">${product.description}</div>`
    : "";

  const selectedVariant = getSelectedVariant(product);
  const currentPrice =
    selectedVariant?.price ?? product.variants?.[0]?.price ?? product.base_price;
  const basePrice = selectedVariant ? selectedVariant.base_price : null;

  let variantsHtml = "";
  if (product.variants?.length > 0) {
    variantsHtml =
      '<div class="modal-label">Choose variant</div><div class="variants-grid" id="modal-variants">';
    product.variants.forEach((v) => {
      const isActive = v.uuid === productModalState.selectedVariantUuid ? " active" : "";
      variantsHtml += `<button class="variant-btn${isActive}" data-uuid="${esc(v.uuid)}">${esc(v.name)}</button>`;
    });
    variantsHtml += "</div>";
  }

  const limits = window.SpaceIS.getProductLimits(product);
  const minQty = limits.min;
  const maxQty = limits.max;
  const step = limits.step;
  const showQtySelector = !(minQty === 1 && maxQty === 1 && step === 1);
  const qty = Math.max(productModalState.quantity, minQty);
  productModalState.quantity = qty;

  const oldPriceHtml =
    basePrice && basePrice !== currentPrice
      ? `<div class="modal-price-old" id="modal-price-old">${fp(basePrice)}</div>`
      : '<div class="modal-price-old" id="modal-price-old" style="display:none"></div>';

  let lowestHtml = "";
  if (selectedVariant?.lowest_price_last_30_days) {
    lowestHtml = `<div class="modal-price-note" id="modal-price-lowest">Lowest in 30 days: ${fp(selectedVariant.lowest_price_last_30_days)}</div>`;
  } else {
    lowestHtml =
      '<div class="modal-price-note" id="modal-price-lowest" style="display:none"></div>';
  }

  content.innerHTML =
    imgHtml +
    '<div class="modal-body">' +
    `<div class="modal-title">${esc(product.name)}</div>` +
    descHtml +
    variantsHtml +
    '<div class="modal-qty-row">' +
    (showQtySelector
      ? '<div>' +
        '<div class="modal-label" style="margin-bottom:6px">Quantity</div>' +
        '<div class="qty-row">' +
        '<div class="qty-stepper">' +
        '<button class="qty-step-btn" id="modal-qty-minus" aria-label="Decrease"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' +
        `<input class="qty-step-input" id="modal-qty-val" type="number" min="${minQty}" max="${maxQty}" step="${step}" value="${qty}">` +
        '<button class="qty-step-btn" id="modal-qty-plus" aria-label="Increase"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' +
        "</div>" +
        `<span class="qty-unit">${esc(product.unit || "szt")}</span>` +
        "</div>" +
        "</div>"
      : "") +
    '<div class="modal-price-block">' +
    `<div class="modal-price" id="modal-price">${fp(currentPrice)}</div>` +
    oldPriceHtml +
    lowestHtml +
    "</div>" +
    "</div>" +
    '<button class="modal-add-btn" id="modal-add-btn">Add to cart</button>' +
    '<div id="modal-recommendations" class="modal-recommendations"></div>' +
    "</div>";

  loadProductRecommendations(product.slug);

  const variantsEl = document.getElementById("modal-variants");
  if (variantsEl) {
    variantsEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".variant-btn");
      if (!btn) return;
      productModalState.selectedVariantUuid = btn.dataset.uuid;
      variantsEl.querySelectorAll(".variant-btn").forEach((b) => {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      updateModalPrice(product);
    });
  }

  // Qty stepper (only if selector is shown)
  if (showQtySelector) {
    const qtyMinus = document.getElementById("modal-qty-minus");
    const qtyPlus = document.getElementById("modal-qty-plus");
    const qtyInput = document.getElementById("modal-qty-val");

    qtyMinus.addEventListener("click", () => {
      const newQty = productModalState.quantity - step;
      if (newQty < minQty) return;
      productModalState.quantity = newQty;
      qtyInput.value = String(newQty);
      qtyMinus.disabled = newQty <= minQty;
      qtyPlus.disabled = false;
    });
    qtyPlus.addEventListener("click", () => {
      const newQty = productModalState.quantity + step;
      if (newQty > maxQty) return;
      productModalState.quantity = newQty;
      qtyInput.value = String(newQty);
      qtyPlus.disabled = newQty >= maxQty;
      qtyMinus.disabled = false;
    });
    qtyMinus.disabled = qty <= minQty;
    qtyPlus.disabled = qty >= maxQty;

    // Manual input — snap to valid value on blur/change
    qtyInput.addEventListener("change", () => {
      let val = parseInt(qtyInput.value, 10);
      if (isNaN(val)) val = productModalState.quantity;
      val = window.SpaceIS.snapQuantity(val, { min: minQty, max: maxQty, step });
      qtyInput.value = val;
      productModalState.quantity = val;
      qtyMinus.disabled = val <= minQty;
      qtyPlus.disabled = val >= maxQty;
    });
    qtyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        qtyInput.blur();
      }
    });
  }

  const addBtn = document.getElementById("modal-add-btn");
  addBtn.addEventListener("click", () => {
    if (!productModalState.selectedVariantUuid) {
      showToast("Choose variant", "error");
      return;
    }
    // Clamp quantity to valid range before sending
    const clampedQty = window.SpaceIS.snapQuantity(productModalState.quantity, {
      min: minQty,
      max: maxQty,
      step,
    });
    productModalState.quantity = clampedQty;
    const qtyEl = document.getElementById("modal-qty-val");
    if (qtyEl) qtyEl.value = String(clampedQty);

    addBtn.disabled = true;
    addBtn.textContent = "Adding...";
    _cartMgr
      .add(productModalState.selectedVariantUuid, clampedQty)
      .then(() => {
        showToast("Added to cart!", "success");
        closeModal();
      })
      .catch((err) => {
        showToast(getErrorMessage(err), "error");
        addBtn.disabled = false;
        addBtn.textContent = "Add to cart";
      });
  });
}

function getSelectedVariant(product) {
  if (!product.variants) return null;
  return (
    product.variants.find((v) => v.uuid === productModalState.selectedVariantUuid) || null
  );
}

function updateModalPrice(product) {
  const variant = getSelectedVariant(product);
  if (!variant) return;
  const priceEl = document.getElementById("modal-price");
  if (priceEl) priceEl.textContent = fp(variant.price);

  // Update old price
  const oldPriceEl = document.getElementById("modal-price-old");
  if (oldPriceEl) {
    if (variant.base_price && variant.base_price !== variant.price) {
      oldPriceEl.textContent = fp(variant.base_price);
      oldPriceEl.style.display = "";
    } else {
      oldPriceEl.textContent = "";
      oldPriceEl.style.display = "none";
    }
  }

  // Update lowest price in 30 days
  const lowestEl = document.getElementById("modal-price-lowest");
  if (lowestEl) {
    if (variant.lowest_price_last_30_days) {
      lowestEl.textContent = `Lowest in 30 days: ${fp(variant.lowest_price_last_30_days)}`;
      lowestEl.style.display = "";
    } else {
      lowestEl.textContent = "";
      lowestEl.style.display = "none";
    }
  }
}

async function loadProductRecommendations(slugOrUuid) {
  const container = document.getElementById("modal-recommendations");
  if (!container) return;

  try {
    const recs = await _client.products.recommendations(slugOrUuid);
    if (!recs?.length) return;
    container.innerHTML = renderRecsHtml(recs, "Recommended");
    attachRecsClickHandler(container, recs);
  } catch {
    // Recommendations failed — silently ignore
  }
}

export function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = isCartOpen() ? "hidden" : "";
}
