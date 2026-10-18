"use client";

import { useState, type ReactNode } from "react";
import MenuHeader from "./MenuHeader";
import MenuSidebar from "./MenuSidebar";
import MenuFooter from "./MenuFooter";
import type { Menu } from "./menu-types";
import "./DynamicMenus.css";

type InitialMenus = {
  top: Menu | null;
  left: Menu | null;
  bottom: Menu | null;
};

type DynamicMenusProps = {
  children: ReactNode;
  initialMenus: InitialMenus;
};

export default function DynamicMenus({
  children,
  initialMenus,
}: DynamicMenusProps) {
  const [top] = useState<Menu | null>(initialMenus.top);
  const [left] = useState<Menu | null>(initialMenus.left);
  const [bottom] = useState<Menu | null>(initialMenus.bottom);

  return (
    <div className="website-layout">
      {top && <MenuHeader menu={top} />}

      <div className="page-shell">
        {left && <MenuSidebar menu={left} />}

        <main className="website-content">
          {children}
        </main>
      </div>

      {bottom && <MenuFooter menu={bottom} />}
    </div>
  );
}