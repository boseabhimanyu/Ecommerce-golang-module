"use client";

import axios from "axios";
import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "@/lib/api";
import { useNotification } from "@/components/notifications/notification-provider";

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  altEmail: string;
  phone: string;
  role: string;
  profilePic?: string | null;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  dateOfBirth?: string | null;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
  twoFactorEnabled: boolean;
};

type CustomerForm = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  altEmail: string;
  phone: string;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pinCode: string;
};

const emptyCustomerForm: CustomerForm = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  altEmail: "",
  phone: "",
  dateOfBirth: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pinCode: "",
};

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error ??
      error.response?.data?.message ??
      fallback
    );
  }

  return fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateForInput(
  value?: string | null,
) {
  if (!value) return "";

  const isoMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T/,
  );

  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    return `${year}-${month}-${day}`;
  }

  const dmyMatch = value.match(
    /^(\d{2})-(\d{2})-(\d{4})$/,
  );

  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;

    return `${year}-${month}-${day}`;
  }

  return "";
}

function formatDateForApi(value: string) {
  if (!value) return "";

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (!match) return "";

  const [, year, month, day] = match;

  return `${day}-${month}-${year}`;
}

function customerToForm(
  customer: Customer,
): CustomerForm {
  return {
    firstName: customer.firstName ?? "",
    lastName: customer.lastName ?? "",
    username: customer.username ?? "",
    email: customer.email ?? "",
    altEmail: customer.altEmail ?? "",
    phone: customer.phone ?? "",
    dateOfBirth: formatDateForInput(
      customer.dateOfBirth,
    ),
    addressLine1: customer.addressLine1 ?? "",
    addressLine2: customer.addressLine2 ?? "",
    city: customer.city ?? "",
    state: customer.state ?? "",
    pinCode: customer.pinCode ?? "",
  };
}

function CustomerField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-zinc-600">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-white/70 bg-white/60 px-3.5 text-sm text-zinc-900 outline-none backdrop-blur-xl transition focus:border-white focus:ring-2 focus:ring-white/70"
      />
    </label>
  );
}

export default function CustomersPage() {
  const { showNotification } =
    useNotification();

  const [customers, setCustomers] = useState<
    Customer[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [pageLoading, setPageLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"all" | "true" | "false">(
      "all",
    );

  const [page, setPage] = useState(1);

  const [limit] = useState(20);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(1);

  const [
    selectedCustomerId,
    setSelectedCustomerId,
  ] = useState<string | null>(null);

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState<Customer | null>(null);

  const [
    customerLoading,
    setCustomerLoading,
  ] = useState(false);

  const [
    customerForm,
    setCustomerForm,
  ] = useState<CustomerForm>(
    emptyCustomerForm,
  );

  const [
    detailsSaving,
    setDetailsSaving,
  ] = useState(false);

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    passwordSaving,
    setPasswordSaving,
  ] = useState(false);

  const [
    statusSaving,
    setStatusSaving,
  ] = useState(false);

  const [
    twoFactorResetting,
    setTwoFactorResetting,
  ] = useState(false);

  const [
    showAddCustomer,
    setShowAddCustomer,
  ] = useState(false);

  const [
    newCustomer,
    setNewCustomer,
  ] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    altEmail: "",
    phone: "",
    password: "",
  });

  const [
    addCustomerLoading,
    setAddCustomerLoading,
  ] = useState(false);

  const queryString = useMemo(() => {
    const params =
      new URLSearchParams();

    params.set(
      "page",
      String(page),
    );

    params.set(
      "limit",
      String(limit),
    );

    if (statusFilter !== "all") {
      params.set(
        "status",
        statusFilter,
      );
    }

    if (search.trim()) {
      params.set(
        "search",
        search.trim(),
      );
    }

    return params.toString();
  }, [
    page,
    limit,
    search,
    statusFilter,
  ]);

  async function loadCustomers() {
    try {
      if (customers.length === 0) {
        setLoading(true);
      } else {
        setPageLoading(true);
      }

      const response =
        await api.get(
          `/customers?${queryString}`,
        );

      setCustomers(
        response.data.customers ?? [],
      );

      const pagination =
        response.data.pagination;

      setTotal(
        pagination?.total ?? 0,
      );

      setTotalPages(
        pagination?.totalPages ?? 1,
      );
    } catch (error) {
      showNotification(
        getErrorMessage(
          error,
          "Unable to load customers",
        ),
        "error",
      );
    } finally {
      setLoading(false);
      setPageLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, [queryString]);

  async function openCustomer(
    customerId: string,
  ) {
    setSelectedCustomerId(
      customerId,
    );

    setSelectedCustomer(null);

    setCustomerLoading(true);

    try {
      const response =
        await api.get(
          `/customers/${customerId}`,
        );

      const customer: Customer =
        response.data.customer;

      setSelectedCustomer(
        customer,
      );

      setCustomerForm(
        customerToForm(customer),
      );
    } catch (error) {
      showNotification(
        getErrorMessage(
          error,
          "Unable to load customer details",
        ),
        "error",
      );
    } finally {
      setCustomerLoading(false);
    }
  }

  function closeCustomer() {
    setSelectedCustomerId(null);
    setSelectedCustomer(null);
    setNewPassword("");
  }

  async function handleUpdateDetails(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedCustomerId) {
      return;
    }

    setDetailsSaving(true);

    try {
      const response =
        await api.patch(
          `/customers/${selectedCustomerId}`,
          {
            ...customerForm,
            dateOfBirth:
              formatDateForApi(
                customerForm.dateOfBirth,
              ),
          },
        );

      const updatedCustomer: Customer =
        response.data.user;

      setSelectedCustomer(
        updatedCustomer,
      );

      setCustomerForm(
        customerToForm(
          updatedCustomer,
        ),
      );

      setCustomers((current) =>
        current.map(
          (customer) =>
            customer.id ===
            updatedCustomer.id
              ? updatedCustomer
              : customer,
        ),
      );

      showNotification(
        response.data.message ??
          "Customer updated successfully",
        "success",
      );
    } catch (error) {
      showNotification(
        getErrorMessage(
          error,
          "Unable to update customer",
        ),
        "error",
      );
    } finally {
      setDetailsSaving(false);
    }
  }

  async function handlePasswordUpdate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedCustomerId) {
      return;
    }

    setPasswordSaving(true);

    try {
      const response =
        await api.patch(
          `/customers/${selectedCustomerId}/password`,
          {
            newPassword,
          },
        );

      setNewPassword("");

      showNotification(
        response.data.message ??
          "Customer password changed successfully",
        "success",
      );
    } catch (error) {
      showNotification(
        getErrorMessage(
          error,
          "Unable to change customer password",
        ),
        "error",
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleStatusChange() {
    if (!selectedCustomer) {
      return;
    }

    setStatusSaving(true);

    const nextStatus =
      !selectedCustomer.status;

    try {
      const response =
        await api.patch(
          `/customers/${selectedCustomer.id}/status`,
          {
            status: nextStatus,
          },
        );

      setSelectedCustomer(
        (current) =>
          current
            ? {
                ...current,
                status:
                  response.data.status,
              }
            : current,
      );

      setCustomers((current) =>
        current.map(
          (customer) =>
            customer.id ===
            selectedCustomer.id
              ? {
                  ...customer,
                  status:
                    response.data.status,
                }
              : customer,
        ),
      );

      showNotification(
        response.data.message ??
          "Customer status updated successfully",
        "success",
      );
    } catch (error) {
      showNotification(
        getErrorMessage(
          error,
          "Unable to change customer status",
        ),
        "error",
      );
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleTwoFactorReset() {
    if (!selectedCustomer) {
      return;
    }

    setTwoFactorResetting(true);

    try {
      const response =
        await api.post(
          `/customers/${selectedCustomer.id}/2fa/reset`,
        );

      setSelectedCustomer(
        (current) =>
          current
            ? {
                ...current,
                twoFactorEnabled:
                  false,
              }
            : current,
      );

      setCustomers((current) =>
        current.map(
          (customer) =>
            customer.id ===
            selectedCustomer.id
              ? {
                  ...customer,
                  twoFactorEnabled:
                    false,
                }
              : customer,
        ),
      );

      showNotification(
        response.data.message ??
          "Two-factor authentication reset successfully",
        "success",
      );
    } catch (error) {
      showNotification(
        getErrorMessage(
          error,
          "Unable to reset two-factor authentication",
        ),
        "error",
      );
    } finally {
      setTwoFactorResetting(false);
    }
  }

  async function handleAddCustomer(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setAddCustomerLoading(true);

    try {
      const response =
        await api.post(
          "/customers",
          newCustomer,
        );

      setShowAddCustomer(false);

      setNewCustomer({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        altEmail: "",
        phone: "",
        password: "",
      });

      showNotification(
        response.data.message ??
          "Customer created successfully",
        "success",
      );

      setPage(1);

      await loadCustomers();
    } catch (error) {
      showNotification(
        getErrorMessage(
          error,
          "Unable to create customer",
        ),
        "error",
      );
    } finally {
      setAddCustomerLoading(false);
    }
  }

  function updateCustomerForm(
    field: keyof CustomerForm,
    value: string,
  ) {
    setCustomerForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateNewCustomer(
    field: keyof typeof newCustomer,
    value: string,
  ) {
    setNewCustomer((current) => ({
      ...current,
      [field]: value,
    }));
  }

  const firstItem =
    total === 0
      ? 0
      : (page - 1) * limit + 1;

  const lastItem = Math.min(
    page * limit,
    total,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Customers
        </h1>

        <p className="mt-1 text-sm text-zinc-600">
          Manage customer accounts
        </p>
      </div>

      <section className="glass rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value,
                );
                setPage(1);
              }}
              placeholder="Search customers..."
              className="h-11 min-w-0 flex-1 rounded-xl border border-white/70 bg-white/60 px-4 text-sm text-zinc-900 outline-none backdrop-blur-xl placeholder:text-zinc-500 focus:border-white focus:ring-2 focus:ring-white/70"
            />

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(
                  event.target.value as
                    | "all"
                    | "true"
                    | "false",
                );

                setPage(1);
              }}
              className="h-11 rounded-xl border border-white/70 bg-white/60 px-4 text-sm text-zinc-800 outline-none backdrop-blur-xl focus:border-white focus:ring-2 focus:ring-white/70"
            >
              <option value="all">
                All status
              </option>

              <option value="true">
                Active
              </option>

              <option value="false">
                Inactive
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              setShowAddCustomer(true)
            }
            className="h-11 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800"
          >
            + Add customer
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-white/60 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <th className="px-4 py-3">
                  Customer
                </th>

                <th className="px-4 py-3">
                  Username
                </th>

                <th className="px-4 py-3">
                  Email
                </th>

                <th className="px-4 py-3">
                  Status
                </th>

                <th className="px-4 py-3">
                  2FA
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map(
                  (customer) => (
                    <tr
                      key={customer.id}
                      onClick={() =>
                        openCustomer(
                          customer.id,
                        )
                      }
                      className="cursor-pointer border-b border-white/40 transition hover:bg-white/40"
                    >
                      <td className="px-4 py-4">
                        <div className="font-medium text-zinc-900">
                          {
                            customer.firstName
                          }{" "}
                          {
                            customer.lastName
                          }
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {
                          customer.username
                        }
                      </td>

                      <td className="px-4 py-4 text-sm text-zinc-600">
                        {customer.email}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={
                            customer.status
                              ? "inline-flex rounded-full border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1 text-xs font-medium text-emerald-700"
                              : "inline-flex rounded-full border border-red-200/80 bg-red-50/70 px-2.5 py-1 text-xs font-medium text-red-700"
                          }
                        >
                          {customer.status
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={
                            customer.twoFactorEnabled
                              ? "inline-flex rounded-full border border-emerald-200/80 bg-emerald-50/70 px-2.5 py-1 text-xs font-medium text-emerald-700"
                              : "inline-flex rounded-full border border-zinc-200/80 bg-zinc-100/70 px-2.5 py-1 text-xs font-medium text-zinc-600"
                          }
                        >
                          {customer.twoFactorEnabled
                            ? "Enabled"
                            : "Disabled"}
                        </span>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-white/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">
            {pageLoading
              ? "Loading..."
              : `Showing ${firstItem}-${lastItem} of ${total}`}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={
                page <= 1 ||
                pageLoading
              }
              onClick={() =>
                setPage((current) =>
                  Math.max(
                    1,
                    current - 1,
                  ),
                )
              }
              className="rounded-xl border border-white/80 bg-white/60 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-2 text-sm text-zinc-600">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >= totalPages ||
                pageLoading
              }
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    totalPages,
                    current + 1,
                  ),
                )
              }
              className="rounded-xl border border-white/80 bg-white/60 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="glass-strong max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Add customer
                </h2>

                <p className="mt-1 text-sm text-zinc-600">
                  Create a new customer
                  account.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddCustomer(
                    false,
                  )
                }
                className="rounded-xl px-3 py-2 text-lg text-zinc-500 transition hover:bg-white/60 hover:text-zinc-900"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleAddCustomer
              }
              className="mt-6 space-y-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <CustomerField
                  label="First name"
                  value={
                    newCustomer.firstName
                  }
                  required
                  onChange={(value) =>
                    updateNewCustomer(
                      "firstName",
                      value,
                    )
                  }
                />

                <CustomerField
                  label="Last name"
                  value={
                    newCustomer.lastName
                  }
                  required
                  onChange={(value) =>
                    updateNewCustomer(
                      "lastName",
                      value,
                    )
                  }
                />

                <CustomerField
                  label="Username"
                  value={
                    newCustomer.username
                  }
                  required
                  onChange={(value) =>
                    updateNewCustomer(
                      "username",
                      value,
                    )
                  }
                />

                <CustomerField
                  label="Email"
                  type="email"
                  value={
                    newCustomer.email
                  }
                  required
                  onChange={(value) =>
                    updateNewCustomer(
                      "email",
                      value,
                    )
                  }
                />

                <CustomerField
                  label="Alternate email"
                  type="email"
                  value={
                    newCustomer.altEmail
                  }
                  onChange={(value) =>
                    updateNewCustomer(
                      "altEmail",
                      value,
                    )
                  }
                />

                <CustomerField
                  label="Phone"
                  value={
                    newCustomer.phone
                  }
                  required
                  onChange={(value) =>
                    updateNewCustomer(
                      "phone",
                      value,
                    )
                  }
                />

                <div className="sm:col-span-2">
                  <CustomerField
                    label="Password"
                    type="password"
                    value={
                      newCustomer.password
                    }
                    required
                    onChange={(value) =>
                      updateNewCustomer(
                        "password",
                        value,
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowAddCustomer(
                      false,
                    )
                  }
                  className="rounded-xl border border-white/80 bg-white/60 px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-white/80"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    addCustomerLoading
                  }
                  className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addCustomerLoading
                    ? "Creating..."
                    : "Create customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="glass-strong relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl">
            <div className="flex items-start justify-between gap-4 border-b border-white/60 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">
                  Customer details
                </h2>

                {selectedCustomer && (
                  <p className="mt-1 text-sm text-zinc-600">
                    {
                      selectedCustomer.firstName
                    }{" "}
                    {
                      selectedCustomer.lastName
                    }{" "}
                    ·{" "}
                    {
                      selectedCustomer.username
                    }
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={
                  closeCustomer
                }
                className="rounded-xl px-3 py-2 text-lg text-zinc-500 transition hover:bg-white/60 hover:text-zinc-900"
                aria-label="Close customer details"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              {customerLoading ? (
                <div className="py-16 text-center text-sm text-zinc-500">
                  Loading customer
                  details...
                </div>
              ) : !selectedCustomer ? (
                <div className="py-16 text-center text-sm text-zinc-500">
                  Customer details
                  could not be
                  loaded.
                </div>
              ) : (
                <div className="space-y-6">
                  <form
                    onSubmit={
                      handleUpdateDetails
                    }
                    className="rounded-2xl border border-white/70 bg-white/40 p-5 backdrop-blur-xl"
                  >
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Personal information
                    </h3>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <CustomerField
                        label="First name"
                        value={
                          customerForm.firstName
                        }
                        onChange={(value) =>
                          updateCustomerForm(
                            "firstName",
                            value,
                          )
                        }
                      />

                      <CustomerField
                        label="Last name"
                        value={
                          customerForm.lastName
                        }
                        onChange={(value) =>
                          updateCustomerForm(
                            "lastName",
                            value,
                          )
                        }
                      />

                      <CustomerField
                        label="Username"
                        value={
                          customerForm.username
                        }
                        onChange={(value) =>
                          updateCustomerForm(
                            "username",
                            value,
                          )
                        }
                      />

                      <CustomerField
                        label="Email"
                        type="email"
                        value={
                          customerForm.email
                        }
                        onChange={(value) =>
                          updateCustomerForm(
                            "email",
                            value,
                          )
                        }
                      />

                      <CustomerField
                        label="Alternate email"
                        type="email"
                        value={
                          customerForm.altEmail
                        }
                        onChange={(value) =>
                          updateCustomerForm(
                            "altEmail",
                            value,
                          )
                        }
                      />

                      <CustomerField
                        label="Phone"
                        value={
                          customerForm.phone
                        }
                        onChange={(value) =>
                          updateCustomerForm(
                            "phone",
                            value,
                          )
                        }
                      />

                      <CustomerField
                        label="Date of birth"
                        type="date"
                        value={
                          customerForm.dateOfBirth
                        }
                        onChange={(value) =>
                          updateCustomerForm(
                            "dateOfBirth",
                            value,
                          )
                        }
                      />
                    </div>

                    <h3 className="mt-6 text-sm font-semibold text-zinc-900">
                      Address
                    </h3>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <CustomerField
                          label="Address line 1"
                          value={
                            customerForm.addressLine1
                          }
                          onChange={(value) =>
                            updateCustomerForm(
                              "addressLine1",
                              value,
                            )
                          }
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <CustomerField
                          label="Address line 2"
                          value={
                            customerForm.addressLine2
                          }
                          onChange={(value) =>
                            updateCustomerForm(
                              "addressLine2",
                              value,
                            )
                          }
                        />
                      </div>

                      <CustomerField
                        label="City"
                        value={
                          customerForm.city
                        }
                        onChange={(value) =>
                          updateCustomerForm(
                            "city",
                            value,
                          )
                        }
                      />

                      <CustomerField
                        label="State"
                        value={
                          customerForm.state
                        }
                        onChange={(value) =>
                          updateCustomerForm(
                            "state",
                            value,
                          )
                        }
                      />

                      <CustomerField
                        label="PIN code"
                        value={
                          customerForm.pinCode
                        }
                        onChange={(value) =>
                          updateCustomerForm(
                            "pinCode",
                            value,
                          )
                        }
                      />
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="submit"
                        disabled={
                          detailsSaving
                        }
                        className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {detailsSaving
                          ? "Saving..."
                          : "Update details"}
                      </button>
                    </div>
                  </form>

                  <section className="rounded-2xl border border-white/70 bg-white/40 p-5 backdrop-blur-xl">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Account
                    </h3>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-zinc-500">
                          Status
                        </p>

                        <p className="mt-1 text-sm text-zinc-800">
                          {selectedCustomer.status
                            ? "Active"
                            : "Inactive"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-zinc-500">
                          Two-factor authentication
                        </p>

                        <p className="mt-1 text-sm text-zinc-800">
                          {selectedCustomer.twoFactorEnabled
                            ? "Enabled"
                            : "Disabled"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-zinc-500">
                          Created
                        </p>

                        <p className="mt-1 text-sm text-zinc-800">
                          {formatDate(
                            selectedCustomer.createdAt,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-zinc-500">
                          Last login
                        </p>

                        <p className="mt-1 text-sm text-zinc-800">
                          {formatDate(
                            selectedCustomer.lastLoginAt,
                          )}
                        </p>
                      </div>
                    </div>
                  </section>

                  <form
                    onSubmit={
                      handlePasswordUpdate
                    }
                    className="rounded-2xl border border-white/70 bg-white/40 p-5 backdrop-blur-xl"
                  >
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Password
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-zinc-600">
                      Set a new password
                      for this customer.
                    </p>

                    <div className="mt-4 max-w-md">
                      <CustomerField
                        label="New password"
                        type="password"
                        value={
                          newPassword
                        }
                        required
                        onChange={
                          setNewPassword
                        }
                      />
                    </div>

                    <div className="mt-4">
                      <button
                        type="submit"
                        disabled={
                          passwordSaving
                        }
                        className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {passwordSaving
                          ? "Updating..."
                          : "Update password"}
                      </button>
                    </div>
                  </form>

                  <section className="rounded-2xl border border-white/70 bg-white/40 p-5 backdrop-blur-xl">
                    <h3 className="text-sm font-semibold text-zinc-900">
                      Account actions
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={
                          handleStatusChange
                        }
                        disabled={
                          statusSaving
                        }
                        className={
                          selectedCustomer.status
                            ? "rounded-xl border border-red-200/80 bg-red-50/70 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100/80 disabled:opacity-50"
                            : "rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100/80 disabled:opacity-50"
                        }
                      >
                        {statusSaving
                          ? "Updating..."
                          : selectedCustomer.status
                            ? "Disable account"
                            : "Enable account"}
                      </button>

                      <button
                        type="button"
                        onClick={
                          handleTwoFactorReset
                        }
                        disabled={
                          twoFactorResetting ||
                          !selectedCustomer.twoFactorEnabled
                        }
                        className="rounded-xl border border-white/80 bg-white/60 px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {twoFactorResetting
                          ? "Resetting..."
                          : "Reset 2FA"}
                      </button>
                    </div>

                    {!selectedCustomer.twoFactorEnabled && (
                      <p className="mt-3 text-xs text-zinc-500">
                        Two-factor
                        authentication
                        is already
                        disabled for
                        this customer.
                      </p>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}