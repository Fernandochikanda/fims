import { useState } from "react";
import { useComms } from "../context/CommsContext";
import { ROLES } from "../data/constants";

export default function Messages({ users, currentUser }) {
  const { messages, sendMessage } = useComms();
  const [activeChat, setActiveChat] = useState(null);
  const [text, setText] = useState("");

  // Determine who the current user can talk to
  let availableUsers = [];
  if (currentUser.role === ROLES.INSPECTOR) {
    availableUsers = users.filter(u => u.role === ROLES.SUPERVISOR);
  } else if (currentUser.role === ROLES.SUPERVISOR) {
    availableUsers = users.filter(u => u.role === ROLES.INSPECTOR || u.role === ROLES.CEO);
  } else {
    availableUsers = users.filter(u => u.role === ROLES.SUPERVISOR);
  }

  const handleSend = () => {
    if (!text.trim() || !activeChat) return;
    sendMessage(currentUser.id, activeChat.id, text);
    setText("");
  };

  const chatMessages = messages.filter(m => 
    (m.fromId === currentUser.id && m.toId === activeChat?.id) || 
    (m.fromId === activeChat?.id && m.toId === currentUser.id)
  ).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div style={{ display: "flex", height: "calc(100vh - 100px)", background: "#fff", borderRadius: 12, border: "1px solid #ddd", overflow: "hidden" }}>
      {/* Sidebar List */}
      <div style={{ width: 250, borderRight: "1px solid #eee", overflowY: "auto" }}>
        <div style={{ padding: "16px", fontWeight: 600, borderBottom: "1px solid #eee" }}>Conversas</div>
        {availableUsers.map(u => (
          <div key={u.id} onClick={() => setActiveChat(u)} style={{ 
            padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f5f5f5", 
            background: activeChat?.id === u.id ? "#E6F1FB" : "transparent",
            display: "flex", alignItems: "center", gap: 10
          }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1E2A3A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>
              {u.avatar}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{u.name}</div>
              <div style={{ fontSize: 10, color: "#888" }}>{u.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {activeChat ? (
          <>
            <div style={{ padding: "16px", borderBottom: "1px solid #eee", fontWeight: 600 }}>
              {activeChat.name}
            </div>
            <div style={{ flex: 1, padding: "16px", overflowY: "auto", background: "#F8F7F4", display: "flex", flexDirection: "column", gap: "12px" }}>
              {chatMessages.map(m => (
                <div style={{ alignSelf: m.fromId === currentUser.id ? "flex-end" : "flex-start", maxWidth: "70%" }}>
                  <div style={{ 
                    background: m.fromId === currentUser.id ? "#1E2A3A" : "#fff", 
                    color: m.fromId === currentUser.id ? "#fff" : "#333",
                    padding: "10px 14px", borderRadius: 12, 
                    borderBottomRightRadius: m.fromId === currentUser.id ? 0 : 12,
                    borderBottomLeftRadius: m.fromId === currentUser.id ? 12 : 0,
                    border: m.fromId === currentUser.id ? "none" : "1px solid #ddd",
                    fontSize: 13
                  }}>
                    {m.text}
                  </div>
                  <div style={{ fontSize: 9, color: "#aaa", textAlign: m.fromId === currentUser.id ? "right" : "left", marginTop: 4 }}>
                    {new Date(m.timestamp).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px", borderTop: "1px solid #eee", display: "flex", gap: 8 }}>
              <input 
                className="form-input" 
                placeholder="Escrever mensagem..." 
                value={text} 
                onChange={e => setText(e.target.value)} 
                onKeyDown={e => e.key === "Enter" && handleSend()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleSend}>Enviar</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
            Selecione uma conversa para começar
          </div>
        )}
      </div>
    </div>
  );
}
