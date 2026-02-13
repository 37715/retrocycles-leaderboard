"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import StaggeredMenu from "@/src/ui/StaggeredMenu";

export function BeatstoreMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollided, setIsCollided] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const menuItems = [
    { label: "home", link: "/leaderboard", ariaLabel: "Home" },
    { label: "hub", link: "/", ariaLabel: "Hub" },
    { label: "about", link: "/about", ariaLabel: "About" },
    { label: "support", link: "/support", ariaLabel: "Support" }
  ];

  const handleMenuClose = () => {
    setIsOpen(false);
    const toggleButton = document.querySelector(".beatstore-menu-wrapper .sm-toggle") as HTMLButtonElement | null;
    if (toggleButton) toggleButton.click();
  };

  const handleMenuItemClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("/")) {
      e.preventDefault();
      router.push(href);
      handleMenuClose();
    }
  };

  useEffect(() => {
    const threshold = 72;
    const onScroll = () => {
      const next = window.scrollY > threshold;
      setIsCollided((prev) => (prev === next ? prev : next));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`beatstore-menu-wrapper${isCollided ? " is-collided" : ""}`}>
      {isOpen && (
        <div
          ref={overlayRef}
          className="menu-overlay"
          onClick={handleMenuClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.3)",
            zIndex: 9990,
            pointerEvents: "auto"
          }}
        />
      )}
      <style>{`
        .beatstore-menu-wrapper .staggered-menu-wrapper.fixed-wrapper { z-index: 10000 !important; }
        .beatstore-menu-wrapper .staggered-menu-header { pointer-events: none !important; z-index: 9999 !important; padding: 1.5rem 2rem; }
        .beatstore-menu-wrapper .sm-toggle {
          pointer-events: auto !important;
          color: #e9e9ef;
          text-transform: lowercase;
          font-size: 14px;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid transparent;
          background: transparent;
          transition: background-color 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease;
        }
        .beatstore-menu-wrapper.is-collided .sm-toggle {
          background: rgba(11, 11, 11, 0.82);
          border-color: rgba(233, 233, 239, 0.18);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
        }
        .beatstore-menu-wrapper .staggered-menu-wrapper[data-open] .sm-toggle {
          background: rgba(11, 11, 11, 0.9);
          border-color: rgba(124, 58, 237, 0.35);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.42);
        }
        .beatstore-menu-wrapper .staggered-menu-wrapper[data-open] .staggered-menu-panel,
        .beatstore-menu-wrapper .staggered-menu-wrapper[data-open] .sm-prelayers { pointer-events: auto !important; z-index: 9998 !important; }
        .beatstore-menu-wrapper .staggered-menu-panel { background: #0b0b0b; }
        .beatstore-menu-wrapper .sm-panel-list { gap: 1.5rem; }
        .beatstore-menu-wrapper .sm-panel-item {
          color: #d7d7e1;
          font-weight: 600;
          text-transform: lowercase;
          letter-spacing: -1px;
          line-height: 1.2;
          cursor: pointer;
          opacity: 0.92;
          transition: color 0.18s ease, text-shadow 0.18s ease, opacity 0.18s ease;
        }
        .beatstore-menu-wrapper .sm-panel-item:hover,
        .beatstore-menu-wrapper .sm-panel-item:focus-visible {
          color: #ffffff;
          opacity: 1;
          text-shadow: 0 0 12px rgba(124, 58, 237, 0.55);
        }
        .beatstore-menu-wrapper .sm-panel-itemLabel { cursor: pointer; }
        .beatstore-menu-wrapper .sm-panel-itemWrap { padding-bottom: 0.2em; }
        .beatstore-menu-wrapper .sm-panel-list[data-numbering] .sm-panel-item::after { color: #7c3aed; opacity: var(--sm-num-opacity, 0); }
      `}</style>
      <StaggeredMenu
        position="left"
        colors={["#0b0b0b", "#0b0b0b"]}
        items={menuItems}
        displayItemNumbering
        menuButtonColor="#e9e9ef"
        openMenuButtonColor="#e9e9ef"
        accentColor="#7c3aed"
        changeMenuColorOnOpen={false}
        isFixed
        onMenuOpen={() => setIsOpen(true)}
        onMenuClose={() => setIsOpen(false)}
        onItemClick={handleMenuItemClick}
      />
    </div>
  );
}
