"use client";

import { FormEvent, useState } from "react";
import { forcePasswordRequest } from "@/lib/auth";
import { useToast } from "@/components/ui/ToastProvider";

export function ForcePasswordModal({ onDone }: { onDone: () => void }) {
  const { success, error: toastError } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const match = newPassword.length >= 4 && newPassword === confirmPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (newPassword.length < 4) throw new Error("Mínimo 4 caracteres");
      if (newPassword !== confirmPassword) throw new Error("Las contraseñas no coinciden");
      await forcePasswordRequest(newPassword, confirmPassword);
      success("Contraseña actualizada");
      onDone();
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-[18px] border border-[#d8c8ef] bg-white px-4 py-3 text-sm text-[#1f2937] outline-none transition focus:border-[#a78bfa] focus:ring-2 focus:ring-[#ede9fe]";
  const label = "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0f172a]/50 backdrop-blur-[2px]" />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[18px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]"
      >
        <div className="px-6 py-6">
          <h2 className="text-xl font-bold text-[#111827]">Cambia tu contraseña</h2>
          <p className="mt-2 text-sm text-[#6b7280]">
            Entraste con tu DNI temporal. Debes crear una contraseña nueva para continuar.
          </p>

          <label className="mt-5 block">
            <span className={label}>Nueva contraseña</span>
            <input
              type="password"
              className={`${field} ${match ? "ring-2 ring-[#86efac]" : ""}`}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={4}
              autoComplete="new-password"
            />
          </label>
          <label className="mt-4 block">
            <span className={label}>Confirmar</span>
            <input
              type="password"
              className={`${field} ${match ? "ring-2 ring-[#86efac]" : ""}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={4}
              autoComplete="new-password"
            />
          </label>
          {match ? (
            <p className="mt-2 text-xs font-medium text-[#15803d]">Las contraseñas coinciden</p>
          ) : null}
        </div>

        <footer className="border-t border-[#f1f5f9] bg-[#f9fafb] px-6 py-4">
          <button
            type="submit"
            disabled={saving || !match}
            className="w-full rounded-full bg-[#16a34a] py-3 text-sm font-semibold text-white transition hover:bg-[#15803d] disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar y continuar"}
          </button>
        </footer>
      </form>
    </div>
  );
}
