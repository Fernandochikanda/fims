import { createContext, useState, useContext, useEffect } from "react";
import { genId } from "../lib/helpers";

const CommsContext = createContext();
export const useComms = () => useContext(CommsContext);

export const CommsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => JSON.parse(localStorage.getItem("fims_notifs")) || []);
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem("fims_messages")) || []);
  const [announcements, setAnnouncements] = useState(() => JSON.parse(localStorage.getItem("fims_announcements")) || []);
  const [dismissedAnn, setDismissedAnn] = useState(() => JSON.parse(localStorage.getItem("fims_dismissed")) || []);

  useEffect(() => { localStorage.setItem("fims_notifs", JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem("fims_messages", JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem("fims_announcements", JSON.stringify(announcements)); }, [announcements]);
  useEffect(() => { localStorage.setItem("fims_dismissed", JSON.stringify(dismissedAnn)); }, [dismissedAnn]);

  const notify = (userId, text, link) => {
    setNotifications(prev => [{ id: genId(), userId, text, link, read: false, timestamp: new Date().toISOString() }, ...prev]);
  };

  const markAllRead = (userId) => {
    setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, read: true } : n));
  };

  const sendMessage = (fromId, toId, text) => {
    setMessages(prev => [...prev, { id: genId(), fromId, toId, text, timestamp: new Date().toISOString() }]);
  };

  const createAnnouncement = (text, author) => {
    setAnnouncements(prev => [{ id: genId(), text, author, date: new Date().toISOString() }, ...prev]);
  };

  const dismissAnnouncement = (userId, annId) => {
    setDismissedAnn(prev => [...prev, { userId, annId }]);
  };

  return (
    <CommsContext.Provider value={{ notifications, notify, markAllRead, messages, sendMessage, announcements, createAnnouncement, dismissAnnouncement, dismissedAnn }}>
      {children}
    </CommsContext.Provider>
  );
};
