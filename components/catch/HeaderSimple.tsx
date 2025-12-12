'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/contexts/CartContext';
import { CartDrawer } from '@/components/cart/CartDrawer';

type GsapGlobal = {
  set: (targets: Element | NodeListOf<Element>, vars: Record<string, unknown>) => void;
  to: (targets: Element | NodeListOf<Element>, vars: Record<string, unknown>) => void;
};

const navLinks = [
  { href: "/menu", label: "menu" },
  { href: "/menu2", label: "menu2" },
  { href: "/modal", label: "modal" },
  { href: "/locations", label: "locations" },
  // { href: "/gift-cards", label: "gift cards" },
  // { href: "/our-story", label: "our story" },
  { href: "/private-events", label: "events" },
  { href: "/kitchen", label: "iPad" }
] as const;

/**
 * Renders the site header with logo, primary navigation, a cart button (with item count badge), a hamburger that opens a full-page mobile menu, and a cart drawer.
 *
 * The component manages internal state for the mobile menu and cart drawer, closes the mobile menu when mobile links are clicked, and dynamically loads GSAP to animate the right-side menu items when the full-page menu becomes visible.
 *
 * @returns The header and associated overlays as a JSX element
 */
export default function HeaderSimple() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { itemCount } = useCart();
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Load GSAP
    const script = document.createElement('script');
    script.src = '/gsap.min.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const gsap = (window as typeof window & { gsap?: GsapGlobal }).gsap;
      if (!gsap) return;

      const rightItems = document.querySelectorAll('.nav-right-link-wrapper');

      // Set initial state
      gsap.set(rightItems, { opacity: 0, xPercent: -20 });

      // Watch for menu open
      const checkInterval = setInterval(() => {
        const menu = document.querySelector('.full-page-menu');
        if (!menu) return;

        const isVisible = getComputedStyle(menu).display !== 'none';

        if (isVisible && !hasAnimatedRef.current) {
          gsap.set(rightItems, { opacity: 0, xPercent: -20 });
          gsap.to(rightItems, {
            opacity: 1,
            xPercent: 0,
            duration: 0.6,
            ease: 'power1.inOut',
            stagger: 0.1
          });
          hasAnimatedRef.current = true;
        }

        if (!isVisible && hasAnimatedRef.current) {
          hasAnimatedRef.current = false;
        }
      }, 200);

      return () => {
        clearInterval(checkInterval);
        document.body.removeChild(script);
      };
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      {/* COPIED FROM CATCH - Header structure */}
      <header className="header">
        <div className="header-logo-wrapper">
          <Link href="/" className="nav-logo">
            <Image
              src="/images/the-catch-logo-2x.png"
              alt="The Catch"
              width={190}
              height={60}
              className="object-contain w-full h-auto"
              priority
            />
          </Link>
        </div>

        <div className="header-nav-wrapper">
          <ul className="nav-links">
            {navLinks.map(item => (
              <li key={item.href}>
                <Link href={item.href} className="catch-nav-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setCartOpen(true)}
            className="nav-cart-button"
            aria-label="Open cart"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="nav-cart-badge">{itemCount}</span>
            )}
          </button>
        </div>

        <div className="header-icon-wrapper">
          <button
            className="menu-icon"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* COPIED FROM CATCH - Full page overlay menu */}
      <div className={`full-page-menu ${mobileMenuOpen ? 'show' : ''}`}>
        <div className="full-page-header">
          <a
            href="#"
            className="full-page-menu-close"
            onClick={(e) => {
              e.preventDefault();
              setMobileMenuOpen(false);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 26 26" fill="none" className="close-menu-icon">
              <path d="M1 25L25 1" stroke="currentColor" strokeWidth="1.5"></path>
              <path d="M1 1L25 25" stroke="currentColor" strokeWidth="1.5"></path>
            </svg>
          </a>
        </div>

        <div className="full-page-nav-left">
          <div className="nav-left-contents">
            <div className="button-wrapper">
              <a
                href="https://www.doordash.com/"
                target="_blank"
                rel="noopener"
                className="button crema-fresca-small _2"
              >
                <div className="button-text">order with doordash</div>
                <div className="button-icon-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 21 20" fill="none" className="button-icon left">
                    <path d="M14.667 3.33301C14.667 6.45412 17.1179 9.00314 20.2002 9.15918L20.5 9.16699V10.833C17.2783 10.833 14.667 13.4453 14.667 16.667H13C13 14.3102 14.088 12.2079 15.7881 10.833H0.5V9.16699H15.7881C14.088 7.79206 13 5.68984 13 3.33301H14.667Z" fill="currentColor"></path>
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 21 20" fill="none" className="button-icon right">
                    <path d="M14.667 3.33301C14.667 6.45412 17.1179 9.00314 20.2002 9.15918L20.5 9.16699V10.833C17.2783 10.833 14.667 13.4453 14.667 16.667H13C13 14.3102 14.088 12.2079 15.7881 10.833H0.5V9.16699H15.7881C14.088 7.79206 13 5.68984 13 3.33301H14.667Z" fill="currentColor"></path>
                  </svg>
                </div>
              </a>
            </div>
            <div className="horizontal-line maiz-dorado"></div>
            <div className="nav-left-links">
              <Link href="/private-events" className="text-link" onClick={() => setMobileMenuOpen(false)}>
                private events
              </Link>
              {/* Temporarily hidden
              <Link href="/our-story" className="text-link" onClick={() => setMobileMenuOpen(false)}>
                News &amp; stories
              </Link>
              */}
            </div>
            <div className="horizontal-line maiz-dorado"></div>
            <div className="social-wrapper horizontal">
              <a href="https://www.facebook.com/" target="_blank" className="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 40 41" fill="none">
                  <path d="M36.6666 20.9006C36.6666 11.6395 29.2055 4.13281 19.9999 4.13281C10.7944 4.13281 3.33325 11.6395 3.33325 20.9006C3.33325 29.2717 9.42659 36.2084 17.3955 37.4661V25.7484H13.1644V20.8995H17.3955V17.2061C17.3955 13.0039 19.8833 10.6817 23.691 10.6817C25.5133 10.6817 27.4221 11.0095 27.4221 11.0095V15.1361H25.3188C23.2488 15.1361 22.6044 16.4295 22.6044 17.7561V20.9006H27.2266L26.4877 25.7473H22.6044V37.4661C30.5733 36.2084 36.6666 29.2717 36.6666 20.9006Z" fill="currentColor"></path>
                </svg>
              </a>
              <a href="https://www.instagram.com/" target="_blank" className="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 40 41" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M14.5482 15.348C15.9941 13.9021 17.9552 13.0898 20 13.0898C22.0448 13.0898 24.0059 13.9021 25.4518 15.348C26.8977 16.7939 27.71 18.755 27.71 20.7998C27.71 22.8446 26.8977 24.8057 25.4518 26.2516C24.0059 27.6975 22.0448 28.5098 20 28.5098C17.9552 28.5098 15.9941 27.6975 14.5482 26.2516C13.1023 24.8057 12.29 22.8446 12.29 20.7998C12.29 18.755 13.1023 16.7939 14.5482 15.348ZM18.0847 25.4238C18.6919 25.6754 19.3427 25.8048 20 25.8048C21.3274 25.8048 22.6004 25.2775 23.5391 24.3389C24.4777 23.4003 25.005 22.1272 25.005 20.7998C25.005 19.4724 24.4777 18.1994 23.5391 17.2607C22.6004 16.3221 21.3274 15.7948 20 15.7948C19.3427 15.7948 18.6919 15.9243 18.0847 16.1758C17.4774 16.4273 16.9257 16.796 16.4609 17.2607C15.9962 17.7255 15.6275 18.2772 15.376 18.8845C15.1245 19.4917 14.995 20.1425 14.995 20.7998C14.995 21.4571 15.1245 22.1079 15.376 22.7151C15.6275 23.3224 15.9962 23.8741 16.4609 24.3389C16.9257 24.8036 17.4774 25.1723 18.0847 25.4238Z" fill="currentColor"></path>
                  <path d="M29.4192 14.2385C29.761 13.8967 29.953 13.4332 29.953 12.9498C29.953 12.4665 29.761 12.0029 29.4192 11.6611C29.0774 11.3193 28.6139 11.1273 28.1305 11.1273C27.6471 11.1273 27.1836 11.3193 26.8418 11.6611C26.5 12.0029 26.308 12.4665 26.308 12.9498C26.308 13.4332 26.5 13.8967 26.8418 14.2385C27.1836 14.5803 27.6471 14.7723 28.1305 14.7723C28.6139 14.7723 29.0774 14.5803 29.4192 14.2385Z" fill="currentColor"></path>
                  <path fillRule="evenodd" clipRule="evenodd" d="M13.816 5.8898C15.416 5.8168 15.926 5.7998 20 5.7998C24.075 5.7998 24.584 5.8178 26.183 5.8898C27.78 5.9628 28.872 6.2178 29.826 6.5868C30.8265 6.96366 31.7329 7.55403 32.482 8.3168C33.245 9.06613 33.8354 9.97287 34.212 10.9738C34.583 11.9278 34.837 13.0188 34.91 14.6158C34.983 16.2158 35 16.7258 35 20.7998C35 24.8738 34.983 25.3838 34.91 26.9838C34.837 28.5808 34.583 29.6718 34.213 30.6258C33.8361 31.6263 33.2458 32.5327 32.483 33.2818C31.733 34.0458 30.826 34.6358 29.826 35.0118C28.872 35.3828 27.781 35.6368 26.184 35.7098C24.584 35.7828 24.074 35.7998 20 35.7998C15.926 35.7998 15.416 35.7828 13.816 35.7098C12.219 35.6368 11.128 35.3828 10.174 35.0128C9.17351 34.6359 8.26715 34.0456 7.518 33.2828C6.754 32.5328 6.164 31.6258 5.788 30.6258C5.417 29.6718 5.163 28.5808 5.09 26.9838C5.017 25.3838 5 24.8748 5 20.7998C5 16.7248 5.018 16.2158 5.09 14.6168C5.163 13.0198 5.418 11.9278 5.787 10.9738C6.16386 9.9733 6.75422 9.06694 7.517 8.3178C8.267 7.5538 9.174 6.9638 10.174 6.5878C11.128 6.2168 12.219 5.9628 13.816 5.8898ZM26.062 8.5898C24.48 8.51781 24.005 8.5028 20 8.5028C15.995 8.5028 15.52 8.51781 13.938 8.5898C12.476 8.6568 11.682 8.9008 11.153 9.1068C10.5014 9.34678 9.91194 9.72985 9.428 10.2278C8.904 10.7528 8.578 11.2528 8.307 11.9528C8.1 12.4818 7.857 13.2758 7.79 14.7378C7.718 16.3198 7.703 16.7948 7.703 20.7998C7.703 24.8048 7.718 25.2798 7.79 26.8618C7.857 28.3238 8.101 29.1178 8.307 29.6468C8.54713 30.2983 8.93018 30.8878 9.428 31.3718C9.91201 31.8697 10.5015 32.2527 11.153 32.4928C11.682 32.6998 12.476 32.9428 13.938 33.0098C15.52 33.0818 15.994 33.0968 20 33.0968C24.006 33.0968 24.48 33.0818 26.062 33.0098C27.524 32.9428 28.318 32.6988 28.847 32.4928C29.4986 32.2529 30.0881 31.8698 30.572 31.3718C31.0699 30.8878 31.4529 30.2983 31.693 29.6468C31.9 29.1178 32.143 28.3238 32.21 26.8618C32.282 25.2798 32.297 24.8048 32.297 20.7998C32.297 16.7948 32.282 16.3198 32.21 14.7378C32.143 13.2758 31.899 12.4818 31.693 11.9528C31.422 11.2528 31.097 10.7528 30.572 10.2278C30.047 9.7038 29.547 9.3778 28.847 9.1068C28.318 8.8998 27.524 8.6568 26.062 8.5898Z" fill="currentColor"></path>
                </svg>
              </a>
              <a href="https://www.tiktok.com/" target="_blank" className="social-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 40 41" fill="none">
                  <path d="M30.1924 10.8144C28.3969 9.64366 27.101 7.77051 26.6967 5.58692C26.6093 5.11514 26.5614 4.6296 26.5614 4.13281H20.8307L20.8215 27.0994C20.7252 29.6713 18.6084 31.7355 16.0135 31.7355C15.207 31.7355 14.4475 31.5338 13.7789 31.182C12.2456 30.3751 11.1963 28.7679 11.1963 26.9183C11.1963 24.262 13.3574 22.1009 16.0135 22.1009C16.5093 22.1009 16.9849 22.1827 17.4349 22.3236V16.4732C16.9692 16.4098 16.4962 16.3702 16.0135 16.3702C10.1972 16.3702 5.46558 21.1021 5.46558 26.9183C5.46558 30.4868 7.2485 33.6448 9.96855 35.5544C11.6819 36.7573 13.7659 37.4661 16.0135 37.4661C21.8297 37.4661 26.5614 32.7345 26.5614 26.9183V15.2723C28.809 16.8855 31.5628 17.8362 34.5342 17.8362V12.1055C32.9335 12.1055 31.4428 11.6296 30.1924 10.8144Z" fill="currentColor"></path>
                </svg>
              </a>
            </div>
          </div>
          <div className="texture-overlay"></div>
        </div>

        <div className="full-page-nav-right">
          <div className="nav-right-content">
            <div className="nav-right-link-wrapper">
              <div className="nav-right-accent-wrapper">
                <div className="accent claro-maiz-right-aligned">
                  food &<br/>drinks
                </div>
              </div>
              <Link href="/menu" className="link-block full-page-nav" onClick={() => setMobileMenuOpen(false)}>
                <h3 className="h3">Menu</h3>
              </Link>
            </div>
            <div className="nav-right-link-wrapper">
              <div className="nav-right-accent-wrapper">
                <div className="accent claro-maiz-right-aligned">
                  alternate<br/>menu
                </div>
              </div>
              <Link href="/menu2" className="link-block full-page-nav" onClick={() => setMobileMenuOpen(false)}>
                <h3 className="h3">Menu2</h3>
              </Link>
            </div>
            <div className="nav-right-link-wrapper">
              <div className="nav-right-accent-wrapper">
                <div className="accent claro-maiz-right-aligned">
                  Explore<br/>Our
                </div>
              </div>
              <Link href="/locations" className="link-block full-page-nav" onClick={() => setMobileMenuOpen(false)}>
                <h3 className="h3">Locations</h3>
              </Link>
            </div>
            {/* Temporarily hidden
            <div className="nav-right-link-wrapper">
              <div className="nav-right-accent-wrapper">
                <div className="accent claro-maiz-right-aligned">
                  share<br/>food
                </div>
              </div>
              <Link href="/gift-cards" className="link-block full-page-nav" onClick={() => setMobileMenuOpen(false)}>
                <h3 className="h3">Gift Cards</h3>
              </Link>
            </div>
            <div className="nav-right-link-wrapper">
              <div className="nav-right-accent-wrapper">
                <div className="accent claro-maiz-right-aligned">
                  our<br/>story
                </div>
              </div>
              <Link href="/our-story" className="link-block full-page-nav" onClick={() => setMobileMenuOpen(false)}>
                <h3 className="h3">Our Story</h3>
              </Link>
            </div>
            */}
            <div className="nav-right-link-wrapper">
              <div className="nav-right-accent-wrapper">
                <div className="accent claro-maiz-right-aligned">
                  celebrate<br/>with us
                </div>
              </div>
              <Link href="/private-events" className="link-block full-page-nav" onClick={() => setMobileMenuOpen(false)}>
                <h3 className="h3">Private Events</h3>
              </Link>
            </div>
          </div>
          <div className="texture-overlay"></div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
