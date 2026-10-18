import Link from "next/link";
import type { MenuItem } from "./menu-types";

export default function MenuLink({ 
  item,
 }: {
   item: MenuItem;
}) {
  const url = item.url?.trim() || "";

  // If there's no URL, render just the label
  if (!url) {
    return <span className="menu-label">{item.label}</span>;
  }

  // External links stay unchanged.
  if (/^https?:\/\//i.test(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="menu-link">
        {item.label}
      </a>
    );
  }

  // Convert /pages/:slug or type === "page" into clean /slug paths
  const internalUrl =
    item.type === "page" || url.startsWith("/pages/")
      ? url.replace(/^\/pages\//, "/")
      : url;

  return (
    <Link href={internalUrl} className="menu-link">
      {item.label}
    </Link>
  );
}