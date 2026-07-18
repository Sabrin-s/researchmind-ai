import { useState, useEffect, useRef } from 'react'

/* ─── API Base URL (works locally and on Hugging Face / Render) ─── */
const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/* ─── Shared style tokens ─── */
const C = {
  bg:        '#020617',
  surface:   '#0f172a',
  surfaceHi: '#1e293b',
  border:    '#1e293b',
  borderHi:  '#334155',
  text:      '#f1f5f9',
  textMuted: '#94a3b8',
  textDim:   '#475569',
  indigo:    '#6366f1',
  indigoDark:'#4338ca',
  sky:       '#38bdf8',
  emerald:   '#34d399',
  rose:      '#f43f5e',
  amber:     '#fbbf24',
  purple:    '#a855f7',
}

const glass = {
  background: 'rgba(15,23,42,0.7)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid rgba(255,255,255,0.07)`,
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
}

const btn = (color='#6366f1', bg='rgba(99,102,241,0.12)') => ({
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '7px 14px', borderRadius: 10, fontSize: 12,
  fontWeight: 600, cursor: 'pointer', border: `1px solid ${color}40`,
  background: bg, color, transition: 'all .2s',
})

/* ─── Agent Log Component ─── */
function AgentLog({ logs, status }) {
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

  const agents = [
    { name: 'Planner Agent',          icon: '📋' },
    { name: 'Web Research Agent',     icon: '🌐' },
    { name: 'PDF Reader Agent',       icon: '📄' },
    { name: 'Fact Checker Agent',     icon: '✅' },
    { name: 'Citation Verifier Agent',icon: '📎' },
    { name: 'Report Writer Agent',    icon: '✍️'  },
  ]

  const getStatus = name => {
    const al = logs.filter(l => l.agent_name === name)
    if (!al.length) return 'pending'
    if (al.some(l => l.status === 'error')) return 'error'
    if (al.some(l => l.status === 'completed')) return 'done'
    return 'running'
  }

  const statusColor = s => s==='done'?C.emerald:s==='running'?C.sky:s==='error'?C.rose:C.textDim
  const statusBg    = s => s==='done'?'rgba(52,211,153,.08)':s==='running'?'rgba(56,189,248,.08)':s==='error'?'rgba(244,63,94,.08)':'rgba(71,85,105,.08)'
  const statusBdr   = s => s==='done'?'rgba(52,211,153,.25)':s==='running'?'rgba(56,189,248,.35)':s==='error'?'rgba(244,63,94,.25)':'rgba(71,85,105,.2)'

  return (
    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:20, height:'100%' }}>
      {/* Pipeline */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, overflowY:'auto' }}>
        <p style={{ fontSize:11, fontWeight:700, color:C.textDim, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:4 }}>
          Agent Pipeline
        </p>
        {agents.map(a => {
          const s = getStatus(a.name)
          return (
            <div key={a.name} style={{
              display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
              borderRadius:12, border:`1px solid ${statusBdr(s)}`, background:statusBg(s),
              animation: s==='running'?'glow 2s ease-in-out infinite':'none',
              transition:'all .3s',
            }}>
              <span style={{ fontSize:18 }}>{a.icon}</span>
              <div>
                <p style={{ fontSize:12, fontWeight:600, color: s==='pending'?C.textDim:C.text }}>{a.name}</p>
                <p style={{ fontSize:10, color:statusColor(s), marginTop:2, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{s}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Console */}
      <div style={{ display:'flex', flexDirection:'column', background:'rgba(2,6,23,.85)', border:`1px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', borderBottom:`1px solid ${C.border}`, background:'rgba(15,23,42,.6)' }}>
          <span style={{ fontSize:14 }}>🖥️</span>
          <span style={{ fontSize:11, fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'.08em' }}>Live Orchestrator Console</span>
          {(status==='researching'||status==='writing') && (
            <span style={{ marginLeft:'auto', fontSize:10, color:C.sky, background:'rgba(56,189,248,.1)', padding:'2px 8px', borderRadius:20, border:`1px solid rgba(56,189,248,.2)`, animation:'pulse 2s ease-in-out infinite' }}>
              ● ACTIVE
            </span>
          )}
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:16, fontFamily:'monospace', fontSize:11, display:'flex', flexDirection:'column', gap:10 }}>
          {!logs.length && <span style={{ color:C.textDim, fontStyle:'italic' }}>Waiting for workflow to start…</span>}
          {logs.map((log,i) => {
            const col = log.status==='completed'?C.emerald:log.status==='error'?C.rose:log.status==='running'?C.sky:C.textMuted
            return (
              <div key={i} style={{ borderBottom:`1px solid rgba(255,255,255,.04)`, paddingBottom:8, animation:'fadeIn .3s ease forwards' }}>
                <span style={{ color:C.textDim }}>[{new Date(log.timestamp).toLocaleTimeString()}] </span>
                <span style={{ color:col, fontWeight:700 }}>[{log.agent_name} › {log.step_name}]</span>
                <p style={{ color:'#cbd5e1', marginTop:4, paddingLeft:12, lineHeight:1.6 }}>{log.log_message}</p>
              </div>
            )
          })}
          <div ref={endRef}/>
        </div>
      </div>
    </div>
  )
}

/* ─── Report Viewer Component ─── */
function ReportViewer({ projectId, report, sources, initialMessages=[] }) {
  const [tab, setTab]           = useState('report')
  const [q, setQ]               = useState('')
  const [msgs, setMsgs]         = useState(initialMessages)
  const [sending, setSending]   = useState(false)
  const endRef = useRef(null)

  useEffect(() => { setMsgs(initialMessages) }, [initialMessages])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs])

  const dl = fmt => window.open(`${API}/reports/${projectId}/download/${fmt}`, '_blank')

  const sendQ = async e => {
    e.preventDefault()
    if (!q.trim()) return
    const user = { sender:'user', message:q, timestamp:new Date().toISOString() }
    setMsgs(p => [...p, user]); setQ(''); setSending(true)
    try {
      const r = await fetch(`${API}/projects/${projectId}/qa`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ question:user.message })
      })
      const bot = await r.json()
      setMsgs(p => [...p, bot])
    } catch { setMsgs(p => [...p, { sender:'assistant', message:'Could not reach backend QA.' }]) }
    finally { setSending(false) }
  }

  let timeline=[], gaps=[]
  try { timeline = JSON.parse(report?.timeline_data||'[]') } catch {}
  try { gaps     = JSON.parse(report?.gaps_data||'[]')     } catch {}

  const highConf = (sources||[]).filter(s=>s.confidence==='High').length

  const tabStyle = active => ({
    padding:'10px 18px', fontSize:12, fontWeight:600, cursor:'pointer',
    border:'none', background:'none', color: active ? C.text : C.textDim,
    borderBottom: active ? `2px solid ${C.indigo}` : '2px solid transparent',
    transition:'all .2s',
  })

  const renderMD = txt => {
    if (!txt) return null
    return txt.split('\n').map((line,i) => {
      if (line.startsWith('# '))  return <h1 key={i} style={{ fontSize:22, fontWeight:800, color:C.text, borderBottom:`1px solid ${C.border}`, paddingBottom:8, margin:'24px 0 12px' }}>{line.slice(2)}</h1>
      if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize:16, fontWeight:700, color:'#cbd5e1', margin:'20px 0 8px' }}>{line.slice(3)}</h2>
      if (line.startsWith('### '))return <h3 key={i} style={{ fontSize:13, fontWeight:700, color:C.textMuted, margin:'14px 0 6px' }}>{line.slice(4)}</h3>
      if (line.startsWith('- ')) return <li key={i} style={{ color:'#94a3b8', fontSize:13, marginLeft:20, marginBottom:4, lineHeight:1.7 }}>{line.slice(2)}</li>
      if (!line.trim()) return <div key={i} style={{ height:8 }}/>
      return <p key={i} style={{ color:'#94a3b8', fontSize:13, lineHeight:1.8, marginBottom:10 }}>{line}</p>
    })
  }

  return (
    <div style={{ ...glass, display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:`1px solid ${C.border}`, gap:12 }}>
        <div>
          <h2 style={{ fontSize:15, fontWeight:800, color:C.text }}>{report?.title||'Research Report'}</h2>
          <p style={{ fontSize:11, color:C.textDim, marginTop:3 }}>
            {(sources||[]).length} sources · {highConf} High Confidence
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {[['PDF','#f43f5e'],['Word','#60a5fa'],['MD','#94a3b8']].map(([f,c])=>(
            <button key={f} onClick={()=>dl(f.toLowerCase())} style={btn(c)}>⬇ {f}</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, background:'rgba(15,23,42,.4)' }}>
        {['report','timeline','qa'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={tabStyle(tab===t)}>
            {t==='report'?'📄 Report':t==='timeline'?'🗓 Timeline & Gaps':'💬 Interactive Q&A'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex:1, overflowY:'auto', padding:24 }}>

        {tab==='report' && <div>{renderMD(report?.content)}</div>}

        {tab==='timeline' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
            {/* Timeline */}
            <div>
              <p style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:20, display:'flex', alignItems:'center', gap:6 }}>🗓 Evolution Timeline</p>
              <div style={{ borderLeft:`2px solid rgba(99,102,241,.3)`, paddingLeft:24, display:'flex', flexDirection:'column', gap:20 }}>
                {timeline.map((t,i)=>(
                  <div key={i} style={{ position:'relative' }}>
                    <div style={{ position:'absolute', left:-31, top:2, width:12, height:12, borderRadius:'50%', background:C.indigo, border:`2px solid ${C.bg}`, boxShadow:`0 0 8px ${C.indigo}` }}/>
                    <span style={{ fontSize:10, fontWeight:700, color:C.indigo, background:'rgba(99,102,241,.1)', padding:'2px 8px', borderRadius:20, border:`1px solid rgba(99,102,241,.2)` }}>{t.year}</span>
                    <p style={{ fontSize:12, color:'#94a3b8', marginTop:6, lineHeight:1.6 }}>{t.event}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Gaps + Stats */}
            <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
              <div>
                <p style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:12, display:'flex', alignItems:'center', gap:6 }}>⚠️ Research Gaps</p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {gaps.map((g,i)=>(
                    <div key={i} style={{ padding:14, background:'rgba(251,191,36,.05)', border:`1px solid rgba(251,191,36,.15)`, borderRadius:10 }}>
                      <p style={{ fontSize:12, fontWeight:700, color:C.amber }}>{g.topic}</p>
                      <p style={{ fontSize:11, color:'#94a3b8', marginTop:6, lineHeight:1.6 }}>{g.conflict_or_question}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:12 }}>📊 Evidence Statistics</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {[['High',C.emerald,'High'],['Medium',C.amber,'Medium'],['Low',C.textMuted,'Low']].map(([label,color,val])=>(
                    <div key={label} style={{ padding:12, background:'rgba(15,23,42,.6)', border:`1px solid ${C.border}`, borderRadius:10, textAlign:'center' }}>
                      <p style={{ fontSize:22, fontWeight:800, color }}>{(sources||[]).filter(s=>s.confidence===val).length}</p>
                      <p style={{ fontSize:10, color:C.textDim, marginTop:4, fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab==='qa' && (
          <div style={{ display:'flex', flexDirection:'column', height:420, background:'rgba(2,6,23,.7)', border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
            <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
              {!msgs.length && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', textAlign:'center', color:C.textDim }}>
                  <span style={{ fontSize:32, animation:'bounce 1.5s ease-in-out infinite', display:'block', marginBottom:8 }}>✨</span>
                  <p style={{ fontSize:13, fontWeight:600, color:C.textMuted }}>Ask the Research Knowledge Base</p>
                  <p style={{ fontSize:11, marginTop:6, maxWidth:280, lineHeight:1.6 }}>Query verified claims, paper sections, or general findings from indexed sources.</p>
                </div>
              )}
              {msgs.map((m,i)=>{
                const isUser = m.sender==='user'
                return (
                  <div key={i} style={{ display:'flex', gap:10, maxWidth:'80%', marginLeft:isUser?'auto':'0', flexDirection:isUser?'row-reverse':'row', animation:'fadeIn .3s ease forwards' }}>
                    <div style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, background:isUser?'rgba(99,102,241,.2)':'rgba(30,41,59,.8)', border:`1px solid ${isUser?'rgba(99,102,241,.3)':C.border}` }}>
                      {isUser?'👤':'🤖'}
                    </div>
                    <div style={{ padding:'10px 14px', borderRadius:12, fontSize:12, lineHeight:1.7, background:isUser?C.indigo:'rgba(15,23,42,.9)', color:isUser?'#fff':'#cbd5e1', border:isUser?'none':`1px solid ${C.border}`, borderTopRightRadius:isUser?2:12, borderTopLeftRadius:isUser?12:2 }}>
                      {m.message}
                    </div>
                  </div>
                )
              })}
              {sending && (
                <div style={{ display:'flex', gap:10, maxWidth:'80%' }}>
                  <div style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, background:'rgba(30,41,59,.8)', border:`1px solid ${C.border}` }}>🤖</div>
                  <div style={{ padding:'10px 14px', borderRadius:12, fontSize:12, color:C.textDim, background:'rgba(15,23,42,.9)', border:`1px solid ${C.border}`, animation:'pulse 2s ease-in-out infinite' }}>Searching vector database…</div>
                </div>
              )}
              <div ref={endRef}/>
            </div>
            <form onSubmit={sendQ} style={{ display:'flex', gap:8, padding:12, borderTop:`1px solid ${C.border}` }}>
              <input value={q} onChange={e=>setQ(e.target.value)} disabled={sending} placeholder="Ask about findings, sources, or methodologies…"
                style={{ flex:1, background:'rgba(15,23,42,.8)', border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 14px', fontSize:12, color:C.text, outline:'none' }}/>
              <button type="submit" disabled={sending||!q.trim()} style={{ padding:'10px 16px', borderRadius:10, background:C.indigo, color:'#fff', border:'none', cursor:sending||!q.trim()?'not-allowed':'pointer', opacity:sending||!q.trim()?.5:1, fontSize:14 }}>➤</button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main App ─── */
export default function App() {
  const [projects, setProjects]         = useState([])
  const [selId, setSelId]               = useState(null)
  const [active, setActive]             = useState(null)
  const [logs, setLogs]                 = useState([])
  const [loading, setLoading]           = useState(false)
  const [topic, setTopic]               = useState('')
  const [cite, setCite]                 = useState('IEEE')
  const [files, setFiles]               = useState([])
  const [dragging, setDragging]         = useState(false)

  const fetchProjects = async () => {
    try { const r=await fetch('${API}/projects'); if(r.ok) setProjects(await r.json()) } catch {}
  }

  useEffect(() => { fetchProjects(); const t=setInterval(fetchProjects,8000); return()=>clearInterval(t) }, [])

  useEffect(() => {
    if (!selId) { setActive(null); setLogs([]); return }
    const load = async () => {
      try {
        const r = await fetch(`${API}/projects/${selId}`)
        if (r.ok) {
          const d = await r.json(); setActive(d)
          subscribeToLogs(selId)
        }
      } catch {}
    }
    load()
  }, [selId])

  const subscribeToLogs = id => {
    setLogs([])
    const es = new EventSource(`${API}/projects/${id}/logs/stream`)
    es.onmessage = e => {
      const d = JSON.parse(e.data)
      if (d.status==='done') { es.close(); fetchProjects(); setLoading(false); fetch(`${API}/projects/${id}`).then(r=>r.json()).then(setActive) }
      else if (!d.error) setLogs(p => p.some(l=>l.id===d.id)?p:[...p,d])
    }
    es.onerror = () => { es.close(); setLoading(false) }
  }

  const createProject = async e => {
    e.preventDefault(); if (!topic.trim()) return
    setLoading(true)
    try {
      const r = await fetch('${API}/projects', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ topic, citation_style:cite }) })
      const p = await r.json(); setSelId(p.id); fetchProjects()
      for (const f of files) { const fd=new FormData(); fd.append('file',f); await fetch(`${API}/projects/${p.id}/upload-pdf`,{method:'POST',body:fd}) }
      setTopic(''); setFiles([])
    } catch { setLoading(false); alert('Failed to start research.') }
  }

  const deleteProject = async id => {
    if (!confirm('Delete this project?')) return
    await fetch(`${API}/projects/${id}`,{method:'DELETE'})
    if (selId===id) setSelId(null)
    fetchProjects()
  }

  const statusColor = s => s==='completed'?C.emerald:s==='failed'?C.rose:(s==='researching'||s==='writing')?C.sky:C.textDim
  const statusBg    = s => s==='completed'?'rgba(52,211,153,.1)':s==='failed'?'rgba(244,63,94,.1)':(s==='researching'||s==='writing')?'rgba(56,189,248,.1)':'rgba(71,85,105,.1)'

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── NAVBAR ── */}
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 28px', background:'rgba(2,6,23,.85)', borderBottom:`1px solid ${C.border}`, backdropFilter:'blur(20px)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:`linear-gradient(135deg, ${C.indigo}, ${C.purple})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:`0 4px 20px rgba(99,102,241,.35)` }}>
            🧠
          </div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <h1 style={{ fontSize:18, fontWeight:800, color:C.text, letterSpacing:'-.02em' }}>ResearchMind</h1>
              <span style={{ fontSize:9, fontWeight:700, color:C.indigo, background:'rgba(99,102,241,.12)', padding:'2px 8px', borderRadius:20, border:`1px solid rgba(99,102,241,.25)`, textTransform:'uppercase', letterSpacing:'.1em' }}>v2.0</span>
            </div>
            <p style={{ fontSize:11, color:C.textDim, marginTop:2 }}>Autonomous Multi-Agent AI Scientist</p>
          </div>
        </div>
        <button onClick={fetchProjects} style={{ padding:'8px 16px', borderRadius:10, background:'rgba(30,41,59,.6)', border:`1px solid ${C.border}`, color:C.textMuted, cursor:'pointer', fontSize:12, fontWeight:600 }}>↻ Refresh</button>
      </header>

      {/* ── MAIN GRID ── */}
      <main style={{ flex:1, display:'grid', gridTemplateColumns:'280px 1fr', gap:20, padding:20, minHeight:0 }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ ...glass, padding:16, display:'flex', flexDirection:'column', height:'calc(100vh - 120px)', overflowY:'auto' }}>
          <p style={{ fontSize:11, fontWeight:700, color:C.textDim, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:12 }}>Recent Projects</p>

          {!projects.length && <p style={{ fontSize:12, color:C.textDim, textAlign:'center', padding:'24px 0' }}>No projects yet. Create one →</p>}

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {projects.map(p => {
              const isSelected = p.id===selId
              return (
                <div key={p.id} onClick={()=>setSelId(p.id)} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'10px 12px', borderRadius:12, cursor:'pointer',
                  border:`1px solid ${isSelected?'rgba(99,102,241,.35)':C.border}`,
                  background: isSelected?'rgba(99,102,241,.1)':'rgba(30,41,59,.3)',
                  transition:'all .2s',
                }}>
                  <div style={{ overflow:'hidden', flex:1 }}>
                    <p style={{ fontSize:12, fontWeight:600, color:C.text, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.topic}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
                      <span style={{ fontSize:10, fontWeight:600, color:statusColor(p.status), background:statusBg(p.status), padding:'1px 7px', borderRadius:20 }}>{p.status}</span>
                      <span style={{ fontSize:10, color:C.textDim }}>#{p.id}</span>
                    </div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();deleteProject(p.id)}} style={{ padding:5, borderRadius:6, background:'transparent', border:'none', cursor:'pointer', color:C.textDim, fontSize:14, marginLeft:6 }} title="Delete">🗑</button>
                </div>
              )
            })}
          </div>
        </aside>

        {/* ── CONTENT ── */}
        <section style={{ display:'flex', flexDirection:'column', gap:20, minHeight:0, height:'calc(100vh - 120px)' }}>

          {!selId ? (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, flex:1 }}>

              {/* Create Form */}
              <div style={{ ...glass, padding:32, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                <div style={{ marginBottom:24 }}>
                  <h2 style={{ fontSize:22, fontWeight:800, color:C.text }}>Create Research Brief</h2>
                  <p style={{ fontSize:13, color:C.textDim, marginTop:6 }}>Configure your topic and trigger the autonomous agent network.</p>
                </div>

                <form onSubmit={createProject} style={{ display:'flex', flexDirection:'column', gap:18 }}>
                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:C.textMuted, display:'block', marginBottom:6 }}>Research Topic / Question</label>
                    <input value={topic} onChange={e=>setTopic(e.target.value)} required placeholder="e.g. Agentic AI in Healthcare, Quantum Computing…"
                      style={{ width:'100%', background:'rgba(2,6,23,.6)', border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px', fontSize:13, color:C.text, outline:'none', transition:'border .2s' }}
                      onFocus={e=>e.target.style.borderColor=C.indigo} onBlur={e=>e.target.style.borderColor=C.border}/>
                  </div>

                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:C.textMuted, display:'block', marginBottom:6 }}>Citation Style</label>
                    <select value={cite} onChange={e=>setCite(e.target.value)}
                      style={{ width:'100%', background:'rgba(2,6,23,.6)', border:`1px solid ${C.border}`, borderRadius:10, padding:'12px 14px', fontSize:13, color:C.text, outline:'none' }}>
                      <option value="IEEE">IEEE Reference Style</option>
                      <option value="APA">APA Reference Style (7th ed.)</option>
                      <option value="MLA">MLA Citation Style</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize:12, fontWeight:600, color:C.textMuted, display:'block', marginBottom:6 }}>Reference PDFs (Optional)</label>
                    <div onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);setFiles(p=>[...p,...Array.from(e.dataTransfer.files).filter(f=>f.type==='application/pdf')])}}
                      style={{ border:`2px dashed ${dragging?C.indigo:C.border}`, borderRadius:10, padding:'20px', textAlign:'center', cursor:'pointer', background:dragging?'rgba(99,102,241,.05)':'transparent', transition:'all .2s' }}>
                      <input type="file" multiple accept=".pdf" onChange={e=>setFiles(p=>[...p,...Array.from(e.target.files||[])])} style={{ display:'none' }} id="pdf-upload"/>
                      <label htmlFor="pdf-upload" style={{ cursor:'pointer' }}>
                        <p style={{ fontSize:20, marginBottom:6 }}>📂</p>
                        <p style={{ fontSize:12, color:C.textMuted }}>Drag & drop PDFs or <span style={{ color:C.indigo, textDecoration:'underline' }}>browse</span></p>
                        <p style={{ fontSize:10, color:C.textDim, marginTop:4 }}>Research papers will be indexed into the vector database</p>
                      </label>
                    </div>
                    {files.length>0 && (
                      <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
                        {files.map((f,i)=>(
                          <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', background:'rgba(30,41,59,.4)', borderRadius:8, fontSize:11 }}>
                            <span style={{ color:C.textMuted }}>📄 {f.name} ({(f.size/1024/1024).toFixed(2)} MB)</span>
                            <button type="button" onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:C.textDim, fontSize:14 }}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={loading||!topic.trim()} style={{
                    width:'100%', padding:'13px', borderRadius:12, fontSize:14, fontWeight:700, cursor:loading||!topic.trim()?'not-allowed':'pointer',
                    background: loading||!topic.trim() ? 'rgba(30,41,59,.6)' : `linear-gradient(135deg, ${C.indigo}, ${C.purple})`,
                    color: loading||!topic.trim() ? C.textDim : '#fff', border:'none',
                    boxShadow: loading||!topic.trim() ? 'none' : `0 4px 20px rgba(99,102,241,.35)`,
                    transition:'all .3s',
                  }}>
                    {loading ? '⏳ Initializing Multi-Agent Workflow…' : '🚀 Launch Autonomous Research'}
                  </button>
                </form>
              </div>

              {/* Info Panel */}
              <div style={{ ...glass, padding:28, display:'flex', flexDirection:'column', gap:24 }}>
                <div>
                  <h3 style={{ fontSize:14, fontWeight:700, color:C.text, marginBottom:10 }}>🤖 Agent Network</h3>
                  <p style={{ fontSize:12, color:C.textDim, lineHeight:1.7 }}>ResearchMind orchestrates 6 specialist AI agents to autonomously research, verify, cite, and write a professional report.</p>
                </div>
                {[
                  ['📋','Planner Agent','Creates research outline & search queries'],
                  ['🌐','Web Research','Crawls and scores authoritative sources'],
                  ['📄','PDF Reader','Parses papers and builds vector index'],
                  ['✅','Fact Checker','Cross-verifies claims with confidence scores'],
                  ['📎','Citation Verifier','Formats IEEE/APA/MLA references'],
                  ['✍️','Report Writer','Compiles PDF and Word report'],
                ].map(([icon,name,desc])=>(
                  <div key={name} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:'rgba(99,102,241,.1)', border:`1px solid rgba(99,102,241,.2)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{icon}</div>
                    <div>
                      <p style={{ fontSize:12, fontWeight:600, color:C.textMuted }}>{name}</p>
                      <p style={{ fontSize:11, color:C.textDim, lineHeight:1.5, marginTop:2 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:16, minHeight:0 }}>
              {/* Back + ID */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <button onClick={()=>setSelId(null)} style={{ fontSize:12, color:C.textMuted, background:'rgba(30,41,59,.5)', border:`1px solid ${C.border}`, borderRadius:8, padding:'6px 14px', cursor:'pointer' }}>← New Research</button>
                <span style={{ fontSize:11, color:C.textDim }}>Workspace <span style={{ color:C.indigo, fontWeight:700, fontFamily:'monospace' }}>RM-{selId}</span></span>
              </div>

              {/* Pipeline log or Report */}
              <div style={{ flex:1, minHeight:0 }}>
                {active?.project?.status !== 'completed'
                  ? <div style={{ ...glass, padding:24, height:'100%' }}><AgentLog logs={logs} status={active?.project?.status}/></div>
                  : <ReportViewer projectId={selId} report={active?.report} sources={active?.sources} initialMessages={active?.messages}/>
                }
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
