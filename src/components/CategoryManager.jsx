import { useState } from 'react'
import { X, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { useCategories } from '../context/CategoryContext'

const PALETTE = [
  '#5E9E8A', '#D4715A', '#C8924A', '#8B7EC8',
  '#9B8E87', '#E07B8C', '#5B8DB8', '#7BAF5E',
  '#C4956A', '#8B5E9E', '#D4A85A', '#9E5E6E',
  '#5E7E9E', '#7E9E5E', '#B07A5E', '#6E8BB5',
]

const EMPTY_FORM = { label: '', color: '#5E9E8A' }

export default function CategoryManager({ onClose }) {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories()

  // editingId: id of category being edited, or 'new' for the add form
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)

  function startEdit(cat) {
    setEditingId(cat.id)
    setForm({ label: cat.label, color: cat.color })
  }

  function startAdd() {
    setEditingId('new')
    setForm(EMPTY_FORM)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.label.trim() || saving) return
    setSaving(true)
    try {
      if (editingId === 'new') {
        await addCategory({ label: form.label.trim(), color: form.color })
      } else {
        await updateCategory(editingId, { label: form.label.trim(), color: form.color })
      }
      cancelEdit()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('이 카테고리를 삭제할까요?\n해당 카테고리의 일정은 유지되지만 색상이 초기화돼요.')) return
    await deleteCategory(id)
    if (editingId === id) cancelEdit()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full max-w-[680px] mx-auto bg-warm-50 rounded-t-[28px] shadow-warm-lg animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-9 h-1 rounded-full bg-warm-300" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-warm-900">카테고리 관리</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-warm-100">
            <X size={15} className="text-warm-600" />
          </button>
        </div>

        <div className="px-5 pb-6 overflow-y-auto scrollbar-none max-h-[75vh] space-y-2">

          {/* Existing categories */}
          {categories.map(cat => (
            <div key={cat.id}>
              {editingId === cat.id ? (
                <EditForm
                  form={form}
                  setForm={setForm}
                  onSave={handleSave}
                  onCancel={cancelEdit}
                  saving={saving}
                />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-warm-100 group">
                  {/* Color dot */}
                  <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="flex-1 text-[15px] font-semibold text-warm-900">{cat.label}</span>
                  {/* Actions */}
                  <button
                    onClick={() => startEdit(cat)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-warm-200 transition-colors"
                  >
                    <Pencil size={14} className="text-warm-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} className="text-warm-400 hover:text-red-400" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add new */}
          {editingId === 'new' ? (
            <EditForm
              form={form}
              setForm={setForm}
              onSave={handleSave}
              onCancel={cancelEdit}
              saving={saving}
              isNew
            />
          ) : (
            <button
              onClick={startAdd}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-warm-300 text-warm-500 font-semibold text-[14px] active:bg-warm-100 transition-colors"
            >
              <Plus size={16} />
              새 카테고리 추가
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EditForm({ form, setForm, onSave, onCancel, saving, isNew }) {
  return (
    <div className="p-4 rounded-2xl border-2 border-warm-200 bg-warm-50 space-y-3">
      {/* Name input */}
      <input
        type="text"
        placeholder="카테고리 이름"
        value={form.label}
        onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
        onKeyDown={e => e.key === 'Enter' && onSave()}
        autoFocus
        className="w-full bg-warm-100 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-warm-900 placeholder-warm-300 outline-none"
      />

      {/* Color palette */}
      <div>
        <p className="text-xs font-semibold text-warm-400 mb-2">색상 선택</p>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map(color => (
            <button
              key={color}
              onClick={() => setForm(f => ({ ...f, color }))}
              className="w-8 h-8 rounded-full transition-transform active:scale-90 flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              {form.color === color && <Check size={14} color="white" strokeWidth={3} />}
            </button>
          ))}
        </div>
        {/* Hex input */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-6 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: form.color }} />
          <input
            type="text"
            value={form.color}
            onChange={e => {
              const v = e.target.value
              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setForm(f => ({ ...f, color: v }))
            }}
            className="flex-1 bg-warm-100 rounded-lg px-2 py-1 text-xs font-mono text-warm-700 outline-none"
            placeholder="#000000"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-warm-200 text-warm-500 text-[14px] font-semibold"
        >
          취소
        </button>
        <button
          onClick={onSave}
          disabled={!form.label.trim() || saving}
          className="flex-1 py-2.5 rounded-xl text-white text-[14px] font-bold disabled:opacity-40 transition-colors"
          style={{ backgroundColor: form.color }}
        >
          {saving ? '저장 중…' : isNew ? '추가' : '저장'}
        </button>
      </div>
    </div>
  )
}
