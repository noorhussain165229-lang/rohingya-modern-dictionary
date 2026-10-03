import React, { useEffect, useMemo, useRef, useState } from 'react'

const DEFAULTS = {
  site_title: 'Rohingya Modern Dictionary',
  site_subtitle: 'English → Burmese → Rohingya → Rohingya Hanifi',
  hero_title: 'Find a word',
  hero_text: 'Tap an entry to see Burmese, Rohingya, Hanifi, examples and pronunciation.',
  search_placeholder: 'Search English, Burmese, Rohingya or Hanifi…',
  developer_name: 'NM Noor Hussain',
  developer_title: 'Dictionary Developer',
  developer_bio: 'I am developing this dictionary to help preserve, learn, search, and share Rohingya vocabulary, Rohingya Hanifi, Burmese, and practical daily language learning.',
  about_title: 'About the Dictionary',
  about_text: 'A community-focused dictionary project for learning, preserving, and developing Rohingya vocabulary and Rohingya Hanifi, with Burmese support and daily speaking practice.',
  menu_quiz: 'Quiz',
  menu_lessons: 'Daily Speaking Practice',
  menu_dark: 'Dark mode',
  menu_voice: 'English voice',
  menu_about: 'About the Developer',
  label_burmese: 'Burmese',
  label_rohingya: 'Rohingya',
  label_hanifi: 'Rohingya Hanifi',
  label_definition: 'Definition',
  label_example: 'English Example',
  label_rohingya_example: 'Rohingya Example',
  accent_color: '#2563eb',
  accent2_color: '#0f766e'
}

const API_ENV = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const getApiBase = () => (localStorage.getItem('rmd_api_url') || API_ENV).replace(/\/$/, '')
const apiUrl = p => `${getApiBase()}${p}`
const escText = v => String(v ?? '')

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = localStorage.getItem('rmd_token') || ''
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!(options.body instanceof FormData) && options.body !== undefined) headers.set('Content-Type', 'application/json')
  const r = await fetch(apiUrl(path), { ...options, headers })
  if (!r.ok) throw new Error(await r.text() || `Request failed: ${r.status}`)
  const ct = r.headers.get('content-type') || ''
  return ct.includes('application/json') ? r.json() : r.text()
}

function fileUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path
  return `${getApiBase()}${path}`
}

function Modal({ children, onClose, wide = false }) {
  return <div className="modal" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className={`panel ${wide ? 'wide' : ''}`}>
      <button className="close" onClick={onClose} aria-label="Close">×</button>
      {children}
    </div>
  </div>
}

function App() {
  const [entries, setEntries] = useState([])
  const [settings, setSettings] = useState(DEFAULTS)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [dark, setDark] = useState(localStorage.getItem('rmd_dark') === '1')
  const [voice, setVoice] = useState(localStorage.getItem('rmd_voice') || 'US')
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [admin, setAdmin] = useState(false)
  const [token, setToken] = useState(localStorage.getItem('rmd_token') || '')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginMsg, setLoginMsg] = useState('')
  const [apiNotice, setApiNotice] = useState('')

  useEffect(() => { loadPublic(); syncOfflineVoices(); window.addEventListener('online', syncOfflineVoices); return () => window.removeEventListener('online', syncOfflineVoices) }, [])
  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    localStorage.setItem('rmd_dark', dark ? '1' : '0')
  }, [dark])
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', settings.accent_color || '#2563eb')
    document.documentElement.style.setProperty('--accent2', settings.accent2_color || '#0f766e')
    document.title = settings.site_title || DEFAULTS.site_title
  }, [settings])

  async function loadPublic() {
    try {
      const [e, s] = await Promise.all([request('/api/entries'), request('/api/settings')])
      setEntries(e)
      setSettings({ ...DEFAULTS, ...s })
      localStorage.setItem('rmd_cached_entries', JSON.stringify(e))
      localStorage.setItem('rmd_cached_settings', JSON.stringify(s))
      setApiNotice('')
    } catch (err) {
      try {
        setEntries(JSON.parse(localStorage.getItem('rmd_cached_entries') || '[]'))
        setSettings({ ...DEFAULTS, ...JSON.parse(localStorage.getItem('rmd_cached_settings') || '{}') })
        setApiNotice('Offline mode: showing the last saved dictionary data.')
      } catch {
        setApiNotice('Could not connect to the dictionary server.')
      }
    }
  }

  const categories = useMemo(() => [...new Set(entries.map(x => x.category).filter(Boolean))].sort(), [entries])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter(x => {
      const hay = [x.english, x.rohingya, x.burmese, x.hanifi, x.definition, x.example_en, x.example_ro, x.notes].join(' ').toLowerCase()
      return (!category || x.category === category) && (!q || hay.includes(q))
    })
  }, [entries, query, category])

  function speak(text) {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = voice === 'UK' ? 'en-GB' : 'en-US'
    window.speechSynthesis.speak(u)
  }

  function toggleVoice() {
    const next = voice === 'US' ? 'UK' : 'US'
    setVoice(next)
    localStorage.setItem('rmd_voice', next)
  }

  async function login() {
    try {
      const x = await request('/api/login', { method: 'POST', body: JSON.stringify({ username: 'admin', password: loginPassword }) })
      localStorage.setItem('rmd_token', x.token)
      setToken(x.token); setLoginMsg(''); setAdmin(true); setLoginPassword('')
    } catch { setLoginMsg('Invalid password') }
  }

  function logout() { localStorage.removeItem('rmd_token'); setToken(''); setAdmin(false) }

  function openAdmin() { setModal('admin'); setAdmin(!!token) }

  return <div className="appShell">
    <header className="topbar">
      <div className="brandBlock">
        <h1>{settings.site_title}</h1>
        <p>{settings.site_subtitle}</p>
      </div>
      <div className="topActions">
        <button className="ghost" onClick={openAdmin}>Admin</button>
      </div>
    </header>

    <main>
      <section className="hero">
        <div><h2>{settings.hero_title}</h2><p>{settings.hero_text}</p></div>
        <div className="stats"><b>{entries.length}</b><span>entries</span></div>
      </section>
      {apiNotice && <div className="notice">{apiNotice}</div>}
      <section className="searchBar">
        <input value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" placeholder={settings.search_placeholder} />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </section>
      <div className="resultGrid">
        {filtered.map(x => <EntryCard key={x.id} entry={x} open={expanded === x.id} onOpen={() => setExpanded(expanded === x.id ? null : x.id)} settings={settings} onSpeak={speak} />)}
        {!filtered.length && <div className="empty card"><h3>No results</h3><p>Try another English, Burmese, Rohingya, or Hanifi search.</p></div>}
      </div>
    </main>

    <button className="hamb" onClick={() => setMenuOpen(v => !v)} aria-label="Open menu">☰<small>Menu</small></button>
    {menuOpen && <div className="menuPanel">
      <button onClick={() => { setModal('quiz'); setMenuOpen(false) }}>🧠 {settings.menu_quiz}</button>
      <button onClick={() => { setModal('lessons'); setMenuOpen(false) }}>🗣️ {settings.menu_lessons}</button>
      <button onClick={() => setDark(v => !v)}>🌙 {settings.menu_dark}: {dark ? 'ON' : 'OFF'}</button>
      <button onClick={toggleVoice}>🔊 {settings.menu_voice}: {voice}</button>
      <button onClick={() => { setModal('about'); setMenuOpen(false) }}>👤 {settings.menu_about}</button>
      <button onClick={() => { setModal('connection'); setMenuOpen(false) }}>🌐 Server connection</button>
    </div>}

    {modal === 'about' && <AboutModal settings={settings} onClose={() => setModal(null)} />}
    {modal === 'lessons' && <LessonsModal onClose={() => setModal(null)} />}
    {modal === 'quiz' && <QuizModal onClose={() => setModal(null)} />}
    {modal === 'connection' && <ConnectionModal onClose={() => setModal(null)} onSaved={() => loadPublic()} />}
    {modal === 'admin' && <Modal wide onClose={() => setModal(null)}>
      {!admin ? <Login password={loginPassword} setPassword={setLoginPassword} message={loginMsg} onLogin={login} /> : <AdminPanel entries={entries} settings={settings} setSettings={setSettings} onReload={loadPublic} onLogout={logout} />}
    </Modal>}
  </div>
}

function EntryCard({ entry, open, onOpen, settings, onSpeak }) {
  return <article className={`card entryCard ${open ? 'open' : ''}`} onClick={onOpen}>
    <div className="wordLine"><div><b>{entry.english || '—'}</b><span>{entry.burmese || entry.rohingya || '—'}</span></div><span className="chevron">{open ? '⌃' : '⌄'}</span></div>
    {open && <div className="details" onClick={e => e.stopPropagation()}>
      <p><strong>{settings.label_burmese}:</strong> {entry.burmese || '—'}</p>
      <p><strong>{settings.label_rohingya}:</strong> {entry.rohingya || '—'}</p>
      <p><strong>{settings.label_hanifi}:</strong> {entry.hanifi || '—'}</p>
      {entry.definition && <p><strong>{settings.label_definition}:</strong> {entry.definition}</p>}
      {entry.example_en && <p><strong>{settings.label_example}:</strong> {entry.example_en}</p>}
      {entry.example_ro && <p><strong>{settings.label_rohingya_example}:</strong> {entry.example_ro}</p>}
      {entry.audio_file && <audio controls preload="none" src={fileUrl(`/api/audio/${encodeURIComponent(entry.audio_file)}`)} />}
      <button className="ghost" onClick={() => onSpeak(entry.english)}>🔊 English</button>
    </div>}
  </article>
}

function Login({ password, setPassword, message, onLogin }) {
  return <div className="loginView"><h2>Admin Panel</h2><p className="hint">Sign in to edit words, voice recordings, lessons, quiz, developer profile and all site settings.</p><input autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && onLogin()} placeholder="Admin password" /><button className="primary full" onClick={onLogin}>Sign in</button>{message && <p className="error">{message}</p>}</div>
}

function AdminPanel({ entries, settings, setSettings, onReload, onLogout }) {
  const [tab, setTab] = useState('dictionary')
  const [siteForm, setSiteForm] = useState(settings)
  const [message, setMessage] = useState('')
  const [quiz, setQuiz] = useState([])
  const [lessons, setLessons] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => { setSiteForm(settings) }, [settings])
  useEffect(() => { if (tab === 'quiz') loadQuiz(); if (tab === 'lessons') loadLessons() }, [tab])

  async function loadQuiz() { try { setQuiz(await request('/api/quiz/admin')) } catch (e) { setMessage(e.message) } }
  async function loadLessons() { try { setLessons(await request('/api/lessons')) } catch (e) { setMessage(e.message) } }

  async function addEntry() {
    await request('/api/entries', { method: 'POST', body: JSON.stringify({ english: 'New word', category: 'General' }) }); await onReload()
  }
  async function importJson(file) {
    if (!file) return
    const data = JSON.parse(await file.text())
    const result = await request('/api/import', { method: 'POST', body: JSON.stringify(data) })
    setMessage(`Imported ${result.imported} entries.`); await onReload()
  }
  async function exportJson() {
    const data = await request('/api/export')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    downloadBlob(blob, 'dictionary-export.json')
  }
  async function saveSettings() {
    setBusy(true); setMessage('')
    try {
      await request('/api/settings', { method: 'PUT', body: JSON.stringify(siteForm) })
      setSettings({ ...DEFAULTS, ...siteForm }); setMessage('All website settings saved.'); await onReload()
    } catch (e) { setMessage(e.message) } finally { setBusy(false) }
  }
  async function uploadPhoto(file) {
    if (!file) return
    const fd = new FormData(); fd.append('photo', file)
    await request('/api/developer/photo', { method: 'POST', body: fd }); await onReload(); setMessage('Developer photo updated.')
  }
  async function saveEntry(id, patch) { await request(`/api/entries/${id}`, { method: 'PUT', body: JSON.stringify(patch) }); await onReload() }
  async function deleteEntry(id) { if (!confirm('Delete this word?')) return; await request(`/api/entries/${id}`, { method: 'DELETE' }); await onReload() }
  async function uploadAudio(id, file) { if (!file) return; const fd = new FormData(); fd.append('audio', file); await request(`/api/entries/${id}/audio`, { method: 'POST', body: fd }); await onReload(); setMessage('Audio uploaded.') }
  async function saveQuiz(id, patch) { await request(`/api/quiz/${id}`, { method: 'PUT', body: JSON.stringify(patch) }); await loadQuiz() }
  async function addQuiz() { await request('/api/quiz', { method: 'POST', body: JSON.stringify({ question: 'New question', answer: '', options: ['', '', '', ''], explanation: '' }) }); await loadQuiz() }
  async function deleteQuiz(id) { if (!confirm('Delete this quiz question?')) return; await request(`/api/quiz/${id}`, { method: 'DELETE' }); await loadQuiz() }
  async function saveLesson(id, patch) { await request(`/api/lessons/${id}`, { method: 'PUT', body: JSON.stringify(patch) }); await loadLessons() }
  async function addLesson() { await request('/api/lessons', { method: 'POST', body: JSON.stringify({ folder: 'Daily Practice', title: 'New lesson', content: '' }) }); await loadLessons() }
  async function deleteLesson(id) { if (!confirm('Delete this lesson?')) return; await request(`/api/lessons/${id}`, { method: 'DELETE' }); await loadLessons() }

  return <div className="adminPanel"><div className="adminHead"><div><h2>Dictionary Manager</h2><p className="hint">{entries.length} entries • all major content is editable</p></div><button className="ghost" onClick={onLogout}>Log out</button></div>
    <div className="tabs">{['dictionary','site','quiz','lessons','security'].map(x => <button key={x} className={tab === x ? 'active' : ''} onClick={() => setTab(x)}>{x[0].toUpperCase()+x.slice(1)}</button>)}</div>
    {message && <div className="notice">{message}</div>}
    {tab === 'dictionary' && <section className="tab"><div className="toolbar"><button className="primary" onClick={addEntry}>+ Add word</button><label className="fileBtn">Import JSON<input type="file" accept="application/json,.json" hidden onChange={e => importJson(e.target.files[0])}/></label><button className="ghost" onClick={exportJson}>Export JSON</button></div><p className="hint">Edit English, Burmese, Rohingya, Hanifi, examples and category. Each word can have a microphone recording or uploaded audio.</p>{entries.map(x => <EntryEditor key={x.id} entry={x} onSave={saveEntry} onDelete={deleteEntry} onAudio={uploadAudio} />)}</section>}
    {tab === 'site' && <SiteEditor form={siteForm} setForm={setSiteForm} onPhoto={uploadPhoto} onSave={saveSettings} busy={busy} />}
    {tab === 'quiz' && <QuizEditor items={quiz} onAdd={addQuiz} onSave={saveQuiz} onDelete={deleteQuiz} />}
    {tab === 'lessons' && <LessonsEditor items={lessons} onAdd={addLesson} onSave={saveLesson} onDelete={deleteLesson} />}
    {tab === 'security' && <SecurityEditor onMessage={setMessage} />}
  </div>
}

function EntryEditor({ entry, onSave, onDelete, onAudio }) {
  const [form, setForm] = useState(entry)
  const [recording, setRecording] = useState(false)
  const [recMsg, setRecMsg] = useState('')
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }
  async function startRecording() {
    setRecMsg('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setRecMsg('Microphone recording is not supported in this browser.'); return }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => e.data.size && chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        try { await onAudio(entry.id, new File([blob], `hanifi-${entry.id}.webm`, { type: blob.type })); setRecMsg('Recorded voice uploaded.') }
        catch { await saveOfflineVoice(entry.id, blob); setRecMsg('Offline: recording saved on this device and will be available for upload when connected.') }
      }
      recorderRef.current = recorder; recorder.start(); setRecording(true)
    } catch { setRecMsg('Microphone permission was not granted.') }
  }
  function stopRecording() { recorderRef.current?.stop(); setRecording(false) }

  return <div className="editRow">
    <div className="editGrid">
      <input value={form.english||''} onChange={e=>set('english',e.target.value)} placeholder="English" />
      <input value={form.burmese||''} onChange={e=>set('burmese',e.target.value)} placeholder="Burmese" />
      <input value={form.rohingya||''} onChange={e=>set('rohingya',e.target.value)} placeholder="Rohingya" />
      <input value={form.hanifi||''} onChange={e=>set('hanifi',e.target.value)} placeholder="Rohingya Hanifi" />
      <input value={form.category||''} onChange={e=>set('category',e.target.value)} placeholder="Category" />
      <input value={form.definition||''} onChange={e=>set('definition',e.target.value)} placeholder="Definition" />
      <input value={form.example_en||''} onChange={e=>set('example_en',e.target.value)} placeholder="English example" />
      <input value={form.example_ro||''} onChange={e=>set('example_ro',e.target.value)} placeholder="Rohingya example" />
      <input value={form.notes||''} onChange={e=>set('notes',e.target.value)} placeholder="Notes / verification" />
    </div>
    <div className="rowBtns"><button className="primary" onClick={()=>onSave(entry.id,form)}>Save</button><button className="ghost" onClick={()=>onDelete(entry.id)}>Delete</button><label className="fileBtn">Upload audio<input type="file" accept="audio/*" hidden onChange={e=>onAudio(entry.id,e.target.files[0])}/></label>{recording ? <button className="danger" onClick={stopRecording}>⏹ Stop recording</button> : <button className="ghost" onClick={startRecording}>🎙️ Record Hanifi voice</button>}</div>
    {entry.audio_file && <audio className="adminAudio" controls preload="none" src={fileUrl(`/api/audio/${encodeURIComponent(entry.audio_file)}`)} />}
    {recMsg && <p className="hint">{recMsg}</p>}
  </div>
}

function SiteEditor({ form, setForm, onPhoto, onSave, busy }) {
  const fields = [
    ['site_title','Site title'],['site_subtitle','Subtitle'],['hero_title','Hero title'],['hero_text','Hero text'],['search_placeholder','Search placeholder'],
    ['developer_name','Developer name'],['developer_title','Developer title'],['developer_bio','Developer bio'],['about_title','About title'],['about_text','About text'],
    ['menu_quiz','Quiz menu label'],['menu_lessons','Speaking menu label'],['menu_dark','Dark mode label'],['menu_voice','Voice menu label'],['menu_about','About menu label'],
    ['label_burmese','Burmese field label'],['label_rohingya','Rohingya field label'],['label_hanifi','Hanifi field label'],['label_definition','Definition field label'],['label_example','English example label'],['label_rohingya_example','Rohingya example label'],
    ['accent_color','Accent color'],['accent2_color','Secondary accent color']
  ]
  return <section className="tab"><h3>Website, developer and UI settings</h3><div className="formGrid">{fields.map(([k,label]) => <label key={k}>{label}{k.includes('text')||k.includes('bio') ? <textarea rows="3" value={form[k]??''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/> : <input type={k.includes('color')?'color':'text'} value={form[k]??''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>}</label>)}</div><label>Developer photo<input type="file" accept="image/*" onChange={e=>onPhoto(e.target.files[0])}/></label>{form.developer_photo && <img className="photo" src={fileUrl(form.developer_photo)} alt="Developer"/>}<button className="primary" disabled={busy} onClick={onSave}>{busy?'Saving…':'Save all website settings'}</button></section>
}

function QuizEditor({ items, onAdd, onSave, onDelete }) {
  return <section className="tab"><button className="primary" onClick={onAdd}>+ Add quiz question</button>{items.map(x=><QuizRow key={x.id} item={x} onSave={onSave} onDelete={onDelete}/>)}</section>
}
function QuizRow({ item, onSave, onDelete }) {
  const [f,setF]=useState({...item,options:[...(item.options||[]), '', '', '', ''].slice(0,4)})
  return <div className="quizRow"><input value={f.question||''} onChange={e=>setF({...f,question:e.target.value})} placeholder="Question"/><input value={f.answer||''} onChange={e=>setF({...f,answer:e.target.value})} placeholder="Correct answer"/><div className="quizOpt">{[0,1,2,3].map(i=><input key={i} value={f.options[i]||''} onChange={e=>{const o=[...f.options];o[i]=e.target.value;setF({...f,options:o})}} placeholder={`Option ${i+1}`}/>)}</div><input value={f.explanation||''} onChange={e=>setF({...f,explanation:e.target.value})} placeholder="Explanation"/><div className="rowBtns"><button className="primary" onClick={()=>onSave(item.id,f)}>Save</button><button className="ghost" onClick={()=>onDelete(item.id)}>Delete</button></div></div>
}

function LessonsEditor({ items, onAdd, onSave, onDelete }) {
  return <section className="tab"><button className="primary" onClick={onAdd}>+ Add speaking lesson</button><p className="hint">Folders can be Greetings, Daily Conversation, Family, Market, Travel, School, Work or any custom folder.</p>{items.map(x=><LessonRow key={x.id} item={x} onSave={onSave} onDelete={onDelete}/>)}</section>
}
function LessonRow({ item, onSave, onDelete }) {
  const [f,setF]=useState(item)
  return <div className="lessonRow"><input value={f.folder||''} onChange={e=>setF({...f,folder:e.target.value})} placeholder="Folder"/><input value={f.title||''} onChange={e=>setF({...f,title:e.target.value})} placeholder="Lesson title"/><textarea rows="5" value={f.content||''} onChange={e=>setF({...f,content:e.target.value})} placeholder="Lesson content"/><input type="number" value={f.sort_order||0} onChange={e=>setF({...f,sort_order:Number(e.target.value)})} placeholder="Order"/><div className="rowBtns"><button className="primary" onClick={()=>onSave(item.id,f)}>Save</button><button className="ghost" onClick={()=>onDelete(item.id)}>Delete</button></div></div>
}

function SecurityEditor({ onMessage }) {
  const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[confirm,setConfirm]=useState('')
  const [server,setServer]=useState(getApiBase())
  async function change() {
    if(next.length<8) return onMessage('New password must be at least 8 characters.')
    if(next!==confirm) return onMessage('New passwords do not match.')
    try { await request('/api/change-password',{method:'POST',body:JSON.stringify({currentPassword:current,newPassword:next})}); setCurrent('');setNext('');setConfirm('');onMessage('Password changed successfully.') } catch(e){onMessage('Could not change password. Check the current password.')}
  }
  function saveServer(){ localStorage.setItem('rmd_api_url',server.replace(/\/$/,'')); onMessage('Server URL saved. Reload the page to reconnect.') }
  return <section className="tab"><h3>Admin security</h3><input type="password" value={current} onChange={e=>setCurrent(e.target.value)} placeholder="Current password"/><input type="password" value={next} onChange={e=>setNext(e.target.value)} placeholder="New password (8+ characters)"/><input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm new password"/><button className="primary" onClick={change}>Change Password</button><h3>Server connection</h3><p className="hint">For a separate AI Studio frontend, put your deployed Node server URL here. Leave blank when the frontend and API share the same domain.</p><input value={server} onChange={e=>setServer(e.target.value)} placeholder="https://your-server.example.com"/><button className="ghost" onClick={saveServer}>Save server URL</button><h3>Deployment</h3><p className="hint">Use HTTPS. Set ADMIN_PASSWORD and JWT_SECRET environment variables on the server before public deployment.</p></section>
}

function AboutModal({ settings, onClose }) {
  return <Modal wide onClose={onClose}><div className="developerCard">{settings.developer_photo ? <img className="photo big" src={fileUrl(settings.developer_photo)} alt={settings.developer_name}/> : <div className="initials">NMH</div>}<h2>{settings.developer_name}</h2><h3>{settings.developer_title}</h3><p>{settings.developer_bio}</p><h3>{settings.about_title}</h3><p className="prewrap">{settings.about_text}</p></div></Modal>
}

function LessonsModal({ onClose }) {
  const [items,setItems]=useState([])
  useEffect(()=>{request('/api/lessons').then(setItems).catch(()=>setItems([]))},[])
  const groups={};items.forEach(x=>(groups[x.folder]??=[]).push(x))
  return <Modal wide onClose={onClose}><h2>🗣️ Daily Speaking Practice</h2>{Object.entries(groups).map(([folder,arr])=><div className="lessonFolder" key={folder}><h3>{folder}</h3>{arr.map(x=><div className="lessonItem" key={x.id}><b>{x.title}</b><div className="lessonContent">{x.content}</div></div>)}</div>)}</Modal>
}

function QuizModal({ onClose }) {
  const [items,setItems]=useState([]),[i,setI]=useState(0),[score,setScore]=useState(0),[done,setDone]=useState(false),[feedback,setFeedback]=useState('')
  useEffect(()=>{request('/api/quiz').then(x=>setItems(x.sort(()=>Math.random()-.5))).catch(()=>setItems([]))},[])
  if (!items.length) return <Modal onClose={onClose}><h2>🧠 Dictionary Quiz</h2><p>No quiz questions are available yet.</p></Modal>
  if (done) return <Modal onClose={onClose}><h2>🧠 Quiz complete</h2><p>Your score: <b>{score}/{items.length}</b></p><button className="primary" onClick={()=>{setI(0);setScore(0);setDone(false);setFeedback('')}}>Try again</button></Modal>
  const q=items[i]
  function answer(o){const correct=o===q.answer;if(correct)setScore(s=>s+1);setFeedback(correct?'Correct!':`Answer: ${q.answer}${q.explanation?` — ${q.explanation}`:''}`)}
  function next(){setFeedback(''); if(i+1>=items.length)setDone(true); else setI(i+1)}
  return <Modal wide onClose={onClose}><h2>🧠 Dictionary Quiz</h2><p>Question {i+1} of {items.length}</p><h3>{q.question}</h3>{q.options.map((o,n)=><button key={n} className="optionBtn" disabled={!!feedback} onClick={()=>answer(o)}>{o}</button>)}{feedback && <div className="notice"><p>{feedback}</p><button className="primary" onClick={next}>{i+1===items.length?'Finish':'Next'}</button></div>}</Modal>
}

function ConnectionModal({ onClose, onSaved }) {
  const [url,setUrl]=useState(getApiBase())
  return <Modal onClose={onClose}><h2>🌐 Server connection</h2><p className="hint">Use this when the React/Vite app is hosted separately from the Node/SQLite API.</p><input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://your-server.example.com"/><button className="primary" onClick={()=>{localStorage.setItem('rmd_api_url',url.replace(/\/$/,''));onSaved();onClose();window.location.reload()}}>Save & reload</button></Modal>
}


async function syncOfflineVoices() {
  if (!navigator.onLine || !localStorage.getItem('rmd_token')) return
  try {
    const db = await openVoiceDb()
    const tx = db.transaction('voices','readonly')
    const req = tx.objectStore('voices').getAll()
    req.onsuccess = async () => {
      for (const item of req.result || []) {
        try {
          const fd = new FormData(); fd.append('audio', new File([item.blob], `offline-${item.entryId}.webm`, {type:item.blob.type||'audio/webm'}))
          await request(`/api/entries/${item.entryId}/audio`, {method:'POST', body:fd})
          const del = db.transaction('voices','readwrite'); del.objectStore('voices').delete(item.id); await txComplete(del)
        } catch {}
      }
    }
  } catch {}
}

function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}

async function saveOfflineVoice(id,blob){
  try { const db=await openVoiceDb(); const tx=db.transaction('voices','readwrite'); tx.objectStore('voices').put({id:`${id}-${Date.now()}`,entryId:id,blob,created:Date.now()}); await txComplete(tx) } catch {}
}
function openVoiceDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open('rmd-offline-voices',1);r.onupgradeneeded=()=>r.result.createObjectStore('voices',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function txComplete(tx){return new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}

export default App
