// examples/vanilla/shared/community.js
// Community section: top customers, latest orders, community goals.

import { esc, fp } from "./format.js";

let _client;

export function initCommunity(client) {
  _client = client;
}

export function renderCommunitySection() {
  const mainEl = document.querySelector("main .container");
  if (!mainEl) return;

  const section = document.createElement("section");
  section.className = "section community-section";
  section.innerHTML =
    '<div class="community-grid">' +
      '<div class="community-card">' +
        '<div class="community-card-header">Top customers</div>' +
        '<div class="community-card-body" id="top-customers"><div class="spinner"></div></div>' +
      "</div>" +
      '<div class="community-card">' +
        '<div class="community-card-header">Latest orders</div>' +
        '<div class="community-card-body" id="latest-orders"><div class="spinner"></div></div>' +
      "</div>" +
    "</div>" +
    '<div class="community-card">' +
      '<div class="community-card-header">Community goals</div>' +
      '<div class="community-card-body" id="goals"><div class="spinner"></div></div>' +
    "</div>";
  mainEl.appendChild(section);
}

export function loadCommunityData() {
  // Top customers
  _client.rankings
    .top({ limit: 10, sort: "-total_spent" })
    .then((customers) => {
      const el = document.getElementById("top-customers");
      if (!customers || customers.length === 0) {
        el.innerHTML = '<div class="community-empty">No data yet.</div>';
        return;
      }
      let html = "";
      customers.forEach((c, i) => {
        html +=
          '<div class="rank-row">' +
          `<span class="rank-pos">#${i + 1}</span>` +
          `<span class="rank-name">${esc(c.first_name)}</span>` +
          `<span class="rank-value">${fp(c.total_spent)}</span>` +
          "</div>";
      });
      el.innerHTML = html;
    })
    .catch(() => {
      document.getElementById("top-customers").innerHTML =
        '<div class="community-empty">Failed to load.</div>';
    });

  // Latest orders
  _client.rankings
    .latest({ limit: 10, sort: "-completed_at" })
    .then((orders) => {
      const el = document.getElementById("latest-orders");
      if (!orders || orders.length === 0) {
        el.innerHTML = '<div class="community-empty">No orders yet.</div>';
        return;
      }
      let html = "";
      orders.forEach((o) => {
        const date = new Date(o.completed_at);
        const timeAgo = getCommunityTimeAgo(date);
        html +=
          '<div class="latest-row">' +
          `<span class="latest-name">${esc(o.first_name)}</span>` +
          `<span class="latest-time">${esc(timeAgo)}</span>` +
          "</div>";
      });
      el.innerHTML = html;
    })
    .catch(() => {
      document.getElementById("latest-orders").innerHTML =
        '<div class="community-empty">Failed to load.</div>';
    });

  // Goals
  _client.goals
    .list({ per_page: 10 })
    .then((result) => {
      const el = document.getElementById("goals");
      const goals = result.data || [];
      if (goals.length === 0) {
        el.innerHTML = '<div class="community-empty">No active goals.</div>';
        return;
      }
      let html = "";
      goals.forEach((g) => {
        const progress = Math.min(g.progress, 100);
        const target = g.target ? fp(g.target) : "\u2014";
        html +=
          '<div class="goal-item">' +
          '<div class="goal-header">' +
          `<span class="goal-name">${esc(g.name)}</span>` +
          `<span class="goal-progress-text">${progress}%</span>` +
          "</div>" +
          `<div class="goal-bar"><div class="goal-bar-fill" style="width:${progress}%"></div></div>` +
          '<div class="goal-amounts">' +
          `<span>${fp(g.collected)}</span>` +
          `<span>${target}</span>` +
          "</div>" +
          "</div>";
      });
      el.innerHTML = html;
    })
    .catch(() => {
      document.getElementById("goals").innerHTML =
        '<div class="community-empty">Failed to load.</div>';
    });
}

function getCommunityTimeAgo(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en");
}
