import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  updateProfile
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query
} from "firebase/firestore";
import { 
  Menu, X, FileText, Moon, Sun, LogOut, Send, Bot, User, Sparkles, 
  Plus, Trash2, Save, Play, Timer as TimerIcon, ChevronRight, AlertCircle, Clock, Lock, MessageSquare
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// Firebase Yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyB8Hf7CU9QRu1hU0nB_39IwzYfjNYjFxOQ",
  authDomain: "zeplnpro.firebaseapp.com",
  projectId: "zeplnpro",
  storageBucket: "zeplnpro.firebasestorage.app",
  messagingSenderId: "58076733466",
  appId: "1:58076733466:web:11aea17f42395d2e4931a3",
  measurementId: "G-HWXDLSE6DT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'emizer-ai-zepln';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [user, setUser] = useState(null);
  
  const [authMode, setAuthMode] = useState(null); 
  const [formData, setFormData] = useState({ name: '', surname: '', email: '', password: '' });
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [notes, setNotes] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [newStudy, setNewStudy] = useState({ title: '', subject: '', duration: 40 });
  
  const [activeTimer, setActiveTimer] = useState(null);
  const timerRef = useRef(null);

  const [messages, setMessages] = useState([
    { id: 1, text: "Selam! Ben EmiZer AI. Emir ÖZER (ZelixYZLM™) tarafından geliştirildim. Misafir olarak 5 hakkın var, giriş yaparak verilerini kaydedebilirsin!", sender: "ai", type: "text" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [guestQuestionCount, setGuestQuestionCount] = useState(0);
  const [showAuthAlert, setShowAuthAlert] = useState(false);

  const messagesEndRef = useRef(null);
  
  // Sizin API Anahtarınız buraya eklendi
  const apiKey = "AIzaSyDgvAybrSw1NxA8tTAzQWZJ_uDENcv7ivM"; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthMode(null);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setStudySessions([]);
      return;
    }
    const notesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'notes');
    const unsubNotes = onSnapshot(notesCol, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const studyCol = collection(db, 'artifacts', appId, 'users', user.uid, 'study');
    const unsubStudy = onSnapshot(studyCol, (snapshot) => {
      setStudySessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubNotes(); unsubStudy(); };
  }, [user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    if (!user && guestQuestionCount >= 5) { setShowAuthAlert(true); return; }

    const currentInput = inputValue.trim();
    setMessages(prev => [...prev, { id: Date.now(), text: currentInput, sender: "user" }]);
    setInputValue("");
    setIsLoading(true);
    if (!user) setGuestQuestionCount(c => c + 1);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: currentInput }] }] })
      });
      const res = await response.json();
      const raw = res.candidates?.[0]?.content?.parts?.[0]?.text || "Bir hata oluştu.";
      setMessages(prev => [...prev, { id: Date.now() + 1, text: raw, sender: "ai" }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Bağlantı hatası.", sender: "ai" }]);
    } finally { setIsLoading(false); }
  };

  const theme = {
    bg: isDarkMode ? "bg-[#0d1117]" : "bg-slate-50",
    card: isDarkMode ? "bg-[#161b22] border-[#30363d]" : "bg-white border-slate-100 shadow-sm",
    text: isDarkMode ? "text-slate-300" : "text-slate-600"
  };

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} overflow-hidden`}>
      <div className="flex-1 flex flex-col">
        <header className={`h-16 flex items-center justify-between px-6 border-b ${isDarkMode ? 'bg-[#161b22] border-[#30363d]' : 'bg-white'}`}>
           <button onClick={() => setIsSidebarOpen(true)}><Menu/></button>
           <h1 className="font-black text-indigo-600 italic">EMIZER AI</h1>
           <button onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(m => (
            <div key={m.id} className={`p-4 rounded-2xl max-w-[85%] ${m.sender === 'user' ? 'bg-indigo-600 text-white ml-auto' : theme.card}`}>{m.text}</div>
          ))}
          {isLoading && <div className="text-xs animate-pulse text-indigo-500 font-bold">EmiZer Düşünüyor...</div>}
        </main>

        <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
          <input className={`flex-1 p-3 rounded-xl outline-none ${theme.card}`} value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Bir şeyler sor..."/>
          <button className="p-3 bg-indigo-600 text-white rounded-xl"><Send/></button>
        </form>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setIsSidebarOpen(false)}>
          <div className={`w-64 h-full ${theme.card} p-6`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-8"><h2 className="font-black">ZELİXYZLM</h2><button onClick={() => setIsSidebarOpen(false)}><X/></button></div>
            <p className="text-xs mb-4 opacity-50">EmiZer AI v1.0</p>
            <div className="space-y-2">
               <button onClick={() => {setActiveTab('chat'); setIsSidebarOpen(false)}} className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg">🤖 Sohbet</button>
               <button onClick={() => {setActiveTab('notes'); setIsSidebarOpen(false)}} className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg">📝 Notlar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
                    
