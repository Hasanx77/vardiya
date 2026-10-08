"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { StatePayload } from "@/lib/types";
import { fetchState } from "@/lib/api-client";
import { COLOR_CLASSES } from "@/lib/colors";

export default function EkipPage() {
  const [data, setData] = useState<StatePayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchState()
      .then(setData)
      .catch(() => setError("Sunucuya ulaşılamadı."));
  }, []);

  if (error) {
    return (
      <main className="flex-1 grid place-items-center px-4">
        <p className="text-red-600">{error}</p>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="flex-1 grid place-items-center">
        <p className="text-zinc-500">Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold">{data.business.name}</h1>
      <p className="mt-1 text-zinc-600">
        Aşağıdan adını seç, bu haftaki vardiyanı gör ve izin talebi gönder.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {data.employees.map((emp) => (
          <Link
            key={emp.id}
            href={`/ekip/${emp.id}`}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-400"
          >
            <span
              className={`h-3 w-3 rounded-full ${COLOR_CLASSES[emp.color]?.dot ?? "bg-zinc-400"}`}
            />
            <div className="flex-1">
              <div className="font-medium">{emp.name}</div>
              <div className="text-xs text-zinc-400">{emp.role}</div>
            </div>
            <span className="text-zinc-400">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
