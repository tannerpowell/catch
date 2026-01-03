import type { Metadata } from "next";
import Image from "next/image";
import {
  MapPin,
  Zap,
  Monitor,
  Users,
  Gauge,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features — Tools for Restaurant Owners | The Catch",
  description:
    "Multi-location menu management, kitchen displays, TV menus, professional photography, real-time pricing, and reliable hosting. Everything you need to run a tighter operation.",
};

// Hero highlights
const heroHighlights = [
  { icon: MapPin, label: "One menu for every location" },
  { icon: Zap, label: "Instant 86'ing" },
  { icon: Monitor, label: "Kitchen + TV displays" },
  { icon: Users, label: "Keep customer relationship" },
  { icon: Gauge, label: "Fast, reliable menus" },
];

// ===== VISUAL COMPONENTS =====

// Multi-location dashboard mockup
function MultiLocationVisual() {
  return (
    <div className="features-visual-card">
      <div className="features-visual-card__header">
        <div className="features-visual-card__dot features-visual-card__dot--red" />
        <div className="features-visual-card__dot features-visual-card__dot--yellow" />
        <div className="features-visual-card__dot features-visual-card__dot--green" />
        <span className="features-visual-card__title">Menu Manager</span>
      </div>
      <div className="features-visual-card__content">
        <div className="features-visual-card__tabs">
          <span className="features-visual-card__tab features-visual-card__tab--active">All Locations</span>
          <span className="features-visual-card__tab">Arlington</span>
          <span className="features-visual-card__tab">Conroe</span>
          <span className="features-visual-card__tab">+14</span>
        </div>
        <div className="features-visual-card__rows">
          <div className="features-visual-card__row">
            <span>Catfish Basket</span>
            <span className="features-visual-card__price">$14.99</span>
          </div>
          <div className="features-visual-card__row">
            <span>Shrimp Boil</span>
            <span className="features-visual-card__price">$24.99</span>
          </div>
          <div className="features-visual-card__row features-visual-card__row--override">
            <span>Crawfish <em>(Arlington: $22.99)</em></span>
            <span className="features-visual-card__price">$19.99</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// KDS mockup with order tickets
function KDSVisual() {
  return (
    <div className="features-kds">
      <div className="features-kds__column">
        <div className="features-kds__header features-kds__header--new">New</div>
        <div className="features-kds__ticket">
          <div className="features-kds__ticket-header">
            <span>#1042</span>
            <span className="features-kds__ticket-time">2:34</span>
          </div>
          <div className="features-kds__ticket-items">
            <div>1× Catfish Basket</div>
            <div>2× Shrimp Tacos</div>
          </div>
          <button type="button" className="features-kds__btn features-kds__btn--start">Start</button>
        </div>
      </div>
      <div className="features-kds__column">
        <div className="features-kds__header features-kds__header--cooking">Cooking</div>
        <div className="features-kds__ticket features-kds__ticket--active">
          <div className="features-kds__ticket-header">
            <span>#1041</span>
            <span className="features-kds__ticket-time features-kds__ticket-time--warning">5:12</span>
          </div>
          <div className="features-kds__ticket-items">
            <div>1× The Catch Boil</div>
            <div>1× Hush Puppies</div>
          </div>
          <button type="button" className="features-kds__btn features-kds__btn--ready">Ready</button>
        </div>
      </div>
      <div className="features-kds__column">
        <div className="features-kds__header features-kds__header--ready">Ready</div>
        <div className="features-kds__ticket features-kds__ticket--done">
          <div className="features-kds__ticket-header">
            <span>#1040</span>
            <span className="features-kds__ticket-badge">Pickup</span>
          </div>
          <div className="features-kds__ticket-items">
            <div>2× Fish &amp; Chips</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// TV Menu + Print Menu mockups
function TVMenuVisual() {
  return (
    <div className="features-displays-duo">
      {/* TV Display mockup */}
      <div className="features-tv-mockup">
        <div className="features-tv-mockup__bezel">
          <div className="features-tv-mockup__screen">
            <div className="features-tv-mockup__header">THE CATCH · Conroe</div>
            <div className="features-tv-mockup__grid">
              <div className="features-tv-mockup__col">
                <div className="features-tv-mockup__cat">Baskets</div>
                <div className="features-tv-mockup__item">
                  <span>Catfish Basket</span>
                  <span className="features-tv-mockup__dots" />
                  <span>$14.99</span>
                </div>
                <div className="features-tv-mockup__item">
                  <span>Shrimp Basket</span>
                  <span className="features-tv-mockup__dots" />
                  <span>$15.99</span>
                </div>
                <div className="features-tv-mockup__item features-tv-mockup__item--off">
                  <span>Oyster Basket</span>
                  <span className="features-tv-mockup__badge">86&apos;d</span>
                </div>
              </div>
              <div className="features-tv-mockup__col">
                <div className="features-tv-mockup__cat">Boils</div>
                <div className="features-tv-mockup__item">
                  <span>The Catch Boil</span>
                  <span className="features-tv-mockup__dots" />
                  <span>$29.99</span>
                </div>
                <div className="features-tv-mockup__item">
                  <span>Cajun Special</span>
                  <span className="features-tv-mockup__dots" />
                  <span>$26.99</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <span className="features-display-label">TV Display</span>
      </div>

      {/* Print Menu mockup */}
      <div className="features-print-mockup">
        <div className="features-print-mockup__page">
          <div className="features-print-mockup__header">
            <div className="features-print-mockup__logo">THE CATCH</div>
            <div className="features-print-mockup__sub">Conroe</div>
          </div>
          <div className="features-print-mockup__section">
            <div className="features-print-mockup__cat">Baskets</div>
            <div className="features-print-mockup__item">Catfish Basket · $14.99</div>
            <div className="features-print-mockup__item">Shrimp Basket · $15.99</div>
          </div>
          <div className="features-print-mockup__section">
            <div className="features-print-mockup__cat">Boils</div>
            <div className="features-print-mockup__item">The Catch Boil · $29.99</div>
            <div className="features-print-mockup__item">Cajun Special · $26.99</div>
          </div>
        </div>
        <span className="features-display-label">Print Menu</span>
      </div>
    </div>
  );
}

// Before/After photography comparison
function PhotographyVisual() {
  return (
    <div className="features-compare">
      <div className="features-compare__side">
        <Image
          src="/images/compare/before/catfish-basket.jpg"
          alt="Before: Original photo"
          width={240}
          height={180}
          className="features-compare__img"
        />
        <span className="features-compare__label features-compare__label--before">Before</span>
      </div>
      <div className="features-compare__arrow">→</div>
      <div className="features-compare__side">
        <Image
          src="/images/compare/after/Catfish basket, served__hero_4x3.png"
          alt="After: Professional photo"
          width={240}
          height={180}
          className="features-compare__img"
        />
        <span className="features-compare__label features-compare__label--after">After</span>
      </div>
    </div>
  );
}

// Pricing/availability toggle mockup
function PricingVisual() {
  return (
    <div className="features-visual-card features-visual-card--dark">
      <div className="features-visual-card__header">
        <div className="features-visual-card__dot features-visual-card__dot--red" />
        <div className="features-visual-card__dot features-visual-card__dot--yellow" />
        <div className="features-visual-card__dot features-visual-card__dot--green" />
        <span className="features-visual-card__title">Availability</span>
      </div>
      <div className="features-visual-card__content">
        <div className="features-visual-card__rows">
          <div className="features-visual-card__row features-visual-card__row--toggle">
            <span>Catfish Basket</span>
            <span className="features-toggle features-toggle--on" />
          </div>
          <div className="features-visual-card__row features-visual-card__row--toggle">
            <span>Shrimp Boil</span>
            <span className="features-toggle features-toggle--on" />
          </div>
          <div className="features-visual-card__row features-visual-card__row--toggle features-visual-card__row--disabled">
            <span>Crawfish (Seasonal)</span>
            <span className="features-toggle features-toggle--off" />
          </div>
        </div>
        <div className="features-visual-card__badge">
          <span>86&apos;d — Updated everywhere in 2 seconds</span>
        </div>
      </div>
    </div>
  );
}

// Customer data/checkout mockup
function CustomerDataVisual() {
  return (
    <div className="features-visual-card">
      <div className="features-visual-card__header">
        <div className="features-visual-card__dot features-visual-card__dot--red" />
        <div className="features-visual-card__dot features-visual-card__dot--yellow" />
        <div className="features-visual-card__dot features-visual-card__dot--green" />
        <span className="features-visual-card__title">Your Orders</span>
      </div>
      <div className="features-visual-card__content">
        <div className="features-visual-card__customer">
          <div className="features-visual-card__avatar">JD</div>
          <div>
            <strong>John D.</strong>
            <div className="features-visual-card__meta">12 orders · Last: 3 days ago</div>
          </div>
        </div>
        <div className="features-visual-card__rows">
          <div className="features-visual-card__row">
            <span>Catfish Basket</span>
            <span className="features-visual-card__count">×8</span>
          </div>
          <div className="features-visual-card__row">
            <span>The Catch Boil</span>
            <span className="features-visual-card__count">×3</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Speed/performance visual
function HostingVisual() {
  return (
    <div className="features-speed">
      <div className="features-speed__metric">
        <span className="features-speed__value">0.8s</span>
        <span className="features-speed__label">Page Load</span>
      </div>
      <div className="features-speed__bar">
        <div className="features-speed__fill" style={{ width: "92%" }} />
      </div>
      <div className="features-speed__stats">
        <div>
          <span className="features-speed__stat-value">99.9%</span>
          <span className="features-speed__stat-label">Uptime</span>
        </div>
        <div>
          <span className="features-speed__stat-value">Global</span>
          <span className="features-speed__stat-label">CDN</span>
        </div>
        <div>
          <span className="features-speed__stat-value">Auto</span>
          <span className="features-speed__stat-label">Scaling</span>
        </div>
      </div>
    </div>
  );
}

// Feature section data
const featureSections = [
  {
    id: "multi-location",
    alignment: "left" as const,
    isDark: false,
    headline: "Update one menu or sixteen. Your call.",
    copy: "Manage menus across every location from one dashboard. Push changes instantly or schedule them for later. Each store keeps its own prices and availability while staying on-brand.",
    bullets: [
      "Sync menu changes across all locations in seconds",
      "Set location-specific prices without duplicating work",
      "Schedule menu updates for new items or specials",
      "Keep branding consistent without micromanaging",
    ],
    Visual: MultiLocationVisual,
  },
  {
    id: "kds",
    alignment: "right" as const,
    isDark: true,
    headline: "Tickets that never get lost in the chaos.",
    copy: "Replace the ticket printer chaos with a screen your line cooks can actually read. Orders flow in automatically, get bumped when done, and never get lost behind the grill.",
    bullets: [
      "Color-coded tickets by order type (dine-in, pickup, delivery)",
      "Automatic time tracking so you know what's behind",
      "Works on any iPad—no special hardware required",
      "Syncs with your existing POS",
    ],
    Visual: KDSVisual,
  },
  {
    id: "tv-displays",
    alignment: "left" as const,
    isDark: false,
    headline: "Turn any screen into a menu board.",
    copy: "Turn any TV into a dynamic menu board. Update prices and availability from your phone. No more printing new signs every time crawfish season ends.",
    bullets: [
      "Plug-and-play setup on any smart TV or Chromecast",
      "Real-time sync with your menu—when something's 86'd, it disappears",
      "Display photos, prices, and descriptions your way",
      "Schedule different menus for breakfast, lunch, and dinner",
    ],
    Visual: TVMenuVisual,
  },
  {
    id: "photography",
    alignment: "right" as const,
    isDark: false,
    headline: "Professional photos that make the food sell itself.",
    copy: "Every item on your menu gets a professional photo that makes it look as good as it tastes. No stock images. No phone snapshots. Just real food, shot right.",
    bullets: [
      "Professional photography for every menu item",
      "Consistent styling across your entire menu",
      "Images optimized for web, mobile, and TV displays",
      "Updates included when you change the menu",
    ],
    Visual: PhotographyVisual,
  },
  {
    id: "pricing",
    alignment: "left" as const,
    isDark: true,
    headline: "86'd an item? The menu knows before your staff does.",
    copy: "When the shrimp runs out, flip a switch. The menu updates everywhere—online, in-store, on the TV—before your next customer orders something you can't make.",
    bullets: [
      "Toggle items on or off with one tap",
      "Update prices without waiting for IT",
      "Changes appear instantly across all channels",
      "Schedule price changes for happy hour or specials",
    ],
    Visual: PricingVisual,
  },
  {
    id: "customer-data",
    alignment: "right" as const,
    isDark: false,
    headline: "Your customers. Your data. No middleman taking a cut.",
    copy: "Customers order directly from you. No app fees. No commissions. You keep the margin and the data—so you know who's ordering, what they like, and how to bring them back.",
    bullets: [
      "Direct ordering with zero third-party fees",
      "Build your own customer database",
      "Track order history and preferences",
      "Send promotions without paying per message",
    ],
    Visual: CustomerDataVisual,
  },
  {
    id: "hosting",
    alignment: "left" as const,
    isDark: false,
    headline: "Fast pages. Zero downtime. No babysitting required.",
    copy: "Your menu loads fast, works on every device, and stays up when it matters. Built on infrastructure that handles traffic spikes without breaking a sweat.",
    bullets: [
      "Sub-second page loads on mobile and desktop",
      "99.9% uptime—no outages during the dinner rush",
      "Automatic scaling for busy periods",
      "No maintenance required on your end",
    ],
    Visual: HostingVisual,
  },
];

// FeatureSection component
interface FeatureSectionProps {
  id: string;
  alignment: "left" | "right";
  headline: string;
  copy: string;
  bullets: string[];
  Visual: React.ComponentType;
  isDark?: boolean;
  animationDelay?: number;
}

function FeatureSection({
  id,
  alignment,
  headline,
  copy,
  bullets,
  Visual,
  isDark = false,
  animationDelay = 0,
}: FeatureSectionProps) {
  return (
    <section
      id={id}
      className={`features-section ${isDark ? "features-section--dark" : ""}`}
    >
      <div
        className={`features-section__inner ${
          alignment === "right" ? "features-section__inner--reversed" : ""
        }`}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <div className="features-section__copy">
          <h2 className="features-section__headline">{headline}</h2>
          <p className="features-section__description">{copy}</p>
          <ul className="features-section__bullets">
            {bullets.map((bullet, i) => (
              <li key={i} className="features-section__bullet">
                {bullet}
              </li>
            ))}
          </ul>
        </div>
        <div className="features-section__visual">
          <Visual />
        </div>
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <div className="features-page">
      {/* Hero Section */}
      <section className="features-hero">
        <div className="features-hero__content">
          <h1 className="features-hero__title">
            Everything your kitchen needs
            <br />
            to run smoother and sell more.
          </h1>
          <p className="features-hero__subtitle">
            One platform. All locations. Real-time control over menus, orders,
            and the customer experience.
          </p>
          <div className="features-hero__highlights">
            {heroHighlights.map((highlight) => {
              const Icon = highlight.icon;
              return (
                <div key={highlight.label} className="features-hero__highlight">
                  <Icon className="features-hero__highlight-icon" />
                  <span>{highlight.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      {featureSections.map((section, index) => (
        <FeatureSection
          key={section.id}
          {...section}
          animationDelay={index * 50}
        />
      ))}

      {/* Closing Summary */}
      <section className="features-closing">
        <div className="features-closing__content">
          <p className="features-closing__text">
            The Catch gives you the tools to run a tighter operation and keep
            more of what you make. No app fees draining your margins. No
            middlemen between you and your customers. Just a platform that does
            exactly what it should—and stays out of your way while you cook.
          </p>
        </div>
      </section>
    </div>
  );
}
