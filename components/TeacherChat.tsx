import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import { askTeacherAssistant, addChatMessage, createChatThread, getChatMessages, listChatThreads, updateChatThread, deleteChatThread } from '../services/api';

type Msg = { role: 'user' | 'assistant' | 'system'; content: string; at: string };
type Thread = { id: string; title: string; mode: 'general' | 'class' | 'child'; classroom?: string | null; child_id?: string | null; updated_at: string };

const TeacherChat: React.FC<{ navigate: (page: string, params?: any) => void; childId?: string; classroom?: string }>
  = ({ navigate, childId, classroom }) => {
    const { user } = useAuth();
    const [history, setHistory] = useState<Msg[]>([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [mode, setMode] = useState<'general' | 'child' | 'class'>(childId ? 'child' : classroom ? 'class' : 'general');
    const [selChild, setSelChild] = useState<string | undefined>(childId);
    const [selClass, setSelClass] = useState<string | undefined>(classroom);
    const [children, setChildren] = useState<any[]>([]);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [activeThread, setActiveThread] = useState<Thread | null>(null);
    const [loadingThreads, setLoadingThreads] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);

    // Edit/Delete states
    const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    useEffect(() => {
      (async () => {
        if (!user) return;
        const { data } = await supabase.from('children').select('id, first_name, last_name, classroom').eq('user_id', user.id);
        setChildren(data || []);
        await refreshThreads();
      })();
    }, [user]);

    const refreshThreads = async () => {
      if (!user) return;
      setLoadingThreads(true);
      try {
        const list = await listChatThreads(user.id);
        setThreads(list as any);
      } finally { setLoadingThreads(false); }
    };

    const loadThreadMessages = async (thr: Thread) => {
      setActiveThread(thr);
      setMode(thr.mode);
      setSelClass(thr.classroom || undefined);
      setSelChild(thr.child_id || undefined);
      setLoadingMsgs(true);
      try {
        const msgs = await getChatMessages(thr.id);
        setHistory((msgs || []).map(m => ({ role: m.role, content: m.content, at: m.created_at })) as any);
      } finally { setLoadingMsgs(false); }
    };

    const classrooms = useMemo(() => {
      const set = new Set<string>();
      for (const c of children) if (c.classroom) set.add(c.classroom);
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr-TR'));
    }, [children]);

    const send = async () => {
      if (!user) return;
      const msg = text.trim();
      if (!msg || sending) return;
      setSending(true);
      const now = new Date().toISOString();
      setHistory(h => [...h, { role: 'user', content: msg, at: now }]);
      setText('');
      try {
        // Ensure thread
        let thr = activeThread;
        if (!thr) {
          const title = msg.length > 50 ? msg.slice(0, 50) + '…' : msg;
          thr = await createChatThread({ userId: user.id, title, mode, classroom: selClass, childId: selChild });
          setActiveThread(thr as any);
          await refreshThreads();
        }
        // Persist user message
        await addChatMessage({ threadId: (thr as any).id, userId: user.id, role: 'user', content: msg });

        const payload: any = { message: msg, mode, history: history.slice(-6) };
        if (mode === 'child' && selChild) payload.childId = selChild;
        if (mode === 'class' && selClass) payload.classroom = selClass;
        const resp = await askTeacherAssistant(payload);
        const reply = (resp && resp.reply) || 'Yanıt alınamadı.';
        const at = new Date().toISOString();
        setHistory(h => [...h, { role: 'assistant', content: String(reply), at }]);
        await addChatMessage({ threadId: (thr as any).id, userId: user.id, role: 'assistant', content: String(reply) });
        await refreshThreads();
      } catch (e: any) {
        const msgText = `Hata: ${e?.message || e}`;
        setHistory(h => [...h, { role: 'assistant', content: msgText, at: new Date().toISOString() }]);
      } finally {
        setSending(false);
      }
    };

    const newChat = () => {
      setActiveThread(null);
      setHistory([]);
      setMode(childId ? 'child' : classroom ? 'class' : 'general');
      setSelChild(childId);
      setSelClass(classroom);
    };

    const handleEditStart = (thr: Thread, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingThreadId(thr.id);
      setEditTitle(thr.title);
    };

    const handleEditSave = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!editingThreadId || !editTitle.trim()) return;
      try {
        await updateChatThread(editingThreadId, editTitle.trim());
        await refreshThreads();
        // Update active thread title if editing current
        if (activeThread?.id === editingThreadId) {
          setActiveThread({ ...activeThread, title: editTitle.trim() });
        }
      } catch (err) {
        console.error('Thread güncellenemedi:', err);
      }
      setEditingThreadId(null);
      setEditTitle('');
    };

    const handleEditCancel = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingThreadId(null);
      setEditTitle('');
    };

    const handleDelete = async (thr: Thread, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm(`"${thr.title}" sohbetini silmek istiyor musunuz?`)) return;
      try {
        await deleteChatThread(thr.id);
        // If deleting active thread, reset
        if (activeThread?.id === thr.id) {
          setActiveThread(null);
          setHistory([]);
        }
        await refreshThreads();
      } catch (err) {
        console.error('Thread silinemedi:', err);
      }
    };

    return (
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Sidebar */}
        <aside className="md:col-span-4 lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-3 h-[70vh] flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Sohbetler</h2>
              <button className="text-primary text-sm hover:underline" onClick={newChat}>Yeni Sohbet</button>
            </div>
            <div className="overflow-y-auto divide-y flex-1">
              {loadingThreads ? (<div className="text-sm text-gray-500 p-2">Yükleniyor…</div>) : (
                threads.length === 0 ? (
                  <div className="text-sm text-gray-500 p-2">Henüz sohbet yok.</div>
                ) : (
                  threads.map(t => (
                    <div key={t.id} className={`relative group ${activeThread?.id === t.id ? 'bg-gray-100' : ''}`}>
                      {editingThreadId === t.id ? (
                        <div className="p-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 border rounded px-2 py-1 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditSave(e as any);
                              if (e.key === 'Escape') handleEditCancel(e as any);
                            }}
                          />
                          <button onClick={handleEditSave} className="text-green-600 text-xs hover:underline">✓</button>
                          <button onClick={handleEditCancel} className="text-gray-500 text-xs hover:underline">✕</button>
                        </div>
                      ) : (
                        <button
                          className="w-full text-left p-2 hover:bg-gray-50"
                          onClick={() => loadThreadMessages(t)}
                        >
                          <div className="text-sm font-medium truncate pr-12">{t.title}</div>
                          <div className="text-[11px] text-gray-500">{new Date(t.updated_at).toLocaleString('tr-TR')}</div>
                        </button>
                      )}
                      {/* Action buttons - visible on hover */}
                      {editingThreadId !== t.id && (
                        <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={(e) => handleEditStart(t, e)}
                            className="p-1 text-gray-500 hover:text-blue-600 text-xs"
                            title="Düzenle"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => handleDelete(t, e)}
                            className="p-1 text-gray-500 hover:text-red-600 text-xs"
                            title="Sil"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </aside>

        {/* Chat area */}
        <div className="md:col-span-8 lg:col-span-9">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Yapay Zekâ Asistanı</h1>
            <button className="text-primary hover:underline" onClick={() => navigate('dashboard')}>Ana sayfa</button>
          </div>

          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1 text-sm"><input type="radio" checked={mode === 'general'} onChange={() => setMode('general')} /> Genel</label>
                <label className="inline-flex items-center gap-1 text-sm"><input type="radio" checked={mode === 'class'} onChange={() => setMode('class')} /> Sınıf</label>
                <label className="inline-flex items-center gap-1 text-sm"><input type="radio" checked={mode === 'child'} onChange={() => setMode('child')} /> Çocuk</label>
              </div>
              {mode === 'class' && (
                <select value={selClass || ''} onChange={(e) => setSelClass(e.target.value)} className="border rounded px-2 py-1 text-sm">
                  <option value="">Sınıf seçin…</option>
                  {classrooms.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              {mode === 'child' && (
                <select value={selChild || ''} onChange={(e) => setSelChild(e.target.value)} className="border rounded px-2 py-1 text-sm min-w-[200px]">
                  <option value="">Çocuk seçin…</option>
                  {children.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              )}
              <div className="text-xs text-gray-500 ml-auto">Not: Tıbbi tanı koymaz; pratik sınıf içi öneriler sunar.</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 h-[60vh] overflow-y-auto">
            {loadingMsgs ? (
              <div className="text-gray-500">Yükleniyor…</div>
            ) : history.length === 0 ? (
              <p className="text-gray-500">Sorunuzu yazın. Örn: "3-4 yaş grubu için ince motoru güçlendiren etkinlik önerir misin?"</p>) : (
              <ul className="space-y-3">
                {history.map((m, idx) => (
                  <li key={idx} className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto' : ''}`}>
                    <div className={`px-3 py-2 rounded-lg ${m.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">{new Date(m.at).toLocaleTimeString('tr-TR')}</div>
                  </li>
                ))}
                {sending && <li className="text-gray-500 text-sm">Asistan yazıyor…</li>}
              </ul>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="flex-1 border rounded px-3 py-2" placeholder="Mesajınızı yazın…" />
            <button onClick={send} disabled={sending || !text.trim()} className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50">Gönder</button>
          </div>
        </div>
      </div>
    );
  };

export default TeacherChat;
