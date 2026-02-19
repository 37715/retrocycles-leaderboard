"use client";

import type { MouseEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

type MenuItem = { label: string; link: string; ariaLabel: string };

interface StaggeredMenuProps {
  position?: "left" | "right";
  colors?: string[];
  items?: MenuItem[];
  displayItemNumbering?: boolean;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  changeMenuColorOnOpen?: boolean;
  isFixed?: boolean;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  onItemClick?: (href: string, event: MouseEvent<HTMLAnchorElement>) => void;
}

export default function StaggeredMenu({
  position = "right",
  colors = ["#B19EEF", "#5227FF"],
  items = [],
  displayItemNumbering = true,
  menuButtonColor = "#fff",
  openMenuButtonColor = "#fff",
  accentColor = "#5227FF",
  changeMenuColorOnOpen = true,
  isFixed = false,
  onMenuOpen,
  onMenuClose,
  onItemClick
}: StaggeredMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const openRef = useRef(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);
  const iconRef = useRef<HTMLSpanElement | null>(null);
  const textInnerRef = useRef<HTMLSpanElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!mounted) return;
    const panel = panelRef.current;
    const preContainer = preLayersRef.current;
    if (!panel) return;

    const preLayers = preContainer ? (Array.from(preContainer.querySelectorAll(".sm-prelayer")) as HTMLElement[]) : [];
    preLayerElsRef.current = preLayers;

    const offscreen = position === "left" ? -100 : 100;
    gsap.set([panel, ...preLayers], { xPercent: offscreen });
    gsap.set(textInnerRef.current, { yPercent: 0 });
    if (toggleBtnRef.current) gsap.set(toggleBtnRef.current, { color: menuButtonColor });
  }, [menuButtonColor, mounted, position]);

  const playOpen = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const layers = preLayerElsRef.current;
    const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel"));
    const numberEls = Array.from(panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item"));
    const offscreen = position === "left" ? -100 : 100;

    gsap.set([panel, ...layers], { xPercent: offscreen });
    gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    gsap.set(numberEls, { "--sm-num-opacity": 0 });

    const tl = gsap.timeline();
    tl.to(layers, { xPercent: 0, duration: 0.5, ease: "power4.out", stagger: 0.07 }, 0);
    tl.to(panel, { xPercent: 0, duration: 0.65, ease: "power4.out" }, 0.12);
    tl.to(itemEls, { yPercent: 0, rotate: 0, duration: 0.6, ease: "power4.out", stagger: 0.06 }, 0.25);
    tl.to(numberEls, { duration: 0.6, ease: "power2.out", "--sm-num-opacity": 1, stagger: 0.08 }, 0.35);
  }, [position]);

  const playClose = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const layers = preLayerElsRef.current;
    const offscreen = position === "left" ? -100 : 100;
    gsap.to([...layers, panel], { xPercent: offscreen, duration: 0.32, ease: "power3.in" });
  }, [position]);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);
    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }

    if (iconRef.current) {
      gsap.to(iconRef.current, { rotate: target ? 225 : 0, duration: target ? 0.8 : 0.35, ease: target ? "power4.out" : "power3.inOut" });
    }
    if (toggleBtnRef.current) {
      gsap.to(toggleBtnRef.current, {
        color: changeMenuColorOnOpen ? (target ? openMenuButtonColor : menuButtonColor) : menuButtonColor,
        delay: 0.1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
    if (textInnerRef.current) {
      gsap.to(textInnerRef.current, {
        yPercent: target ? -50 : 0,
        duration: target ? 0.45 : 0.35,
        ease: target ? "power4.out" : "power3.inOut"
      });
    }
  }, [changeMenuColorOnOpen, menuButtonColor, onMenuClose, onMenuOpen, openMenuButtonColor, playClose, playOpen]);

  return (
    <div className={`staggered-menu-wrapper${isFixed ? " fixed-wrapper" : ""}`} style={{ ["--sm-accent" as string]: accentColor }} data-position={position} data-open={open || undefined}>
      <header className="staggered-menu-header">
        <button ref={toggleBtnRef} className="sm-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={toggleMenu} type="button">
          <span className="sm-toggle-textWrap" aria-hidden="true">
            <span ref={textInnerRef} className="sm-toggle-textInner">
              <span className="sm-toggle-line">rcl</span>
              <span className="sm-toggle-line">close</span>
            </span>
          </span>
          <span ref={iconRef} className="sm-icon" aria-hidden="true">
            <span className="sm-icon-line" />
            <span className="sm-icon-line" style={{ transform: "translate(-50%, -50%) rotate(90deg)" }} />
          </span>
        </button>
      </header>

      {mounted && (
        <>
          <div ref={preLayersRef} className="sm-prelayers" aria-hidden="true">
            {colors.slice(0, 2).map((c, i) => (
              <div key={i} className="sm-prelayer" style={{ background: c }} />
            ))}
          </div>
          <aside ref={panelRef} className="staggered-menu-panel" aria-hidden={!open}>
            <div className="sm-panel-inner">
              <ul className="sm-panel-list" role="list" data-numbering={displayItemNumbering || undefined}>
                {items.map((it, idx) => (
                  <li className="sm-panel-itemWrap" key={it.label + idx}>
                    <a className="sm-panel-item" href={it.link} aria-label={it.ariaLabel} data-index={idx + 1} onClick={(event) => onItemClick?.(it.link, event)}>
                      <span className="sm-panel-itemLabel">{it.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
