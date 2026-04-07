'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2, Pause, Play, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  listingId: string
  currentStatus: string
  title: string
}

export function ListingActions({ listingId, currentStatus, title }: Props) {
  const router = useRouter()
  const [open, setOpen]               = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [busy, setBusy]               = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  async function patchStatus(status: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success(status === 'SOLD' ? 'סומנה כנמכרה' : status === 'PAUSED' ? 'המודעה הושהתה' : 'המודעה הופעלה מחדש')
      router.refresh()
    } catch {
      toast.error('שגיאה בעדכון המודעה')
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  async function handleDelete() {
    setBusy(true)
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('המודעה נמחקה')
      router.refresh()
    } catch {
      toast.error('שגיאה במחיקת המודעה')
    } finally {
      setBusy(false)
      setShowConfirm(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={() => !busy && setOpen((v) => !v)}
        disabled={busy}
        className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center hover:bg-outline-variant/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="אפשרויות"
      >
        <MoreHorizontal className="w-4 h-4 text-on-surface" />
      </button>

      {/* Dropdown menu */}
      {open && !showConfirm && (
        <div className="absolute left-0 top-12 z-50 min-w-[180px] bg-surface-container border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden">
          {currentStatus === 'ACTIVE' && (
            <button
              onClick={() => { patchStatus('PAUSED'); setOpen(false) }}
              disabled={busy}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-highest text-right"
            >
              <Pause className="w-4 h-4 text-on-surface-variant" />
              <span>השהה מודעה</span>
            </button>
          )}
          {currentStatus === 'PAUSED' && (
            <button
              onClick={() => { patchStatus('ACTIVE'); setOpen(false) }}
              disabled={busy}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-highest text-right"
            >
              <Play className="w-4 h-4 text-green-400" />
              <span>הפעל מחדש</span>
            </button>
          )}
          {currentStatus !== 'SOLD' && (
            <button
              onClick={() => { patchStatus('SOLD'); setOpen(false) }}
              disabled={busy}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container-highest text-right"
            >
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>סמן כנמכר</span>
            </button>
          )}
          <hr className="border-outline-variant/20" />
          <button
            onClick={() => setShowConfirm(true)}
            disabled={busy}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 text-right"
          >
            <Trash2 className="w-4 h-4" />
            <span>מחק מודעה</span>
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" dir="rtl">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-surface-container border border-outline-variant/20 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="font-headline text-lg font-bold text-on-surface mb-2">מחיקת מודעה</h2>
            <p className="text-on-surface-variant text-sm mb-6">
              האם למחוק את{' '}
              <span className="font-semibold text-on-surface">{title}</span>?
              <br />
              פעולה זו לא ניתנת לביטול.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={busy}
                className="flex-1 py-3 rounded-2xl border border-outline-variant/30 text-on-surface text-sm font-semibold hover:bg-surface-container-highest transition-colors"
              >
                ביטול
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {busy ? 'מוחק...' : 'מחק'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
