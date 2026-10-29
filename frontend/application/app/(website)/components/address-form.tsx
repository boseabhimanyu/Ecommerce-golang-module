"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { Address, AddressFormData } from '@/lib/types'

type AddressFormProps = {
  initialData?: Address | null;
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
};

export function AddressForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
}: AddressFormProps) {
  const [formData, setFormData] = useState<AddressFormData>({
    fullName: initialData?.fullName ?? "",
    phone: initialData?.phone ?? "",
    line1: initialData?.line1 ?? "",
    line2: initialData?.line2 ?? "",
    city: initialData?.city ?? "",
    state: initialData?.state ?? "",
    pinCode: initialData?.pinCode ?? "",
    country: initialData?.country ?? "India",
  });

  function handleChange(
    field: keyof AddressFormData,
    value: string,
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      fullName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      line1: formData.line1.trim(),
      line2: formData.line2.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pinCode: formData.pinCode.trim(),
      country: formData.country.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border p-4 shadow-[0_8px_30px_rgba(23,60,121,0.08)] backdrop-blur-2xl sm:p-5 lg:p-6"
      style={{
        backgroundColor: "var(--menu-glass)",
        borderColor: "var(--menu-glass-border)",
        color: "var(--menu-text)",
      }}
    >
      <div className="mb-5 flex items-center justify-between">
        <h2
          className="text-base font-semibold"
          style={{
            color: "var(--menu-text)",
          }}
        >
          {initialData ? "Edit address" : "Add new address"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--menu-muted)" }}
        >
          Cancel
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AddressField
          id="fullName"
          label="Full name / Label"
          value={formData.fullName}
          required
          autoComplete="name"
          onChange={(e) => handleChange("fullName", e.target.value)}
        />

        <AddressField
          id="phone"
          label="Phone"
          type="tel"
          value={formData.phone}
          required
          autoComplete="tel"
          inputMode="tel"
          onChange={(e) => handleChange("phone", e.target.value)}
        />

        <div className="sm:col-span-2">
          <AddressField
            id="line1"
            label="Address line 1"
            value={formData.line1}
            required
            autoComplete="address-line1"
            onChange={(e) => handleChange("line1", e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <AddressField
            id="line2"
            label="Address line 2 (Optional)"
            value={formData.line2}
            autoComplete="address-line2"
            onChange={(e) => handleChange("line2", e.target.value)}
          />
        </div>

        <AddressField
          id="city"
          label="City"
          value={formData.city}
          required
          autoComplete="address-level2"
          onChange={(e) => handleChange("city", e.target.value)}
        />

        <AddressField
          id="state"
          label="State"
          value={formData.state}
          required
          autoComplete="address-level1"
          onChange={(e) => handleChange("state", e.target.value)}
        />

        <AddressField
          id="pinCode"
          label="PIN code"
          value={formData.pinCode}
          required
          autoComplete="postal-code"
          inputMode="numeric"
          onChange={(e) => handleChange("pinCode", e.target.value)}
        />

        <AddressField
          id="country"
          label="Country"
          value={formData.country}
          required
          autoComplete="country-name"
          onChange={(e) => handleChange("country", e.target.value)}
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="h-11 rounded-xl border px-4 text-sm font-medium transition-colors hover:brightness-95 disabled:opacity-50"
          style={{
            backgroundColor: "var(--menu-glass)",
            borderColor: "var(--menu-glass-border)",
            color: "var(--menu-text)",
          }}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="h-11 rounded-xl px-5 text-sm font-medium text-white shadow-lg shadow-blue-900/15 transition-colors hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: "var(--menu-blue)",
          }}
        >
          {loading
            ? "Saving..."
            : initialData
            ? "Update address"
            : "Save address"}
        </button>
      </div>
    </form>
  );
}

type AddressFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

function AddressField({
  id,
  label,
  type = "text",
  value,
  required = false,
  autoComplete,
  inputMode,
  onChange,
}: AddressFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium"
        style={{
          color: "var(--menu-text)",
        }}
      >
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={onChange}
        className="h-11 rounded-xl border px-4 text-sm shadow-[0_4px_14px_rgba(23,60,121,0.07)] outline-none backdrop-blur-xl transition hover:bg-white/70 focus:border-blue-300 focus:bg-white/80 focus:ring-2 focus:ring-blue-200"
        style={{
          backgroundColor: "var(--menu-glass)",
          borderColor: "var(--menu-glass-border)",
          color: "var(--menu-text)",
        }}
      />
    </div>
  );
}