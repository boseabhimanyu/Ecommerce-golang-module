"use client";
import Link from "next/link";
import { useState } from "react";
import MenuLink from "./MenuLink";
import type { Menu, MenuItem } from "./menu-types";

function HeaderItems({ items }: { items: MenuItem[] }) {
  return (
    <ul className="menu-list">
      {items
        .filter((item) => item.displayStatus)
        .sort((a, b) => a.order - b.order)
        .map((item) => {
          const children = (item.children ?? [])
            .filter((child) => child.displayStatus)
            .sort((a, b) => a.order - b.order);

          return (
            <li key={item.id} className={children.length ? "has-children" : ""}>
              <MenuLink item={item} />
              {children.length > 0 && (
                <>
                 
                  <div className="header-dropdown">
                    <HeaderItems items={children} />
                  </div>
                </>
              )}
            </li>
          );
        })}
    </ul>
  );
}

export default function MenuHeader({ menu }: { menu: Menu }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass-header">
      <Link href="/" className="brand">
        Go Mongo NextJs
      </Link>

      <button
        className="mobile-toggle"
        aria-label="Toggle menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      <nav
        aria-label={menu.name}
        className={`top-nav ${open ? "open" : ""}`}
      >
        <HeaderItems items={menu.items} />
      </nav>
    </header>
  );
}