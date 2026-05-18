import { useRef, useEffect, useState, useCallback } from 'react'
import { COLORS } from '../utils/constants.js'
import { describeFrame } from '../services/api.js'

export function CameraCapture({ onCapture, captureRef, onFrameDescribed, facingMode: initialFacing = 'environment', aspectRatio = '3/4', language = 'en' }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const facingRef = useRef(initialFacing)
  const startIdRef = useRef(0)

  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState('Starting camera...')
  const [permDenied, setPermDenied] = useState(false)
  const [error, setError] = useState(null)
  const [facing, setFacing] = useState(initialFacing)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const [describing, setDescribing] = useState(false)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setTorchOn(false)
    setTorchSupported(false)
  }, [])

  const startCamera = useCallback(async (face, deviceId) => {
    const mode = face ?? facingRef.current
    const id = ++startIdRef.current
    setReady(false)
    setStatus('Starting camera...')
    setError(null)
    setPermDenied(false)
    stopStream()

    const constraints = deviceId
      ? { video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 960 } } }
      : { video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 960 } } }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setPermDenied(true)
        setError('Camera access denied. Allow camera in your browser settings, then tap Retry.')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      } catch {
        setError('Could not access camera. Check your device settings.')
        return
      }
    }

    if (id !== startIdRef.current) { stream.getTracks().forEach((t) => t.stop()); return }
    streamRef.current = stream

    // Check torch support on back camera track
    if (mode === 'environment') {
      const track = stream.getVideoTracks()[0]
      const caps = track?.getCapabilities?.()
      if (caps?.torch) setTorchSupported(true)
    }

    const video = videoRef.current
    if (!video) return
    video.srcObject = stream
    video.muted = true
    video.playsInline = true

    const markReady = () => {
      if (id !== startIdRef.current) return
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setReady(true)
        setStatus('')
        return
      }
      requestAnimationFrame(markReady)
    }

    video.addEventListener('loadedmetadata', markReady, { once: true })
    video.addEventListener('canplay', markReady, { once: true })
    video.play().then(markReady).catch(markReady)
    markReady()

    setTimeout(() => {
      if (id === startIdRef.current && !ready) setStatus('Camera opened — tap Start camera if image is frozen.')
    }, 3000)
  }, [stopStream]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      const next = !torchOn
      await track.applyConstraints({ advanced: [{ torch: next }] })
      setTorchOn(next)
    } catch {
      // torch not supported on this device despite capability report
      setTorchSupported(false)
    }
  }, [torchOn])

  const flip = useCallback(async () => {
    const next = facingRef.current === 'environment' ? 'user' : 'environment'
    facingRef.current = next
    setFacing(next)
    setTorchSupported(false)
    setTorchOn(false)
    await startCamera(next)
  }, [startCamera])

  const describeCurrentFrame = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || describing) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      setDescribing(true)
      onFrameDescribed?.('Describing what I see...')
      try {
        const data = await describeFrame(blob, language)
        onFrameDescribed?.(data.description || 'Nothing clear in frame.')
      } catch {
        onFrameDescribed?.('Could not describe the frame right now.')
      } finally {
        setDescribing(false)
      }
    }, 'image/jpeg', 0.75)
  }, [describing, onFrameDescribed, language])

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator(); const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(1100, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
      osc.start(); osc.stop(ctx.currentTime + 0.06)
    } catch {}

    canvas.toBlob((blob) => {
      if (!blob) return
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      onCapture?.(blob, dataUrl)
    }, 'image/jpeg', 0.92)
  }, [onCapture])

  useEffect(() => {
    if (captureRef) captureRef.current = capture
  }, [captureRef, capture])

  useEffect(() => {
    startCamera()
    return () => { startIdRef.current++; stopStream() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, textAlign: 'center', background: '#000', borderRadius: 'var(--radius)' }}>
        <p style={{ fontSize: 15, color: COLORS.DANGER, lineHeight: 1.6 }}>{error}</p>
        {permDenied && (
          <p style={{ fontSize: 13, color: COLORS.TEXT_MUTED, lineHeight: 1.6 }}>
            In Safari: Settings → {window.location.hostname} → Camera → Allow.<br />
            In Chrome: tap the lock icon → Camera → Allow.
          </p>
        )}
        <button onClick={() => startCamera()} style={{ padding: '12px 24px', borderRadius: 12, background: COLORS.ACCENT, color: '#fff', fontWeight: 700, fontSize: 15, minHeight: 48 }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    // role="application" tells TalkBack this is an interactive region,
    // preventing it from intercepting swipe gestures meant for the app
    <div role="application" aria-label="Camera viewfinder"
      style={{ flex: 1, position: 'relative', background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden', aspectRatio }}>

      <video
        ref={videoRef}
        autoPlay playsInline muted
        aria-hidden
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Target frame */}
      {ready && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '8%', left: '10%', width: '80%', height: '84%', border: '2px solid rgba(167,139,250,0.5)', borderRadius: 16 }} />
        </div>
      )}

      {/* Status overlay */}
      {!ready && (
        <div aria-live="polite" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <p style={{ color: COLORS.TEXT_MUTED, fontSize: 14, textAlign: 'center', padding: '0 24px' }}>{status}</p>
          {status !== 'Starting camera...' && (
            <button onClick={() => { videoRef.current?.play(); startCamera() }}
              style={{ padding: '10px 20px', borderRadius: 10, background: COLORS.ACCENT, color: '#fff', fontWeight: 600, fontSize: 14, minHeight: 44 }}>
              Start camera
            </button>
          )}
        </div>
      )}

      {/* Top-right controls: torch + flip */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Torch toggle — only shown on back camera if supported */}
        {torchSupported && facing === 'environment' && (
          <button
            onClick={toggleTorch}
            aria-label={torchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
            aria-pressed={torchOn}
            style={{ width: 52, height: 52, borderRadius: '50%', background: torchOn ? 'rgba(250,204,21,0.9)' : 'rgba(0,0,0,0.55)', border: `2px solid ${torchOn ? '#fbbf24' : 'rgba(255,255,255,0.6)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            🔦
          </button>
        )}

        {/* Flip camera */}
        <button onClick={flip} aria-label={facing === 'environment' ? 'Switch to front camera' : 'Switch to back camera'}
          style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '2px solid rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
        </button>
      </div>

      {/* Capture button — larger touch target for accessibility */}
      {ready && (
        <button
          onClick={capture}
          aria-label="Take photo"
          style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', width: 88, height: 88, borderRadius: '50%', background: 'rgba(124,58,237,0.85)', border: '4px solid #fff', fontSize: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', touchAction: 'manipulation' }}>
          📸
        </button>
      )}

      {/* Describe frame — only shown when parent passes onFrameDescribed */}
      {ready && onFrameDescribed && (
        <button
          onClick={describeCurrentFrame}
          disabled={describing}
          aria-label="Describe what's in frame"
          style={{
            position: 'absolute', bottom: 28, right: 16,
            height: 52, padding: '0 14px',
            borderRadius: COLORS.RADIUS,
            background: describing ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.6)',
            border: `2px solid ${describing ? COLORS.ACCENT : 'rgba(255,255,255,0.5)'}`,
            color: '#fff', fontSize: 12, fontWeight: 700,
            letterSpacing: 0.8, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 6,
            cursor: describing ? 'not-allowed' : 'pointer',
            opacity: describing ? 0.7 : 1,
          }}
        >
          {describing ? '…' : '👁 Describe'}
        </button>
      )}
    </div>
  )
}
