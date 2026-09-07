import { AnimatePresence, motion } from 'framer-motion'
import QRCode from 'qrcode'
import { ArrowUpRight, BarChart3, BookOpen, CalendarDays, ChevronRight, CircleUserRound, ClipboardList, Download, FileUp, LayoutDashboard, LogOut, Menu, Pencil, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import './App.css'

const configuredApiUrl = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
const configuredPublicUrl = String(import.meta.env.VITE_PUBLIC_URL || '').trim().replace(/\/+$/, '')
const getApiBaseUrl = () => {
  if (configuredApiUrl) return configuredApiUrl
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5000/api'
    return `${window.location.origin}/api`
  }
  return 'http://localhost:5000/api'
}
const getPublicAppUrl = () => {
  if (configuredPublicUrl) return configuredPublicUrl
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:5173'
}
const API_URL = getApiBaseUrl()
const PUBLIC_APP_URL = getPublicAppUrl()
const ROLES = ['President', 'Vice President', 'Treasurer', 'Chapter Head', 'Chief of Staff', 'Secretary General', 'Director General', 'Marketing & PRO', 'Design & IT', 'Finance', 'Logistics', 'Delegate Affairs', 'Hospitality', 'Crisis' ]
const delegateFields = [['name', 'Full name'], ['email', 'Email'], ['phone', 'Phone'], ['school', 'School'], ['committee', 'Committee'], ['country', 'Country']]
const volunteerFields = [['name', 'Full name'], ['email', 'Email'], ['phone', 'Phone'], ['school', 'School'], ['role', 'Role'], ['photo', 'Photo']]
const blankForm = (type) => Object.fromEntries((type === 'delegate' ? delegateFields : volunteerFields).map(([key]) => [key, '']))

async function api(path, options = {}) {
  const token = localStorage.getItem('qrmun_token')
  const headers = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  const requestPath = `/${String(path).replace(/^\/+/, '')}`
  const response = await fetch(`${API_URL}${requestPath}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Something went wrong')
  return data
}

function Crest() { return <span className="crest">Q</span> }
function Signature() { return <span className="signature-mark" aria-label="Made by Sagal">Sagal</span> }
function Button({ children, quiet = false, ...props }) { return <button className={`button ${quiet ? 'button-quiet' : 'button-primary'}`} {...props}>{children}</button> }
function PageFrame({ children }) { return <motion.div className="page-content" initial={{ opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 105, damping: 18, mass: .7 }} layout>{children}</motion.div> }
function ErrorMessage({ message }) { return message ? <p className="message error">{message}</p> : null }
function Loading() { return <div className="loading-state"><span />Loading registry...</div> }
function PhoneField({ value, onChange }) {
  const digits = String(value || '').replace(/^\+977/, '').replace(/\D/g, '').slice(0, 10)
  return <div className="phone-input"><span>+977</span><input required inputMode="numeric" pattern="[0-9]{10}" minLength={10} maxLength={10} value={digits} onChange={(event) => onChange(`+977${event.target.value.replace(/\D/g, '').slice(0, 10)}`)} placeholder="98XXXXXXXX" /></div>
}
function MemberPhoto({ row, large = false }) { const className = large ? 'person-photo detail-photo' : 'person-photo'; return row.photo ? <img className={className} src={row.photo} alt={`${row.name} profile`} /> : <span className={`${large ? 'detail-photo' : 'person-avatar'} person-placeholder`}>{row.name.split(' ').map((p) => p[0]).join('')}</span> }
function compressPhoto(file) { return new Promise((resolve, reject) => { const image = new Image(); const source = URL.createObjectURL(file); image.onload = () => { const scale = Math.min(1, 800 / Math.max(image.naturalWidth, image.naturalHeight)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale)); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(source); resolve(canvas.toDataURL('image/jpeg', .82)) }; image.onerror = () => { URL.revokeObjectURL(source); reject(new Error('Unable to read that image.')) }; image.src = source }) }

function Sidebar({ open, onClose, onLogout }) {
  const navItems = [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }, { label: 'Delegates', to: '/delegates', icon: Users }, { label: 'OC', to: '/volunteers', icon: ClipboardList }, { label: 'Import data', to: '/import', icon: FileUp }]
  return <><button className={`mobile-scrim ${open ? 'show' : ''}`} aria-label="Close menu" onClick={onClose} /><aside className={`sidebar ${open ? 'sidebar-open' : ''}`}><div className="sidebar-brand"><Crest /><div><strong>QRMUN</strong><small>2026 · Made in Nepal</small></div><button className="mobile-close" onClick={onClose} aria-label="Close menu"><X size={18} /></button></div><p className="nav-label">Workspace</p><nav className="main-nav">{navItems.map(({ label, to, icon: Icon }) => <NavLink end={to === '/'} key={to} to={to} onClick={onClose} className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}><Icon size={17} strokeWidth={1.7} /><span>{label}</span></NavLink>)}</nav><div className="sidebar-bottom"><button className="nav-item" onClick={onLogout}><LogOut size={17} strokeWidth={1.7} /><span>Log out</span></button><div className="user-chip"><span className="avatar">AR</span><span><strong>Admin account</strong><small>Operations</small></span></div></div></aside></>
}

function Header({ onMenu }) { const location = useLocation(); const title = location.pathname === '/' ? 'Dashboard' : location.pathname.includes('volunteers') ? 'OC' : location.pathname.includes('import') ? 'Import data' : 'Delegates'; return <header className="content-header"><button className="menu-trigger" onClick={onMenu} aria-label="Open menu"><Menu size={21} /></button><div className="breadcrumbs"><span>QRMUN 2026</span><ChevronRight size={14} /><strong>{title}</strong></div><div className="header-actions"><span className="status-online">● Database live</span><div className="header-profile"><span className="avatar">AR</span><span>Admin</span></div></div></header> }
function SectionHeading({ eyebrow, title, description, action }) { return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="heading-description">{description}</p>}</div>{action}</div> }
function EmptyState({ text }) { return <div className="empty-state"><Users size={25} /><p>{text}</p></div> }

function Dashboard() {
  const [stats, setStats] = useState(null); const [error, setError] = useState('')
  useEffect(() => { api('/dashboard/stats').then(setStats).catch((e) => setError(e.message)) }, [])
  return <PageFrame><SectionHeading eyebrow="Conference operations" title="Good morning." description="Here is the pulse of your conference." action={<Button quiet><CalendarDays size={16} />Conference day 01<ChevronRight size={15} /></Button>} /><ErrorMessage message={error} />{!stats && !error ? <Loading /> : <><div className="stat-grid"><Stat label="Total delegates" value={stats?.totalDelegates ?? '—'} note="Registered participants" icon={Users} accent /><Stat label="OC & volunteers" value={stats?.totalVolunteers ?? '—'} note="Conference team" icon={CircleUserRound} /><Stat label="Schools" value={stats?.schools ?? '—'} note="Represented institutions" icon={BookOpen} /><Stat label="Committees" value={stats?.committees ?? '—'} note="Active rooms" icon={BarChart3} /></div><div className="dashboard-grid"><section className="surface activity-surface"><SurfaceHeading eyebrow="Latest activity" title="Recent registrations" /><div className="activity-list">{stats?.activity?.length ? stats.activity.map((item) => <div className="activity-item" key={`${item.type}-${item.id}`}><span className="activity-mark">{item.type === 'delegate' ? 'D' : 'V'}</span><div><strong>{item.label}</strong><small>{item.id} · {new Date(item.createdAt).toLocaleDateString()}</small></div></div>) : <EmptyState text="No registration data yet." />}</div></section></div></>}</PageFrame>
}
function Stat({ label, value, note, icon: Icon, accent }) { return <div className={`stat-card ${accent ? 'accent' : ''}`}><div className="stat-top"><span>{label}</span><Icon size={18} /></div><strong>{value}</strong><small>{note}</small></div> }
function SurfaceHeading({ eyebrow, title }) { return <div className="surface-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div> }

function MemberPage({ type, notify }) {
  const isDelegate = type === 'delegate'; const endpoint = isDelegate ? '/delegates' : '/volunteers'; const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [query, setQuery] = useState({ search: '', committee: '', country: '', school: '', role: '' }); const [modal, setModal] = useState(null); const [detail, setDetail] = useState(null); const [qr, setQr] = useState(null)
  const load = (signal) => { setLoading(true); setError(''); const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value)); api(`${endpoint}?${params}`, { signal }).then(setRows).catch((e) => { if (e.name !== 'AbortError') setError(e.message) }).finally(() => { if (!signal?.aborted) setLoading(false) }) }
  useEffect(() => { const controller = new AbortController(); setRows([]); load(controller.signal); return () => controller.abort() }, [type, query.search, query.committee, query.country, query.school, query.role])
  const remove = async (row) => { if (!window.confirm(`Delete ${row.name}? This cannot be undone.`)) return; try { await api(`${endpoint}/${isDelegate ? row.delegateId : row.volunteerId}`, { method: 'DELETE' }); notify('Record deleted'); load() } catch (e) { setError(e.message) } }
  const save = async (form) => { try { const path = modal.record ? `${endpoint}/${isDelegate ? modal.record.delegateId : modal.record.volunteerId}` : endpoint; await api(path, { method: modal.record ? 'PUT' : 'POST', body: JSON.stringify(form) }); setModal(null); notify(modal.record ? 'Record updated' : 'Record added'); load() } catch (e) { setError(e.message) } }
  const options = isDelegate ? [['committee', 'All committees'], ['country', 'All countries'], ['school', 'All schools']] : [['role', 'All roles']]
    return <PageFrame><SectionHeading eyebrow={isDelegate ? 'Participant registry' : 'Conference team'} title={isDelegate ? 'Delegates' : 'OC'} description={isDelegate ? 'Every voice in the room, accounted for.' : 'The people making the room come alive.'} action={<Button onClick={() => setModal({ type, record: null })}><Plus size={17} />Add {isDelegate ? 'delegate' : 'member'}</Button>} /><ErrorMessage message={error} /><div className="table-toolbar"><div className="table-search"><Search size={17} /><input value={query.search} onChange={(e) => setQuery({ ...query, search: e.target.value })} placeholder="Search by name, school or ID" /></div>{options.map(([key, label]) => <select key={key} value={query[key]} onChange={(e) => setQuery({ ...query, [key]: e.target.value })}><option value="">{label}</option>{(key === 'role' ? ROLES : [...new Set(rows.map((row) => row[key]))]).map((value) => <option key={value} value={value}>{value}</option>)}</select>)}</div><section className="table-surface"><div className="table-meta"><span>Showing <strong>{rows.length}</strong> records</span><span className="table-note">Live database</span></div>{loading ? <Loading /> : rows.length === 0 ? <EmptyState text={Object.values(query).some(Boolean) ? `No ${isDelegate ? 'delegates' : 'OC members'} found for your search.` : isDelegate ? 'No delegates registered yet.' : 'No OC members added yet.'} /> : <div className="table-wrap"><table><thead><tr><th>{isDelegate ? 'Delegate' : 'Member'}</th>{isDelegate ? <><th>Country</th><th>Committee</th><th>School</th></> : <><th>Roles</th><th>School</th></>}<th /><th /></tr></thead><tbody>{rows.map((row) => <tr key={row._id}><td><div className="person-cell"><MemberPhoto row={row} /><div><strong>{row.name}</strong><small>{row.delegateId || row.volunteerId}</small></div></div></td>{isDelegate ? <><td>{row.country}</td><td><span className="committee-tag">{row.committee}</span></td><td>{row.school}</td></> : <><td><span className="committee-tag">{row.role}</span></td><td>{row.school}</td></>}<td /> <td><div className="row-actions"><button className="row-action" title="View details" onClick={() => setDetail(row)}><ArrowUpRight size={16} /></button><button className="row-action" title="Edit" onClick={() => setModal({ type, record: row })}><Pencil size={15} /></button>{isDelegate && <button className="row-action" title="View QR" onClick={() => setQr(row)}><span className="qr-mini">QR</span></button>}<button className="row-action danger" title="Delete" onClick={() => remove(row)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div>}</section>{modal && <MemberModal type={type} record={modal.record} onClose={() => setModal(null)} onSave={save} />}{detail && <DetailModal record={detail} type={type} onClose={() => setDetail(null)} onQr={() => setQr(detail)} />}{qr && <QrModal record={qr} onClose={() => setQr(null)} />}</PageFrame>
}
function MemberModal({ type, record, onClose, onSave }) { const isDelegate = type === 'delegate'; const fields = isDelegate ? delegateFields : volunteerFields; const [form, setForm] = useState(record ? Object.fromEntries(fields.map(([key]) => [key, record[key] || ''])) : blankForm(type)); const [error, setError] = useState(''); const submit = (e) => { e.preventDefault(); if (Object.entries(form).some(([key, value]) => key !== 'photo' && !value.trim())) return setError('Please complete every field.'); if (!/^\+977\d{10}$/.test(form.phone)) return setError('Phone number must contain exactly 10 digits after +977.'); onSave(form) }; const update = (key, value) => setForm({ ...form, [key]: value }); const updatePhoto = async (file) => { if (!file) return; try { update('photo', await compressPhoto(file)); setError('') } catch (photoError) { setError(photoError.message) } }; return <Modal onClose={onClose}><p className="eyebrow">Registry record</p><h2>{record ? 'Edit' : 'Add'} {isDelegate ? 'delegate' : 'OC'}</h2><form onSubmit={submit} className="member-form">{fields.map(([key, label]) => <label key={key}>{label}{key === 'photo' ? <input type="file" accept="image/*" onChange={(e) => updatePhoto(e.target.files[0])} /> : key === 'phone' ? <PhoneField value={form[key]} onChange={(value) => update(key, value)} /> : !isDelegate && key === 'role' ? <select required value={form[key]} onChange={(e) => update(key, e.target.value)}><option value="">Choose role</option>{ROLES.map((value) => <option key={value}>{value}</option>)}</select> : <input required value={form[key]} onChange={(e) => update(key, e.target.value)} type={key === 'email' ? 'email' : 'text'} />}</label>)}<ErrorMessage message={error} /><div className="modal-actions"><Button quiet type="button" onClick={onClose}>Cancel</Button><Button type="submit">Save member</Button></div></form></Modal> }
function Modal({ children, onClose }) { return <AnimatePresence><motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .22 }} onClick={onClose}><motion.div className="modal" initial={{ opacity: 0, y: 30, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }} transition={{ type: 'spring', stiffness: 250, damping: 22 }} onClick={(e) => e.stopPropagation()}><div className="modal-head"><div>{children}</div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div></motion.div></motion.div></AnimatePresence> }
function DetailModal({ record, type, onClose, onQr }) { const isDelegate = type === 'delegate'; return <Modal onClose={onClose}><MemberPhoto row={record} large /><p className="eyebrow">Verified record</p><h2>{record.name}</h2><p className="detail-id">{record.delegateId || record.volunteerId}</p><div className="detail-grid">{Object.entries(record).filter(([key]) => ['name', 'photo', '_id', '__v', 'createdAt', 'updatedAt'].indexOf(key) === -1).map(([key, value]) => <div key={key}><small>{key}</small><strong>{value}</strong></div>)}</div>{isDelegate && <Button onClick={onQr}>View QR</Button>}</Modal> }
function QrModal({ record, onClose }) { const [src, setSrc] = useState(''); const delegateId = String(record.delegateId || '').trim(); const url = `${PUBLIC_APP_URL}/delegate/${encodeURIComponent(delegateId)}`; useEffect(() => { QRCode.toDataURL(url, { margin: 2, width: 280, color: { dark: '#25231f', light: '#fbfaf6' } }).then(setSrc) }, [url]); return <Modal onClose={onClose}><p className="eyebrow">Delegate verification</p><h2>{record.name}</h2><p className="detail-id">Scan to verify · {delegateId}</p>{src && <img className="qr-image" src={src} alt={`QR code for ${record.name}`} />}<a className="button button-primary qr-download" href={src} download={`${delegateId}.png`}><Download size={16} />Download QR</a></Modal> }

function ImportPage({ notify }) { const [type, setType] = useState('delegates'); const [file, setFile] = useState(null); const [preview, setPreview] = useState(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const previewFile = async () => { if (!file) return; setLoading(true); try { const form = new FormData(); form.append('type', type); form.append('file', file); setPreview(await api('/import/preview', { method: 'POST', body: form })) } catch (e) { setError(e.message) } finally { setLoading(false) } }; const confirm = async () => { setLoading(true); try { await api('/import/confirm', { method: 'POST', body: JSON.stringify({ type, rows: preview.rows.filter((row) => row.valid).map((row) => row.data) }) }); notify('Import completed'); setPreview(null); setFile(null) } catch (e) { setError(e.message) } finally { setLoading(false) } }; return <PageFrame><SectionHeading eyebrow="Data operations" title="Import data" description="Bring your registry in carefully, with a preview before anything is saved." /><ErrorMessage message={error} /><section className="surface import-surface"><div className="import-controls"><label>Record type<select value={type} onChange={(e) => { setType(e.target.value); setPreview(null) }}><option value="delegates">Delegates</option><option value="volunteers">OC / Volunteers</option></select></label><label className="file-input">CSV file<input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files[0])} /></label><Button onClick={previewFile} disabled={!file || loading}>{loading ? 'Checking...' : 'Preview file'}</Button></div><p className="import-help">Required columns: {type === 'delegates' ? 'name, email, phone, school, committee, country' : 'name, email, phone, school, department, position'}</p>{preview && <div className="preview"><div className="table-meta"><span><strong>{preview.valid}</strong> valid · <strong>{preview.invalid}</strong> invalid</span><span>{preview.total} rows found</span></div><div className="preview-rows">{preview.rows.map((row) => <div className={row.valid ? 'preview-row' : 'preview-row invalid'} key={row.row}><span>Row {row.row}</span><span>{row.data.name || 'Unnamed record'}</span><span>{row.valid ? 'Ready' : row.errors.join(', ')}</span></div>)}</div>{preview.valid > 0 && <Button onClick={confirm} disabled={loading}>Confirm import of {preview.valid} rows</Button>}</div>}</section></PageFrame> }

function RegistrationPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', school: '', age: '', grade: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api('/registration', { method: 'POST', body: JSON.stringify(form) });
      navigate(`/payment/${result._id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return <main className="login-page"><div className="login-card"><div className="login-brand"><Crest /><strong>QRMUN</strong></div><p className="eyebrow">Registration</p><h1>Join the conference.</h1><p>Fill in your details to begin your registration process.</p><form onSubmit={submit}><label>Full Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} type="text" /></label><label>Email<input required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" /></label><label>Phone<PhoneField value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} /></label><label>School<input required value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} type="text" /></label><div className="form-row"><label>Age<input required value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} type="number" /></label><label>Grade<input required value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} type="text" /></label></div><ErrorMessage message={error} /><Button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Continue to Payment'}</Button></form></div><Signature /></main> }

function PaymentPage() {
  const { id } = useParams();
  const [registration, setRegistration] = useState(null);
  const [method, setMethod] = useState('esewa');
  const [proof, setProof] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api(`/registration/${id}`).then(setRegistration).catch((e) => setError(e.message));
  }, [id]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (method === 'esewa') {
        const result = await api('/payment/initiate', { method: 'POST', body: JSON.stringify({ registrationId: id, method: 'esewa', amount: 1000 }) }); // Example amount
        if (result.success) {
          await api('/payment/verify', { method: 'POST', body: JSON.stringify({ registrationId: id, transactionId: 'TXN' + Date.now(), amount: 1000, gateway: 'esewa' }) });
          navigate('/payment-success');
        }
      } else {
        if (!proof) return setError('Please upload payment proof.');
        await api('/payment/upload-proof', { method: 'POST', body: JSON.stringify({ registrationId: id, proofUrl: proof }) });
        navigate('/payment-success');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!registration) return <Loading />;

  return <main className="login-page"><div className="login-card"><div className="login-brand"><Crest /><strong>QRMUN</strong></div><p className="eyebrow">Payment</p><h1>Complete your registration.</h1><p>Delegate: <strong>{registration.name}</strong></p><div className="payment-amount">Amount Due: <strong>Rs. 1000</strong></div><form onSubmit={handlePayment} className="payment-form"><div className="payment-options"><label className="payment-option"><input type="radio" name="method" value="esewa" checked={method === 'esewa'} onChange={(e) => setMethod(e.target.value)} /><span>Pay via eSewa</span></label><label className="payment-option"><input type="radio" name="method" value="manual" checked={method === 'manual'} onChange={(e) => setMethod(e.target.value)} /><span>Bank Transfer / Other</span></label></div>{method === 'manual' && <label>Upload Proof<input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files[0]; if (file) { const base64 = await compressPhoto(file); setProof(base64); } }} /></label>}<ErrorMessage message={error} /><Button type="submit" disabled={loading}>{loading ? 'Processing...' : 'Confirm Payment'}</Button></form></div><Signature /></main> }

function PaymentSuccess() {
  const [status, setStatus] = useState('checking');
  const [delegateId, setDelegateId] = useState(null);
  useEffect(() => {
    setDelegateId('DEL-0001'); 
    setStatus('verified');
  }, []);

  return <main className="login-page"><div className="login-card"><div className="login-brand"><Crest /><strong>QRMUN</strong></div><p className="eyebrow">Confirmation</p><h1>{status === 'verified' ? 'Payment Successful!' : 'Payment Submitted'}</h1><p>{status === 'verified' ? 'Welcome to the conference. Your registration is now official.' : 'Your payment is being reviewed by the administration.'}</p>{delegateId && <div className="delegate-id-box">Delegate ID: <strong>{delegateId}</strong></div>}<Button onClick={() => window.location.href = '/'} >Back to Home</Button></div><Signature /></main> }

function Login({ onLogin }) { const [email, setEmail] = useState('ParivartanSoc'); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const submit = async (e) => { e.preventDefault(); try { const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('qrmun_token', result.token); onLogin(result.admin) } catch (err) { setError(err.message) } }; return <main className="login-page"><div className="login-card"><div className="login-brand"><Crest /><strong>QRMUN</strong></div><p className="eyebrow">Administration</p><h1>Welcome back.</h1><p>Sign in to manage the conference registry.</p><form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label><ErrorMessage message={error} /><Button type="submit">Sign in</Button></form></div><Signature /></main> }

function PublicVerification() { const { delegateId } = useParams(); const [delegate, setDelegate] = useState(null); const [error, setError] = useState(''); useEffect(() => { api(`/public/delegate/${delegateId}`).then(setDelegate).catch((e) => setError(e.message)) }, [delegateId]); const isBackendIssue = error && /failed to fetch|network|load|fetch/i.test(error); return <main className="verification-page">{delegate ? <motion.section className="verification-card" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }}><div className="verified-badge">✓</div><p className="verified-label">Verified delegate</p><h1>✓ VERIFIED</h1><div className="verification-rule" /><h2>{delegate.name}</h2><p className="verification-id">{delegate.delegateId}</p><div className="verification-details"><div><small>School</small><strong>{delegate.school}</strong></div><div><small>Country</small><strong>{delegate.country}</strong></div><div><small>Committee</small><strong>{delegate.committee}</strong></div></div><p className="verification-footer">QRMUN 2026 · Official delegate registry</p></motion.section> : error ? <section className="verification-card not-found"><Crest /><p className="verified-label">Public registry</p><h1>{isBackendIssue ? 'Verification service unavailable.' : 'Delegate not found.'}</h1><p>{isBackendIssue ? 'The QR check could not reach the backend. Please confirm the application is running and the API URL is configured correctly.' : <>We could not verify <strong>{delegateId}</strong>. Please check the QR code or delegate ID and try again.</>}</p></section> : <Loading />}<Signature /></main> }

function AdminApp({ onLogout }) { const [menuOpen, setMenuOpen] = useState(false); const [toast, setToast] = useState(''); const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3000) }; return <div className="app-layout"><Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={onLogout} /><main className="main-area"><Header onMenu={() => setMenuOpen(true)} /><Routes><Route path="/" element={<Dashboard />} /><Route path="/delegates" element={<MemberPage type="delegate" notify={notify} />} /><Route path="/volunteers" element={<MemberPage type="volunteer" notify={notify} />} /><Route path="/import" element={<ImportPage notify={notify} />} /><Route path="*" element={<Dashboard />} /></Routes></main><Signature />{toast && <motion.div className="toast" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>{toast}</motion.div>}</div> }

function App() {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith('/delegate/')) {
      setChecking(false);
      return;
    }
    if (location.pathname === '/register') {
      setChecking(false);
      return;
    }
    if (location.pathname.startsWith('/payment/')) {
      setChecking(false);
      return;
    }
    if (location.pathname === '/payment-success') {
      setChecking(false);
      return;
    }
    if (!localStorage.getItem('qrmun_token')) {
      setChecking(false);
      return;
    }
    api('/auth/me').then(setAdmin).catch(() => localStorage.removeItem('qrmun_token')).finally(() => setChecking(false))
  }, [location.pathname]);

  if (location.pathname.startsWith('/delegate/')) return <PublicVerification />;
  if (location.pathname === '/register') return <RegistrationPage />;
  if (location.pathname.startsWith('/payment/')) return <PaymentPage />;
  if (location.pathname === '/payment-success') return <PaymentSuccess />;
  if (checking) return <Loading />;
  if (!admin) return <Login onLogin={setAdmin} />;
  return <AdminApp onLogout={() => { localStorage.removeItem('qrmun_token'); setAdmin(null) }} />
}

export default function RootApp() { return <BrowserRouter><App /></BrowserRouter> }