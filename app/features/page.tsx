import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import {
  Clock,
  History,
  RefreshCw,
  Bell,
  ChefHat,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features — Order Tracking & Customer Accounts",
  description:
    "Track your order in real-time, view your order history, reorder favorites in one click, and get SMS notifications when your food is ready.",
};

const features = [
  {
    icon: Clock,
    headline: "Your order, tracked from flame to finish.",
    subhead: "Real-Time Order Tracking",
    description:
      "Watch your order move from kitchen to counter. A live progress bar, timestamps, and estimated ready time—no app required.",
    cta: null,
  },
  {
    icon: History,
    headline: "The regulars remember. So do we.",
    subhead: "Order History",
    description:
      "Every order you've placed, organized and searchable. See what you loved. See what you ordered for the office that one time.",
    cta: {
      label: "View your orders",
      href: "/account/orders" as Route,
    },
  },
  {
    icon: RefreshCw,
    headline: "One tap. Same order. No thinking required.",
    subhead: "One-Click Reorder",
    description:
      "Found your go-to? Order it again in seconds. We'll check availability, update pricing, and add it to your cart.",
    cta: null,
  },
  {
    icon: Bell,
    headline: "A ping when it's time to pick up.",
    subhead: "SMS & Email Updates",
    description:
      "Get a text when your order is ready. No app to download, no refreshing required. Just a notification when it matters.",
    cta: null,
  },
];

export default function FeaturesPage() {
  return (
    <div className="features-page">
      {/* Hero Section */}
      <section className="features-hero">
        <div className="features-hero__content">
          <p className="features-hero__eyebrow">For Our Guests</p>
          <h1 className="features-hero__title">
            Never wonder
            <br />
            <em>&ldquo;where&apos;s my food?&rdquo;</em>
            <br />
            again.
          </h1>
          <p className="features-hero__subtitle">
            Order tracking, history, and reordering—built for people who value
            their time.
          </p>
          <div className="features-hero__cta">
            <Link href={"/sign-up" as Route} className="features-btn features-btn--primary">
              Create Your Free Account
            </Link>
            <Link href="/menu" className="features-btn features-btn--ghost">
              Start Your Order
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-grid-section">
        <div className="features-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.subhead}
                className="feature-card"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="feature-card__icon">
                  <Icon strokeWidth={1.5} />
                </div>
                <p className="feature-card__subhead">{feature.subhead}</p>
                <h2 className="feature-card__headline">{feature.headline}</h2>
                <p className="feature-card__description">
                  {feature.description}
                </p>
                {feature.cta && (
                  <Link href={feature.cta.href} className="feature-card__link">
                    {feature.cta.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* For Managers Section */}
      <section className="features-managers">
        <div className="features-managers__inner">
          <div className="features-managers__content">
            <p className="features-managers__eyebrow">For Restaurant Managers</p>
            <h2 className="features-managers__title">
              Update your menu
              <br />
              without calling IT.
            </h2>
            <p className="features-managers__description">
              Add dishes, adjust prices, toggle availability—all through a
              simple dashboard. No code, no waiting, no friction. Each location
              manages its own menu, and changes go live when you say so.
            </p>
            <div className="features-managers__features">
              <div className="features-managers__feature">
                <ChefHat className="h-5 w-5" />
                <span>Per-location menu control</span>
              </div>
              <div className="features-managers__feature">
                <RefreshCw className="h-5 w-5" />
                <span>Real-time updates</span>
              </div>
              <div className="features-managers__feature">
                <Clock className="h-5 w-5" />
                <span>Scheduled availability</span>
              </div>
            </div>
          </div>
          <div className="features-managers__visual">
            <div className="features-managers__card">
              <div className="features-managers__card-header">
                <div className="features-managers__card-dot" />
                <div className="features-managers__card-dot" />
                <div className="features-managers__card-dot" />
              </div>
              <div className="features-managers__card-content">
                <div className="features-managers__card-row">
                  <span className="features-managers__card-label">
                    Catfish Basket
                  </span>
                  <span className="features-managers__card-price">$14.99</span>
                </div>
                <div className="features-managers__card-row">
                  <span className="features-managers__card-label">
                    Shrimp Boil
                  </span>
                  <span className="features-managers__card-price">$24.99</span>
                </div>
                <div className="features-managers__card-row features-managers__card-row--disabled">
                  <span className="features-managers__card-label">
                    Crawfish (Seasonal)
                  </span>
                  <span className="features-managers__card-badge">
                    Unavailable
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="features-cta">
        <div className="features-cta__content">
          <h2 className="features-cta__title">Ready to order smarter?</h2>
          <p className="features-cta__subtitle">
            Create a free account and never lose track of your food again.
          </p>
          <Link href={"/sign-up" as Route} className="features-btn features-btn--large">
            Create Your Free Account
          </Link>
        </div>
      </section>
    </div>
  );
}
