"use client";

import {
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "@/lib/api";

import MenuItemTree from "./menu-item-tree";
import type { MenuItem } from "./sortable-menu-item";
import MenuItemForm from "./menu-item-form";
import { DragDropProvider } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";

type AdminMenu = {
  id: string;
  name: string;
  location: "top" | "left" | "bottom";
  status: boolean;
  items: MenuItem[];
};

type MenuEditorProps = {
  menuId: string;
};

// Recursively sort items and children by their 'order' property ascending
function sortItemsByOrder(items: MenuItem[]): MenuItem[] {
  return [...items]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => ({
      ...item,
      children: sortItemsByOrder(item.children ?? []),
    }));
}

function collectGroups(items: MenuItem[]): MenuItem[] {
  const groups: MenuItem[] = [];

  function visit(nodes: MenuItem[]) {
    for (const item of nodes) {
      if (item.type === "group") {
        groups.push(item);
      }

      if (item.children?.length) {
        visit(item.children);
      }
    }
  }

  visit(items);

  return groups;
}

function cloneItems(items: MenuItem[]): MenuItem[] {
  return items.map((item) => ({
    ...item,
    children: cloneItems(item.children ?? []),
  }));
}

function flattenItems(items: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = [];

  function visit(nodes: MenuItem[]) {
    for (const item of nodes) {
      result.push(item);

      if (item.children?.length) {
        visit(item.children);
      }
    }
  }

  visit(items);

  return result;
}

export default function MenuEditor({
  menuId,
}: MenuEditorProps) {
  const [menu, setMenu] = useState<AdminMenu | null>(
    null,
  );

  const [draftItems, setDraftItems] = useState<
    MenuItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State for menu deletion confirmation modal
  const [showMenuDeleteModal, setShowMenuDeleteModal] = useState(false);
  const [menuDeleting, setMenuDeleting] = useState(false);

  // State for item deletion confirmation modal
  const [itemToDelete, setItemToDelete] =
    useState<MenuItem | null>(null);
  const [itemDeleting, setItemDeleting] = useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );
  const [activeDragId, setActiveDragId] =
    useState<string | null>(null);
    
  const [saveMessage, setSaveMessage] = useState<
    string | null
  >(null);

  const [showItemForm, setShowItemForm] =
    useState(false);

  const [editingItem, setEditingItem] =
    useState<MenuItem | null>(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/admin/menus/${menuId}`,
      );

      const loadedMenu = response.data?.menu;

      if (
        !loadedMenu ||
        typeof loadedMenu !== "object" ||
        !loadedMenu.id
      ) {
        throw new Error(
          "Invalid menu detail response.",
        );
      }

      const items: MenuItem[] = Array.isArray(
        loadedMenu.items,
      )
        ? sortItemsByOrder(loadedMenu.items)
        : [];

      setMenu({
        ...loadedMenu,
        items,
      });

      setDraftItems(cloneItems(items));
      setSaveMessage(null);
    } catch (err) {
      console.error("Unable to load menu:", err);

      setError(
        "Unable to load this menu. Please check the API response.",
      );
    } finally {
      setLoading(false);
    }
  }, [menuId]);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  const flatDraftItems = useMemo(
    () => flattenItems(draftItems),
    [draftItems],
  );

  const groups = useMemo(
    () => collectGroups(draftItems),
    [draftItems],
  );

  function handleDragStart(event: any) {
    const source =
      event.operation?.source;

    if (source?.id != null) {
      setActiveDragId(
        String(source.id),
      );
    }

    setSaveMessage(null);
  }

  async function handleDragEnd(event: any) {
    setActiveDragId(null);

    if (event.canceled) {
      return;
    }

    const source =
      event.operation?.source;

    const target =
      event.operation?.target;

    if (!source || !target) {
      return;
    }

    if (
      !isSortable(source) ||
      !isSortable(target)
    ) {
      return;
    }

    const sourceGroup =
      source.group == null
        ? "root"
        : String(source.group);

    const targetGroup =
      target.group == null
        ? "root"
        : String(target.group);

    if (
      sourceGroup !== targetGroup
    ) {
      return;
    }

    const fromIndex =
      source.initialIndex;

    const toIndex =
      source.index;

    if (
      fromIndex == null ||
      toIndex == null ||
      fromIndex === toIndex
    ) {
      return;
    }

    const itemId = String(source.id);
    const newOrder = toIndex + 1;

    // Optimistically update local UI state immediately
    setDraftItems((current) => {
      return sortItemsByOrder(
        reorderGroup(
          current,
          sourceGroup,
          fromIndex,
          toIndex,
        ),
      );
    });

    setError(null);
    setSaveMessage(null);

    try {
      // Send the PATCH request to update the item order in the database
      await api.patch(
        `/admin/menus/${menuId}/items/${itemId}/order`,
        {
          order: newOrder,
        },
      );

      // Refresh menu to sync with server state
      await loadMenu();
      setSaveMessage("Menu item order updated successfully.");
    } catch (err: any) {
      console.error("Unable to update menu item order:", err);
      setError(
        err?.response?.data?.message ??
          "Unable to update menu item order.",
      );
      // Revert draft items on failure by reloading original menu
      await loadMenu();
    }
  }

  async function toggleMenuStatus() {
    if (!menu || saving) {
      return;
    }

    const nextStatus = !menu.status;

    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      await api.patch(`/admin/menus/${menu.id}`, {
        status: nextStatus,
      });

      setMenu((current) =>
        current
          ? { ...current, status: nextStatus }
          : current,
      );

      setSaveMessage(
        nextStatus
          ? "Menu activated successfully."
          : "Menu deactivated successfully.",
      );
    } catch (err) {
      console.error(
        "Unable to change menu status:",
        err,
      );

      setError("Unable to change the menu status.");
    } finally {
      setSaving(false);
    }
  }

  // Confirmed handler for deleting the entire menu
  async function handleConfirmMenuDelete() {
    if (!menu) return;

    setMenuDeleting(true);
    setError(null);

    try {
      await api.delete(`/admin/menus/${menu.id}`);
      window.location.href = "/dashboard/menus";
    } catch (err) {
      console.error("Unable to delete menu:", err);
      setError("Unable to delete this menu.");
      setMenuDeleting(false);
      setShowMenuDeleteModal(false);
    }
  }

  // Triggers opening the delete confirmation modal for a menu item
  function handleItemDeleteClick(item: MenuItem) {
    setItemToDelete(item);
    setError(null);
    setSaveMessage(null);
  }

  // Executes actual deletion when confirmed inside the modal
  async function handleConfirmItemDelete() {
    if (!itemToDelete) return;

    setItemDeleting(true);
    setError(null);
    setSaveMessage(null);

    try {
      await api.delete(
        `/admin/menus/${menuId}/items/${itemToDelete.id}`,
      );

      await loadMenu();

      setSaveMessage(
        `"${itemToDelete.label}" deleted successfully.`,
      );
      setItemToDelete(null);
    } catch (err: any) {
      console.error("Unable to delete menu item:", err);

      setError(
        err?.response?.data?.message ??
          "Unable to delete the menu item.",
      );
    } finally {
      setItemDeleting(false);
    }
  }

  function reorder<T>(
    items: T[],
    fromIndex: number,
    toIndex: number,
  ): T[] {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= items.length ||
      toIndex >= items.length ||
      fromIndex === toIndex
    ) {
      return items;
    }

    const next = [...items];

    const [moved] = next.splice(fromIndex, 1);

    if (moved === undefined) {
      return items;
    }

    next.splice(toIndex, 0, moved);

    return next;
  }

  function reorderGroup(
    items: MenuItem[],
    group: string | number | undefined,
    fromIndex: number,
    toIndex: number,
  ): MenuItem[] {
    const normalizedGroup =
      group == null
        ? "root"
        : String(group);

    if (normalizedGroup === "root") {
      return reorder(
        items,
        fromIndex,
        toIndex,
      );
    }

    if (!normalizedGroup.startsWith("parent:")) {
      return items;
    }

    const parentId =
      normalizedGroup.slice("parent:".length);

    return items.map((item) => {
      if (item.id !== parentId) {
        return item;
      }

      return {
        ...item,
        children: reorder(
          item.children ?? [],
          fromIndex,
          toIndex,
        ),
      };
    });
  }

  function openCreateForm() {
    setEditingItem(null);
    setShowItemForm(true);
  }

  function openEditForm(item: MenuItem) {
    setEditingItem(item);
    setShowItemForm(true);
  }

  function closeItemForm() {
    setShowItemForm(false);
    setEditingItem(null);
  }

  async function handleItemSaved() {
    closeItemForm();
    await loadMenu();
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8">
        <p className="text-sm text-zinc-500">
          Loading menu...
        </p>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <p className="text-sm text-red-700">
          {error ?? "Menu not found."}
        </p>

        <button
          type="button"
          onClick={() => void loadMenu()}
          className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Menu header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-zinc-900">
              {menu.name}
            </h1>

            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
              {menu.location}
            </span>

            <span
              className={[
                "rounded-full px-2.5 py-1 text-xs",
                menu.status
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-zinc-100 text-zinc-500",
              ].join(" ")}
            >
              {menu.status ? "Active" : "Inactive"}
            </span>
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            View the existing menu structure and manage
            its individual items.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving || menuDeleting}
            onClick={() => void toggleMenuStatus()}
            className={[
              "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
              menu.status
                ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                : "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
            ].join(" ")}
          >
            {saving
              ? "Updating..."
              : menu.status
                ? "Deactivate"
                : "Activate"}
          </button>

          <button
            type="button"
            disabled={menuDeleting || saving}
            onClick={() => setShowMenuDeleteModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />

            Delete Menu
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <p className="text-sm text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* Operation feedback */}
      {saveMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {saveMessage}
        </div>
      )}

      {/* Menu item heading and add button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Menu items
          </h2>

          <p className="text-sm text-zinc-500">
            {flatDraftItems.length} item
            {flatDraftItems.length === 1 ? "" : "s"}{" "}
            in this menu, including nested items.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          Add menu item
        </button>
      </div>

      {/* Existing menu structure */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        {draftItems.length > 0 ? (
          <DragDropProvider
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <MenuItemTree
              items={draftItems}
              onEdit={openEditForm}
              onDelete={handleItemDeleteClick}
            />
          </DragDropProvider>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center">
            <p className="font-medium text-zinc-800">
              No menu items yet
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Add a menu item to start building this
              navigation structure.
            </p>

            <button
              type="button"
              onClick={openCreateForm}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              Add first item
            </button>
          </div>
        )}
      </div>

      {/* Item create/edit form */}
      {showItemForm && (
        <MenuItemForm
          menuId={menu.id}
          item={editingItem}
          groups={groups}
          onClose={closeItemForm}
          onSaved={handleItemSaved}
        />
      )}

      {/* Delete Menu Confirmation Modal */}
      {showMenuDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">
                    Delete Menu
                  </h2>
                  <p className="text-xs text-zinc-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMenuDeleteModal(false)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-zinc-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-zinc-900">
                  &ldquo;{menu.name}&rdquo;
                </span>
                ? This will permanently delete this menu and all of its items.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowMenuDeleteModal(false)}
                disabled={menuDeleting}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmMenuDelete}
                disabled={menuDeleting}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {menuDeleting ? "Deleting..." : "Delete Menu"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Menu Item Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">
                    Delete Menu Item
                  </h2>
                  <p className="text-xs text-zinc-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-zinc-600">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-zinc-900">
                  &ldquo;{itemToDelete.label}&rdquo;
                </span>
                ? If this is a group, any child items inside it may also be affected.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={itemDeleting}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmItemDelete}
                disabled={itemDeleting}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {itemDeleting ? "Deleting..." : "Delete Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}