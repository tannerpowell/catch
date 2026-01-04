"use client";

import { useState } from "react";
import {
  ROADMAP_EPICS,
  ROADMAP_LAST_UPDATED,
  CATEGORY_META,
  PRIORITY_META,
  STATUS_META,
  EFFORT_META,
  computeRoadmapStats,
  type FeatureCategory,
  type DevStatus,
} from "./roadmap-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  ChefHat,
  CreditCard,
  Server,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Fish,
} from "lucide-react";

const CATEGORY_ICONS: Record<FeatureCategory, React.ReactNode> = {
  ordering: <ShoppingCart className="h-5 w-5" />,
  kitchen: <ChefHat className="h-5 w-5" />,
  payments: <CreditCard className="h-5 w-5" />,
  infrastructure: <Server className="h-5 w-5" />,
};

const STATUS_ICONS: Record<DevStatus, React.ReactNode> = {
  todo: <Circle className="h-4 w-4" />,
  in_progress: <Clock className="h-4 w-4" />,
  blocked: <AlertCircle className="h-4 w-4" />,
  done: <CheckCircle2 className="h-4 w-4" />,
};

export default function RoadmapPage() {
  const stats = computeRoadmapStats(ROADMAP_EPICS);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(
    new Set(ROADMAP_EPICS.map((e) => e.id))
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<FeatureCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<DevStatus | "all">("all");

  const toggleEpic = (id: string) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredEpics = ROADMAP_EPICS.filter((epic) => {
    if (filterCategory !== "all" && epic.category !== filterCategory) return false;
    if (filterStatus === "all") return true;
    // Check if any item or task matches the status filter
    return epic.items.some((item) => {
      if (item.tasks) {
        return item.tasks.some((task) => task.status === filterStatus);
      }
      return item.status === filterStatus;
    });
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Fish className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">The Catch Roadmap</h1>
              <p className="text-muted-foreground">
                Development progress for the restaurant ordering system
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span id="category-filter-label" className="text-sm text-muted-foreground">Category:</span>
              <div className="flex gap-1" role="group" aria-labelledby="category-filter-label">
                <button
                  onClick={() => setFilterCategory("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                    filterCategory === "all"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  All
                </button>
                {(Object.keys(CATEGORY_META) as FeatureCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm transition-colors",
                      filterCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {CATEGORY_META[cat].label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span id="status-filter-label" className="text-sm text-muted-foreground">Status:</span>
              <div className="flex gap-1" role="group" aria-labelledby="status-filter-label">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm transition-colors",
                    filterStatus === "all"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  All
                </button>
                {(["done", "in_progress", "todo"] as DevStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm transition-colors",
                      filterStatus === status
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {STATUS_META[status].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-3xl font-bold text-foreground">{stats.percentComplete}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.done}
            </div>
            <div className="text-sm text-muted-foreground">Done</div>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.inProgress}
            </div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </div>
          <div className="rounded-xl border border-border bg-muted/50 p-4">
            <div className="text-3xl font-bold text-muted-foreground">{stats.todo}</div>
            <div className="text-sm text-muted-foreground">To Do</div>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {stats.blocked}
            </div>
            <div className="text-sm text-muted-foreground">Blocked</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="text-foreground">
              {stats.done} / {stats.total} tasks
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
              style={{ width: `${stats.percentComplete}%` }}
            />
          </div>
        </div>

        {/* Epics */}
        <div className="space-y-6">
          {filteredEpics.map((epic) => {
            const epicStats = {
              total: 0,
              done: 0,
            };
            epic.items.forEach((item) => {
              if (item.tasks) {
                item.tasks.forEach((t) => {
                  epicStats.total++;
                  if (t.status === "done") epicStats.done++;
                });
              } else {
                epicStats.total++;
                if (item.status === "done") epicStats.done++;
              }
            });
            const epicPercent =
              epicStats.total > 0 ? Math.round((epicStats.done / epicStats.total) * 100) : 0;

            return (
              <div
                key={epic.id}
                className={cn(
                  "rounded-xl border overflow-hidden",
                  CATEGORY_META[epic.category].bgClass
                )}
              >
                {/* Epic Header */}
                <button
                  onClick={() => toggleEpic(epic.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg bg-muted/50",
                      CATEGORY_META[epic.category].color
                    )}
                  >
                    {CATEGORY_ICONS[epic.category]}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-foreground">{epic.title}</h2>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          CATEGORY_META[epic.category].color,
                          "bg-muted/50"
                        )}
                      >
                        {CATEGORY_META[epic.category].label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{epic.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-foreground">{epicPercent}%</div>
                      <div className="text-xs text-muted-foreground">
                        {epicStats.done}/{epicStats.total}
                      </div>
                    </div>
                    {expandedEpics.has(epic.id) ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Epic Items */}
                {expandedEpics.has(epic.id) && (
                  <div className="border-t border-border/50 divide-y divide-border/50">
                    {epic.items
                      .filter((item) => {
                        if (filterStatus === "all") return true;
                        if (item.tasks) {
                          return item.tasks.some((task) => task.status === filterStatus);
                        }
                        return item.status === filterStatus;
                      })
                      .map((item) => {
                        const itemDone = item.tasks
                          ? item.tasks.filter((t) => t.status === "done").length
                          : item.status === "done"
                            ? 1
                            : 0;
                        const itemTotal = item.tasks ? item.tasks.length : 1;

                        return (
                          <div key={item.id} className="bg-card/30">
                            {/* Item Header */}
                            <button
                              onClick={() => item.tasks && toggleItem(item.id)}
                              className={cn(
                                "w-full flex items-center gap-4 p-4",
                                item.tasks && "hover:bg-muted/30 transition-colors cursor-pointer"
                              )}
                            >
                              <div
                                className={cn(
                                  "flex items-center gap-2",
                                  STATUS_META[item.status].color
                                )}
                              >
                                {STATUS_ICONS[item.status]}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {item.id}
                                  </span>
                                  <span className="font-medium text-foreground">{item.title}</span>
                                  <span
                                    className={cn(
                                      "text-xs px-1.5 py-0.5 rounded",
                                      PRIORITY_META[item.priority].color
                                    )}
                                  >
                                    {PRIORITY_META[item.priority].label}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                {item.tasks && (
                                  <>
                                    <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-green-500"
                                        style={{ width: `${itemTotal > 0 ? Math.min(Math.max((itemDone / itemTotal) * 100, 0), 100) : 0}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-muted-foreground w-10">
                                      {itemDone}/{itemTotal}
                                    </span>
                                    {expandedItems.has(item.id) ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </>
                                )}
                              </div>
                            </button>

                            {/* Tasks */}
                            {item.tasks && expandedItems.has(item.id) && (
                              <div className="pb-4 px-4 pl-14 space-y-2">
                                {item.tasks
                                  .filter(
                                    (task) =>
                                      filterStatus === "all" || task.status === filterStatus
                                  )
                                  .map((task) => (
                                    <div key={task.id} className="flex items-start gap-3 text-sm">
                                      <span className={cn(STATUS_META[task.status].color, "mt-0.5")}>
                                        {STATUS_ICONS[task.status]}
                                      </span>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-mono text-xs text-muted-foreground">
                                            {task.id}
                                          </span>
                                          <span
                                            className={cn(
                                              task.status === "done"
                                                ? "text-muted-foreground line-through"
                                                : "text-foreground"
                                            )}
                                          >
                                            {task.title}
                                          </span>
                                          {task.effort && (
                                            <span
                                              className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted"
                                              title={EFFORT_META[task.effort].hint}
                                            >
                                              {EFFORT_META[task.effort].label}
                                            </span>
                                          )}
                                        </div>
                                        {task.notes && (
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {task.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
          <p>Last updated: {ROADMAP_LAST_UPDATED}</p>
        </div>
      </div>
    </div>
  );
}
