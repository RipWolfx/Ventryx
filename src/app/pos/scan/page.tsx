"use client";

import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

type Status = "loading" | "ready" | "scanning" | "invalid" | "error";

function ScanContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t") || "";
  const { success, error: toastError } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastCodeRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const [status, setStatus] = useState<Status>("loading");
  const [statusText, setStatusText] = useState("Verificando sesión…");
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const onDetectRef = useRef<(codigo: string) => void>(() => {});

  useEffect(() => {
    onDetectRef.current = async (codigo: string) => {
      const now = Date.now();
      if (
        lastCodeRef.current.code === codigo &&
        now - lastCodeRef.current.at < 2500
      ) {
        return;
      }
      lastCodeRef.current = { code: codigo, at: now };

      try {
        const res = await fetch(`/api/pos/sesion/${encodeURIComponent(token)}/codigo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "No se pudo enviar el código");
        setLastScanned(codigo);
        setStatusText(`Enviado: ${codigo}`);
        success("Código enviado a la caja");
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(40);
        }
      } catch (err) {
        toastError(err instanceof Error ? err.message : "Error al enviar");
      }
    };
  }, [token, success, toastError]);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setStatusText("Falta el parámetro t (token de sesión)");
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        const check = await fetch(`/api/pos/sesion/${encodeURIComponent(token)}`, {
          cache: "no-store",
        });
        const checkData = await check.json().catch(() => ({}));
        if (!check.ok || !checkData.ok) {
          if (!cancelled) {
            setStatus("invalid");
            setStatusText("Sesión inválida o expirada");
          }
          return;
        }

        if (cancelled || !videoRef.current) return;

        setStatus("scanning");
        setStatusText("Apunta la cámara al código de barras");

        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, _err, ctrl) => {
            controlsRef.current = ctrl;
            if (result) {
              const text = result.getText()?.trim();
              if (text) void onDetectRef.current(text);
            }
          },
        );
        controlsRef.current = controls;
        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setStatusText(
            err instanceof Error
              ? err.message
              : "No se pudo acceder a la cámara",
          );
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      try {
        controlsRef.current?.stop();
      } catch {
        /* ignore */
      }
      controlsRef.current = null;
    };
  }, [token]);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#111827] text-white">
      <header className="relative z-10 flex items-center justify-between bg-black/50 px-4 py-3 backdrop-blur-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Ventryx POS
          </p>
          <p className="text-sm font-semibold">Escáner móvil</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${
            status === "scanning" || status === "ready"
              ? "bg-emerald-500/20 text-emerald-300"
              : status === "invalid" || status === "error"
                ? "bg-red-500/20 text-red-300"
                : "bg-white/10 text-white/70"
          }`}
        >
          {status === "loading"
            ? "Conectando"
            : status === "scanning" || status === "ready"
              ? "Activo"
              : status === "invalid"
                ? "Inválido"
                : "Error"}
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          autoPlay
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-48 w-[80%] max-w-sm rounded-xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
        </div>
      </div>

      <footer className="relative z-10 space-y-1 bg-black/60 px-4 py-4 backdrop-blur-sm">
        <p className="text-center text-sm font-medium">{statusText}</p>
        {lastScanned ? (
          <p className="text-center font-mono text-xs text-emerald-300">{lastScanned}</p>
        ) : null}
        {!token ? (
          <p className="text-center text-xs text-red-300">
            Abre el enlace generado desde la caja (Link escáner).
          </p>
        ) : null}
      </footer>
    </div>
  );
}

export default function PosScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#111827] text-sm text-white/70">
          Cargando escáner…
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
