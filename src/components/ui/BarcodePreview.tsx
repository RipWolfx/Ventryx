"use client";

import { useEffect, useRef } from "react";
import { renderBarcodeSvg } from "@/lib/barcode";

export function BarcodePreview({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      if (value.trim()) renderBarcodeSvg(ref.current, value);
      else ref.current.innerHTML = "";
    } catch {
      ref.current.innerHTML = "";
    }
  }, [value]);

  if (!value.trim()) {
    return (
      <p className={`rounded-[14px] border border-dashed border-[#e5e7eb] bg-[#fafafa] px-4 py-6 text-center text-xs text-[#9ca3af] ${className}`}>
        Genera o escribe un código para ver la vista previa
      </p>
    );
  }

  return (
    <div className={`flex justify-center rounded-[14px] border border-[#e5e7eb] bg-white p-3 ${className}`}>
      <svg ref={ref} />
    </div>
  );
}
