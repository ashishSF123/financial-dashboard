"use client";

import { useState } from "react";
import { formatINR } from "./kpi-cards";

interface Column {
  key: string;
  label: string;
  type: "text" | "number" | "currency" | "status";
}

interface EditableTableProps {
  title: string;
  description: string;
  accent?: string;
  columns: Column[];
  rows: Record<string, unknown>[];
  onUpdate: (rows: Record<string, unknown>[]) => void;
  recalculate?: (row: Record<string, unknown>) => Record<string, unknown>;
}

export function EditableTable({ title, description, accent = "indigo", columns, rows, onUpdate, recalculate }: EditableTableProps) {
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addingRow, setAddingRow] = useState(false);
  const [newRow, setNewRow] = useState<Record<string, string>>({});

  const accentColors: Record<string, { header: string; border: string; addBtn: string; addBtnHover: string }> = {
    amber: { header: "text-amber-400", border: "border-amber-500/10", addBtn: "bg-amber-500/[0.08] text-amber-300 border-amber-500/20", addBtnHover: "hover:bg-amber-500/[0.15]" },
    indigo: { header: "text-indigo-400", border: "border-indigo-500/10", addBtn: "bg-indigo-500/[0.08] text-indigo-300 border-indigo-500/20", addBtnHover: "hover:bg-indigo-500/[0.15]" },
    rose: { header: "text-rose-400", border: "border-rose-500/10", addBtn: "bg-rose-500/[0.08] text-rose-300 border-rose-500/20", addBtnHover: "hover:bg-rose-500/[0.15]" },
    emerald: { header: "text-emerald-400", border: "border-emerald-500/10", addBtn: "bg-emerald-500/[0.08] text-emerald-300 border-emerald-500/20", addBtnHover: "hover:bg-emerald-500/[0.15]" },
    cyan: { header: "text-cyan-400", border: "border-cyan-500/10", addBtn: "bg-cyan-500/[0.08] text-cyan-300 border-cyan-500/20", addBtnHover: "hover:bg-cyan-500/[0.15]" },
    purple: { header: "text-purple-400", border: "border-purple-500/10", addBtn: "bg-purple-500/[0.08] text-purple-300 border-purple-500/20", addBtnHover: "hover:bg-purple-500/[0.15]" },
  };
  const ac = accentColors[accent] || accentColors.indigo;

  const startEdit = (rowIdx: number, colKey: string, currentValue: unknown) => {
    setEditingCell({ rowIdx, colKey });
    setEditValue(String(currentValue ?? ""));
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const { rowIdx, colKey } = editingCell;
    const col = columns.find((c) => c.key === colKey);
    const updated = [...rows];
    let newVal: unknown = editValue;
    if (col?.type === "number" || col?.type === "currency") {
      newVal = parseFloat(editValue) || 0;
    }
    updated[rowIdx] = { ...updated[rowIdx], [colKey]: newVal };
    if (recalculate) {
      updated[rowIdx] = recalculate(updated[rowIdx]);
    }
    onUpdate(updated);
    setEditingCell(null);
  };

  const deleteRow = (idx: number) => {
    onUpdate(rows.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    const row: Record<string, unknown> = { id: `new-${Date.now()}` };
    columns.forEach((col) => {
      if (col.type === "number" || col.type === "currency") {
        row[col.key] = parseFloat(newRow[col.key] || "0") || 0;
      } else {
        row[col.key] = newRow[col.key] || "";
      }
    });
    const finalRow = recalculate ? recalculate(row) : row;
    onUpdate([...rows, finalRow]);
    setAddingRow(false);
    setNewRow({});
  };

  const renderStatus = (value: unknown) => {
    const str = String(value || "").toLowerCase();
    if (str.includes("completed") || str.includes("closed")) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Closed</span>;
    }
    if (str.includes("active") || str.includes("progress")) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">Active</span>;
    }
    return <span className="text-slate-500 text-xs">{String(value || "—")}</span>;
  };

  const formatCell = (col: Column, value: unknown) => {
    if (value === null || value === undefined || value === "") return "—";
    if (col.type === "currency") return formatINR(Number(value));
    if (col.type === "number") {
      const n = Number(value);
      return n === Math.floor(n) ? String(n) : n.toFixed(2);
    }
    return String(value);
  };

  // Summary row for currency columns
  const currencyCols = columns.filter((c) => c.type === "currency");
  const totals: Record<string, number> = {};
  currencyCols.forEach((col) => {
    totals[col.key] = rows.reduce((sum, row) => sum + (Number(row[col.key]) || 0), 0);
  });

  return (
    <div className="relative overflow-hidden bg-[#12131a] border border-white/[0.06] rounded-2xl">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-base font-semibold tracking-tight">{title}</h2>
            <p className="text-slate-500 text-[11px] mt-0.5 font-medium">{description}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-600 font-medium">{rows.length} records</span>
            <button
              onClick={() => setAddingRow(true)}
              className={`${ac.addBtn} ${ac.addBtnHover} border px-3.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all`}
            >
              + Add Row
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.02]">
              {columns.map((col) => (
                <th key={col.key} className={`text-left ${ac.header} text-[9px] font-bold uppercase tracking-[1px] px-4 py-3 border-b border-white/[0.04]`}>
                  {col.label}
                </th>
              ))}
              <th className="w-10 border-b border-white/[0.04]" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={String(row.id) || rowIdx} className="border-b border-white/[0.02] hover:bg-white/[0.02] group transition-colors">
                {columns.map((col) => {
                  const isEditing = editingCell?.rowIdx === rowIdx && editingCell?.colKey === col.key;
                  return (
                    <td key={col.key} className="px-4 py-3">
                      {isEditing ? (
                        <input
                          autoFocus
                          type={col.type === "text" || col.type === "status" ? "text" : "number"}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingCell(null); }}
                          className="bg-indigo-500/[0.08] border border-indigo-500/30 rounded-md px-2.5 py-1 text-xs text-white w-full outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                        />
                      ) : col.type === "status" ? (
                        <span onClick={() => startEdit(rowIdx, col.key, row[col.key])} className="cursor-pointer">
                          {renderStatus(row[col.key])}
                        </span>
                      ) : (
                        <span
                          onClick={() => startEdit(rowIdx, col.key, row[col.key])}
                          className={`cursor-pointer transition-colors text-xs ${
                            col.type === "currency"
                              ? "font-semibold text-cyan-400 hover:text-cyan-300"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {formatCell(col, row[col.key])}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3">
                  <button
                    onClick={() => deleteRow(rowIdx)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-rose-500/[0.06] border border-rose-500/10 flex items-center justify-center text-rose-400/60 hover:text-rose-400 hover:bg-rose-500/10 text-[10px] transition-all"
                    title="Delete"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}

            {/* Add row form */}
            {addingRow && (
              <tr className="bg-indigo-500/[0.02] border-b border-indigo-500/10">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5">
                    <input
                      type={col.type === "text" || col.type === "status" ? "text" : "number"}
                      placeholder={col.label}
                      value={newRow[col.key] || ""}
                      onChange={(e) => setNewRow((p) => ({ ...p, [col.key]: e.target.value }))}
                      className="bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1 text-xs text-white w-full outline-none focus:border-indigo-400 placeholder:text-slate-700"
                    />
                  </td>
                ))}
                <td className="px-3">
                  <div className="flex gap-1">
                    <button onClick={addRow} className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold hover:bg-emerald-500/20 transition-all">✓</button>
                    <button onClick={() => { setAddingRow(false); setNewRow({}); }} className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 text-[10px] hover:bg-white/[0.06] transition-all">✕</button>
                  </div>
                </td>
              </tr>
            )}

            {/* Totals row */}
            {currencyCols.length > 0 && rows.length > 0 && (
              <tr className="bg-white/[0.02] border-t border-white/[0.06]">
                {columns.map((col, idx) => (
                  <td key={col.key} className="px-4 py-3">
                    {idx === 0 ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total</span>
                    ) : col.type === "currency" ? (
                      <span className="text-xs font-bold text-white">{formatINR(totals[col.key])}</span>
                    ) : null}
                  </td>
                ))}
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && !addingRow && (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <span className="text-slate-600 text-lg">∅</span>
          </div>
          <p className="text-slate-600 text-xs">No records yet</p>
          <p className="text-slate-700 text-[10px] mt-1">Click &quot;+ Add Row&quot; to begin</p>
        </div>
      )}
    </div>
  );
}
