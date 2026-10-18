"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import api from "@/lib/api";
import MenuList, {
  type AdminMenu,
} from "@/components/menus/menu-list";

export default function MenusSettingsPage() {
  const [menus, setMenus] = 
  useState<AdminMenu[]>([]);

  const [loading, setLoading] = 
  useState(true);

  const [error, setError] = 
  useState<string | null>(null);

  // State for menu deletion confirmation modal
  const [menuToDelete, setMenuToDelete] = useState<AdminMenu | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadMenus = 
  useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/admin/menus");
      const data = response.data;

      const loadedMenus = Array.isArray(data?.menus)
        ? data.menus
        : Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : null;

      if (!loadedMenus) {
        throw new Error("Invalid menus response format");
      }

      setMenus(loadedMenus);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load menus.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus]);

  // Triggers opening the delete confirmation modal
  function handleDeleteClick(menu: AdminMenu) {
    setMenuToDelete(menu);
    setError(null);
  }

  // Executes actual deletion when confirmed inside the modal
  async function handleConfirmDelete() {
    if (!menuToDelete) return;

    setDeleting(true);
    setError(null);

    try {
      await api.delete(`/admin/menus/${menuToDelete.id}`);
      setMenuToDelete(null);
      await loadMenus();
    } catch (err) {
      console.error("Unable to delete menu:", err);
      setError("Unable to delete this menu.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Menus
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Manage the navigation menus used by 
          the website.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8">
          <p className="text-sm text-zinc-500">
            Loading menus...
            </p>
        </div>
      ) : (
        <MenuList
          menus={menus}
          onChanged={loadMenus}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Delete Menu Confirmation Modal */}
      {menuToDelete && (
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
                onClick={() => setMenuToDelete(null)}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-zinc-600">
                Are you sure you want to delete the menu{" "}
                <span className="font-semibold text-zinc-900">
                  &ldquo;{menuToDelete.name}&rdquo;
                </span>
                ? This will permanently remove the menu and all its items.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setMenuToDelete(null)}
                disabled={deleting}
                className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Menu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}