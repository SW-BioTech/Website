import { useState, useCallback, useEffect } from "react";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#events", label: "Events" },
  { href: "#newsletter", label: "Newsletter" },
  { href: "#contact", label: "Contact", cta: true },
];

export default function Header({ showSignals, onToggleSignals }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const close = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    document.body.classList.toggle("drawer-open", drawerOpen);
    return () => document.body.classList.remove("drawer-open");
  }, [drawerOpen]);

  return (
    <>
      <header className="site-header">
        <a className="logo" href="#top">
          SW Biotech
        </a>

        <nav className="nav" aria-label="Primary">
          {NAV_LINKS.map(({ href, label, cta }) => (
            <a key={href} href={href} className={cta ? "nav__cta" : undefined}>
              {label}
            </a>
          ))}
          <button
            type="button"
            className={`signal-toggle ${showSignals ? "signal-toggle--on" : ""}`}
            onClick={onToggleSignals}
            aria-pressed={showSignals}
            title={showSignals ? "Hide signal pulses" : "Show signal pulses"}
          >
            <svg className="signal-toggle__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="4" cy="8" r="2" fill="currentColor" />
              <circle cx="12" cy="8" r="2" fill="currentColor" />
              <path d="M6 8h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray={showSignals ? "0" : "2 2"} />
              {showSignals && <circle cx="8" cy="8" r="1.2" fill="var(--accent-b)" />}
            </svg>
            <span className="signal-toggle__label">Signals</span>
          </button>
        </nav>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((o) => !o)}
        >
          <span className="nav-toggle__lines" />
          <span className="visually-hidden">Menu</span>
        </button>
      </header>

      {drawerOpen && (
        <div className="nav-drawer" role="dialog" aria-label="Navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <a key={href} href={href} onClick={close}>
              {label}
            </a>
          ))}
          <button
            type="button"
            className={`signal-toggle signal-toggle--drawer ${showSignals ? "signal-toggle--on" : ""}`}
            onClick={onToggleSignals}
            aria-pressed={showSignals}
          >
            <svg className="signal-toggle__icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="4" cy="8" r="2" fill="currentColor" />
              <circle cx="12" cy="8" r="2" fill="currentColor" />
              <path d="M6 8h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray={showSignals ? "0" : "2 2"} />
              {showSignals && <circle cx="8" cy="8" r="1.2" fill="var(--accent-b)" />}
            </svg>
            <span>Signal pulses {showSignals ? "on" : "off"}</span>
          </button>
        </div>
      )}
    </>
  );
}
