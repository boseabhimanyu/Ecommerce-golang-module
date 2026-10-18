import MenuLink from "./MenuLink";
import type { Menu, MenuItem } from "./menu-types";

function SidebarItems({ items }: { items: MenuItem[] }) {
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
                <div className="sidebar-submenu">
                  <SidebarItems items={children} />
                </div>
              )}
            </li>
          );
        })}
    </ul>
  );
}

export default function MenuSidebar({ menu }: { menu: Menu }) {
  return (
    <aside className="glass-sidebar">
      <h2 className="sidebar-heading">{menu.name}</h2>
      <nav aria-label={menu.name}>
        <SidebarItems items={menu.items} />
      </nav>
    </aside>
  );
}