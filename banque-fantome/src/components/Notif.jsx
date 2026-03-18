import { useEffect } from 'react'

export default function Notif({ msg, type = 'ok', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`notif ${type}`}>
      {type === 'ok' ? '✓ ' : type === 'err' ? '✗ ' : ''}
      {msg}
    </div>
  )
}
