"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "@/lib/api";

import type {
  MenuItem,
  MenuItemType,
} from "./sortable-menu-item";

type PageOption = {
  id: string;
  title: string;
  slug: string;
};

type GroupDestination = "none" | "page" | "url";

type MenuItemFormProps = {
  menuId: string;
  item?: MenuItem | null;
  groups: MenuItem[];
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  label: string;
  type: MenuItemType;
  pageId: string;
  url: string;
  parentId: string;
  displayStatus: boolean;
  groupDestination: GroupDestination;
};

// Helper function to validate absolute URLs and relative paths
function isValidMenuUrl(value: string): boolean {
  const trimmed = value.trim();
  
  // 1. Allow relative paths starting with '/' (e.g., /dashboard, /about)
  if (trimmed.startsWith("/")) {
    return trimmed.length > 1; 
  }

  // 2. Allow valid http:// or https:// absolute URLs
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function initialState(item?: MenuItem | null): FormState {
  const pageId = item?.pageId ?? "";
  const url = item?.url ?? "";

  return {
    label: item?.label ?? "",
    type: item?.type ?? "group",
    pageId,
    url,
    parentId: "",
    displayStatus: item?.displayStatus ?? true,
    groupDestination:
      item?.type === "group"
        ? pageId
          ? "page"
          : url
            ? "url"
            : "none"
        : "none",
  };
}

export default function MenuItemForm({
  menuId,
  item,
  groups,
  onClose,
  onSaved,
}: MenuItemFormProps) {
  const [form, setForm] = useState<FormState>(
    initialState(item),
  );

  const [pages, setPages] = useState<PageOption[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const editing = Boolean(item);

  useEffect(() => {
    setForm(initialState(item));
    setError("");
  }, [item]);

  useEffect(() => {
    if (
      form.type !== "page" &&
      form.type !== "group"
    ) {
      return;
    }

    let cancelled = false;

    async function loadPages() {
      try {
        setLoadingPages(true);

        const response = await api.get("/admin/pages");
        const payload = response.data;

        const rawPages =
          payload?.pages ??
          payload?.data?.pages ??
          payload?.data ??
          payload?.items ??
          [];

        const normalized: PageOption[] = Array.isArray(
          rawPages,
        )
          ? rawPages.map((page: any) => ({
              id: String(page.id ?? page._id ?? ""),
              title: page.title ?? "",
              slug: page.slug ?? "",
            })).filter((page) => page.id !== "")
          : [];

        if (!cancelled) {
          setPages(normalized);
        }
      } catch (err) {
        console.error("Unable to load pages:", err);

        if (!cancelled) {
          setPages([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPages(false);
        }
      }
    }

    void loadPages();

    return () => {
      cancelled = true;
    };
  }, [form.type]);

  function update<K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleTypeChange(type: MenuItemType) {
    setForm((current) => ({
      ...current,
      type,
      ...(type === "page"
        ? {
            url: "",
            groupDestination: "page" as GroupDestination,
          }
        : type === "url"
          ? {
              pageId: "",
              groupDestination: "url" as GroupDestination,
            }
          : {
              groupDestination: current.pageId
                ? "page"
                : current.url
                  ? "url"
                  : "none",
            }),
    }));
  }

  function handleGroupDestinationChange(
    destination: GroupDestination,
  ) {
    setForm((current) => ({
      ...current,
      groupDestination: destination,
      pageId: destination === "page" ? current.pageId : "",
      url: destination === "url" ? current.url : "",
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");

    if (!form.label.trim()) {
      setError("Label is required.");
      return;
    }

    if (
      form.type === "page" &&
      !form.pageId.trim()
    ) {
      setError("Please select a page.");
      return;
    }

    if (
      form.type === "url" &&
      !form.url.trim()
    ) {
      setError("URL is required.");
      return;
    }

    if (
      form.type === "group" &&
      form.groupDestination === "page" &&
      !form.pageId.trim()
    ) {
      setError("Please select a page for this group.");
      return;
    }

    if (
      form.type === "group" &&
      form.groupDestination === "url" &&
      !form.url.trim()
    ) {
      setError("Please enter a URL for this group.");
      return;
    }

    // Validate absolute URL or relative path format
    const isUrlActive =
      form.type === "url" ||
      (form.type === "group" && form.groupDestination === "url");

    if (isUrlActive && form.url.trim()) {
      if (!isValidMenuUrl(form.url)) {
        setError(
          "Please enter a valid absolute URL (e.g., https://example.com) or relative path (e.g., /dashboard)."
        );
        return;
      }
    }

    try {
      setSaving(true);

      const payload: Record<string, unknown> = {
        label: form.label.trim(),
        type: form.type,
        displayStatus: form.displayStatus,
      };

      if (form.type === "page") {
        payload.pageId = form.pageId;
      }

      if (form.type === "url") {
        payload.url = form.url.trim();
      }

      if (form.type === "group") {
        if (form.groupDestination === "page") {
          payload.pageId = form.pageId;
          payload.url = "";
        } else if (form.groupDestination === "url") {
          payload.pageId = "";
          payload.url = form.url.trim();
        } else {
          payload.pageId = "";
          payload.url = "";
        }
      }

      if (!editing && form.parentId) {
        payload.parentId = form.parentId;
      }

      if (editing && item) {
        await api.patch(
          `/admin/menus/${menuId}/items/${item.id}`,
          payload,
        );
      } else {
        await api.post(
          `/admin/menus/${menuId}/items`,
          payload,
        );
      }

      onSaved();
    } catch (err: unknown) {
      console.error("Unable to save menu item:", err);

      const getBackendMessage = (data: unknown): string | null => {
        if (typeof data === "string" && data.trim()) {
          return data;
        }

        if (!data || typeof data !== "object") {
          return null;
        }

        const body = data as Record<string, unknown>;

        for (const key of ["message", "error", "detail"]) {
          const value = body[key];

          if (typeof value === "string" && value.trim()) {
            return value;
          }

          if (
            value &&
            typeof value === "object" &&
            "message" in value &&
            typeof (value as { message?: unknown }).message === "string"
          ) {
            return (value as { message: string }).message;
          }
        }

        if (Array.isArray(body.errors)) {
          const messages = body.errors
            .map((entry) => {
              if (typeof entry === "string") return entry;

              if (
                entry &&
                typeof entry === "object" &&
                "message" in entry &&
                typeof (entry as { message?: unknown }).message === "string"
              ) {
                return (entry as { message: string }).message;
              }

              return null;
            })
            .filter((message): message is string => Boolean(message));

          if (messages.length) {
            return messages.join(" ");
          }
        }

        return null;
      };

      const error = err as {
        response?: { data?: unknown; status?: number };
        message?: string;
      };

      const backendMessage = getBackendMessage(error.response?.data);

      setError(
        backendMessage ??
          (error.response?.status
            ? `Request failed (${error.response.status}).`
            : error.message || "Unable to save the menu item."),
      );
    } finally {
      setSaving(false);
    }
  }

  const showPageSelector =
    form.type === "page" ||
    (form.type === "group" &&
      form.groupDestination === "page");

  const showUrlInput =
    form.type === "url" ||
    (form.type === "group" &&
      form.groupDestination === "url");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              {editing ? "Edit Menu Item" : "Add Menu Item"}
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Add or update a group, page, or external URL.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
            aria-label="Close form"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-800">
              Label
            </label>

            <input
              value={form.label}
              onChange={(event) =>
                update("label", event.target.value)
              }
              required
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="About Us"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-800">
              Type
            </label>

            <select
              value={form.type}
              onChange={(event) =>
                handleTypeChange(
                  event.target.value as MenuItemType,
                )
              }
              className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            >
              <option value="group">Group</option>
              <option value="page">Page</option>
              <option value="url">URL</option>
            </select>
          </div>

          {form.type === "group" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                Group destination
              </label>

              <select
                value={form.groupDestination}
                onChange={(event) =>
                  handleGroupDestinationChange(
                    event.target.value as GroupDestination,
                  )
                }
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="none">No destination</option>
                <option value="page">Link to a page</option>
                <option value="url">Link to a URL</option>
              </select>

              <p className="mt-1.5 text-xs text-zinc-500">
                Groups can have child items and an optional destination.
              </p>
            </div>
          )}

          {!editing && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                Parent group
              </label>

              <select
                value={form.parentId}
                onChange={(event) =>
                  update("parentId", event.target.value)
                }
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              >
                <option value="">Top level</option>

                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>

              <p className="mt-1.5 text-xs text-zinc-500">
                Child items can belong to a group in this menu.
              </p>
            </div>
          )}

          {showPageSelector && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                Page
              </label>

              <select
                value={form.pageId}
                onChange={(event) =>
                  update("pageId", event.target.value)
                }
                disabled={loadingPages}
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:bg-zinc-100"
              >
                <option value="">
                  {loadingPages
                    ? "Loading pages..."
                    : "Select a page"}
                </option>

                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                    {page.slug ? ` (${page.slug})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showUrlInput && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                URL or Path
              </label>

              <input
                type="text" // Changed from "url" to "text" to support relative paths
                value={form.url}
                onChange={(event) =>
                  update("url", event.target.value)
                }
                required
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                placeholder="https://example.com or /dashboard"
              />
            </div>
          )}

          <label className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3">
            <input
              type="checkbox"
              checked={form.displayStatus}
              onChange={(event) =>
                update("displayStatus", event.target.checked)
              }
              className="h-4 w-4 rounded border-zinc-300"
            />

            <span>
              <span className="block text-sm font-medium text-zinc-800">
                Display item
              </span>

              <span className="block text-xs text-zinc-500">
                Hidden items remain in the menu but are not displayed.
              </span>
            </span>
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                (loadingPages && showPageSelector)
              }
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}