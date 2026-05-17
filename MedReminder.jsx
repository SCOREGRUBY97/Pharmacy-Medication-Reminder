import { useState, useEffect, useRef } from "react";

// ── Colour tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: "#F0F6F4",
  card: "#FFFFFF",
  primary: "#87ceff",
  primaryLight: "#2A9D7C",
  accent: "#E8F5F0",
  accentStrong: "#C8EAE0",
  danger: "#E05C5C",
  warn: "#F4A261",
  success: "#2A9D7C",
  text: "#1A2E28",
  sub: "#6B8F84",
  border: "#D4E9E1",
  white: "#FFFFFF",
  pill: "#EAF7F2",
  missed: "#FEE9E9",
  taken: "#E8F5F0",
};

// ── Tiny icon set (SVG inline) ─────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = C.primary }) => {
  const icons = {
    pill: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 20.5L3.5 13.5a5 5 0 0 1 7.07-7.07l7 7a5 5 0 0 1-7.07 7.07z"/>
        <line x1="8.5" y1="11.5" x2="15.5" y2="4.5"/>
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    x: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    plus: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    edit: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    trash: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
        <path d="M9 6V4h6v2"/>
      </svg>
    ),
    home: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    grid: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    history: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.97"/>
      </svg>
    ),
    meds: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
      </svg>
    ),
    bell: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    user: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    menu: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
    chevronRight: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    ),
    eye: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    eyeOff: (
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ),
    google: (
      <svg viewBox="0 0 24 24" fill={color}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  };
  return <span style={{ display: "inline-flex", width: size, height: size, flexShrink: 0 }}>{icons[name] || null}</span>;
};

// ── Sample data ────────────────────────────────────────────────────────────────
const INITIAL_MEDS = [
  { id: 1, name: "Metformin", amount: "500mg", tablets: 2, time: "08:00", frequency: "daily", doctor: "Dr. Smith", startDate: "2025-05-01", color: "#2A9D7C", emoji: "💊" },
  { id: 2, name: "Lisinopril", amount: "10mg", tablets: 1, time: "12:00", frequency: "daily", doctor: "Dr. Patel", startDate: "2025-04-15", color: "#1A6B55", emoji: "🔵" },
  { id: 3, name: "Atorvastatin", amount: "20mg", tablets: 1, time: "20:00", frequency: "daily", doctor: "Dr. Johnson", startDate: "2025-03-20", color: "#F4A261", emoji: "🟠" },
  { id: 4, name: "Aspirin", amount: "100mg", tablets: 1, time: "08:00", frequency: "daily", doctor: "Dr. Smith", startDate: "2025-05-10", color: "#E05C5C", emoji: "❤️" },
];

const HISTORY_DATA = [
  { id: 1, medId: 1, name: "Metformin 500mg", time: "08:00", date: "Today", status: "taken" },
  { id: 2, medId: 2, name: "Lisinopril 10mg", time: "12:00", date: "Today", status: "pending" },
  { id: 3, medId: 3, name: "Atorvastatin 20mg", time: "20:00", date: "Today", status: "pending" },
  { id: 4, medId: 1, name: "Metformin 500mg", time: "08:00", date: "Yesterday", status: "taken" },
  { id: 5, medId: 4, name: "Aspirin 100mg", time: "08:00", date: "Yesterday", status: "missed" },
  { id: 6, medId: 2, name: "Lisinopril 10mg", time: "12:00", date: "Yesterday", status: "taken" },
  { id: 7, medId: 3, name: "Atorvastatin 20mg", time: "20:00", date: "Yesterday", status: "taken" },
  { id: 8, medId: 1, name: "Metformin 500mg", time: "08:00", date: "May 15", status: "taken" },
  { id: 9, medId: 4, name: "Aspirin 100mg", time: "08:00", date: "May 15", status: "taken" },
];

// ── Shared UI Primitives ───────────────────────────────────────────────────────
const Header = ({ user, onMenu, showMenu, menuOpen, currentPage }) => (
  <header style={{
    background: C.primary,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 12px rgba(26,107,85,0.25)",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {showMenu && (
        <button onClick={onMenu} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <Icon name="menu" color={C.white} size={22} />
        </button>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, background: C.primaryLight,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>💊</div>
        <span style={{ color: C.white, fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, letterSpacing: 0.3 }}>
          MedRemind
        </span>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ background: C.primaryLight, borderRadius: 20, padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}>
        <Icon name="user" color={C.white} size={15} />
        <span style={{ color: C.white, fontSize: 13, fontWeight: 600 }}>Hello, {user?.firstName || "User"}</span>
      </div>
    </div>
  </header>
);

const NavBar = ({ current, onChange }) => {
  const tabs = [
    { id: "home", label: "Home", icon: "home" },
    { id: "dashboard", label: "Dashboard", icon: "grid" },
    { id: "medications", label: "Meds", icon: "meds" },
    { id: "history", label: "History", icon: "history" },
  ];
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 420,
      background: C.white, borderTop: `1px solid ${C.border}`,
      display: "flex", zIndex: 200,
      boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, border: "none", background: "none", cursor: "pointer",
          padding: "10px 4px 8px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          color: current === t.id ? C.primary : C.sub,
          transition: "all .2s",
        }}>
          <Icon name={t.icon} color={current === t.id ? C.primary : C.sub} size={22} />
          <span style={{ fontSize: 10, fontWeight: current === t.id ? 700 : 500, fontFamily: "Nunito, sans-serif" }}>
            {t.label}
          </span>
          {current === t.id && (
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: C.primary, marginTop: 1 }} />
          )}
        </button>
      ))}
    </nav>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.white,
    borderRadius: 16,
    padding: "16px",
    boxShadow: "0 2px 12px rgba(26,107,85,0.08)",
    border: `1px solid ${C.border}`,
    ...style,
  }}>{children}</div>
);

const Input = ({ label, type = "text", value, onChange, placeholder, required, icon, endIcon }) => {
  const [show, setShow] = useState(false);
  const isPass = type === "password";
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, display: "block", marginBottom: 5, letterSpacing: 0.5, textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: C.danger }}> *</span>}
      </label>}
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
          <Icon name={icon} size={16} color={C.sub} />
        </span>}
        <input
          type={isPass && show ? "text" : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: `12px ${isPass ? 44 : 14}px 12px ${icon ? 40 : 14}px`,
            border: `1.5px solid ${C.border}`,
            borderRadius: 12, fontSize: 14, outline: "none",
            background: C.bg, color: C.text, fontFamily: "Nunito, sans-serif",
            transition: "border-color .2s",
          }}
          onFocus={e => (e.target.style.borderColor = C.primary)}
          onBlur={e => (e.target.style.borderColor = C.border)}
        />
        {isPass && (
          <button onClick={() => setShow(!show)} style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", padding: 2,
          }}>
            <Icon name={show ? "eyeOff" : "eye"} size={16} color={C.sub} />
          </button>
        )}
      </div>
    </div>
  );
};

const Btn = ({ children, onClick, variant = "primary", icon, fullWidth, size = "md", disabled }) => {
  const styles = {
    primary: { bg: C.primary, color: C.white, border: "none" },
    secondary: { bg: C.accent, color: C.primary, border: `1.5px solid ${C.primaryLight}` },
    danger: { bg: C.danger, color: C.white, border: "none" },
    ghost: { bg: "transparent", color: C.primary, border: `1.5px solid ${C.border}` },
  };
  const s = styles[variant];
  const pad = size === "sm" ? "8px 16px" : "13px 22px";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: s.bg, color: s.color, border: s.border,
      padding: pad, borderRadius: 12, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: size === "sm" ? 13 : 14,
      display: "inline-flex", alignItems: "center", gap: 7, width: fullWidth ? "100%" : "auto",
      justifyContent: "center", transition: "all .2s", opacity: disabled ? 0.6 : 1,
      boxShadow: variant === "primary" ? "0 4px 14px rgba(26,107,85,0.25)" : "none",
    }}>
      {icon && <Icon name={icon} size={17} color={s.color} />}
      {children}
    </button>
  );
};

// ── Notification Toast ─────────────────────────────────────────────────────────
const NotificationToast = ({ notification, onDismiss }) => {
  if (!notification) return null;
  return (
    <div style={{
      position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
      width: "90%", maxWidth: 380, zIndex: 999,
      background: C.primary, borderRadius: 16,
      boxShadow: "0 8px 30px rgba(26,107,85,0.35)",
      padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 14,
      animation: "slideDown .3s ease",
    }}>
      <div style={{ fontSize: 28 }}>🔔</div>
      <div style={{ flex: 1 }}>
        <div style={{ color: C.white, fontWeight: 700, fontSize: 14, fontFamily: "Nunito, sans-serif" }}>
          Time to take your medication!
        </div>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 2 }}>
          {notification.name} — {notification.tablets} tablet{notification.tablets > 1 ? "s" : ""} at {notification.time}
        </div>
      </div>
      <button onClick={onDismiss} style={{ background: "rgba(255,255,255,0.2)", border: "none", cursor: "pointer", padding: 6, borderRadius: 8 }}>
        <Icon name="x" color={C.white} size={16} />
      </button>
    </div>
  );
};

// ── LOGIN PAGE ─────────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin, onGoRegister }) => {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!account || !password) { setError("Please fill in all fields."); return; }
    onLogin({ firstName: account.split("@")[0] || account, email: account });
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.primary} 0%, ${C.primaryLight} 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>💊</div>
          <h1 style={{ color: C.white, fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, margin: 0 }}>MedRemind</h1>
          <p style={{ color: "rgba(255,255,255,0.75)", margin: "6px 0 0", fontFamily: "Nunito, sans-serif", fontSize: 14 }}>Your personal medication companion</p>
        </div>

        <Card style={{ padding: 28 }}>
          <h2 style={{ margin: "0 0 22px", color: C.text, fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Welcome back</h2>
          {error && <div style={{ background: C.missed, color: C.danger, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, fontFamily: "Nunito, sans-serif" }}>{error}</div>}
          <Input label="Account / Email" value={account} onChange={setAccount} placeholder="your@email.com" icon="user" required />
          <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="Enter password" required />
          <div style={{ marginTop: 20 }}>
            <Btn onClick={handleLogin} fullWidth>Login →</Btn>
          </div>
          <div style={{ textAlign: "center", margin: "18px 0 12px", color: C.sub, fontSize: 13, fontFamily: "Nunito, sans-serif" }}>or continue with</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ flex: 1, padding: "10px", border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: 13, color: C.text }}>
              <Icon name="google" size={18} color="#4285F4" /> Google
            </button>
            <button style={{ flex: 1, padding: "10px", border: `1.5px solid ${C.border}`, borderRadius: 12, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "Nunito, sans-serif", fontWeight: 700, fontSize: 13, color: C.text }}>
              ✉️ Email
            </button>
          </div>
          <div style={{ textAlign: "center", marginTop: 22 }}>
            <button onClick={onGoRegister} style={{ background: "none", border: "none", cursor: "pointer", color: C.primary, fontWeight: 700, fontFamily: "Nunito, sans-serif", fontSize: 14 }}>
              Don't have an account? Register
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ── REGISTER PAGE ──────────────────────────────────────────────────────────────
const RegisterPage = ({ onRegister, onGoLogin }) => {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", account: "", password: "", phone: "" });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${C.primary} 0%, ${C.primaryLight} 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>💊</div>
          <h1 style={{ color: C.white, fontFamily: "'Playfair Display', serif", fontSize: 26, margin: 0 }}>Create Account</h1>
        </div>
        <Card style={{ padding: 28 }}>
          <h2 style={{ margin: "0 0 20px", color: C.text, fontFamily: "'Playfair Display', serif", fontSize: 20 }}>Register</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="First Name" value={form.firstName} onChange={set("firstName")} placeholder="John" required />
            <Input label="Last Name" value={form.lastName} onChange={set("lastName")} placeholder="Doe" required />
          </div>
          <Input label="Email Address" type="email" value={form.email} onChange={set("email")} placeholder="john@email.com" icon="user" required />
          <Input label="Account (for login)" value={form.account} onChange={set("account")} placeholder="johndoe123" required />
          <Input label="Password" type="password" value={form.password} onChange={set("password")} placeholder="Create a strong password" required />
          <Input label="Phone Number" value={form.phone} onChange={set("phone")} placeholder="+1 234 567 8900" required />
          <div style={{ marginTop: 8 }}>
            <Btn onClick={() => onRegister(form)} fullWidth>Finish →</Btn>
          </div>
          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button onClick={onGoLogin} style={{ background: "none", border: "none", cursor: "pointer", color: C.primary, fontWeight: 700, fontFamily: "Nunito, sans-serif", fontSize: 14 }}>
              Already have an account? Login
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ── MEDICINE CARD (used in home) ───────────────────────────────────────────────
const MedScheduleItem = ({ med, onAction }) => {
  const now = new Date();
  const [h, m] = med.time.split(":").map(Number);
  const medTime = new Date(); medTime.setHours(h, m, 0, 0);
  const isPast = medTime < now;
  const statusColor = med.status === "taken" ? C.success : med.status === "missed" ? C.danger : isPast ? C.warn : C.primary;

  return (
    <div style={{
      background: C.white, borderRadius: 14, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 14,
      border: `1.5px solid ${C.border}`,
      boxShadow: "0 2px 10px rgba(26,107,85,0.07)",
      marginBottom: 10,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: `${med.color}22`, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <span style={{ fontSize: 22 }}>{med.emoji}</span>
        <span style={{ fontSize: 9, color: med.color, fontWeight: 700 }}>{med.tablets}x</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text, fontFamily: "Nunito, sans-serif" }}>{med.name}</div>
        <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{med.amount} · {med.tablets} tablet{med.tablets > 1 ? "s" : ""}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          <Icon name="clock" size={12} color={C.sub} />
          <span style={{ fontSize: 12, color: C.sub, fontFamily: "Nunito, sans-serif" }}>{med.time}</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        {med.status !== "taken" && med.status !== "missed" ? (
          <>
            <button onClick={() => onAction(med.id, "taken")} style={{
              background: C.success, border: "none", borderRadius: 10, padding: "6px 12px",
              color: C.white, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "Nunito, sans-serif",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <Icon name="check" color={C.white} size={13} /> Taken
            </button>
            <button onClick={() => onAction(med.id, "missed")} style={{
              background: C.missed, border: "none", borderRadius: 10, padding: "6px 12px",
              color: C.danger, cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "Nunito, sans-serif",
            }}>
              Missed
            </button>
          </>
        ) : (
          <div style={{
            background: med.status === "taken" ? C.taken : C.missed,
            color: med.status === "taken" ? C.success : C.danger,
            borderRadius: 10, padding: "6px 12px", fontWeight: 700, fontSize: 12, fontFamily: "Nunito, sans-serif",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Icon name={med.status === "taken" ? "check" : "x"} color={med.status === "taken" ? C.success : C.danger} size={13} />
            {med.status === "taken" ? "Taken" : "Missed"}
          </div>
        )}
      </div>
    </div>
  );
};

// ── HOME PAGE ──────────────────────────────────────────────────────────────────
const HomePage = ({ meds, user, onAction }) => {
  const today = new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
  const nextMed = meds.find(m => m.status !== "taken" && m.status !== "missed");

  return (
    <div style={{ padding: "20px 16px 90px" }}>
      {/* Date banner */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: C.sub, fontFamily: "Nunito, sans-serif", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Today</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: "'Playfair Display', serif" }}>{today}</div>
      </div>

      {/* Next dose hero */}
      {nextMed && (
        <div style={{
          background: `linear-gradient(135deg, ${C.primary}, ${C.primaryLight})`,
          borderRadius: 20, padding: "20px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 16,
          boxShadow: "0 6px 24px rgba(26,107,85,0.3)",
        }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "Nunito, sans-serif" }}>Next Dose</div>
            <div style={{ color: C.white, fontSize: 28, fontWeight: 800, fontFamily: "Nunito, sans-serif" }}>{nextMed.time}</div>
            <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: 600, fontFamily: "Nunito, sans-serif" }}>{nextMed.name}</div>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Nunito, sans-serif" }}>{nextMed.tablets} tablet{nextMed.tablets > 1 ? "s" : ""} · {nextMed.amount}</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 52 }}>{nextMed.emoji}</div>
        </div>
      )}

      {/* Today's schedule */}
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: C.text, margin: "0 0 14px" }}>Today's Schedule</h3>
      {meds.map(m => <MedScheduleItem key={m.id} med={m} onAction={onAction} />)}

      {meds.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: C.sub }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 15, fontWeight: 600 }}>No medications scheduled for today!</div>
        </div>
      )}
    </div>
  );
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
const Dashboard = ({ meds, historyData }) => {
  const taken = historyData.filter(h => h.date === "Today" && h.status === "taken").length;
  const total = historyData.filter(h => h.date === "Today").length;
  const missed = historyData.filter(h => h.date === "Today" && h.status === "missed").length;
  const nextMed = meds.find(m => m.status !== "taken" && m.status !== "missed");
  const pct = total ? Math.round((taken / total) * 100) : 0;

  return (
    <div style={{ padding: "20px 16px 90px" }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: C.text, margin: "0 0 18px" }}>Dashboard</h2>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {/* Daily compliance */}
        <Card style={{ padding: "18px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, fontFamily: "Nunito, sans-serif" }}>Daily Compliance</div>
          <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 10px" }}>
            <svg viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)", width: 80, height: 80 }}>
              <circle cx="40" cy="40" r="32" fill="none" stroke={C.accentStrong} strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none" stroke={C.primary} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 32 * pct / 100} ${2 * Math.PI * 32 * (1 - pct / 100)}`}
                strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.primary, fontFamily: "Nunito, sans-serif" }}>{taken}/{total}</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: C.sub, fontFamily: "Nunito, sans-serif" }}>{pct}% complete</div>
        </Card>

        {/* Next dose */}
        <Card style={{ padding: "18px 16px" }}>
          <div style={{ fontSize: 11, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, fontFamily: "Nunito, sans-serif" }}>Next Dose</div>
          {nextMed ? (
            <>
              <div style={{ fontSize: 28, textAlign: "center", margin: "6px 0" }}>{nextMed.emoji}</div>
              <div style={{ background: C.accent, borderRadius: 10, padding: "6px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.primary, fontFamily: "Nunito, sans-serif" }}>{nextMed.time}</div>
                <div style={{ fontSize: 11, color: C.text, fontFamily: "Nunito, sans-serif", fontWeight: 600 }}>{nextMed.name}</div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", color: C.success, fontWeight: 700, fontFamily: "Nunito, sans-serif", fontSize: 13, paddingTop: 16 }}>All done! ✓</div>
          )}
        </Card>
      </div>

      {/* Stat summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Taken", value: taken, color: C.success, bg: C.taken },
          { label: "Missed", value: missed, color: C.danger, bg: C.missed },
          { label: "Pending", value: total - taken - missed, color: C.warn, bg: "#FFF4EA" },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "14px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, fontFamily: "Nunito, sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: s.color, fontWeight: 700, fontFamily: "Nunito, sans-serif", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Medication list */}
      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: C.text, margin: "0 0 12px" }}>My Medications</h3>
      {meds.map(med => (
        <Card key={med.id} style={{ marginBottom: 10, padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 28 }}>{med.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, fontFamily: "Nunito, sans-serif" }}>{med.name}</div>
              <div style={{ fontSize: 12, color: C.sub, fontFamily: "Nunito, sans-serif" }}>
                {med.amount} · {med.tablets} tablet{med.tablets > 1 ? "s" : ""} · {med.time}
              </div>
              <div style={{ fontSize: 11, color: C.sub, fontFamily: "Nunito, sans-serif", marginTop: 2 }}>
                {med.doctor} · Started {med.startDate}
              </div>
            </div>
            <div style={{ background: C.accent, borderRadius: 10, padding: "6px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.primary, fontWeight: 700, fontFamily: "Nunito, sans-serif" }}>{med.frequency}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ── MEDICATIONS PAGE ───────────────────────────────────────────────────────────
const MedicationsPage = ({ meds, onAdd, onEdit, onDelete }) => {
  const [swipedId, setSwipedId] = useState(null);

  return (
    <div style={{ padding: "20px 16px 90px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: C.text, margin: 0 }}>My Medications</h2>
        <button onClick={onAdd} style={{
          width: 42, height: 42, borderRadius: "50%", background: C.primary, border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 14px rgba(26,107,85,0.35)",
        }}>
          <Icon name="plus" color={C.white} size={20} />
        </button>
      </div>

      {meds.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: C.sub }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>💊</div>
          <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No medications yet</div>
          <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 13 }}>Tap + to add your first medication</div>
        </div>
      )}

      {meds.map(med => (
        <div key={med.id} style={{ position: "relative", marginBottom: 10, overflow: "hidden", borderRadius: 14 }}>
          {/* Swipe actions revealed */}
          <div style={{
            position: "absolute", right: 0, top: 0, height: "100%",
            display: "flex", alignItems: "center",
            opacity: swipedId === med.id ? 1 : 0,
            transition: "opacity .2s",
            pointerEvents: swipedId === med.id ? "all" : "none",
          }}>
            <button onClick={() => { onEdit(med); setSwipedId(null); }} style={{
              background: C.primaryLight, border: "none", cursor: "pointer",
              height: "100%", padding: "0 18px", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4, color: C.white,
              fontSize: 10, fontWeight: 700, fontFamily: "Nunito, sans-serif",
            }}>
              <Icon name="edit" color={C.white} size={18} /> Edit
            </button>
            <button onClick={() => { onDelete(med.id); setSwipedId(null); }} style={{
              background: C.danger, border: "none", cursor: "pointer",
              height: "100%", padding: "0 18px", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4, color: C.white,
              fontSize: 10, fontWeight: 700, fontFamily: "Nunito, sans-serif",
            }}>
              <Icon name="trash" color={C.white} size={18} /> Delete
            </button>
          </div>

          <div
            onClick={() => setSwipedId(swipedId === med.id ? null : med.id)}
            style={{
              background: C.white, borderRadius: 14, padding: "16px",
              border: `1.5px solid ${C.border}`,
              display: "flex", gap: 14, alignItems: "center", cursor: "pointer",
              transition: "transform .2s",
              transform: swipedId === med.id ? "translateX(-130px)" : "translateX(0)",
            }}>
            <div style={{
              width: 54, height: 54, borderRadius: 14, background: `${med.color}22`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0,
            }}>
              {med.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.text, fontFamily: "Nunito, sans-serif" }}>{med.name}</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 2, fontFamily: "Nunito, sans-serif" }}>{med.amount} · {med.tablets} tablet{med.tablets > 1 ? "s" : ""}</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 3, fontFamily: "Nunito, sans-serif" }}>
                {med.doctor} · {med.time} · {med.frequency}
              </div>
            </div>
            <div style={{ color: C.sub, fontSize: 11, fontFamily: "Nunito, sans-serif", textAlign: "right" }}>
              <div style={{ background: C.accent, borderRadius: 8, padding: "4px 8px", color: C.primary, fontWeight: 700 }}>
                {med.time}
              </div>
              <div style={{ marginTop: 4 }}>Swipe</div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ textAlign: "center", marginTop: 10, padding: "12px", background: C.accent, borderRadius: 12 }}>
        <div style={{ fontSize: 12, color: C.sub, fontFamily: "Nunito, sans-serif" }}>
          💡 Tap a card to reveal Edit & Delete options
        </div>
      </div>
    </div>
  );
};

// ── ADD / EDIT MODAL ───────────────────────────────────────────────────────────
const AddEditModal = ({ med, onSave, onClose }) => {
  const emojis = ["💊", "🔵", "🟠", "❤️", "🟡", "🟣", "⚪", "🌿"];
  const colors = ["#2A9D7C", "#1A6B55", "#F4A261", "#E05C5C", "#F4D03F", "#9B59B6", "#95A5A6", "#27AE60"];
  const [form, setForm] = useState(med || { name: "", amount: "", tablets: 1, time: "08:00", frequency: "daily", doctor: "", startDate: "", emoji: "💊", color: "#2A9D7C" });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: C.white, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 420,
        padding: "24px 20px 40px", maxHeight: "90vh", overflowY: "auto",
        animation: "slideUp .3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 22, color: C.text }}>
            {med ? "Edit Medication" : "Add Medication"}
          </h2>
          <button onClick={onClose} style={{ background: C.bg, border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="x" size={17} color={C.sub} />
          </button>
        </div>

        {/* Emoji picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, display: "block", marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>Icon</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {emojis.map((e, i) => (
              <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e, color: colors[i] }))} style={{
                width: 42, height: 42, borderRadius: 12, fontSize: 20, border: `2px solid ${form.emoji === e ? colors[i] : C.border}`,
                background: form.emoji === e ? `${colors[i]}22` : C.bg, cursor: "pointer",
              }}>{e}</button>
            ))}
          </div>
        </div>

        <Input label="Name of Medicine" value={form.name} onChange={set("name")} placeholder="e.g. Metformin" required />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Input label="Amount / Dosage" value={form.amount} onChange={set("amount")} placeholder="e.g. 500mg" required />
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, display: "block", marginBottom: 5, letterSpacing: 0.5, textTransform: "uppercase" }}>Tablets <span style={{ color: C.danger }}>*</span></label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => set("tablets")(Math.max(1, form.tablets - 1))} style={{ width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, cursor: "pointer", fontSize: 18, color: C.primary, fontWeight: 700 }}>−</button>
              <span style={{ minWidth: 24, textAlign: "center", fontWeight: 800, fontSize: 16, color: C.text, fontFamily: "Nunito, sans-serif" }}>{form.tablets}</span>
              <button onClick={() => set("tablets")(form.tablets + 1)} style={{ width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.bg, cursor: "pointer", fontSize: 18, color: C.primary, fontWeight: 700 }}>+</button>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, display: "block", marginBottom: 5, letterSpacing: 0.5, textTransform: "uppercase" }}>Time</label>
          <input type="time" value={form.time} onChange={e => set("time")(e.target.value)} style={{
            width: "100%", boxSizing: "border-box", padding: "12px 14px",
            border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 14,
            background: C.bg, color: C.text, fontFamily: "Nunito, sans-serif", outline: "none",
          }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, display: "block", marginBottom: 8, letterSpacing: 0.5, textTransform: "uppercase" }}>Frequency</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ label: "Daily", value: "daily" }, { label: "2× Day", value: "twice_daily" }, { label: "Every Day", value: "every_day" }].map(opt => (
              <button key={opt.value} onClick={() => set("frequency")(opt.value)} style={{
                flex: 1, padding: "10px 4px", borderRadius: 10, border: `1.5px solid ${form.frequency === opt.value ? C.primary : C.border}`,
                background: form.frequency === opt.value ? C.accent : C.white, cursor: "pointer",
                color: form.frequency === opt.value ? C.primary : C.sub, fontWeight: 700, fontSize: 12,
                fontFamily: "Nunito, sans-serif",
              }}>{opt.label}</button>
            ))}
          </div>
        </div>

        <Input label="Doctor Name" value={form.doctor} onChange={set("doctor")} placeholder="Dr. Smith" />
        <Input label="Start Date" type="date" value={form.startDate} onChange={set("startDate")} />

        <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
          <Btn onClick={onClose} variant="ghost" fullWidth>Cancel</Btn>
          <Btn onClick={() => onSave(form)} fullWidth icon="check">Save</Btn>
        </div>
      </div>
    </div>
  );
};

// ── HISTORY PAGE ───────────────────────────────────────────────────────────────
const HistoryPage = ({ historyData }) => {
  const today = historyData.filter(h => h.date === "Today");
  const past = historyData.filter(h => h.date !== "Today");

  const StatusBadge = ({ status }) => {
    const cfg = {
      taken: { bg: C.taken, color: C.success, label: "Taken", icon: "check" },
      missed: { bg: C.missed, color: C.danger, label: "Missed", icon: "x" },
      pending: { bg: "#FFF4EA", color: C.warn, label: "Pending", icon: "clock" },
    };
    const s = cfg[status] || cfg.pending;
    return (
      <div style={{ background: s.bg, color: s.color, borderRadius: 10, padding: "5px 10px", fontWeight: 700, fontSize: 11, fontFamily: "Nunito, sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
        <Icon name={s.icon} color={s.color} size={12} /> {s.label}
      </div>
    );
  };

  const HistoryItem = ({ item }) => (
    <div style={{
      background: C.white, borderRadius: 12, padding: "12px 14px",
      display: "flex", alignItems: "center", gap: 12,
      border: `1.5px solid ${C.border}`, marginBottom: 8,
    }}>
      <div style={{ fontSize: 22 }}>💊</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: C.text, fontFamily: "Nunito, sans-serif" }}>{item.name}</div>
        <div style={{ fontSize: 11, color: C.sub, display: "flex", alignItems: "center", gap: 4, marginTop: 2, fontFamily: "Nunito, sans-serif" }}>
          <Icon name="clock" size={11} color={C.sub} /> {item.time}
        </div>
      </div>
      <StatusBadge status={item.status} />
    </div>
  );

  return (
    <div style={{ padding: "20px 16px 90px" }}>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: C.text, margin: "0 0 20px" }}>History</h2>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 4, height: 20, borderRadius: 2, background: C.primary }} />
          <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 17, color: C.text }}>
            Today · {new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long" })}
          </h3>
        </div>
        {today.map(item => <HistoryItem key={item.id} item={item} />)}
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 4, height: 20, borderRadius: 2, background: C.sub }} />
          <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 17, color: C.text }}>Past Records</h3>
        </div>

        {/* Group by date */}
        {["Yesterday", "May 15"].map(date => {
          const items = past.filter(h => h.date === date);
          if (!items.length) return null;
          return (
            <div key={date} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, fontFamily: "Nunito, sans-serif" }}>{date}</div>
              {items.map(item => <HistoryItem key={item.id} item={item} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── MAIN APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [authPage, setAuthPage] = useState("login"); // "login" | "register" | null
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [meds, setMeds] = useState(INITIAL_MEDS);
  const [history, setHistory] = useState(HISTORY_DATA);
  const [editMed, setEditMed] = useState(null);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [notification, setNotification] = useState(null);

  // Simulate a notification arriving
  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      setNotification(meds[1]);
    }, 3000);
    return () => clearTimeout(t);
  }, [user]);

  const handleLogin = (u) => { setUser(u); setAuthPage(null); };
  const handleRegister = (f) => { setUser({ firstName: f.firstName, email: f.email }); setAuthPage(null); };

  const handleAction = (id, status) => {
    setMeds(ms => ms.map(m => m.id === id ? { ...m, status } : m));
    setHistory(h => h.map(i => i.medId === id && i.date === "Today" ? { ...i, status } : i));
  };

  const handleSaveMed = (form) => {
    if (editMed) {
      setMeds(ms => ms.map(m => m.id === editMed.id ? { ...m, ...form } : m));
    } else {
      const newMed = { ...form, id: Date.now(), status: undefined };
      setMeds(ms => [...ms, newMed]);
      setHistory(h => [...h, { id: Date.now(), medId: newMed.id, name: `${form.name} ${form.amount}`, time: form.time, date: "Today", status: "pending" }]);
    }
    setShowAddEdit(false);
    setEditMed(null);
  };

  const handleDeleteMed = (id) => {
    setMeds(ms => ms.filter(m => m.id !== id));
    setHistory(h => h.filter(i => i.medId !== id));
  };

  const medsWithStatus = meds.map(m => {
    const histEntry = history.find(h => h.medId === m.id && h.date === "Today");
    return { ...m, status: histEntry?.status };
  });

  // ── Auth screens ──
  if (authPage === "login") return <LoginPage onLogin={handleLogin} onGoRegister={() => setAuthPage("register")} />;
  if (authPage === "register") return <RegisterPage onRegister={handleRegister} onGoLogin={() => setAuthPage("login")} />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Nunito:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #F0F6F4; }
        @keyframes slideDown { from { transform: translateX(-50%) translateY(-20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        ::-webkit-scrollbar { width: 0; }
      `}</style>

      <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: C.bg, position: "relative" }}>
        <Header user={user} />

        <NotificationToast notification={notification} onDismiss={() => setNotification(null)} />

        <main style={{ minHeight: "calc(100vh - 60px)" }}>
          {page === "home" && <HomePage meds={medsWithStatus} user={user} onAction={handleAction} />}
          {page === "dashboard" && <Dashboard meds={medsWithStatus} historyData={history} />}
          {page === "medications" && (
            <MedicationsPage
              meds={meds}
              onAdd={() => { setEditMed(null); setShowAddEdit(true); }}
              onEdit={(m) => { setEditMed(m); setShowAddEdit(true); }}
              onDelete={handleDeleteMed}
            />
          )}
          {page === "history" && <HistoryPage historyData={history} />}
        </main>

        <NavBar current={page} onChange={setPage} />

        {showAddEdit && (
          <AddEditModal
            med={editMed}
            onSave={handleSaveMed}
            onClose={() => { setShowAddEdit(false); setEditMed(null); }}
          />
        )}
      </div>
    </>
  );
}
