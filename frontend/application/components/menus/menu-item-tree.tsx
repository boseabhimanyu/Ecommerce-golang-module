"use client";

import SortableMenuItem, {
  type MenuItem,
} from "./sortable-menu-item";

type MenuItemTreeProps = {
  items: MenuItem[];
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
};

export default function MenuItemTree({
  items,
  onEdit,
  onDelete,
}: MenuItemTreeProps) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-zinc-700">
          This menu has no items yet.
        </p>

        <p className="mt-1 text-sm text-zinc-500">
          Add a menu item to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <SortableMenuItem
          key={item.id}
          item={item}
          index={index}
          groupId="root"
          depth={0}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}