// examples/vanilla/shared/categories.js
// Shared category navigation: parent list + subcategory bar.
// Each page provides an `onSelect` callback for page-specific reload logic.

let _state;
let _client;

/**
 * Wire up the shared state object and SDK client.
 * Must be called once before loadCategories / selectCategory.
 *
 * @param {object} state - The per-page state object (must have currentPage + currentCategory).
 * @param {object} client - SpaceISClient instance.
 */
export function initCategories(state, client) {
  _state = state;
  _client = client;
}

/**
 * Fetch categories from the API and populate the #categories container.
 * Skips the fetch if state.categoriesLoaded is already true.
 *
 * @param {{ onSelect: (cat: object, btn: HTMLButtonElement) => void }} opts
 */
export async function loadCategories({ onSelect }) {
  if (_state.categoriesLoaded) return;
  _state.categoriesLoaded = true;

  try {
    const categories = await _client.categories.list();
    const container = document.getElementById("categories");
    categories.forEach((cat) => {
      if (!cat.is_active) return;
      const btn = document.createElement("button");
      btn.className = "cat-btn";
      btn.textContent = cat.name;
      btn.dataset.uuid = cat.uuid;
      btn.addEventListener("click", () => {
        selectCategory(cat, btn, { onSelect });
      });
      container.appendChild(btn);
    });
  } catch { /* ignore */ }
}

/**
 * Activate a parent category button, render its children, and trigger `onSelect`.
 *
 * @param {object} cat - Category object from the API.
 * @param {HTMLButtonElement} btn - The button that was clicked.
 * @param {{ onSelect: (cat: object, btn: HTMLButtonElement) => void }} opts
 */
export function selectCategory(cat, btn, { onSelect }) {
  _state.currentCategory = cat.uuid;
  _state.currentPage = 1;

  // Highlight active parent
  document.querySelectorAll("#categories .cat-btn").forEach((b) => {
    b.classList.remove("active");
  });
  if (btn) btn.classList.add("active");

  // Render subcategories (if any)
  const subContainer = document.getElementById("subcategories");
  subContainer.innerHTML = "";

  const activeChildren = (cat.children || []).filter((c) => c.is_active);

  if (activeChildren.length > 0) {
    subContainer.style.display = "";

    // "All in category" option
    const allBtn = document.createElement("button");
    allBtn.className = "cat-btn cat-child active";
    allBtn.textContent = "All";
    allBtn.addEventListener("click", () => {
      _state.currentCategory = cat.uuid;
      _state.currentPage = 1;
      subContainer.querySelectorAll(".cat-btn").forEach((b) => {
        b.classList.remove("active");
      });
      allBtn.classList.add("active");
      onSelect(cat, allBtn);
    });
    subContainer.appendChild(allBtn);

    // Child categories
    activeChildren.forEach((child) => {
      const subBtn = document.createElement("button");
      subBtn.className = "cat-btn cat-child";
      subBtn.textContent = child.name;
      subBtn.dataset.uuid = child.uuid;
      subBtn.addEventListener("click", () => {
        _state.currentCategory = child.uuid;
        _state.currentPage = 1;
        subContainer.querySelectorAll(".cat-btn").forEach((b) => {
          b.classList.remove("active");
        });
        subBtn.classList.add("active");
        onSelect(child, subBtn);
      });
      subContainer.appendChild(subBtn);
    });
  } else {
    subContainer.style.display = "none";
  }

  onSelect(cat, btn);
}
