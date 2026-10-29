"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

import api from "@/lib/api";
import type { Address, AddressFormData } from "@/lib/types";
import { useNotification } from "@/components/notifications/notification-provider";
import { AddressForm } from "../components/address-form";

export default function AddressesPage() {
  const { showNotification } = useNotification();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // State for Glass Delete Modal
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    setLoading(true);
    try {
      const response = await api.get<Address[]>("/auth/addresses");
      setAddresses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showNotification(
          error.response?.data?.message ??
            error.response?.data?.error ??
            "Failed to load addresses.",
          "error",
        );
      } else {
        showNotification("Unable to connect to the server.", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(formData: AddressFormData) {
    setActionLoading(true);
    try {
      await api.post<Address>("/auth/addresses", formData);
      showNotification("Address added successfully.", "success");
      setIsCreating(false);
      // Re-fetch to guarantee sort order and default flag integrity
      await fetchAddresses();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showNotification(
          error.response?.data?.message ??
            error.response?.data?.error ??
            "Failed to add address.",
          "error",
        );
      } else {
        showNotification("Unable to connect to the server.", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdate(formData: AddressFormData) {
    if (!editingAddress) return;
    setActionLoading(true);
    try {
      await api.patch<Address>(
        `/auth/addresses/${editingAddress.id}`,
        formData,
      );
      showNotification("Address updated successfully.", "success");
      setEditingAddress(null);
      await fetchAddresses();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showNotification(
          error.response?.data?.message ??
            error.response?.data?.error ??
            "Failed to update address.",
          "error",
        );
      } else {
        showNotification("Unable to connect to the server.", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSetDefault(id: string) {
    setActionLoading(true);
    try {
      const response = await api.patch<{ address: Address; message: string }>(
        `/auth/addresses/${id}/default`,
      );
      showNotification(
        response.data?.message ?? "Default address updated.",
        "success",
      );
      setAddresses((prev) =>
        prev.map((item) => ({
          ...item,
          isDefault: item.id === id,
        })),
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showNotification(
          error.response?.data?.message ??
            error.response?.data?.error ??
            "Failed to update default address.",
          "error",
        );
      } else {
        showNotification("Unable to connect to the server.", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deletingAddressId) return;

    setActionLoading(true);
    try {
      const response = await api.delete<{ message: string }>(
        `/auth/addresses/${deletingAddressId}`,
      );
      showNotification(
        response.data?.message ?? "Address deleted successfully.",
        "success",
      );
      setDeletingAddressId(null);
      // Re-fetch so any auto-reassigned default address reflects immediately
      await fetchAddresses();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showNotification(
          error.response?.data?.message ??
            error.response?.data?.error ??
            "Failed to delete address.",
          "error",
        );
      } else {
        showNotification("Unable to connect to the server.", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* Back to Profile & Header */}
      <div className="mb-6">
        <Link
          href="/profile"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium transition-colors hover:underline"
          style={{ color: "var(--menu-muted)" }}
        >
          ← Back to Profile
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "var(--menu-text)" }}
            >
              Saved addresses
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--menu-muted)" }}
            >
              Manage your delivery and billing addresses.
            </p>
          </div>

          {!isCreating && !editingAddress && (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-medium text-white shadow-lg shadow-blue-900/15 transition-colors hover:brightness-90"
              style={{ backgroundColor: "var(--menu-blue)" }}
            >
              + Add address
            </button>
          )}
        </div>
      </div>

      {/* Inline Create Form */}
      {isCreating && (
        <div className="mb-8">
          <AddressForm
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            loading={actionLoading}
          />
        </div>
      )}

      {/* Inline Edit Form */}
      {editingAddress && (
        <div className="mb-8">
          <AddressForm
            initialData={editingAddress}
            onSubmit={handleUpdate}
            onCancel={() => setEditingAddress(null)}
            loading={actionLoading}
          />
        </div>
      )}

      {/* Address List */}
      {loading ? (
        <div
          className="rounded-3xl border p-8 text-center backdrop-blur-2xl"
          style={{
            backgroundColor: "var(--menu-glass)",
            borderColor: "var(--menu-glass-border)",
            color: "var(--menu-muted)",
          }}
        >
          Loading addresses...
        </div>
      ) : addresses.length === 0 && !isCreating ? (
        <div
          className="rounded-3xl border p-8 text-center backdrop-blur-2xl"
          style={{
            backgroundColor: "var(--menu-glass)",
            borderColor: "var(--menu-glass-border)",
            color: "var(--menu-muted)",
          }}
        >
          <p className="text-sm">No saved addresses found.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="relative flex flex-col justify-between rounded-3xl border p-5 shadow-[0_8px_30px_rgba(23,60,121,0.08)] backdrop-blur-2xl transition-all"
              style={{
                backgroundColor: "var(--menu-glass)",
                borderColor: address.isDefault
                  ? "var(--menu-blue)"
                  : "var(--menu-glass-border)",
                color: "var(--menu-text)",
              }}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base">{address.fullName}</h3>
                  {address.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-300/80 bg-blue-50/70 px-2.5 py-0.5 text-[11px] font-medium text-blue-800">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      Default
                    </span>
                  )}
                </div>

                <div
                  className="mt-3 space-y-1 text-sm leading-relaxed"
                  style={{ color: "var(--menu-muted)" }}
                >
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>
                    {address.city}, {address.state} - {address.pinCode}
                  </p>
                  <p>{address.country}</p>
                  <p className="pt-1 text-xs font-mono">Phone: {address.phone}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="mt-5 flex items-center justify-between border-t pt-4 text-xs font-medium"
                style={{ borderColor: "var(--menu-glass-border)" }}
              >
                {!address.isDefault ? (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(address.id)}
                    disabled={actionLoading}
                    className="text-blue-600 hover:underline disabled:opacity-50"
                  >
                    Set as default
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingAddress(address);
                    }}
                    disabled={actionLoading}
                    className="hover:underline"
                    style={{ color: "var(--menu-text)" }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingAddressId(address.id)}
                    disabled={actionLoading}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Styled Glass Delete Confirmation Modal */}
      {deletingAddressId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close modal"
            onClick={() => setDeletingAddressId(null)}
            className="absolute inset-0 cursor-default"
          />

          <div
            className="relative w-full max-w-sm rounded-3xl border p-5 shadow-[0_24px_70px_rgba(23,60,121,0.22)] backdrop-blur-2xl"
            style={{
              backgroundColor: "var(--menu-glass)",
              borderColor: "var(--menu-glass-border)",
              color: "var(--menu-text)",
            }}
          >
            <h3 className="text-base font-semibold">Delete address</h3>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{ color: "var(--menu-muted)" }}
            >
              Are you sure you want to remove this address? This action cannot be undone.
            </p>

            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingAddressId(null)}
                disabled={actionLoading}
                className="h-10 rounded-xl border px-4 text-xs font-medium transition hover:brightness-95 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--menu-glass)",
                  borderColor: "var(--menu-glass-border)",
                  color: "var(--menu-text)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={actionLoading}
                className="h-10 rounded-xl bg-red-600 px-4 text-xs font-medium text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}