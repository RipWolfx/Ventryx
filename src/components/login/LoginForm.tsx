"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/lib/auth";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Ingresa usuario y contraseña.");
      return;
    }

    setLoading(true);
    try {
      await loginRequest(username.trim(), password);
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-7" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-[0.8rem] font-medium text-[#5b4a75]">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          className="login-input"
          placeholder="admin"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[0.8rem] font-medium text-[#5b4a75]">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="login-input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-[#fde8ff] px-3 py-2 text-sm text-[#7a1f6c]">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="login-btn mt-1 w-full rounded-xl bg-[#7020ed] py-3.5 text-[0.95rem] font-semibold tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
