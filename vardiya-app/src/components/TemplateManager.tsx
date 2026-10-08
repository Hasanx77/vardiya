"use client";

import { useState } from "react";
import type { ShiftTemplate } from "@/lib/types";
import { addTemplate, deleteTemplate, updateTemplate } from "@/lib/api-client";
import { COLOR_PALETTE, COLOR_CLASSES } from "@/lib/colors";
import { shiftHours } from "@/lib/shifts";

type Draft = { name: string; start: string; end: string; color: string };

const EMPTY: Draft = { name: "", start: "09:00", end: "17:00", color: "sky" };

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          title={c}
          onClick={() => onChange(c)}
          className={`h-5 w-5 rounded-full ${COLOR_CLASSES[c].dot} ${
            value === c ? "ring-2 ring-offset-2 ring-zinc-900" : ""
          }`}
        />
      ))}
    </div>
  );
}

export default function TemplateManager({
  templates,
  onChanged,
}: {
  templates: ShiftTemplate[];
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<Record<string, Draft>>({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function flash(m: string) {
    setMsg(m);
    window.setTimeout(() => setMsg(""), 2500);
  }

  async function add() {
    if (busy) return;
    setBusy(true);
    try {
      await addTemplate(draft);
      setDraft(EMPTY);
      await onChanged();
      flash("Şablon eklendi ✅");
    } catch {
      flash("Eklenemedi. Saatleri SS:DD biçiminde gir.");
    } finally {
      setBusy(false);
    }
  }

  async function save(id: string) {
    const d = editing[id];
    if (!d || busy) return;
    setBusy(true);
    try {
      await updateTemplate(id, d);
      setEditing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await onChanged();
      flash("Şablon güncellendi ✅");
    } catch {
      flash("Güncellenemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(t: ShiftTemplate) {
    if (!window.confirm(`"${t.name}" şablonu silinsin mi? Bu şablondaki vardiyalar da silinir.`))
      return;
    setBusy(true);
    try {
      await deleteTemplate(t.id);
      await onChanged();
      flash("Şablon silindi.");
    } catch {
      flash("Silinemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-700">Vardiya Şablonları</h3>

      <ul className="mt-3 divide-y divide-zinc-100">
        {templates.map((t) => {
          const d = editing[t.id];
          return (
            <li key={t.id} className="py-3">
              {!d ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm">
                    <span className={`h-2.5 w-2.5 rounded-full ${COLOR_CLASSES[t.color]?.dot ?? ""}`} />
                    <strong>{t.name}</strong>
                    <span className="text-zinc-500">
                      {t.start}–{t.end} · {shiftHours(t)} sa
                    </span>
                  </span>
                  <span className="flex gap-2">
                    <button
                      onClick={() =>
                        setEditing((prev) => ({
                          ...prev,
                          [t.id]: { name: t.name, start: t.start, end: t.end, color: t.color },
                        }))
                      }
                      className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => remove(t)}
                      className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Sil
                    </button>
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      value={d.name}
                      onChange={(e) =>
                        setEditing((prev) => ({ ...prev, [t.id]: { ...d, name: e.target.value } }))
                      }
                      placeholder="Ad"
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-900"
                    />
                    <input
                      type="time"
                      value={d.start}
                      onChange={(e) =>
                        setEditing((prev) => ({ ...prev, [t.id]: { ...d, start: e.target.value } }))
                      }
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-900"
                    />
                    <input
                      type="time"
                      value={d.end}
                      onChange={(e) =>
                        setEditing((prev) => ({ ...prev, [t.id]: { ...d, end: e.target.value } }))
                      }
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-900"
                    />
                  </div>
                  <ColorPicker
                    value={d.color}
                    onChange={(c) =>
                      setEditing((prev) => ({ ...prev, [t.id]: { ...d, color: c } }))
                    }
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => save(t.id)}
                      disabled={busy}
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() =>
                        setEditing((prev) => {
                          const next = { ...prev };
                          delete next[t.id];
                          return next;
                        })
                      }
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Yeni şablon */}
      <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-3">
        <p className="text-xs font-medium text-zinc-500">Yeni şablon ekle</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Ad (ör. Gece)"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-900"
          />
          <input
            type="time"
            value={draft.start}
            onChange={(e) => setDraft({ ...draft, start: e.target.value })}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-900"
          />
          <input
            type="time"
            value={draft.end}
            onChange={(e) => setDraft({ ...draft, end: e.target.value })}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:border-zinc-900"
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <ColorPicker value={draft.color} onChange={(c) => setDraft({ ...draft, color: c })} />
          <button
            onClick={add}
            disabled={busy}
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            + Ekle
          </button>
        </div>
      </div>

      {msg && <p className="mt-3 text-xs text-emerald-700">{msg}</p>}
      <p className="mt-3 text-xs text-zinc-500">
        Haftalık 45 saati aşan personel ızgarada kırmızı ile işaretlenir.
      </p>
    </div>
  );
}
