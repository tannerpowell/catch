"use client";

import { useState, useRef, useEffect, type CSSProperties } from "react";
import styles from "./MenuDisplaySetup.module.css";

type LocationPreview = { slug: string; name: string };

interface Props {
  locations: LocationPreview[];
}

export default function MenuDisplaySetupClient({ locations }: Props) {
  const [selectedSlug, setSelectedSlug] = useState(locations[0]?.slug || "");
  const selectedLocation = locations.find((l) => l.slug === selectedSlug);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(0.25);
  const [modalScreen, setModalScreen] = useState<1 | 2 | null>(null);

  // Calculate scale factor based on container width
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const frameWidth = (containerWidth - 16) / 2; // 16px gap
        const scale = frameWidth / 1920;
        setScaleFactor(scale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalScreen(null);
    };
    if (modalScreen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [modalScreen]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>Operations</span>
          <h1 className={styles.title}>Menu TV Display Setup</h1>
          <p className={styles.subtitle}>
            Configure TV menus for each location
          </p>
        </header>

        {/* TV Preview Section */}
        <section className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <h2 className={styles.sectionTitle}>PREVIEW</h2>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className={styles.locationSelect}
            >
              {locations.map((loc) => (
                <option key={loc.slug} value={loc.slug}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.tvPair} ref={containerRef}>
            <button
              type="button"
              className={styles.tvFrame}
              onClick={() => setModalScreen(1)}
              aria-label="View Screen 1 fullscreen"
            >
              <div className={styles.tvLabel}>Screen 1</div>
              <div
                className={styles.tvScaleWrapper}
                style={{ "--scale-factor": scaleFactor } as CSSProperties}
              >
                <iframe
                  src={`/tv-menu-display/${selectedSlug}?page=1`}
                  className={styles.tvScreen}
                  title={`${selectedLocation?.name} - Page 1`}
                />
              </div>
            </button>
            <button
              type="button"
              className={styles.tvFrame}
              onClick={() => setModalScreen(2)}
              aria-label="View Screen 2 fullscreen"
            >
              <div className={styles.tvLabel}>Screen 2</div>
              <div
                className={styles.tvScaleWrapper}
                style={{ "--scale-factor": scaleFactor } as CSSProperties}
              >
                <iframe
                  src={`/tv-menu-display/${selectedSlug}?page=2`}
                  className={styles.tvScreen}
                  title={`${selectedLocation?.name} - Page 2`}
                />
              </div>
            </button>
          </div>
        </section>

        {/* Two-column location links */}
        <section className={styles.locationsSection}>
          <h2 className={styles.sectionTitle}>LOCATIONS</h2>
          <div className={styles.locationGrid}>
            {locations.map((loc) => (
              <div key={loc.slug} className={styles.locationRow}>
                <div className={styles.locationInfo}>
                  <span className={styles.locationName}>{loc.name}</span>
                  <span className={styles.locationPath}>/{loc.slug}</span>
                </div>
                <div className={styles.screenButtons}>
                  <a
                    href={`/tv-menu-display/${loc.slug}?page=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.screenButton}
                  >
                    Screen 1
                  </a>
                  <a
                    href={`/tv-menu-display/${loc.slug}?page=2`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.screenButton}
                  >
                    Screen 2
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Setup notices */}
        <section className={styles.notices}>
          <div className={styles.notice}>
            <h3 className={styles.noticeTitle}>Mac Mini Kiosk Setup</h3>
            <ol className={styles.noticeList}>
              <li>Open Safari or Chrome on your Mac Mini</li>
              <li>Navigate to the location URL above</li>
              <li>Enter fullscreen mode (Cmd + Ctrl + F in Safari, or F11 in Chrome)</li>
              <li>Menu data refreshes automatically every 5 minutes</li>
            </ol>
          </div>

          <div className={styles.notice}>
            <h3 className={styles.noticeTitle}>Chrome Kiosk Mode</h3>
            <p className={styles.noticeText}>
              For a true kiosk experience, launch Chrome with these flags:
            </p>
            <code className={styles.codeBlock}>
              /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk --noerrdialogs --disable-infobars &quot;https://yourdomain.com/tv-menu-display/conroe&quot;
            </code>
          </div>
        </section>
      </div>

      {/* Fullscreen Modal */}
      {modalScreen && (
        <div className={styles.modalOverlay} onClick={() => setModalScreen(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>
              {(selectedLocation?.name
                ? selectedLocation.name.replace(/^The Catch\s*[—–-]\s*/i, "")
                : selectedSlug)} – Screen {modalScreen}
            </div>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setModalScreen(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <iframe
              src={`/tv-menu-display/${selectedSlug}?page=${modalScreen}`}
              className={styles.modalIframe}
              title={`${selectedLocation?.name} - Page ${modalScreen}`}
            />
            <div className={styles.modalClickLayer} onClick={() => setModalScreen(null)} />
          </div>
        </div>
      )}
    </div>
  );
}
