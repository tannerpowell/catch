// =============================================================================
// The Catch - Development Roadmap Data
// =============================================================================

export type DevStatus = "todo" | "in_progress" | "blocked" | "done";
export type Priority = "p0" | "p1" | "p2" | "p3";
export type Effort = "xs" | "s" | "m" | "l" | "xl";
export type FeatureCategory = "ordering" | "kitchen" | "payments" | "infrastructure";

export type DevTask = {
  id: string;
  title: string;
  status: DevStatus;
  effort?: Effort;
  notes?: string;
};

export type RoadmapItem = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: DevStatus;
  tasks?: DevTask[];
};

export type RoadmapEpic = {
  id: string;
  title: string;
  description: string;
  category: FeatureCategory;
  items: RoadmapItem[];
};

// =============================================================================
// Metadata Configuration
// =============================================================================

export const CATEGORY_META: Record<
  FeatureCategory,
  { label: string; color: string; bgClass: string }
> = {
  ordering: {
    label: "Customer Ordering",
    color: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
  },
  kitchen: {
    label: "Kitchen Operations",
    color: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-500/10 border-orange-500/20",
  },
  payments: {
    label: "Payments",
    color: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
  },
  infrastructure: {
    label: "Infrastructure",
    color: "text-slate-600 dark:text-slate-400",
    bgClass: "bg-slate-500/10 border-slate-500/20",
  },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  p0: { label: "Critical", color: "text-red-600 dark:text-red-400 bg-red-500/10" },
  p1: { label: "High", color: "text-orange-600 dark:text-orange-400 bg-orange-500/10" },
  p2: { label: "Medium", color: "text-yellow-600 dark:text-yellow-400 bg-yellow-500/10" },
  p3: { label: "Low", color: "text-green-600 dark:text-green-400 bg-green-500/10" },
};

export const STATUS_META: Record<
  DevStatus,
  { label: string; color: string }
> = {
  todo: { label: "To Do", color: "text-muted-foreground" },
  in_progress: { label: "In Progress", color: "text-blue-600 dark:text-blue-400" },
  blocked: { label: "Blocked", color: "text-red-600 dark:text-red-400" },
  done: { label: "Done", color: "text-green-600 dark:text-green-400" },
};

export const EFFORT_META: Record<Effort, { label: string; hint: string }> = {
  xs: { label: "XS", hint: "< 1 day" },
  s: { label: "S", hint: "1-2 days" },
  m: { label: "M", hint: "3-5 days" },
  l: { label: "L", hint: "1-2 weeks" },
  xl: { label: "XL", hint: "2+ weeks" },
};

// =============================================================================
// Roadmap Metadata
// =============================================================================

export const ROADMAP_LAST_UPDATED = "January 15, 2026";

// =============================================================================
// Roadmap Data
// =============================================================================

export const ROADMAP_EPICS: RoadmapEpic[] = [
  // =========================================================================
  // EPIC: Foundation
  // =========================================================================
  {
    id: "foundation",
    title: "Foundation",
    description: "Core architecture, CMS integration, and multi-location support",
    category: "infrastructure",
    items: [
      {
        id: "CATCH-001",
        title: "Next.js Project Setup",
        description: "Next.js 15 with App Router, TypeScript, and Tailwind CSS",
        priority: "p0",
        status: "done",
        tasks: [
          { id: "CATCH-001a", title: "Initialize Next.js 15 project", status: "done", effort: "s" },
          { id: "CATCH-001b", title: "Configure TypeScript strict mode", status: "done", effort: "xs" },
          { id: "CATCH-001c", title: "Set up Tailwind CSS v4", status: "done", effort: "s" },
          { id: "CATCH-001d", title: "Configure ESLint and formatting", status: "done", effort: "xs" },
        ],
      },
      {
        id: "CATCH-002",
        title: "Sanity CMS Integration",
        description: "Headless CMS for content management with embedded studio",
        priority: "p0",
        status: "done",
        tasks: [
          { id: "CATCH-002a", title: "Sanity project and dataset setup", status: "done", effort: "s" },
          { id: "CATCH-002b", title: "Define content schemas (locations, menu items, categories)", status: "done", effort: "l" },
          { id: "CATCH-002c", title: "Embed Sanity Studio at /studio", status: "done", effort: "m" },
          { id: "CATCH-002d", title: "GROQ query layer with caching", status: "done", effort: "m" },
          { id: "CATCH-002e", title: "Webhook for ISR revalidation", status: "done", effort: "s" },
        ],
      },
      {
        id: "CATCH-003",
        title: "Multi-Location Architecture",
        description: "Support for 17+ restaurant locations with location-specific data",
        priority: "p0",
        status: "done",
        tasks: [
          { id: "CATCH-003a", title: "Location schema with hours, address, contact", status: "done", effort: "m" },
          { id: "CATCH-003b", title: "Per-location price overrides", status: "done", effort: "m" },
          { id: "CATCH-003c", title: "Location selector and context", status: "done", effort: "s" },
          { id: "CATCH-003d", title: "Location detail pages (/locations/[slug])", status: "done", effort: "m" },
        ],
      },
      {
        id: "CATCH-004",
        title: "Design System",
        description: "Responsive design with dark mode and brand aesthetics",
        priority: "p1",
        status: "done",
        tasks: [
          { id: "CATCH-004a", title: "CSS variables for theming", status: "done", effort: "s" },
          { id: "CATCH-004b", title: "Dark mode toggle", status: "done", effort: "s" },
          { id: "CATCH-004c", title: "Typography system (Playfair, Source Sans)", status: "done", effort: "s" },
          { id: "CATCH-004d", title: "Responsive breakpoints and mobile-first approach", status: "done", effort: "m" },
        ],
      },
      {
        id: "CATCH-005",
        title: "Observability",
        description: "Error tracking and performance monitoring",
        priority: "p1",
        status: "done",
        tasks: [
          { id: "CATCH-005a", title: "Sentry integration (client/server/edge)", status: "done", effort: "m" },
          { id: "CATCH-005b", title: "Vercel Analytics setup", status: "done", effort: "xs" },
          { id: "CATCH-005c", title: "Speed Insights integration", status: "done", effort: "xs" },
        ],
      },
    ],
  },

  // =========================================================================
  // EPIC: Menu & Ordering
  // =========================================================================
  {
    id: "menu-ordering",
    title: "Menu & Ordering",
    description: "Customer-facing menu browsing and order placement",
    category: "ordering",
    items: [
      {
        id: "CATCH-010",
        title: "Menu Browsing",
        description: "Browse menus with categories, items, and location-specific pricing",
        priority: "p0",
        status: "done",
        tasks: [
          { id: "CATCH-010a", title: "Category navigation with scroll-spy", status: "done", effort: "m" },
          { id: "CATCH-010b", title: "Menu item list with images and pricing", status: "done", effort: "m" },
          { id: "CATCH-010c", title: "Item badges (Spicy, Vegetarian, GF, etc.)", status: "done", effort: "s" },
          { id: "CATCH-010d", title: "Menu search functionality", status: "done", effort: "s" },
          { id: "CATCH-010e", title: "Location-aware pricing display", status: "done", effort: "m" },
        ],
      },
      {
        id: "CATCH-011",
        title: "Item Detail Modal",
        description: "View item details and customize with modifiers",
        priority: "p0",
        status: "done",
        tasks: [
          { id: "CATCH-011a", title: "Item modal with description and image", status: "done", effort: "m" },
          { id: "CATCH-011b", title: "Modifier groups (required/optional)", status: "done", effort: "l" },
          { id: "CATCH-011c", title: "Price calculation with modifiers", status: "done", effort: "m" },
          { id: "CATCH-011d", title: "Special instructions input", status: "done", effort: "s" },
        ],
      },
      {
        id: "CATCH-012",
        title: "Cart System",
        description: "Shopping cart with persistence and quantity management",
        priority: "p0",
        status: "done",
        tasks: [
          { id: "CATCH-012a", title: "Cart context and state management", status: "done", effort: "m" },
          { id: "CATCH-012b", title: "Add to cart with modifiers", status: "done", effort: "m" },
          { id: "CATCH-012c", title: "Update quantity and remove items", status: "done", effort: "s" },
          { id: "CATCH-012d", title: "LocalStorage persistence", status: "done", effort: "s" },
          { id: "CATCH-012e", title: "Cart drawer/sidebar UI", status: "done", effort: "m" },
        ],
      },
      {
        id: "CATCH-013",
        title: "Checkout Flow",
        description: "Guest checkout with customer information and order summary",
        priority: "p0",
        status: "done",
        tasks: [
          { id: "CATCH-013a", title: "Checkout page layout", status: "done", effort: "m" },
          { id: "CATCH-013b", title: "Customer info form (name, phone, email)", status: "done", effort: "m" },
          { id: "CATCH-013c", title: "Order type selection (pickup/delivery/dine-in)", status: "done", effort: "s" },
          { id: "CATCH-013d", title: "Order summary with totals", status: "done", effort: "s" },
          { id: "CATCH-013e", title: "Form validation with Zod", status: "done", effort: "s" },
        ],
      },
      {
        id: "CATCH-014",
        title: "Order Confirmation",
        description: "Post-order confirmation and tracking",
        priority: "p1",
        status: "done",
        tasks: [
          { id: "CATCH-014a", title: "Order confirmation page", status: "done", effort: "m" },
          { id: "CATCH-014b", title: "Order tracking by number", status: "done", effort: "m" },
          { id: "CATCH-014c", title: "Order history API endpoint", status: "done", effort: "s" },
        ],
      },
      {
        id: "CATCH-015",
        title: "Navigation Progress",
        description: "Perceived performance with progress indicators",
        priority: "p1",
        status: "done",
        tasks: [
          { id: "CATCH-015a", title: "Navigation progress bar (150ms threshold)", status: "done", effort: "m" },
          { id: "CATCH-015b", title: "Route loading skeletons", status: "done", effort: "m" },
          { id: "CATCH-015c", title: "Content fade-in transitions", status: "done", effort: "s" },
        ],
      },
    ],
  },

  // =========================================================================
  // EPIC: Kitchen Display System
  // =========================================================================
  {
    id: "kitchen",
    title: "Kitchen Display System",
    description: "Real-time order management for kitchen staff",
    category: "kitchen",
    items: [
      {
        id: "CATCH-020",
        title: "KDS Board",
        description: "Order board with status columns",
        priority: "p0",
        status: "done",
        tasks: [
          { id: "CATCH-020a", title: "Kitchen board layout", status: "done", effort: "m" },
          { id: "CATCH-020b", title: "Order columns (Confirmed → Preparing → Ready)", status: "done", effort: "m" },
          { id: "CATCH-020c", title: "Order cards with item details", status: "done", effort: "m" },
          { id: "CATCH-020d", title: "Status update controls", status: "done", effort: "s" },
        ],
      },
      {
        id: "CATCH-021",
        title: "PWA Capability",
        description: "Install as app on tablets and kitchen displays",
        priority: "p1",
        status: "done",
        tasks: [
          { id: "CATCH-021a", title: "Web app manifest", status: "done", effort: "s" },
          { id: "CATCH-021b", title: "Service worker registration", status: "done", effort: "m" },
          { id: "CATCH-021c", title: "Add-to-homescreen prompts", status: "done", effort: "s" },
          { id: "CATCH-021d", title: "Offline fallback page", status: "done", effort: "s" },
        ],
      },
      {
        id: "CATCH-022",
        title: "Real-time Updates",
        description: "Live order updates without page refresh",
        priority: "p1",
        status: "in_progress",
        tasks: [
          { id: "CATCH-022a", title: "Polling-based updates (current)", status: "done", effort: "s" },
          { id: "CATCH-022b", title: "WebSocket or SSE implementation", status: "todo", effort: "l", notes: "Replace polling with real-time connection" },
          { id: "CATCH-022c", title: "Optimistic UI updates", status: "todo", effort: "m" },
        ],
      },
    ],
  },

  // =========================================================================
  // EPIC: Payments
  // =========================================================================
  {
    id: "payments",
    title: "Payment Processing",
    description: "Stripe integration for secure payment handling",
    category: "payments",
    items: [
      {
        id: "CATCH-030",
        title: "Stripe Integration",
        description: "Core payment processing with Stripe",
        priority: "p0",
        status: "todo",
        tasks: [
          { id: "CATCH-030a", title: "Stripe SDK setup and configuration", status: "todo", effort: "s" },
          { id: "CATCH-030b", title: "Create payment intent API route", status: "todo", effort: "m" },
          { id: "CATCH-030c", title: "Stripe Elements checkout UI", status: "todo", effort: "m" },
          { id: "CATCH-030d", title: "Payment confirmation handling", status: "todo", effort: "s" },
        ],
      },
      {
        id: "CATCH-031",
        title: "Webhook Handling",
        description: "Handle Stripe events for order fulfillment",
        priority: "p0",
        status: "todo",
        tasks: [
          { id: "CATCH-031a", title: "Webhook endpoint with signature verification", status: "todo", effort: "m" },
          { id: "CATCH-031b", title: "Payment success → order confirmation", status: "todo", effort: "m" },
          { id: "CATCH-031c", title: "Payment failure handling", status: "todo", effort: "s" },
          { id: "CATCH-031d", title: "Idempotency for duplicate events", status: "todo", effort: "s" },
        ],
      },
      {
        id: "CATCH-032",
        title: "Multi-Location Stripe Connect",
        description: "Separate payment accounts per location",
        priority: "p2",
        status: "todo",
        tasks: [
          { id: "CATCH-032a", title: "Stripe Connect account linking", status: "todo", effort: "l" },
          { id: "CATCH-032b", title: "Location-based payment routing", status: "todo", effort: "m" },
          { id: "CATCH-032c", title: "Connect onboarding flow", status: "todo", effort: "l" },
        ],
      },
      {
        id: "CATCH-033",
        title: "Refunds & Disputes",
        description: "Handle refunds and payment disputes",
        priority: "p2",
        status: "todo",
        tasks: [
          { id: "CATCH-033a", title: "Refund API endpoint", status: "todo", effort: "m" },
          { id: "CATCH-033b", title: "Partial refund support", status: "todo", effort: "s" },
          { id: "CATCH-033c", title: "Dispute notification handling", status: "todo", effort: "m" },
        ],
      },
    ],
  },

  // =========================================================================
  // EPIC: Authentication & Security
  // =========================================================================
  {
    id: "auth",
    title: "Authentication & Security",
    description: "User authentication and role-based access control",
    category: "infrastructure",
    items: [
      {
        id: "CATCH-040",
        title: "Staff Authentication",
        description: "Secure login for kitchen and management staff",
        priority: "p0",
        status: "todo",
        tasks: [
          { id: "CATCH-040a", title: "Clerk authentication setup", status: "todo", effort: "m", notes: "Clerk SDK already installed" },
          { id: "CATCH-040b", title: "Kitchen staff login flow", status: "todo", effort: "m" },
          { id: "CATCH-040c", title: "Manager authentication", status: "todo", effort: "s" },
          { id: "CATCH-040d", title: "Session management", status: "todo", effort: "s" },
        ],
      },
      {
        id: "CATCH-041",
        title: "Role-Based Access Control",
        description: "Restrict features based on user roles",
        priority: "p0",
        status: "todo",
        tasks: [
          { id: "CATCH-041a", title: "Define roles (customer, kitchen, manager, admin)", status: "todo", effort: "s" },
          { id: "CATCH-041b", title: "Protected route middleware", status: "todo", effort: "m" },
          { id: "CATCH-041c", title: "Location-based authorization", status: "todo", effort: "m" },
          { id: "CATCH-041d", title: "Audit logging for sensitive actions", status: "todo", effort: "m" },
        ],
      },
      {
        id: "CATCH-042",
        title: "Customer Accounts",
        description: "Optional customer accounts for order history",
        priority: "p2",
        status: "todo",
        tasks: [
          { id: "CATCH-042a", title: "Customer sign-up/sign-in", status: "todo", effort: "m" },
          { id: "CATCH-042b", title: "Order history for logged-in users", status: "todo", effort: "m" },
          { id: "CATCH-042c", title: "Saved addresses", status: "todo", effort: "s" },
          { id: "CATCH-042d", title: "Favorite items", status: "todo", effort: "s" },
        ],
      },
    ],
  },

  // =========================================================================
  // EPIC: Notifications
  // =========================================================================
  {
    id: "notifications",
    title: "Notifications",
    description: "Email and SMS notifications for order updates",
    category: "infrastructure",
    items: [
      {
        id: "CATCH-050",
        title: "Email Notifications",
        description: "Transactional emails via Resend",
        priority: "p1",
        status: "done",
        tasks: [
          { id: "CATCH-050a", title: "Resend SDK setup", status: "done", effort: "s" },
          { id: "CATCH-050b", title: "Order confirmation email template", status: "done", effort: "m" },
          { id: "CATCH-050c", title: "Order ready notification", status: "done", effort: "s" },
          { id: "CATCH-050d", title: "Receipt email with order details", status: "done", effort: "m", notes: "Included in order confirmation" },
        ],
      },
      {
        id: "CATCH-051",
        title: "SMS Notifications",
        description: "Text message updates via Twilio",
        priority: "p1",
        status: "done",
        tasks: [
          { id: "CATCH-051a", title: "Twilio SDK setup", status: "done", effort: "s" },
          { id: "CATCH-051b", title: "Order confirmed SMS", status: "done", effort: "s" },
          { id: "CATCH-051c", title: "Order ready for pickup SMS", status: "done", effort: "s" },
          { id: "CATCH-051d", title: "Customer opt-in/opt-out handling", status: "done", effort: "m" },
        ],
      },
      {
        id: "CATCH-052",
        title: "Push Notifications",
        description: "Browser push for kitchen and customers",
        priority: "p3",
        status: "todo",
        tasks: [
          { id: "CATCH-052a", title: "Push notification service worker", status: "todo", effort: "m" },
          { id: "CATCH-052b", title: "Kitchen new order alerts", status: "todo", effort: "m" },
          { id: "CATCH-052c", title: "Customer order status updates", status: "todo", effort: "m" },
        ],
      },
    ],
  },

  // =========================================================================
  // EPIC: POS Integration
  // =========================================================================
  {
    id: "pos",
    title: "POS Integration",
    description: "Revel POS system integration for order management",
    category: "kitchen",
    items: [
      {
        id: "CATCH-060",
        title: "Revel API Integration",
        description: "Connect to Revel POS system",
        priority: "p1",
        status: "todo",
        tasks: [
          { id: "CATCH-060a", title: "Revel API client setup", status: "todo", effort: "m" },
          { id: "CATCH-060b", title: "Authentication and token management", status: "todo", effort: "m" },
          { id: "CATCH-060c", title: "Error handling and retry logic", status: "todo", effort: "s" },
        ],
      },
      {
        id: "CATCH-061",
        title: "Order Push to POS",
        description: "Send online orders to Revel for fulfillment",
        priority: "p1",
        status: "todo",
        tasks: [
          { id: "CATCH-061a", title: "Order data mapping (web → Revel format)", status: "todo", effort: "l" },
          { id: "CATCH-061b", title: "Push order on payment success", status: "todo", effort: "m" },
          { id: "CATCH-061c", title: "Handle push failures gracefully", status: "todo", effort: "m" },
          { id: "CATCH-061d", title: "Order sync status tracking", status: "todo", effort: "s" },
        ],
      },
      {
        id: "CATCH-062",
        title: "Menu Sync from POS",
        description: "Keep menu in sync with Revel",
        priority: "p2",
        status: "todo",
        tasks: [
          { id: "CATCH-062a", title: "Fetch menu items from Revel", status: "todo", effort: "m" },
          { id: "CATCH-062b", title: "Price and availability sync", status: "todo", effort: "m" },
          { id: "CATCH-062c", title: "Scheduled sync job", status: "todo", effort: "s" },
        ],
      },
    ],
  },

  // =========================================================================
  // EPIC: Testing
  // =========================================================================
  {
    id: "testing",
    title: "Testing & QA",
    description: "Automated testing for reliability",
    category: "infrastructure",
    items: [
      {
        id: "CATCH-070",
        title: "E2E Testing Infrastructure",
        description: "Playwright setup for end-to-end tests",
        priority: "p1",
        status: "todo",
        tasks: [
          { id: "CATCH-070a", title: "Playwright configuration", status: "todo", effort: "m" },
          { id: "CATCH-070b", title: "Test fixtures and helpers", status: "todo", effort: "m" },
          { id: "CATCH-070c", title: "CI/CD integration", status: "todo", effort: "s" },
        ],
      },
      {
        id: "CATCH-071",
        title: "Critical Flow Tests",
        description: "E2E tests for core user journeys",
        priority: "p1",
        status: "todo",
        tasks: [
          { id: "CATCH-071a", title: "Menu browsing and item selection", status: "todo", effort: "m" },
          { id: "CATCH-071b", title: "Cart operations (add, update, remove)", status: "todo", effort: "m" },
          { id: "CATCH-071c", title: "Checkout and payment flow", status: "todo", effort: "l" },
          { id: "CATCH-071d", title: "Order tracking page", status: "todo", effort: "s" },
        ],
      },
      {
        id: "CATCH-072",
        title: "Unit Tests",
        description: "Unit tests for business logic",
        priority: "p2",
        status: "todo",
        tasks: [
          { id: "CATCH-072a", title: "Vitest setup and configuration", status: "todo", effort: "s" },
          { id: "CATCH-072b", title: "Cart calculation tests", status: "todo", effort: "m" },
          { id: "CATCH-072c", title: "Price and modifier logic tests", status: "todo", effort: "m" },
          { id: "CATCH-072d", title: "Validation schema tests", status: "todo", effort: "s" },
        ],
      },
    ],
  },

  // =========================================================================
  // EPIC: Future Enhancements
  // =========================================================================
  {
    id: "future",
    title: "Future Enhancements",
    description: "Nice-to-have features for future releases",
    category: "ordering",
    items: [
      {
        id: "CATCH-080",
        title: "Scheduled Orders",
        description: "Allow customers to schedule pickup/delivery time",
        priority: "p2",
        status: "todo",
        tasks: [
          { id: "CATCH-080a", title: "Date/time picker in checkout", status: "todo", effort: "m" },
          { id: "CATCH-080b", title: "Kitchen queue scheduling", status: "todo", effort: "m" },
          { id: "CATCH-080c", title: "Reminder notifications", status: "todo", effort: "s" },
        ],
      },
      {
        id: "CATCH-081",
        title: "Catering Orders",
        description: "Large orders with special handling",
        priority: "p3",
        status: "todo",
        tasks: [
          { id: "CATCH-081a", title: "Catering menu and pricing", status: "todo", effort: "l" },
          { id: "CATCH-081b", title: "Lead time requirements", status: "todo", effort: "s" },
          { id: "CATCH-081c", title: "Staff review before confirmation", status: "todo", effort: "m" },
        ],
      },
      {
        id: "CATCH-082",
        title: "Loyalty Program",
        description: "Rewards for repeat customers",
        priority: "p3",
        status: "todo",
        tasks: [
          { id: "CATCH-082a", title: "Points earning system", status: "todo", effort: "m" },
          { id: "CATCH-082b", title: "Reward redemption", status: "todo", effort: "m" },
          { id: "CATCH-082c", title: "Loyalty dashboard for customers", status: "todo", effort: "m" },
        ],
      },
      {
        id: "CATCH-083",
        title: "Delivery Integration",
        description: "Native delivery with driver tracking",
        priority: "p3",
        status: "todo",
        tasks: [
          { id: "CATCH-083a", title: "Delivery zone configuration", status: "todo", effort: "m" },
          { id: "CATCH-083b", title: "Driver assignment", status: "todo", effort: "l" },
          { id: "CATCH-083c", title: "Real-time driver tracking", status: "todo", effort: "xl" },
        ],
      },
    ],
  },
];

// =============================================================================
// Stats Computation
// =============================================================================

export function computeRoadmapStats(epics: RoadmapEpic[]) {
  let total = 0;
  let done = 0;
  let inProgress = 0;
  let blocked = 0;

  for (const epic of epics) {
    for (const item of epic.items) {
      if (item.tasks) {
        for (const task of item.tasks) {
          total++;
          if (task.status === "done") done++;
          else if (task.status === "in_progress") inProgress++;
          else if (task.status === "blocked") blocked++;
        }
      } else {
        total++;
        if (item.status === "done") done++;
        else if (item.status === "in_progress") inProgress++;
        else if (item.status === "blocked") blocked++;
      }
    }
  }

  return {
    total,
    done,
    inProgress,
    blocked,
    todo: total - done - inProgress - blocked,
    percentComplete: total > 0 ? Math.round((done / total) * 100) : 0,
  };
}
