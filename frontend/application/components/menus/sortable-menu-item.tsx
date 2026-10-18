"use client";

import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Folder,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useSortable } from "@dnd-kit/react/sortable";

export type MenuItemType = "group" | "page" | "url";

export type MenuItem = {
  id: string;
  label: string;
  type: MenuItemType;
  pageId?: string | null;
  url?: string | null;
  order: number;
  displayStatus: boolean;
  children?: MenuItem[];
};

type SortableMenuItemProps = {
  item: MenuItem;
  index: number;
  groupId: string;
  depth: number;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
};

function getItemIcon(type: MenuItemType) {
  if (type === "group") {
    return Folder;
  }

  if (type === "page") {
    return FileText;
  }

  return ExternalLink;
}

export default function SortableMenuItem({
  item,
  index,
  groupId,
  depth,
  onEdit,
  onDelete,
}: SortableMenuItemProps) {
  const [expanded, setExpanded] = useState(true);

  const sortable = useSortable({
    id: item.id,
    index,
    group: groupId,
    type: "menu-item",
    accept: "menu-item",
  });

  const Icon = getItemIcon(item.type);

  const children = item.children ?? [];
  const hasChildren = children.length > 0;

  return (
    <div className="relative">
      <div
        ref={sortable.ref}
        className={[
          "group flex items-center gap-3 rounded-xl border bg-white px-3 py-3 shadow-sm transition",
          sortable.isDragging
            ? "border-blue-400 opacity-60 shadow-lg"
            : "border-zinc-200",
          sortable.isDropTarget
            ? "ring-2 ring-blue-200"
            : "",
          !item.displayStatus ? "opacity-60" : "",
        ].join(" ")}
      >
        {/* Drag handle */}
        <button
          type="button"
          ref={sortable.handleRef}
          aria-label={`Drag ${item.label}`}
          className="cursor-grab touch-none rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Expand/collapse */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-label={
              expanded
                ? `Collapse ${item.label}`
                : `Expand ${item.label}`
            }
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Type icon */}
        <div className="rounded-lg bg-zinc-100 p-2">
          <Icon className="h-4 w-4 text-zinc-600" />
        </div>

        {/* Label */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-zinc-900">
              {item.label}
            </p>

            <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-500">
              {item.type}
            </span>

            {!item.displayStatus && (
              <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                Hidden
              </span>
            )}
          </div>

          {item.url && (
  <p className="mt-0.5 truncate text-xs text-zinc-400">
    {item.url}
  </p>
)}

{item.pageId && (
  <p className="mt-0.5 truncate text-xs text-zinc-400">
    Page: {item.pageId}
  </p>
)}

       </div>

        {/* Edit */}
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          <Pencil className="h-4 w-4" />
          <span className="hidden sm:inline">Edit</span>
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(item)}
          aria-label={`Delete ${item.label}`}
          title={`Delete ${item.label}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-zinc-100 pl-4">
          {children.map((child, childIndex) => (
            <SortableMenuItem
              key={child.id}
              item={child}
              index={childIndex}
              groupId={`parent:${item.id}`}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}