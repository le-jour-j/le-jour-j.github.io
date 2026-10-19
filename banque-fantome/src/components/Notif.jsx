import { useEffect, useRef } from 'react'
import Portal from './Portal'

export default function Notif({ msg, type = 'ok', onClose }) {
  // onClose est souvent une fonction recréée à chaque rendu : la garder dans une ref
  // évite de relancer le minuteur pendant qu'on tape (la notif ne partait plus).
  const fermer = useRef(onClose)
  fermer.current = onClose
  useEffect(() => {
    const t = setTimeout(() => fermer.current?.(), 3500)
    return () => clearTimeout(t)
  }, [msg])

  return (
    <Portal>
    <div className={`notif ${type}`} role="status" onClick={onClose} title="Cliquer pour fermer">
      {type === 'ok' ? '✓ ' : type === 'err' ? '✗ ' : ''}
      {msg}
    </div>
    </Portal>
  )
}
