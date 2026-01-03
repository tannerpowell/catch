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
      { href: '/menu' as Route, label: 'Menu', description: 'Premium 3-pane menu with instant filtering' },
      { href: '/menu2' as Route, label: 'Menu Mixitup', description: 'Card-based menu layout with smooth animations' },
      { href: '/menu-legacy' as Route, label: 'Menu (Legacy)', description: 'Original menu with categories' },
      { href: '/locations' as Route, label: 'Locations', description: 'Find a restaurant near you' },
      { href: '/checkout' as Route, label: 'Checkout', description: 'Complete your order' },
      { href: '/order-confirmation' as Route, label: 'Order Confirmation', description: 'Order status and details' },
    ],
  },
  {
    title: 'ABOUT',
    description: 'Learn more about The Catch',
    links: [
      { href: '/features' as Route, label: 'Features', description: 'What makes our ordering system special' },
      { href: '/our-story' as Route, label: 'Our Story', description: 'The history and mission behind The Catch' },
      { href: '/private-events' as Route, label: 'Private Events', description: 'Host your next gathering with us' },
      { href: '/gift-cards' as Route, label: 'Gift Cards', description: 'Give the gift of great seafood' },
    ],
  },
  {
    title: 'MARKETING',
    description: 'Showcase and promotional tools',
    links: [
      { href: '/ai-images' as Route, label: 'AI Image Gallery', description: 'Browse AI-enhanced menu photography' },
      { href: '/image-compare' as Route, label: 'Image Compare', description: 'Before/after image slider comparisons' },
    ],
  },
  {
    title: 'OPERATIONS',
    description: 'Back-of-house tools',
    links: [
      { href: '/kitchen' as Route, label: 'iPad', description: 'Kitchen order management system', badge: 'Staff' },
      { href: '/tv-menu-display' as Route, label: 'TV Menu Display', description: 'Digital menu boards for locations', badge: 'Staff' },
      { href: '/print-menu' as Route, label: 'Print Menu', description: 'Generate printable PDF menus', badge: 'Staff' },
      { href: '/categories-analysis' as Route, label: 'Menu Analysis', description: 'Property reports and universal menu planning', badge: 'Staff' },
    ],
  },
  {
    title: 'DEVELOPMENT',
    description: 'Tools for building and testing',
    links: [
      { href: '/dev/roadmap' as Route, label: 'Roadmap', description: 'Development progress and upcoming features', badge: 'Dev' },
      { href: '/modal' as Route, label: 'Modifier Modal', description: 'Test the item customization sheet', badge: 'Dev' },
      { href: '/test' as Route, label: 'Component Test', description: 'Test page for components', badge: 'Dev' },
      { href: '/design-demo' as Route, label: 'Design Demo', description: 'Interactive design system comparison', badge: 'Dev' },
      { href: '/studio' as Route, label: 'Sanity Studio', description: 'Content management system', badge: 'CMS' },
    ],
  },
  {
    title: 'ARCHIVES',
    description: 'Previous page designs',
    links: [
      { href: '/sitemap/locations-archive' as Route, label: 'Locations (Legacy)', description: 'Previous map + list layout', badge: 'Archive' },
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
