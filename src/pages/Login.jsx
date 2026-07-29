import { useState } from "react";
import { SEED_USERS } from "../data/constants";
import { Icon } from "../lib/icons";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handle = () => {
    const user = SEED_USERS.find(u => u.email === email);
    if (user && password === "fims2025") { onLogin(user); }
    else setError("Email ou senha incorretos. Tente: admin@fims.co.mz / fims2025");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#1E2A3A", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="clipboard" size={20} style={{ color: "#fff" }} />
          </div>
          <div>
            <div className="login-logo">FIMS</div>
            <div className="login-sub">Field Inspection Management</div>
          </div>
        </div>
        {error && <div className="alert-bar alert-critical" style={{ marginBottom: 16 }}><Icon name="alert" size={14} />{error}</div>}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        <div className="form-group">
          <label className="form-label">Senha</label>
          <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handle()} />
        </div>
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "10px" }} onClick={handle}>Entrar</button>
        <div style={{ marginTop: 20, padding: "12px", background: "#F8F7F4", borderRadius: 8, fontSize: 11, color: "#888" }}>
          <strong>Usuários demo</strong><br />
          admin@fims.co.mz → Admin<br />
          ceo@fims.co.mz → CEO<br />
          supervisor@fims.co.mz → Supervisor<br />
          inspector1@fims.co.mz → Inspetor<br />
          <em>Senha para todos: fims2025</em>
        </div>
      </div>
    </div>
  );
}
