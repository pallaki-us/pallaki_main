import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { showToast } from '../lib/toast'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'pallaki-media'

export default function ImageUpload({ folder = 'portfolio', maxFiles = 12, existingUrls = [], onUploadComplete }) {
  const { user } = useAuth()
  const [images, setImages] = useState(existingUrls)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()

  async function handleFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return

    // Validate
    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        showToast('Only JPG, PNG and WebP images are allowed.')
        return
      }
      if (file.size > MAX_SIZE) {
        showToast(`${file.name} is too large. Max 2MB per image.`)
        return
      }
    }

    if (images.length + files.length > maxFiles) {
      showToast(`You can upload a maximum of ${maxFiles} images.`)
      return
    }

    if (!supabase) {
      // demo mode — just show local previews
      const previews = files.map(f => URL.createObjectURL(f))
      const updated = [...images, ...previews]
      setImages(updated)
      onUploadComplete?.(updated)
      return
    }

    setUploading(true)
    const uploaded = []

    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false })

      if (error) {
        showToast(`Upload failed: ${error.message}`)
        continue
      }

      const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path)

      uploaded.push(data.publicUrl)
    }

    const updated = [...images, ...uploaded]
    setImages(updated)
    onUploadComplete?.(updated)
    setUploading(false)
    showToast(`${uploaded.length} photo${uploaded.length > 1 ? 's' : ''} uploaded ✨`)
  }

  async function removeImage(url, index) {
    if (supabase && url.includes('supabase')) {
      const path = url.split(`/${BUCKET}/`)[1]
      await supabase.storage.from(BUCKET).remove([path])
    }
    const updated = images.filter((_, i) => i !== index)
    setImages(updated)
    onUploadComplete?.(updated)
  }

  const remaining = maxFiles - images.length

  return (
    <div>
      {/* Existing images grid */}
      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginBottom: '.8rem' }}>
          {images.map((url, i) => (
            <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
              <img
                src={url}
                alt=""
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--br)' }}
              />
              <button
                onClick={() => removeImage(url, i)}
                style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--vx)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload slot */}
      {remaining > 0 && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={handleFiles}
          />
          <div
            className="upload-slot"
            style={{ width: '100%', height: 80, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: uploading ? 'wait' : 'pointer' }}
            onClick={() => !uploading && inputRef.current.click()}
          >
            {uploading ? (
              <span style={{ fontSize: '.8rem', color: 'var(--tl)' }}>Uploading…</span>
            ) : (
              <>
                <span style={{ fontSize: '1.4rem' }}>＋</span>
                <span style={{ fontSize: '.68rem', color: 'var(--tl)' }}>Add photos ({remaining} remaining)</span>
              </>
            )}
          </div>
        </div>
      )}

      <p style={{ fontSize: '.68rem', color: 'var(--tl)', marginTop: '.4rem' }}>
        JPG, PNG or WebP · Max 2MB per image · Up to {maxFiles} photos
      </p>
    </div>
  )
}
