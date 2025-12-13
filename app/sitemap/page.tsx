'use client';

import Link from 'next/link';
import type { Route } from 'next';
import styles from './sitemap.module.css';

interface SitemapLink {
  href: Route;
  label: string;
  description?: string;
  badge?: string;
}

interface SitemapSection {
  title: string;
  description?: string;
  links: SitemapLink[];
}

const sections: SitemapSection[] = [
  {
    title: 'ORDERING',
    description: 'Browse our menu and place your order',
    links: [
      { href: '/menu' as Route, label: 'Menu', description: 'Full menu with categories and filtering' },
      { href: '/menu2' as Route, label: 'Menu (Alternate)', description: 'Card-based menu layout' },
      { href: '/locations' as Route, label: 'Locations', description: 'Find a restaurant near you' },
      { href: '/checkout' as Route, label: 'Checkout', description: 'Complete your order' },
      { href: '/order-confirmation' as Route, label: 'Order Confirmation', description: 'Order status and details' },
    ],
  },
  {
    title: 'ABOUT',
    description: 'Learn more about The Catch',
    links: [
      { href: '/our-story' as Route, label: 'Our Story', description: 'The history and mission behind The Catch' },
      { href: '/private-events' as Route, label: 'Private Events', description: 'Host your next gathering with us' },
      { href: '/gift-cards' as Route, label: 'Gift Cards', description: 'Give the gift of great seafood' },
    ],
  },
  {
    title: 'OPERATIONS',
    description: 'Back-of-house tools',
    links: [
      { href: '/kitchen' as Route, label: 'Kitchen Display', description: 'iPad order management system', badge: 'Staff' },
      { href: '/menu-display' as Route, label: 'Menu TV Display', description: 'Digital menu boards for locations', badge: 'Staff' },
      { href: '/categories-analysis' as Route, label: 'Menu Analysis', description: 'Property reports and universal menu planning', badge: 'Staff' },
    ],
  },
  {
    title: 'DEVELOPMENT',
    description: 'Tools for building and testing',
    links: [
      { href: '/modal' as Route, label: 'Modifier Modal', description: 'Test the item customization sheet', badge: 'Dev' },
      { href: '/test' as Route, label: 'Component Test', description: 'Test page for components', badge: 'Dev' },
      { href: '/studio' as Route, label: 'Sanity Studio', description: 'Content management system', badge: 'CMS' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <span className={styles.eyebrow}>Navigation</span>
          <h1 className={styles.title}>Sitemap</h1>
          <p className={styles.subtitle}>
            All pages and tools in one place
          </p>
        </header>

        {/* Sections */}
        <div className={styles.sections}>
          {sections.map((section) => (
            <section key={section.title} className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                {section.description && (
                  <p className={styles.sectionDescription}>{section.description}</p>
                )}
              </div>
              <ul className={styles.linkList}>
                {section.links.map((link) => (
                  <li key={link.href} className={styles.linkItem}>
                    <Link href={link.href} className={styles.link}>
                      <div className={styles.linkContent}>
                        <span className={styles.linkLabel}>
                          {link.label}
                          {link.badge && (
                            <span className={styles.badge} data-badge={link.badge.toLowerCase()}>
                              {link.badge}
                            </span>
                          )}
                        </span>
                        {link.description && (
                          <span className={styles.linkDescription}>{link.description}</span>
                        )}
                      </div>
                      <span className={styles.linkArrow}>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <span className={styles.footerText}>The Catch</span>
            <span className={styles.footerDivider}>·</span>
            <span className={styles.footerText}>Fresh Gulf Seafood</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
