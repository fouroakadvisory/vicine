"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CommunityField, FieldType } from "@/lib/types";
import { FIELD_PRESETS } from "@/lib/types";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Wand2,
  X,
  Check,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Text",
  phone: "Phone",
  email: "Email",
  url: "URL / Website",
  textarea: "Long text",
  select: "Dropdown (pick one)",
  multiselect: "Multi-select (pick many)",
  number: "Number",
};

function labelToName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 60);
}

interface FieldFormState {
  label: string;
  name: string;
  field_type: FieldType;
  placeholder: string;
  is_required: boolean;
  is_shareable: boolean;
  options_text: string;
}

const DEFAULT_FORM: FieldFormState = {
  label: "",
  name: "",
  field_type: "text",
  placeholder: "",
  is_required: false,
  is_shareable: true,
  options_text: "",
};

interface FieldBuilderProps {
  communityId: string;
  initialFields: CommunityField[];
}

export default function FieldBuilder({
  communityId,
  initialFields,
}: FieldBuilderProps) {
  const [fields, setFields] = useState<CommunityField[]>(initialFields);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FieldFormState>(DEFAULT_FORM);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<FieldFormState>(DEFAULT_FORM);
  const [showPresets, setShowPresets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("community_fields")
      .delete()
      .eq("id", id);
    if (!error) {
      setFields((prev) => prev.filter((f) => f.id !== id));
      if (editingId === id) setEditingId(null);
    }
    setDeleteConfirm(null);
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const idx = fields.findIndex((f) => f.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === fields.length - 1) return;

    const newFields = [...fields];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newFields[idx], newFields[swapIdx]] = [newFields[swapIdx], newFields[idx]];
    setFields(newFields);

    const supabase = createClient();
    await Promise.all(
      newFields.map((f, i) =>
        supabase
          .from("community_fields")
          .update({ sort_order: i })
          .eq("id", f.id)
      )
    );
  }

  function startEdit(field: CommunityField) {
    setEditingId(field.id);
    setShowAddForm(false);
    setEditForm({
      label: field.label,
      name: field.name,
      field_type: field.field_type,
      placeholder: field.placeholder ?? "",
      is_required: field.is_required,
      is_shareable: field.is_shareable,
      options_text: field.options?.join("\n") ?? "",
    });
  }

  async function handleSaveEdit() {
    if (!editingId) return;
    setSaving(true);
    const supabase = createClient();

    const options =
      editForm.field_type === "select" || editForm.field_type === "multiselect"
        ? editForm.options_text
            .split("\n")
            .map((o) => o.trim())
            .filter(Boolean)
        : null;

    const { data, error } = await supabase
      .from("community_fields")
      .update({
        label: editForm.label,
        name: editForm.name,
        field_type: editForm.field_type,
        placeholder: editForm.placeholder || null,
        is_required: editForm.is_required,
        is_shareable: editForm.is_shareable,
        options,
      })
      .eq("id", editingId)
      .select()
      .single();

    if (!error && data) {
      setFields((prev) =>
        prev.map((f) => (f.id === editingId ? (data as CommunityField) : f))
      );
      setEditingId(null);
    }
    setSaving(false);
  }

  async function handleAdd() {
    if (!addForm.label.trim()) return;
    setSaving(true);
    const supabase = createClient();

    const options =
      addForm.field_type === "select" || addForm.field_type === "multiselect"
        ? addForm.options_text
            .split("\n")
            .map((o) => o.trim())
            .filter(Boolean)
        : null;

    const { data, error } = await supabase
      .from("community_fields")
      .insert({
        community_id: communityId,
        label: addForm.label,
        name: addForm.name || labelToName(addForm.label),
        field_type: addForm.field_type,
        placeholder: addForm.placeholder || null,
        is_required: addForm.is_required,
        is_shareable: addForm.is_shareable,
        options,
        sort_order: fields.length,
      })
      .select()
      .single();

    if (!error && data) {
      setFields((prev) => [...prev, data as CommunityField]);
      setAddForm(DEFAULT_FORM);
      setShowAddForm(false);
    }
    setSaving(false);
  }

  async function applyPreset(presetKey: string) {
    const preset = FIELD_PRESETS[presetKey];
    if (!preset) return;
    setApplyingPreset(presetKey);

    const supabase = createClient();
    const startOrder = fields.length;

    const { data, error } = await supabase
      .from("community_fields")
      .insert(
        preset.fields.map((f, i) => ({
          community_id: communityId,
          name: f.name,
          label: f.label,
          field_type: f.field_type,
          placeholder: f.placeholder ?? null,
          is_required: f.is_required ?? false,
          is_shareable: f.is_shareable ?? true,
          options: f.options ?? null,
          sort_order: startOrder + i,
        }))
      )
      .select();

    if (!error && data) {
      setFields((prev) => [...prev, ...(data as CommunityField[])]);
    }
    setShowPresets(false);
    setApplyingPreset(null);
  }

  return (
    <div className="space-y-4">
      {/* Preset picker */}
      {showPresets && (
        <div className="bg-gold-50 border border-gold-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-slate-900">
                Load from preset
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Adds a set of fields to your community. You can edit them
                after.
              </p>
            </div>
            <button
              onClick={() => setShowPresets(false)}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid gap-2">
            {Object.entries(FIELD_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                disabled={applyingPreset === key}
                className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gold-200 hover:border-gold-400 transition-colors text-left disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {preset.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {preset.fields.length} fields:{" "}
                    {preset.fields.map((f) => f.label).join(", ")}
                  </p>
                </div>
                {applyingPreset === key ? (
                  <span className="text-xs text-gold-600">Adding...</span>
                ) : (
                  <span className="text-xs text-gold-600 font-medium">
                    Apply
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fields list */}
      {fields.length === 0 && !showAddForm ? (
        <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200">
          <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No fields yet.</p>
          <p className="text-xs mt-0.5">
            Add fields manually or load a preset to get started quickly.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              {editingId === field.id ? (
                <FieldEditForm
                  form={editForm}
                  onChange={setEditForm}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleMove(field.id, "up")}
                      disabled={idx === 0}
                      className="text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(field.id, "down")}
                      disabled={idx === fields.length - 1}
                      className="text-slate-300 hover:text-slate-600 disabled:opacity-20 transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Field info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {field.label}
                    </p>
                    <p className="text-xs text-slate-400">
                      {FIELD_TYPE_LABELS[field.field_type]}
                      {field.options &&
                        field.options.length > 0 &&
                        ` — ${field.options.slice(0, 3).join(", ")}${field.options.length > 3 ? "..." : ""}`}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {field.is_shareable && (
                      <span className="text-xs text-forest-700 bg-forest-50 px-2 py-0.5 rounded">
                        Shareable
                      </span>
                    )}
                    {field.is_required && (
                      <span className="text-xs text-gold-700 bg-gold-50 px-2 py-0.5 rounded">
                        Required
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => startEdit(field)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="Edit"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirm === field.id ? (
                      <div className="flex items-center gap-1 ml-1">
                        <span className="text-xs text-red-600">Delete?</span>
                        <button
                          onClick={() => handleDelete(field.id)}
                          className="text-xs px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs px-2 py-0.5 text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(field.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add field form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-forest-200 overflow-hidden">
          <div className="px-4 pt-3 pb-0">
            <p className="text-xs font-medium text-forest-700 uppercase tracking-wide">
              New field
            </p>
          </div>
          <FieldEditForm
            form={addForm}
            onChange={setAddForm}
            onSave={handleAdd}
            onCancel={() => {
              setShowAddForm(false);
              setAddForm(DEFAULT_FORM);
            }}
            saving={saving}
            isNew
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {!showAddForm && (
          <button
            onClick={() => {
              setShowAddForm(true);
              setShowPresets(false);
              setEditingId(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-forest-600 text-white rounded-lg text-sm font-medium hover:bg-forest-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add field
          </button>
        )}
        <button
          onClick={() => {
            setShowPresets(!showPresets);
            setShowAddForm(false);
            setEditingId(null);
          }}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm font-medium transition-colors",
            showPresets
              ? "border-gold-400 bg-gold-50 text-gold-800"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          )}
        >
          <Wand2 className="w-4 h-4" />
          Load preset
        </button>
      </div>
    </div>
  );
}

// Shared edit/add form
function FieldEditForm({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  isNew = false,
}: {
  form: FieldFormState;
  onChange: (form: FieldFormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isNew?: boolean;
}) {
  const needsOptions =
    form.field_type === "select" || form.field_type === "multiselect";
  const inputClass =
    "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-forest-500";

  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Label
          </label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => {
              const label = e.target.value;
              onChange({
                ...form,
                label,
                // Auto-generate machine name only for new fields
                name: isNew ? labelToName(label) : form.name,
              });
            }}
            className={inputClass}
            placeholder="e.g. Phone number"
            autoFocus={isNew}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Field type
          </label>
          <select
            value={form.field_type}
            onChange={(e) =>
              onChange({ ...form, field_type: e.target.value as FieldType })
            }
            className={inputClass}
          >
            {(
              Object.entries(FIELD_TYPE_LABELS) as [FieldType, string][]
            ).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {needsOptions && (
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Options{" "}
            <span className="text-slate-400 font-normal">(one per line)</span>
          </label>
          <textarea
            value={form.options_text}
            onChange={(e) => onChange({ ...form, options_text: e.target.value })}
            rows={4}
            className={cn(inputClass, "resize-none font-mono text-xs")}
            placeholder={"Option A\nOption B\nOption C"}
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Placeholder{" "}
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={form.placeholder}
          onChange={(e) => onChange({ ...form, placeholder: e.target.value })}
          className={inputClass}
          placeholder="Shown when the field is empty..."
        />
      </div>

      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_shareable}
            onChange={(e) =>
              onChange({ ...form, is_shareable: e.target.checked })
            }
            className="rounded border-slate-300 text-forest-600 focus:ring-forest-500"
          />
          Shareable
          <span className="text-xs text-slate-400 font-normal">
            (reciprocal visibility)
          </span>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_required}
            onChange={(e) =>
              onChange({ ...form, is_required: e.target.checked })
            }
            className="rounded border-slate-300 text-forest-600 focus:ring-forest-500"
          />
          Required
        </label>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving || !form.label.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-forest-600 text-white rounded-lg text-sm font-medium hover:bg-forest-700 transition-colors disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          {saving ? "Saving..." : isNew ? "Add field" : "Save changes"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
