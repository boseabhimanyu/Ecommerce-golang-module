import MenuLink from "./MenuLink";
import type { Menu, MenuItem } from "./menu-types";

export default function MenuFooter({ menu }: { menu: Menu }) {
  return (
    <footer className="glass-footer">
      <div className="footer-columns">
        {menu.items
          .filter((item) => item.displayStatus)
          .sort((a, b) => a.order - b.order)
          .map((item) => (
            <section key={item.id} className="footer-group">
              <h3><MenuLink item={item} /></h3>
              <ul className="menu-list">
                {(item.children ?? [])
                  .filter((child) => child.displayStatus)
                  .sort((a, b) => a.order - b.order)
                  .map((child) => (
                    <li key={child.id}>
                      <MenuLink item={child} />
                    </li>
                  ))}
              </ul>
            </section>
          ))}
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Abhimanyu Bose</span>
        <span>All rights reserved.</span>
      </div>
    </footer>
  );
}