"use client";

import axios from "axios";
import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

import api from "@/lib/api";
import type { User } from "@/lib/types";
import { useNotification } from "@/components/notifications/notification-provider";

type ProfileFormProps = {
  user: User;
};

function formatDateForApi(value: string) {
  if (!value) {
    return "";
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/,
  );

  if (!match) {
    return "";
  }

  const [, year, month, day] = match;

  return `${day}-${month}-${year}`;
}

function formatDateForInput(value?: string | null) {
  if (!value) {
    return "";
  }

  // ISO date/timestamp:
  // 1985-08-15T00:00:00Z
  const isoMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T/,
  );

  if (isoMatch) {
    const [, year, month, day] = isoMatch;

    return `${year}-${month}-${day}`;
  }

  // DD-MM-YYYY:
  // 15-08-1985
  const dmyMatch = value.match(
    /^(\d{2})-(\d{2})-(\d{4})$/,
  );

  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;

    return `${year}-${month}-${day}`;
  }

  return "";
}

export default function ProfileForm({
  user,
}: ProfileFormProps) {
  const { showNotification } = useNotification();

  const [firstName, setFirstName] = useState(
    user.firstName ?? "",
  );

  const [lastName, setLastName] = useState(
    user.lastName ?? "",
  );

  const [username, setUsername] = useState(
    user.username ?? "",
  );

  const [email, setEmail] = useState(
    user.email ?? "",
  );

  const [altEmail, setAltEmail] = useState(
    user.altEmail ?? "",
  );

  const [phone, setPhone] = useState(
    user.phone ?? "",
  );

  const [dateOfBirth, setDateOfBirth] = useState(
    formatDateForInput(user.dateOfBirth),
  );

  const [addressLine1, setAddressLine1] = useState(
    user.addressLine1 ?? "",
  );

  const [addressLine2, setAddressLine2] = useState(
    user.addressLine2 ?? "",
  );

  const [city, setCity] = useState(
    user.city ?? "",
  );

  const [state, setState] = useState(
    user.state ?? "",
  );

  const [pinCode, setPinCode] = useState(
    user.pinCode ?? "",
  );

  const [profilePic, setProfilePic] = useState(
    user.profilePic ?? "",
  );

  const [profileImageLoading, setProfileImageLoading] =
    useState(false);

  const [showProfileImage, setShowProfileImage] =
    useState(false);

  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);

    try {
      const apiDateOfBirth =
        formatDateForApi(dateOfBirth);

      const response = await api.patch(
        "/auth/me",
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
          email: email.trim(),
          altEmail: altEmail.trim(),
          phone: phone.trim(),
          dateOfBirth: apiDateOfBirth,
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          state: state.trim(),
          pinCode: pinCode.trim(),
        },
      );

      showNotification(
        response.data?.message ??
          "Profile updated successfully.",
        "success",
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showNotification(
          error.response?.data?.message ??
            error.response?.data?.error ??
            "Unable to update profile.",
          "error",
        );
      } else {
        showNotification(
          "Unable to connect to the server.",
          "error",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileImageUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();

    formData.append("profile_pic", file);

    setProfileImageLoading(true);

    try {
      const response = await api.patch(
        "/auth/me/image",
        formData,
      );

      showNotification(
        response.data?.message ??
          "Profile picture updated successfully.",
        "success",
      );

      // Refresh the page so /auth/me provides the
      // newly saved profilePic.
      window.location.reload();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showNotification(
          error.response?.data?.message ??
            error.response?.data?.error ??
            "Unable to update profile picture.",
          "error",
        );
      } else {
        showNotification(
          "Unable to connect to the server.",
          "error",
        );
      }
    } finally {
      setProfileImageLoading(false);

      // Allow selecting the same file again.
      event.target.value = "";
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="glass rounded-3xl p-4 sm:p-5 lg:p-6"
      >
        {/* Profile Picture */}

        <section className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-white/80 bg-white/60 shadow-[0_8px_24px_rgba(31,38,135,0.08)]">
              {profilePic ? (
                <button
                  type="button"
                  onClick={() =>
                    setShowProfileImage(true)
                  }
                  className="block h-full w-full cursor-zoom-in"
                  aria-label="View profile picture"
                >
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace(
                      "/api/v1",
                      "",
                    )}/${profilePic}`}
                    alt={`${firstName} ${lastName}`}
                    className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                  />
                </button>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-zinc-500">
                  {firstName.charAt(0)}
                  {lastName.charAt(0)}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-base font-semibold">
                Profile picture
              </h2>

              <p className="mt-1 text-sm text-zinc-600">
                Upload a new profile picture.
              </p>

              <label
                htmlFor="profile-picture"
                className={`mt-3 inline-flex cursor-pointer items-center rounded-xl border border-zinc-300/70 bg-zinc-200/80 px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-300/80 ${
                  profileImageLoading
                    ? "pointer-events-none opacity-60"
                    : ""
                }`}
              >
                {profileImageLoading
                  ? "Uploading..."
                  : "Change photo"}
              </label>

              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                disabled={profileImageLoading}
                className="hidden"
              />
            </div>
          </div>
        </section>

        <div className="mb-6 h-px bg-white/50" />

        {/* Personal Information */}

        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold">
              Personal information
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ProfileField
              id="firstName"
              label="First name"
              value={firstName}
              autoComplete="given-name"
              onChange={(event) =>
                setFirstName(event.target.value)
              }
            />

            <ProfileField
              id="lastName"
              label="Last name"
              value={lastName}
              autoComplete="family-name"
              onChange={(event) =>
                setLastName(event.target.value)
              }
            />

            <ProfileField
              id="username"
              label="Username"
              value={username}
              autoComplete="username"
              onChange={(event) =>
                setUsername(event.target.value)
              }
            />

            <ProfileField
              id="phone"
              label="Phone"
              type="tel"
              value={phone}
              autoComplete="tel"
              inputMode="tel"
              onChange={(event) =>
                setPhone(event.target.value)
              }
            />

            <ProfileField
              id="email"
              label="Email"
              type="email"
              value={email}
              autoComplete="email"
              inputMode="email"
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />

            <ProfileField
              id="altEmail"
              label="Alternative email"
              type="email"
              value={altEmail}
              autoComplete="email"
              inputMode="email"
              onChange={(event) =>
                setAltEmail(event.target.value)
              }
            />

            <ProfileField
              id="dateOfBirth"
              label="Date of birth"
              type="date"
              value={dateOfBirth}
              onChange={(event) =>
                setDateOfBirth(event.target.value)
              }
            />
          </div>
        </section>

        {/* Divider */}

        <div className="my-6 h-px bg-white/50" />

        {/* Address */}

        <section>
          <div className="mb-5">
            <h2 className="text-base font-semibold">
              Address
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <ProfileField
                id="addressLine1"
                label="Address line 1"
                value={addressLine1}
                autoComplete="address-line1"
                onChange={(event) =>
                  setAddressLine1(event.target.value)
                }
              />
            </div>

            <div className="sm:col-span-2">
              <ProfileField
                id="addressLine2"
                label="Address line 2"
                value={addressLine2}
                autoComplete="address-line2"
                onChange={(event) =>
                  setAddressLine2(event.target.value)
                }
              />
            </div>

            <ProfileField
              id="city"
              label="City"
              value={city}
              autoComplete="address-level2"
              onChange={(event) =>
                setCity(event.target.value)
              }
            />

            <ProfileField
              id="state"
              label="State"
              value={state}
              autoComplete="address-level1"
              onChange={(event) =>
                setState(event.target.value)
              }
            />

            <ProfileField
              id="pinCode"
              label="PIN code"
              value={pinCode}
              autoComplete="postal-code"
              inputMode="numeric"
              onChange={(event) =>
                setPinCode(event.target.value)
              }
            />
          </div>
        </section>

        {/* Actions */}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : "Save changes"}
          </button>
        </div>
      </form>

      {/* Profile image preview */}

      {showProfileImage && profilePic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close profile picture"
            onClick={() =>
              setShowProfileImage(false)
            }
            className="absolute inset-0 cursor-default"
          />

          <div className="relative max-h-[90vh] max-w-[90vw] rounded-3xl border border-white/80 bg-white/40 p-3 shadow-[0_24px_70px_rgba(31,38,135,0.22)] backdrop-blur-2xl">
            <button
              type="button"
              onClick={() =>
                setShowProfileImage(false)
              }
              aria-label="Close"
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/70 text-lg text-zinc-700 shadow-sm backdrop-blur-xl transition hover:bg-white"
            >
              ×
            </button>

            <img
              src={`${process.env.NEXT_PUBLIC_API_URL?.replace(
                "/api/v1",
                "",
              )}/${profilePic}`}
              alt={`${firstName} ${lastName}`}
              className="max-h-[82vh] max-w-[85vw] rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

type ProfileFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
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
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
};

function ProfileField({
  id,
  label,
  type = "text",
  value,
  autoComplete,
  inputMode,
  onChange,
}: ProfileFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium"
      >
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={onChange}
        className="h-11 rounded-xl border border-white/80 bg-white/60 px-4 text-sm shadow-[0_4px_14px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] outline-none backdrop-blur-xl transition placeholder:text-zinc-400 hover:bg-white/65 focus:border-white focus:bg-white/75 focus:shadow-[0_6px_18px_rgba(31,38,135,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] focus:ring-2 focus:ring-white/60"
      />
    </div>
  );
}