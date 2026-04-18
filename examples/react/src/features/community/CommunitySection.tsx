"use client";

import { useTopCustomers, useLatestOrders, useGoals } from "@spaceis/react";
import type { TopCustomer, LatestOrder, Goal } from "@spaceis/react";
import { fp } from "@/lib/helpers";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function CommunitySection() {
  const { data: topCustomers, isLoading: loadingTop } = useTopCustomers({ limit: 10, sort: "-total_spent" });
  const { data: latestOrders, isLoading: loadingLatest } = useLatestOrders({ limit: 10, sort: "-completed_at" });
  const { data: goalsData, isLoading: loadingGoals } = useGoals({ per_page: 10 });

  const goals = goalsData?.data ?? [];

  return (
    <section className="section community-section">
      <div className="community-grid">
        {/* Top Customers */}
        <div className="community-card">
          <div className="community-card-header">Top customers</div>
          <div className="community-card-body">
            {loadingTop ? (
              <div className="spinner" />
            ) : !topCustomers || topCustomers.length === 0 ? (
              <div className="community-empty">No data yet.</div>
            ) : (
              topCustomers.map((c: TopCustomer, i) => (
                <div key={i} className="rank-row">
                  <span className="rank-pos">#{i + 1}</span>
                  <span className="rank-name">{c.first_name}</span>
                  <span className="rank-value">{fp(c.total_spent)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Orders */}
        <div className="community-card">
          <div className="community-card-header">Latest orders</div>
          <div className="community-card-body">
            {loadingLatest ? (
              <div className="spinner" />
            ) : !latestOrders || latestOrders.length === 0 ? (
              <div className="community-empty">No orders yet.</div>
            ) : (
              latestOrders.map((o: LatestOrder, i) => (
                <div key={i} className="latest-row">
                  <span className="latest-name">{o.first_name}</span>
                  <span className="latest-time">{timeAgo(o.completed_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Community Goals */}
      <div className="community-card">
        <div className="community-card-header">Community goals</div>
        <div className="community-card-body">
          {loadingGoals ? (
            <div className="spinner" />
          ) : goals.length === 0 ? (
            <div className="community-empty">No active goals.</div>
          ) : (
            goals.map((g: Goal) => {
              const progress = Math.min(g.progress, 100);
              const target = g.target ? fp(g.target) : "\u2014";
              return (
                <div key={g.uuid} className="goal-item">
                  <div className="goal-header">
                    <span className="goal-name">{g.name}</span>
                    <span className="goal-progress-text">{progress}%</span>
                  </div>
                  <div className="goal-bar">
                    <div
                      className="goal-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="goal-amounts">
                    <span>{fp(g.collected)}</span>
                    <span>{target}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
