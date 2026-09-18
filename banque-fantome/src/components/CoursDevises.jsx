import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Cours des devises : chaque monnaie inventée par les joueurs, sa masse émise, ses émetteurs.
export default function CoursDevises({ compact = false }) {
  const [devises, setDevises] = useState([])
  useEffect(() => {
    const charger = () => supabase.rpc('cours_devises').then(({ data }) => setDevises(data || []))
    charger()
    const channel = supabase.channel('cours-devises')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billets_emis' }, charger)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])
  if (!devises.length) return null
  const total = devises.reduce((a, d) => a + Number(d.masse), 0)
  return (
    <div className={`table-wrap ${compact ? 'compact' : ''}`}>
      <table className="livre cours">
        <thead><tr><th>Devise</th><th className="num">Billets</th><th className="num">Masse</th><th className="num">Part</th>{!compact && <th className="num">Émetteurs</th>}</tr></thead>
        <tbody>
          {devises.map(d => (
            <tr key={d.devise}>
              <td><strong>{d.devise}</strong></td>
              <td className="num">{d.billets}</td>
              <td className="num">{d.masse}</td>
              <td className="num"><span className="part-barre" style={{ '--part': `${Math.round((d.masse / Math.max(1, total)) * 100)}%` }}>{Math.round((d.masse / Math.max(1, total)) * 100)} %</span></td>
              {!compact && <td className="num">{d.emetteurs}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
