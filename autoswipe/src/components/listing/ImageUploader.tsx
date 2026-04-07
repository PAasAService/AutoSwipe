'use client'

/**
 * ImageUploader
 *
 * Handles real image uploads to Cloudinary with:
 *  - File picker (click) + drag-and-drop
 *  - Per-image XHR upload with live progress bar
 *  - Retry on error
 *  - Reorder via ← → arrow buttons (index 0 = left = primary)
 *  - Primary badge on the first image (index 0)
 *  - Remove button (calls DELETE /api/upload for already-uploaded images)
 *  - Max 6 images, min 1 image enforced
 *  - 10 MB per-file size limit enforced before upload starts
 *
 * Props:
 *   onChange(items)      — called whenever the done-list changes.
 *                          Only 'done' items are passed upward.
 *   onBusyChange(busy)   — called when any upload starts or finishes.
 *                          Parent should block submission while busy = true.
 *   maxImages            — default 6
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, X, ChevronLeft, ChevronRight, Loader2, RotateCcw, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UploadedImage {
  url:      string
  publicId: string
}

type ItemStatus = 'pending' | 'uploading' | 'done' | 'error'

interface ImageItem {
  id:         string
  file:       File
  previewUrl: string
  status:     ItemStatus
  progress:   number        // 0–100
  url?:       string
  publicId?:  string
  error?:     string
  xhr?:       XMLHttpRequest
}

interface SignResponse {
  signature: string
  timestamp: number
  folder:    string
  cloudName: string
  apiKey:    string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2)
}

function isImage(file: File) {
  return file.type.startsWith('image/')
}

const ACCEPTED    = 'image/jpeg,image/png,image/webp,image/heic,image/heif'
const MAX_BYTES   = 10 * 1024 * 1024  // 10 MB

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onChange:       (images: UploadedImage[]) => void
  onBusyChange?:  (uploading: boolean) => void
  maxImages?:     number
}

export function ImageUploader({ onChange, onBusyChange, maxImages = 6 }: Props) {
  const [items, setItems]     = useState<ImageItem[]>([])
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const itemsRef     = useRef<ImageItem[]>(items)
  itemsRef.current   = items

  // Notify parent of done-list (order preserved)
  useEffect(() => {
    const done = items
      .filter((it) => it.status === 'done' && it.url && it.publicId)
      .map((it) => ({ url: it.url!, publicId: it.publicId! }))
    onChange(done)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  // Notify parent when busy state changes
  const hasUploading = items.some((it) => it.status === 'uploading')
  useEffect(() => {
    onBusyChange?.(hasUploading)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUploading])

  // Abort all in-flight XHRs on unmount
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => it.xhr?.abort())
    }
  }, [])

  // ── Upload one file ───────────────────────────────────────────────────────

  const uploadOne = useCallback(async (item: ImageItem) => {
    let sign: SignResponse
    try {
      const res = await fetch('/api/upload/sign', { method: 'POST' })
      if (!res.ok) throw new Error('sign failed')
      sign = await res.json()
    } catch {
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: 'error', error: 'שגיאה בחתימת ההעלאה' } : it
        )
      )
      return
    }

    const formData = new FormData()
    formData.append('file',      item.file)
    formData.append('api_key',   sign.apiKey)
    formData.append('timestamp', String(sign.timestamp))
    formData.append('signature', sign.signature)
    formData.append('folder',    sign.folder)

    const xhr = new XMLHttpRequest()

    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, xhr } : it))
    )

    xhr.upload.addEventListener('progress', (e) => {
      if (!e.lengthComputable) return
      const pct = Math.round((e.loaded / e.total) * 100)
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, progress: pct } : it))
      )
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, status: 'done', progress: 100, url: result.secure_url, publicId: result.public_id, xhr: undefined }
                : it
            )
          )
        } catch {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, status: 'error', error: 'תשובת שגיאה מהשרת' } : it
            )
          )
        }
      } else {
        setItems((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: 'error', error: `שגיאה ${xhr.status}` } : it
          )
        )
      }
    })

    xhr.addEventListener('error', () => {
      setItems((prev) =>
        prev.map((it) =>
          it.id === item.id ? { ...it, status: 'error', error: 'שגיאת רשת' } : it
        )
      )
    })

    xhr.addEventListener('abort', () => {
      // Silently remove the item when aborted (user removed it mid-upload)
      setItems((prev) => prev.filter((it) => it.id !== item.id))
    })

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`)
    xhr.send(formData)
  }, [])

  // ── Add files ─────────────────────────────────────────────────────────────

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files).filter((f) => {
        if (!isImage(f)) return false
        if (f.size > MAX_BYTES) {
          toast.error(`הקובץ גדול מדי — מקסימום 10MB לתמונה`)
          return false
        }
        return true
      })

      const slots = maxImages - items.length
      if (slots <= 0) {
        toast.error(`ניתן להוסיף עד ${maxImages} תמונות`)
        return
      }

      const toAdd    = arr.slice(0, slots)
      const newItems: ImageItem[] = toAdd.map((file) => ({
        id:         uid(),
        file,
        previewUrl: URL.createObjectURL(file),
        status:     'pending' as ItemStatus,
        progress:   0,
      }))

      setItems((prev) => {
        const updated = [...prev, ...newItems]
        setTimeout(() => {
          newItems.forEach((it) => {
            setItems((p) =>
              p.map((x) => (x.id === it.id ? { ...x, status: 'uploading' } : x))
            )
            uploadOne(it)
          })
        }, 0)
        return updated
      })
    },
    [items.length, maxImages, uploadOne]
  )

  // ── Remove ────────────────────────────────────────────────────────────────

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((it) => it.id === id)
      if (!item) return prev

      item.xhr?.abort()

      if (item.publicId) {
        fetch(`/api/upload?publicId=${encodeURIComponent(item.publicId)}`, { method: 'DELETE' }).catch(() => {})
      }

      if (item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl)
      }

      return prev.filter((it) => it.id !== id)
    })
  }, [])

  // ── Reorder ───────────────────────────────────────────────────────────────

  const move = useCallback((id: string, direction: -1 | 1) => {
    setItems((prev) => {
      const idx  = prev.findIndex((it) => it.id === id)
      if (idx < 0) return prev
      const next = idx + direction
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }, [])

  // ── Retry ─────────────────────────────────────────────────────────────────

  const retryItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const item = prev.find((it) => it.id === id)
        if (!item) return prev
        const reset = prev.map((it) =>
          it.id === id ? { ...it, status: 'uploading' as ItemStatus, progress: 0, error: undefined, publicId: undefined, url: undefined } : it
        )
        setTimeout(() => uploadOne({ ...item, status: 'uploading', progress: 0, error: undefined, publicId: undefined, url: undefined }), 0)
        return reset
      })
    },
    [uploadOne]
  )

  // ── Drag & drop ───────────────────────────────────────────────────────────

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      addFiles(e.dataTransfer.files)
    },
    [addFiles]
  )

  // ── Derived ───────────────────────────────────────────────────────────────

  const allDone = items.length > 0 && items.every((it) => it.status === 'done')

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3" dir="rtl">
      {/* Grid of thumbnails */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {items.map((item, idx) => (
            <div key={item.id} className="relative flex flex-col gap-1">
              {/* Thumbnail */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container">
                <img
                  src={item.previewUrl}
                  alt=""
                  className={clsx(
                    'w-full h-full object-cover transition-opacity duration-300',
                    item.status !== 'done' && 'opacity-50'
                  )}
                />

                {/* Progress overlay */}
                {item.status === 'uploading' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 gap-1.5 px-3">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                    <div className="w-full bg-white/20 rounded-full h-1">
                      <div
                        className="bg-primary h-1 rounded-full transition-all duration-200"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-white text-[10px] font-bold">{item.progress}%</span>
                  </div>
                )}

                {/* Error overlay */}
                {item.status === 'error' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-1">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-300 text-[10px] text-center px-1 leading-tight">{item.error}</span>
                    <button
                      onClick={() => retryItem(item.id)}
                      className="flex items-center gap-1 mt-1 px-2 py-1 bg-white/10 rounded-lg text-white text-[10px] hover:bg-white/20"
                    >
                      <RotateCcw className="w-3 h-3" /> נסה שוב
                    </button>
                  </div>
                )}

                {/* Primary badge — index 0, done */}
                {idx === 0 && item.status === 'done' && (
                  <div className="absolute bottom-1.5 right-1.5 bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    ראשית
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="absolute top-1.5 left-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                  aria-label="הסר תמונה"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              {/* Reorder arrows — ChevronLeft moves toward index 0 (left), ChevronRight moves away */}
              {item.status === 'done' && items.length > 1 && (
                <div className="flex justify-center gap-1">
                  <button
                    onClick={() => move(item.id, -1)}
                    disabled={idx === 0}
                    className="w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center disabled:opacity-20 hover:bg-surface-container-high transition-colors"
                    aria-label="הזז שמאלה"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-on-surface-variant" />
                  </button>
                  <button
                    onClick={() => move(item.id, 1)}
                    disabled={idx === items.length - 1}
                    className="w-6 h-6 rounded-lg bg-surface-container flex items-center justify-center disabled:opacity-20 hover:bg-surface-container-high transition-colors"
                    aria-label="הזז ימינה"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add-more cell */}
          {items.length < maxImages && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-2xl bg-surface-container border-2 border-dashed border-outline-variant/30 hover:border-primary/40 flex flex-col items-center justify-center gap-1 text-on-surface-variant transition-colors"
              aria-label="הוסף תמונה"
            >
              <Camera className="w-6 h-6" />
              <span className="text-xs">הוסף</span>
            </button>
          )}
        </div>
      )}

      {/* Drop zone — shown only when no items yet */}
      {items.length === 0 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={clsx(
            'w-full rounded-3xl border-2 border-dashed py-10 flex flex-col items-center justify-center gap-3 transition-all',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-outline-variant/30 bg-surface-container hover:border-primary/40 hover:bg-surface-container-high'
          )}
          aria-label="בחר תמונות"
        >
          <Camera className="w-8 h-8 text-on-surface-variant/50" />
          <div className="text-center">
            <p className="text-sm font-semibold text-on-surface-variant">לחץ לבחירת תמונות</p>
            <p className="text-xs text-on-surface-variant/60 mt-0.5">או גרור לכאן · JPG, PNG, WEBP · עד 10MB לתמונה</p>
          </div>
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      {/* Status line */}
      {items.length > 0 && (
        <p className="text-xs text-on-surface-variant text-right px-1">
          {hasUploading
            ? 'מעלה תמונות...'
            : allDone
              ? `✓ ${items.length} תמונות הועלו בהצלחה`
              : items.some((it) => it.status === 'error')
                ? 'חלק מהתמונות נכשלו — לחץ "נסה שוב"'
                : `${items.length} תמונות`}
        </p>
      )}
    </div>
  )
}
