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

// Kullanıcının sağladığı güncel Firebase Yapılandırması
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'emizer-ai-zepln';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [user, setUser] = useState(null);
  
  // Auth State
  const [authMode, setAuthMode] = useState(null); 
  const [formData, setFormData] = useState({ name: '', surname: '', email: '', password: '' });
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Data State
  const [notes, setNotes] = useState([]);
  const [studySessions, setStudySessions] = useState([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [newStudy, setNewStudy] = useState({ title: '', subject: '', duration: 40 });
  
  // Timer State
  const [activeTimer, setActiveTimer] = useState(null);
  const timerRef = useRef(null);

  // Chat State
  const [messages, setMessages] = useState([
    { id: 1, text: "Selam! Ben EmiZer AI. Emir ÖZER (ZelixYZLM™) tarafından geliştirildim. Misafir olarak 5 hakkın var, giriş yaparak verilerini kaydedebilirsin!", sender: "ai", type: "text" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [guestQuestionCount, setGuestQuestionCount] = useState(0);
  const [showAuthAlert, setShowAuthAlert] = useState(false);

  const messagesEndRef = useRef(null);
  const apiKey = ""; 

  // Manuel Auth Listener
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

  // Firestore Sync
  useEffect(() => {
    if (!user) {
      setNotes([]);
      setStudySessions([]);
      return;
    }

    const notesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'notes');
    const unsubNotes = onSnapshot(notesCol, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotes(notesData);
    }, (err) => console.error("Notes error:", err));

    const studyCol = collection(db, 'artifacts', appId, 'users', user.uid, 'study');
    const unsubStudy = onSnapshot(studyCol, (snapshot) => {
      const studyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudySessions(studyData);
    }, (err) => console.error("Study error:", err));

    return () => { unsubNotes(); unsubStudy(); };
  }, [user]);

  // Timer logic
  useEffect(() => {
    if (activeTimer && activeTimer.timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setActiveTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (activeTimer && activeTimer.timeLeft === 0) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeTimer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab, isLoading]);

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const sendWelcomeMessage = (userName) => {
    const welcomeText = `Hoş geldin ${userName}! 🎉 Ben EmiZer AI. Mehmet Emir ÖZER (ZelixYZLM™) tarafından senin için tasarlandım. Artık tüm özelliklerim emrinde! \n\nNeler yapabilirim?\n🎨 Görsel oluşturabilirim,\n📊 Tablo ve grafikler hazırlayabilirim,\n📝 Notlarını bulutta saklayabilirim,\n⏱️ Etüt sistemimizle derslerini takip edebilirim.\n\nNasıl yardımcı olabilirim?`;
    setMessages(prev => [...prev, { id: Date.now() + 99, text: welcomeText, sender: "ai", type: "text" }]);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isAuthLoading) return;
    
    setAuthError("");
    setIsAuthLoading(true);
    
    const email = formData.email.trim();
    const password = formData.password;
    const name = formData.name.trim();
    const surname = formData.surname.trim();

    try {
      if (authMode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fullName = name ? `${name} ${surname}` : "Yeni Kullanıcı";
        await updateProfile(userCredential.user, { displayName: fullName });
        sendWelcomeMessage(fullName);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        sendWelcomeMessage(userCredential.user.displayName || "Kullanıcı");
      }
    } catch (error) {
      console.error("Auth Error:", error.code);
      if (error.code === 'auth/email-already-in-use') setAuthError("Bu e-posta adresi zaten kayıtlı.");
      else if (error.code === 'auth/wrong-password') setAuthError("Şifre hatalı.");
      else if (error.code === 'auth/user-not-found') setAuthError("Kullanıcı bulunamadı.");
      else if (error.code === 'auth/invalid-email') setAuthError("Geçersiz e-posta formatı.");
      else if (error.code === 'auth/weak-password') setAuthError("Şifre çok zayıf (en az 6 karakter).");
      else setAuthError("Bağlantı sorunu veya hatalı bilgi. Lütfen tekrar deneyin.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Chat & AI Logic
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    if (!user && guestQuestionCount >= 5) {
      setShowAuthAlert(true);
      return;
    }

    const currentInput = inputValue.trim();
    setMessages(prev => [...prev, { id: Date.now(), text: currentInput, sender: "user" }]);
    setInputValue("");
    setIsLoading(true);
    if (!user) setGuestQuestionCount(c => c + 1);

    if (currentInput === "M7489M") {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          text: "Tamamdır Kanıt Modu aktif ✅\nBeni Mehmet Emir ÖZER tasarladı\n75.yıl ORTAOKULU adına hizmet etmek benim öncelikli görevim\nZelixYZLM Mehmet Emirin kurduğu gruptur\nSizce bu kadarıda yetmez mi?", 
          sender: "ai" 
        }]);
        setIsLoading(false);
      }, 1500); // Küçük bir gecikme ile "İşleniyor" hissi
      return;
    }

    try {
      const isImg = /çiz|oluştur|göster|resmet|resim|fotoğraf|görsel/i.test(currentInput);
      if (isImg && currentInput.length > 5) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instances: [{ prompt: currentInput }], parameters: { sampleCount: 1 } })
        });
        const result = await response.json();
        const url = `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
        setMessages(prev => [...prev, { id: Date.now() + 1, text: "Görselin hazır:", sender: "ai", type: "image", content: url }]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: currentInput }] }],
          systemInstruction: { parts: [{ text: `Sen EmiZer AI'sın. Sahibin Emir ÖZER (ZelixYZLM™). Ortaokul öğrencileri için eğitim asistanısın. Sayısal veri istenirse JSON formatında tablo ve grafik verisi üret.` }] }
        })
      });
      const res = await response.json();
      const raw = res.candidates?.[0]?.content?.parts?.[0]?.text || "Anlayamadım, tekrar eder misin?";
      let clean = raw;
      let viz = null;
      const match = raw.match(/\{[\s\S]*"type":\s*"data_viz"[\s\S]*\}/);
      if (match) { viz = JSON.parse(match[0]); clean = raw.replace(match[0], ""); }
      setMessages(prev => [...prev, { id: Date.now() + 1, text: clean, sender: "ai", type: viz ? "viz" : "text", vizData: viz }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Sistemde bir sorun oluştu.", sender: "ai" }]);
    } finally { setIsLoading(false); }
  };

  const theme = {
    bg: isDarkMode ? "bg-[#0d1117]" : "bg-slate-50",
    card: isDarkMode ? "bg-[#161b22] border-[#30363d]" : "bg-white border-slate-100 shadow-sm",
    text: isDarkMode ? "text-slate-300" : "text-slate-600",
    title: isDarkMode ? "text-white" : "text-slate-900"
  };

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} transition-all duration-300 overflow-hidden font-sans`}>
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-all z-50 w-72 ${theme.card} border-r flex flex-col`}>
        <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-600" />
            <h1 className={`text-xl font-black ${theme.title}`}>EmiZer AI</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)}><X size={20} /></button>
        </div>
        <nav className="flex-1 py-4">
          <button onClick={() => {setActiveTab('chat'); setIsSidebarOpen(false);}} className={`w-full flex items-center px-6 py-4 text-xs font-black ${activeTab === 'chat' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : ''}`}><Bot className="mr-3" /> ANA MENÜ</button>
          <button onClick={() => {setActiveTab('notes'); setIsSidebarOpen(false);}} className={`w-full flex items-center px-6 py-4 text-xs font-black ${activeTab === 'notes' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : ''}`}><FileText className="mr-3" /> NOTLARIM</button>
          <button onClick={() => {setActiveTab('study'); setIsSidebarOpen(false);}} className={`w-full flex items-center px-6 py-4 text-xs font-black ${activeTab === 'study' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : ''}`}><Clock className="mr-3" /> ETÜT SİSTEMİ</button>
          <button onClick={() => {setActiveTab('feedback'); setIsSidebarOpen(false);}} className={`w-full flex items-center px-6 py-4 text-xs font-black ${activeTab === 'feedback' ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : ''}`}><MessageSquare className="mr-3" /> GERİ BİLDİRİM EKLE</button>
        </nav>
        <div className="p-4 border-t dark:border-slate-800 space-y-2">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black">{isDarkMode ? 'GÜNDÜZ' : 'GECE'}</button>
          {user && <button onClick={() => signOut(auth)} className="w-full py-3 text-red-500 text-[10px] font-black">ÇIKIŞ YAP</button>}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <header className={`h-16 flex items-center justify-between px-6 border-b ${isDarkMode ? 'bg-[#161b22]/90 border-[#30363d]' : 'bg-white/90 border-slate-200'} backdrop-blur-md`}>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2"><Menu size={22} /></button>
          <div className="flex items-center gap-3">
            {!user ? (
              <div className="flex gap-2">
                <button onClick={() => {setAuthError(""); setAuthMode('login');}} className="text-xs font-black px-4 py-2 text-indigo-600">Giriş</button>
                <button onClick={() => {setAuthError(""); setAuthMode('register');}} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20">KAYIT OL</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-full">
                <span className="text-[10px] font-black uppercase">{user.displayName || 'Kullanıcı'}</span>
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-[10px] uppercase">{(user.displayName || 'K').charAt(0)}</div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'feedback' ? (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-in fade-in zoom-in duration-300">
               <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
                 <MessageSquare size={32} className="text-indigo-600" />
               </div>
               <div className={`max-w-md p-8 rounded-[2.5rem] border ${theme.card} shadow-xl`}>
                 <p className="text-sm font-black leading-relaxed">
                   GERİ BİLDİRİM SİSTEMİ AKTİF ✅<br/>
                   7/24 saat destek İÇİN<br/>
                   <span className="text-indigo-600">"arcixgamesssinfo@gmail.com"</span><br/>
                   hesabımıza mesajınızı bırakın iyi gşbket dileriz 😁
                 </p>
               </div>
            </div>
          ) : !user && (activeTab === 'notes' || activeTab === 'study') ? (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"><Lock size={24} className="opacity-40" /></div>
              <h2 className="text-xl font-black mb-2">Bu Bölüm Kilitli!</h2>
              <p className="text-xs opacity-60 mb-6 max-w-xs">Notlarını ve etütlerini kaydetmek için lütfen giriş yap veya kayıt ol.</p>
              <button onClick={() => setAuthMode('login')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs">GİRİŞ YAP</button>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto p-8">
              {activeTab === 'chat' && (
                <div className="max-w-3xl mx-auto space-y-8 pb-20">
                  {messages.map(m => (
                    <div key={m.id} className={`flex gap-4 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.sender === 'user' ? 'bg-slate-700' : 'bg-indigo-600'}`}>{m.sender === 'user' ? <User size={16} className="text-white"/> : <Bot size={16} className="text-white"/>}</div>
                      <div className={`p-4 rounded-2xl max-w-[80%] ${m.sender === 'user' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/10' : theme.card}`}>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
                        {m.type === 'image' && <img src={m.content} className="mt-4 rounded-xl shadow-2xl" />}
                        {m.type === 'viz' && m.vizData && <div className="mt-4 h-40"><ResponsiveContainer><AreaChart data={m.vizData.data}><Area type="monotone" dataKey="deger" fill="#6366f1" stroke="#6366f1" fillOpacity={0.1}/></AreaChart></ResponsiveContainer></div>}
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-4 animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center"><Bot size={16} className="text-white"/></div>
                      <div className={`p-4 rounded-2xl ${theme.card}`}>
                         <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-indigo-600">EmiZer Ai İşliyo...</span>
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce"></div>
                              <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce delay-75"></div>
                              <div className="w-1 h-1 bg-indigo-600 rounded-full animate-bounce delay-150"></div>
                            </div>
                         </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {activeTab === 'notes' && (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <h1 className={`text-3xl font-black ${theme.title}`}>Notlarım</h1>
                    <button onClick={() => setIsNoteModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-600/30 flex items-center gap-2"><Plus size={18}/> Yeni Not</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {notes.map(n => (
                      <div key={n.id} className={`p-5 rounded-[2rem] border ${theme.card}`}>
                        <div className="flex justify-between items-start mb-2"><h3 className="font-bold">{n.title}</h3><button onClick={async () => await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'notes', n.id))} className="text-red-400"><Trash2 size={16}/></button></div>
                        <p className="text-xs opacity-60 line-clamp-3">{n.content}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {activeTab === 'study' && (
                <>
                  <div className="flex justify-between items-center mb-8">
                    <h1 className={`text-3xl font-black ${theme.title}`}>Etüt Sistemi</h1>
                    <button onClick={() => setIsStudyModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-600/30 flex items-center gap-2"><Plus size={18}/> Etüt Oluştur</button>
                  </div>
                  {activeTimer && (
                    <div className="mb-10 p-10 rounded-[3rem] bg-indigo-600 text-white text-center shadow-2xl shadow-indigo-600/40 animate-pulse">
                      <div className="text-xs font-black uppercase mb-2">Aktif: {activeTimer.title}</div>
                      <div className="text-7xl font-black mb-4">{Math.floor(activeTimer.timeLeft / 60)}:{(activeTimer.timeLeft % 60).toString().padStart(2, '0')}</div>
                      <button onClick={() => setActiveTimer(null)} className="px-8 py-2 bg-white/20 rounded-full font-black text-xs">Durdur</button>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studySessions.length === 0 ? <p className="opacity-30 font-bold col-span-2 text-center py-20">Henüz kayıtlı etüt yok.</p> : studySessions.map(s => (
                      <div key={s.id} className={`p-6 rounded-[2.5rem] border ${theme.card} flex justify-between items-center`}>
                        <div><h4 className="font-black text-lg">{s.title}</h4><p className="text-[10px] uppercase font-bold text-indigo-600">{s.subject} • {s.duration} Dk</p></div>
                        <div className="flex gap-2">
                          <button onClick={() => setActiveTimer({ id: s.id, title: s.title, timeLeft: s.duration * 60 })} className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center"><Play size={20}/></button>
                          <button onClick={async () => await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'study', s.id))} className="text-red-400 p-2"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </main>

        <div className="p-6">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative">
            <div className={`flex items-center rounded-2xl border ${isDarkMode ? 'bg-[#161b22] border-[#30363d]' : 'bg-white border-slate-100 shadow-sm'}`}>
              <textarea 
                rows="1" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                placeholder={user ? "Sohbete başlayın..." : `Misafir Kullanım Hakkı: ${5 - guestQuestionCount}`}
                className="w-full p-4 bg-transparent outline-none resize-none text-sm"
              />
              <button type="submit" disabled={isLoading} className="mr-3 p-2 bg-indigo-600 text-white rounded-xl shadow-lg disabled:opacity-50"><Send size={18}/></button>
            </div>
          </form>
        </div>
      </div>

      {/* Auth Modals */}
      {authMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
          <div className={`w-full max-w-md rounded-[3rem] border p-10 relative overflow-hidden shadow-2xl ${isDarkMode ? "bg-[#0d1117] border-[#30363d]" : "bg-white border-white"}`}>
            <button onClick={() => setAuthMode(null)} className="absolute top-6 right-6 opacity-50"><X size={20} /></button>
            <h2 className="text-3xl font-black tracking-tighter text-center mb-8 uppercase">{authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div className="flex gap-2">
                  <input required name="name" placeholder="Ad" className="w-1/2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 outline-none text-sm" value={formData.name} onChange={handleInputChange} />
                  <input required name="surname" placeholder="Soyad" className="w-1/2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 outline-none text-sm" value={formData.surname} onChange={handleInputChange} />
                </div>
              )}
              <input required name="email" type="email" placeholder="E-posta" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 outline-none text-sm" value={formData.email} onChange={handleInputChange} />
              <input required name="password" type="password" placeholder="Şifre" className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 outline-none text-sm" value={formData.password} onChange={handleInputChange} />
              {authError && <p className="text-red-500 text-[10px] font-bold text-center uppercase">{authError}</p>}
              <button type="submit" disabled={isAuthLoading} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl disabled:opacity-50">
                {isAuthLoading ? 'İŞLEM YAPILIYOR...' : (authMode === 'login' ? 'GİRİŞ YAP' : 'KAYDOL')}
              </button>
            </form>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full mt-6 text-[10px] font-black text-indigo-500 uppercase tracking-widest">{authMode === 'login' ? 'Hesabın yok mu? Kaydol' : 'Hesabın var mı? Giriş yap'}</button>
          </div>
        </div>
      )}

      {/* Note/Study Modals */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`w-full max-w-xl rounded-[2.5rem] p-10 ${isDarkMode ? 'bg-[#161b22] border border-[#30363d]' : 'bg-white'}`}>
            <h2 className="text-2xl font-black mb-6">Yeni Not</h2>
            <input placeholder="Not Başlığı" className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 outline-none mb-4 font-bold" value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})}/>
            <textarea rows="5" placeholder="İçerik..." className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 outline-none mb-6 text-sm" value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})} />
            <div className="flex justify-between"><button onClick={() => setIsNoteModalOpen(false)} className="text-xs font-black opacity-50 uppercase">İPTAL</button><button onClick={async () => {
              if(!user) return;
              await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'notes'), { ...newNote, createdAt: new Date().toISOString() });
              setNewNote({title:'', content:''}); setIsNoteModalOpen(false);
            }} className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg">KAYDET</button></div>
          </div>
        </div>
      )}

      {isStudyModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className={`w-full max-w-xl rounded-[2.5rem] p-10 ${isDarkMode ? 'bg-[#161b22] border border-[#30363d]' : 'bg-white'}`}>
            <h2 className="text-2xl font-black mb-6">Etüt Planla</h2>
            <div className="space-y-4 mb-6">
              <input placeholder="Etüt Adı" className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 outline-none font-bold" value={newStudy.title} onChange={e => setNewStudy({...newStudy, title: e.target.value})}/>
              <input placeholder="Ders" className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 outline-none text-sm" value={newStudy.subject} onChange={e => setNewStudy({...newStudy, subject: e.target.value})}/>
              <input type="number" placeholder="Dakika" className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 outline-none text-sm" value={newStudy.duration} onChange={e => setNewStudy({...newStudy, duration: e.target.value})}/>
            </div>
            <div className="flex justify-between"><button onClick={() => setIsStudyModalOpen(false)} className="text-xs font-black opacity-50 uppercase">İPTAL</button><button onClick={async () => {
              if(!user) return;
              await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'study'), { ...newStudy, createdAt: new Date().toISOString(), duration: parseInt(newStudy.duration) });
              setNewStudy({title:'', subject:'', duration:40}); setIsStudyModalOpen(false);
            }} className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg">KAYDET</button></div>
          </div>
        </div>
      )}

      {showAuthAlert && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className={`max-w-sm w-full rounded-[3rem] p-10 text-center shadow-2xl ${isDarkMode ? 'bg-[#161b22] border border-indigo-500/30' : 'bg-white'}`}>
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6"><Sparkles className="text-white" size={40} /></div>
            <h3 className="text-3xl font-black mb-4 tracking-tighter">Limiti Aştın!</h3>
            <p className="text-sm opacity-60 mb-10">ZelixYZLM™ kalıcılığı ve sonsuz hak için hemen ücretsiz üye ol.</p>
            <button onClick={() => {setShowAuthAlert(false); setAuthMode('register');}} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">Hemen Kaydol</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
