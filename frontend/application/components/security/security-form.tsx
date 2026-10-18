"use client";

import axios from "axios";
import QRCode from "qrcode";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import api from "@/lib/api";
import { useNotification } from "@/components/notifications/notification-provider";

type SecurityFormProps = {
  twoFactorEnabled: boolean;
};

type SetupResponse = {
  message: string;
  otpauthUrl: string;
  secret: string;
};

type VerifySetupResponse = {
  backupCodes: string[];
  backupCodesLow: boolean;
  backupCodesRemaining: number;
  message: string;
  twoFactorEnabled: boolean;
};

type DisableResponse = {
  message: string;
  twoFactorEnabled: boolean;
};

type PasswordResponse = {
  message: string;
};

type BackupCodesResponse = {
  backupCodes: string[];
  backupCodesLow: boolean;
  backupCodesRemaining: number;
  message: string;
};

export default function SecurityForm({
  twoFactorEnabled: initialTwoFactorEnabled,
}: SecurityFormProps) {
  const { showNotification } = useNotification();

  const [twoFactorEnabled, setTwoFactorEnabled] =
    useState(initialTwoFactorEnabled);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [passwordLoading, setPasswordLoading] =
    useState(false);
  const [passwordMessage, setPasswordMessage] =
    useState("");

  // 2FA setup
  const [setupStarted, setSetupStarted] = useState(false);
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] =
    useState(false);

  // 2FA disable
  const [disableMode, setDisableMode] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  // Backup codes
  const [backupCodes, setBackupCodes] = useState<string[]>(
    [],
  );
  const [showBackupCodes, setShowBackupCodes] =
    useState(false);
  const [copied, setCopied] = useState(false);

  const [capsLockOn, setCapsLockOn] = useState(false);

  // Backup code regeneration
  const [showBackupCodeRegeneration, setShowBackupCodeRegeneration] =
    useState(false);

  const [backupCodeVerification, setBackupCodeVerification] =
    useState("");

  const [
    backupCodeRegenerationLoading,
    setBackupCodeRegenerationLoading,
  ] = useState(false);

  const [
    backupCodeRegenerationError,
    setBackupCodeRegenerationError,
  ] = useState("");

  const [newBackupCodes, setNewBackupCodes] =
    useState<string[] | null>(null);

  const [backupCodesCopied, setBackupCodesCopied] =
    useState(false);

  const passwordsMatch =
    confirmPassword.length > 0 &&
    newPassword === confirmPassword;

  useEffect(() => {
    if (!otpauthUrl) {
      setQrCode("");
      return;
    }

    let cancelled = false;

    QRCode.toDataURL(otpauthUrl, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) {
          setQrCode(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrCode("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [otpauthUrl]);

  async function handlePasswordSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        "New password and re-entered password do not match.",
      );
      return;
    }

    setPasswordLoading(true);

    try {
      const response =
        await api.patch<PasswordResponse>(
          "/auth/password",
          {
            currentPassword,
            newPassword,
          },
        );

      showNotification(
        response.data?.message ??
          "Password changed successfully.",
        "success",
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage =
          error.response?.data?.message ??
          error.response?.data?.error;

        showNotification(
          backendMessage ??
            "Unable to change password.",
          "error",
        );
      } else {
        showNotification(
          "Unable to connect to the server.",
          "error",
        );
      }
    } finally {
      setPasswordLoading(false);
    }
  }

  async function startTwoFactorSetup() {
    setTwoFactorLoading(true);

    try {
      const response =
        await api.post<SetupResponse>(
          "/auth/2fa/setup",
        );

      setOtpauthUrl(response.data.otpauthUrl);
      setSecret(response.data.secret);
      setSetupStarted(true);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showNotification(
          error.response?.data?.message ??
            error.response?.data?.error ??
            "Unable to start two-factor authentication.",
          "error",
        );
      } else {
        showNotification(
          "Unable to connect to the server.",
          "error",
        );
      }
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function verifyTwoFactorSetup() {
    setTwoFactorLoading(true);

    try {
      const response =
        await api.post<VerifySetupResponse>(
          "/auth/2fa/verify-setup",
          {
            code: setupCode.trim(),
          },
        );

      setTwoFactorEnabled(
        response.data.twoFactorEnabled,
      );

      setBackupCodes(response.data.backupCodes);
      setShowBackupCodes(true);
      setCopied(false);

      setSetupStarted(false);
      setSetupCode("");
      setOtpauthUrl("");
      setSecret("");
      setQrCode("");

      showNotification(
        response.data.message ??
          "Two-factor authentication enabled successfully.",
        "success",
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showNotification(
          error.response?.data?.message ??
            error.response?.data?.error ??
            "Unable to verify two-factor authentication.",
          "error",
        );
      } else {
        showNotification(
          "Unable to connect to the server.",
          "error",
        );
      }
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function disableTwoFactor() {
    setTwoFactorLoading(true);

    try {
      const response =
        await api.post<DisableResponse>(
          "/auth/2fa/disable",
          {
            code: disableCode.trim(),
          },
        );

      setTwoFactorEnabled(
        response.data.twoFactorEnabled,
      );

      setDisableMode(false);
      setDisableCode("");

      showNotification(
        response.data.message ??
          "Two-factor authentication disabled successfully.",
        "success",
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showNotification(
          error.response?.data?.message ??
            error.response?.data?.error ??
            "Unable to disable two-factor authentication.",
          "error",
        );
      } else {
        showNotification(
          "Unable to connect to the server.",
          "error",
        );
      }
    } finally {
      setTwoFactorLoading(false);
    }
  }

    async function copyBackupCodes() {
    try {
      await navigator.clipboard.writeText(
        backupCodes.join("\n"),
      );

      setCopied(true);

      // Automatically resets the "Copied" status after 2 seconds
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
      
    } catch {
      setCopied(false);
    }
  }


  function closeBackupCodes() {
    setShowBackupCodes(false);
    setBackupCodes([]);
    setCopied(false);
  }

  function handlePasswordKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    setCapsLockOn(
      event.getModifierState("CapsLock"),
    );
  }

  function handlePasswordKeyUp(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    setCapsLockOn(
      event.getModifierState("CapsLock"),
    );
  }

  async function handleBackupCodeRegeneration(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setBackupCodeRegenerationError("");

    const code = backupCodeVerification.trim();

    if (!code) {
      setBackupCodeRegenerationError(
        "Enter your authenticator code or backup code.",
      );
      return;
    }

    setBackupCodeRegenerationLoading(true);

    try {
      const response =
        await api.post<BackupCodesResponse>(
          "/auth/2fa/backup-codes/regenerate",
          {
            code,
          },
        );

      setNewBackupCodes(
        response.data.backupCodes ?? [],
      );

      setBackupCodeVerification("");
      setShowBackupCodeRegeneration(false);

      showNotification(
        response.data.message ??
          "Backup codes regenerated successfully.",
        "success",
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage =
          error.response?.data?.message ??
          error.response?.data?.error;

        setBackupCodeRegenerationError(
          backendMessage ??
            "Unable to regenerate backup codes.",
        );
      } else {
        setBackupCodeRegenerationError(
          "Unable to connect to the server.",
        );
      }
    } finally {
      setBackupCodeRegenerationLoading(false);
    }
  }

  async function handleCopyNewBackupCodes() {
    if (!newBackupCodes) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        newBackupCodes.join("\n"),
      );

      setBackupCodesCopied(true);

      window.setTimeout(() => {
        setBackupCodesCopied(false);
      }, 2000);
    } catch {
      setBackupCodesCopied(false);
    }
  }

  function closeNewBackupCodes() {
    setNewBackupCodes(null);
    setBackupCodesCopied(false);
  }

  return (
    <>
      <div className="space-y-6">
        {/* Password */}

        <section className="glass rounded-3xl p-5 sm:p-6">
          <div>
            <h2 className="text-base font-semibold">
              Password reset
            </h2>
          </div>

          <form
            onSubmit={handlePasswordSubmit}
            className="mt-6 max-w-xl space-y-4"
          >
            <SecurityField
              id="current-password"
              label="Old password"
              type="password"
              value={currentPassword}
              autoComplete="current-password"
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
              onKeyDown={handlePasswordKeyDown}
              onKeyUp={handlePasswordKeyUp}
              onBlur={() => setCapsLockOn(false)}
            />

            <SecurityField
              id="new-password"
              label="New password"
              type="password"
              value={newPassword}
              autoComplete="new-password"
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              onKeyDown={handlePasswordKeyDown}
              onKeyUp={handlePasswordKeyUp}
              onBlur={() => setCapsLockOn(false)}
            />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="confirm-password"
                className="text-sm font-medium"
              >
                Re-enter new password
              </label>

              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                onKeyDown={handlePasswordKeyDown}
                onKeyUp={handlePasswordKeyUp}
                onBlur={() => setCapsLockOn(false)}
                className={`h-11 rounded-xl border px-4 text-sm outline-none backdrop-blur-xl transition shadow-[0_4px_14px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] focus:ring-2 ${
                  passwordsMatch
                    ? "border-green-200/80 bg-green-50/60 focus:border-green-300 focus:ring-green-200/50"
                    : "border-white/80 bg-white/60 focus:border-white focus:bg-white/75 focus:ring-white/60"
                }`}
              />
            </div>

            {capsLockOn && (
              <p className="text-xs text-amber-700">
                Caps Lock is on
              </p>
            )}

            {passwordMessage && (
              <p className="text-sm text-red-600">
                {passwordMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="h-11 rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {passwordLoading
                ? "Changing..."
                : "Change password"}
            </button>
          </form>
        </section>

        {/* 2FA */}

        <section className="glass rounded-3xl p-5 sm:p-6">
          <div>
            <h2 className="text-base font-semibold">
              Two-factor authentication
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
              Add an extra layer of security to your
              account.
            </p>
          </div>

          {!twoFactorEnabled && !setupStarted && (
            <div className="mt-6">
              <button
                type="button"
                onClick={startTwoFactorSetup}
                disabled={twoFactorLoading}
                className="h-11 rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {twoFactorLoading
                  ? "Starting..."
                  : "Enable 2FA"}
              </button>
            </div>
          )}

          {!twoFactorEnabled && setupStarted && (
            <div className="mt-6 max-w-xl space-y-6">
              <div>
                <p className="text-sm font-medium">
                  Scan this QR code
                </p>

                <p className="mt-1 text-sm text-zinc-600">
                  Scan the code with your authenticator
                  app.
                </p>

                <div className="mt-4 flex min-h-64 items-center justify-center rounded-2xl border border-white/70 bg-white/50 p-4">
                  {qrCode ? (
                    <img
                      src={qrCode}
                      alt="Two-factor authentication QR code"
                      className="h-56 w-56 rounded-xl"
                    />
                  ) : (
                    <p className="text-sm text-zinc-500">
                      Generating QR code...
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">
                  Setup key
                </p>

                <div className="mt-2 overflow-x-auto rounded-xl border border-white/80 bg-white/60 px-4 py-3 font-mono text-sm shadow-[0_4px_14px_rgba(31,38,135,0.08)]">
                  {secret}
                </div>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/40 p-5 backdrop-blur-xl">
                <h3 className="text-sm font-semibold">
                  Verify your authenticator
                </h3>

                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Enter the 6-digit code shown in your
                  authenticator app to complete two-factor
                  authentication setup.
                </p>

                <div className="mt-4">
                  <SecurityField
                    id="setup-code"
                    label="Authentication code"
                    value={setupCode}
                    inputMode="numeric"
                    onChange={(event) =>
                      setSetupCode(event.target.value)
                    }
                  />
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={verifyTwoFactorSetup}
                    disabled={twoFactorLoading}
                    className="h-11 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {twoFactorLoading
                      ? "Verifying..."
                      : "Verify and enable 2FA"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {twoFactorEnabled && !disableMode && (
            <div className="mt-6">
              <div className="mb-4 rounded-xl border border-green-200/70 bg-green-50/60 px-4 py-3 text-sm text-green-700">
                Two-factor authentication is enabled.
              </div>

              <button
                type="button"
                onClick={() => {
                  setDisableMode(true);
                }}
                className="h-11 rounded-xl border border-red-200/80 bg-red-50/60 px-5 text-sm font-medium text-red-700 transition hover:bg-red-50"
              >
                Disable 2FA
              </button>
            </div>
          )}

          {twoFactorEnabled && disableMode && (
            <div className="mt-6 max-w-xl space-y-4">
              <p className="text-sm text-zinc-600">
                Enter your current authenticator code to
                disable two-factor authentication.
              </p>

              <SecurityField
                id="disable-code"
                label="Authentication code"
                value={disableCode}
                inputMode="numeric"
                onChange={(event) =>
                  setDisableCode(event.target.value)
                }
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={disableTwoFactor}
                  disabled={twoFactorLoading}
                  className="h-11 rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {twoFactorLoading
                    ? "Disabling..."
                    : "Disable 2FA"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDisableMode(false);
                    setDisableCode("");
                  }}
                  className="h-11 rounded-xl border border-white/80 bg-white/60 px-5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-white/75"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Backup codes */}

      {twoFactorEnabled && (
        <section className="mt-8 glass rounded-2xl p-6">
          <div>
            <h2 className="text-base font-semibold">
              Backup codes
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
              Generate a new set of backup codes if you need
              to replace your current codes.
            </p>
          </div>

          {!showBackupCodeRegeneration && (
            <button
              type="button"
              onClick={() => {
                setShowBackupCodeRegeneration(true);
                setBackupCodeRegenerationError("");
              }}
              className="mt-5 rounded-xl border border-zinc-300/70 bg-zinc-200/80 px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-300/80"
            >
              Generate new backup codes
            </button>
          )}

          {showBackupCodeRegeneration && (
            <form
              onSubmit={handleBackupCodeRegeneration}
              className="mt-5 rounded-2xl border border-white/70 bg-white/40 p-5"
            >
              <h3 className="text-sm font-semibold">
                Verify your identity
              </h3>

              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Enter your authenticator code or backup code
                to generate a new set of backup codes.
              </p>

              <input
                type="text"
                value={backupCodeVerification}
                onChange={(event) =>
                  setBackupCodeVerification(
                    event.target.value,
                  )
                }
                placeholder="TOTP or backup code"
                autoComplete="one-time-code"
                className="mt-4 w-full rounded-xl border border-white/70 bg-white/60 px-4 py-3 text-sm text-zinc-900 outline-none backdrop-blur-xl placeholder:text-zinc-500 focus:border-white focus:ring-2 focus:ring-white/60"
              />

              {backupCodeRegenerationError && (
                <p className="mt-2 text-sm text-red-600">
                  {backupCodeRegenerationError}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={backupCodeRegenerationLoading}
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {backupCodeRegenerationLoading
                    ? "Generating..."
                    : "Generate new backup codes"}
                </button>

                <button
                  type="button"
                  disabled={backupCodeRegenerationLoading}
                  onClick={() => {
                    setShowBackupCodeRegeneration(false);
                    setBackupCodeVerification("");
                    setBackupCodeRegenerationError("");
                  }}
                  className="rounded-xl border border-white/80 bg-white/60 px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-white/80 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* 2FA setup backup codes popup */}

      {showBackupCodes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close backup codes"
            className="absolute inset-0 bg-black/10 backdrop-blur-[3px]"
          />

          <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-white/70 bg-white/40 p-5 shadow-[0_24px_70px_rgba(31,38,135,0.18)] backdrop-blur-xl sm:p-6">
            <div>
              <h2 className="text-lg font-semibold">
                Save your backup codes
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Two-factor authentication is now enabled.
                Save these backup codes somewhere safe.
                They will not be shown again.
              </p>
            </div>

            <div className="mt-5 max-h-[45vh] overflow-y-auto rounded-2xl border border-white/70 bg-white/50 p-3 backdrop-blur-xl">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {backupCodes.map((code) => (
                  <div
                    key={code}
                    className="rounded-xl border border-white/70 bg-white/70 px-3 py-2.5 text-center font-mono text-sm tracking-wide shadow-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={copyBackupCodes}
                className="h-11 rounded-xl border border-white/80 bg-white/70 px-5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-white"
              >
                {copied
                  ? "Copied"
                  : "Copy all codes"}
              </button>

              <button
                type="button"
                onClick={closeBackupCodes}
                className="h-11 rounded-xl bg-black px-5 text-sm font-medium text-white shadow-lg shadow-black/10 transition hover:bg-zinc-800"
              >
                I've saved them
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerated backup codes popup */}

      {newBackupCodes !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="glass-strong w-full max-w-lg rounded-3xl p-6">
            <h2 className="text-lg font-semibold">
              New backup codes
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Save these backup codes somewhere secure. They
              will not be shown again after you close this
              window.
            </p>

            <div className="mt-5 grid gap-2 rounded-2xl border border-white/70 bg-white/50 p-4 sm:grid-cols-2">
              {newBackupCodes.map((backupCode) => (
                <div
                  key={backupCode}
                  className="rounded-xl bg-white/70 px-3 py-2 text-center font-mono text-sm tracking-wide text-zinc-800"
                >
                  {backupCode}
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyNewBackupCodes}
                className="rounded-xl border border-white/80 bg-white/60 px-4 py-2.5 text-sm font-medium text-zinc-800 transition-colors hover:bg-white/80"
              >
                {backupCodesCopied
                  ? "Copied"
                  : "Copy all codes"}
              </button>

              <button
                type="button"
                onClick={closeNewBackupCodes}
                className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                I've saved them
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type SecurityFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric";
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onKeyDown?: (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => void;
  onKeyUp?: (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => void;
  onBlur?: (
    event: React.FocusEvent<HTMLInputElement>,
  ) => void;
};

function SecurityField({
  id,
  label,
  type = "text",
  value,
  autoComplete,
  inputMode,
  onChange,
  onKeyDown,
  onKeyUp,
  onBlur,
}: SecurityFieldProps) {
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
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
        className="h-11 rounded-xl border border-white/80 bg-white/60 px-4 text-sm shadow-[0_4px_14px_rgba(31,38,135,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] outline-none backdrop-blur-xl transition placeholder:text-zinc-400 hover:bg-white/65 focus:border-white focus:bg-white/75 focus:shadow-[0_6px_18px_rgba(31,38,135,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] focus:ring-2 focus:ring-white/60"
      />
    </div>
  );
}