import { useState, useCallback, useEffect } from "react";

const NAV_LINKS = [
  { href: "#about", label: "About" },
  { href: "#events", label: "Events" },
  { href: "#newsletter", label: "Newsletter" },
  { href: "#contact", label: "Contact", cta: true },
];

export default function Header() {
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
        </div>
      )}
    </>
  );
}
