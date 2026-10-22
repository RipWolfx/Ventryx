export type AuthSession = {
  id: number;
  username: string;
  rol: string;
  nombres?: string | null;
  apellidos?: string | null;
  email?: string | null;
  foto?: string | null;
  mustChangePassword?: boolean;
};

export async function loginRequest(username: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "No se pudo iniciar sesión");
  }
  return data as { user: AuthSession };
}

export async function logoutRequest() {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export async function meRequest(): Promise<AuthSession | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user as AuthSession;
}

export async function forcePasswordRequest(newPassword: string, confirmPassword: string) {
  const res = await fetch("/api/auth/password-inicial", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ newPassword, confirmPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "No se pudo cambiar la contraseña");
  }
  return data;
}
