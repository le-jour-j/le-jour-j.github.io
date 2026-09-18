import { useEffect } from 'react'
import Portal from './Portal'

export default function Notif({ msg, type = 'ok', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <Portal>
    <div className={`notif ${type}`} role="status" onClick={onClose} title="Cliquer pour fermer">
      {type === 'ok' ? '✓ ' : type === 'err' ? '✗ ' : ''}
      {msg}
    </div>
    </Portal>
  )
}
