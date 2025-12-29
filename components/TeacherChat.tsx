import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '../App';
import { supabase } from '../services/supabase';
import { askTeacherAssistant, addChatMessage, createChatThread, getChatMessages, listChatThreads, updateChatThread, deleteChatThread } from '../services/api';
import { t, getDateLocale } from '../constants.clean';
import { PlusIcon, TrashIcon, PencilSquareIcon, PaperAirplaneIcon, ChatBubbleLeftIcon, EllipsisHorizontalIcon, XMarkIcon, CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

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

    // Mobile view state: 'threads' shows thread list, 'chat' shows chat area
    const [mobileView, setMobileView] = useState<'threads' | 'chat'>('threads');

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
        setMobileView('chat'); // Switch to chat view on mobile
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
      setMobileView('chat'); // Switch to chat view on mobile
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
      if (!confirm(`"${thr.title}" ${t('confirmDeleteChat')}`)) return;
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


    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
      scrollToBottom();
    }, [history, sending]);

    return (
      <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex gap-6">
        {/* Sidebar - Hidden on mobile when viewing chat */}
        <aside className={`w-full md:w-80 flex-shrink-0 bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden transition-colors ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <button
              onClick={newChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-md hover:shadow-lg hover:translate-y-[-1px] transition-all font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              {t('newChat')}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingThreads ? (
              <div className="text-center py-8 text-gray-500 animate-pulse">{t('loading')}</div>
            ) : threads.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{t('noChatYet')}</p>
              </div>
            ) : (
              threads.map(thr => (
                <div
                  key={thr.id}
                  className={`group relative rounded-xl transition-all duration-200 border border-transparent ${activeThread?.id === thr.id
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/50'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                >
                  {editingThreadId === thr.id ? (
                    <div className="p-2 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave(e as any);
                          if (e.key === 'Escape') handleEditCancel(e as any);
                        }}
                      />
                      <button onClick={handleEditSave} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckIcon className="w-4 h-4" /></button>
                      <button onClick={handleEditCancel} className="p-1 text-gray-500 hover:bg-gray-50 rounded"><XMarkIcon className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button
                      className="w-full text-left p-3 pr-8"
                      onClick={() => loadThreadMessages(thr)}
                    >
                      <div className={`text-sm font-semibold truncate mb-0.5 ${activeThread?.id === thr.id ? 'text-orange-700 dark:text-orange-400' : 'text-gray-700 dark:text-gray-200'
                        }`}>
                        {thr.title}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        {new Date(thr.updated_at).toLocaleDateString(getDateLocale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </button>
                  )}

                  {/* Action buttons */}
                  {editingThreadId !== thr.id && (
                    <div className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-sm">
                      <button
                        onClick={(e) => handleEditStart(thr, e)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                        title={t('edit')}
                      >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(thr, e)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        title={t('delete')}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Chat Area - Hidden on mobile when viewing threads */}
        <main className={`flex-1 bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden transition-colors relative ${mobileView === 'threads' ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-md z-10 flex items-center justify-between sticky top-0">
            <div className="flex items-center gap-3">
              {/* Mobile Back Button */}
              <button
                onClick={() => setMobileView('threads')}
                className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  ✨
                </span>
                {t('aiAssistant')}
              </h1>
            </div>

            {/* Context Filters */}
            <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800/50 p-1 rounded-lg">
              <button
                onClick={() => setMode('general')}
                className={`px-3 py-1.5 rounded-md transition-all ${mode === 'general' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
              >
                {t('general')}
              </button>
              <button
                onClick={() => setMode('class')}
                className={`px-3 py-1.5 rounded-md transition-all ${mode === 'class' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
              >
                {t('classroom')}
              </button>
              <button
                onClick={() => setMode('child')}
                className={`px-3 py-1.5 rounded-md transition-all ${mode === 'child' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
              >
                {t('child')}
              </button>
            </div>
          </div>

          {/* Context Selectors */}
          {(mode !== 'general') && (
            <div className="px-6 py-3 bg-orange-50/50 dark:bg-orange-900/10 border-b border-orange-100 dark:border-orange-800/30 flex gap-4 animate-fade-in">
              {mode === 'class' && (
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t('selectClass')}:</span>
                  <select
                    value={selClass || ''}
                    onChange={(e) => setSelClass(e.target.value)}
                    className="w-full border-gray-300 dark:border-gray-600 rounded-lg text-sm py-2 px-3 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{t('selectClass')}</option>
                    {classrooms.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
              {mode === 'child' && (
                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t('selectChild')}:</span>
                  <select
                    value={selChild || ''}
                    onChange={(e) => setSelChild(e.target.value)}
                    className="w-full border-gray-300 dark:border-gray-600 rounded-lg text-sm py-2 px-3 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{t('selectChild')}</option>
                    {children.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
            {loadingMsgs ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 opacity-60">
                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center mb-4">
                  <span className="text-4xl">✨</span>
                </div>
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">{t('askAnything')}</p>
                <p className="text-sm max-w-md mt-2">{t('noteDisclaimer')}</p>
              </div>
            ) : (
              history.map((m, idx) => (
                <div key={idx} className={`flex gap-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-lg flex-shrink-0 mt-2 text-orange-600">
                      🤖
                    </div>
                  )}

                  <div className={`max-w-[75%] space-y-1`}>
                    <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${m.role === 'user'
                      ? 'bg-orange-500 text-white rounded-tr-none'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700'
                      }`}>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                    <div className={`text-[11px] text-gray-400 dark:text-gray-500 ${m.role === 'user' ? 'text-right pr-1' : 'pl-1'}`}>
                      {new Date(m.at).toLocaleTimeString(getDateLocale(), { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 flex-shrink-0 mt-2">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              ))
            )}

            {sending && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-lg flex-shrink-0 text-orange-600">🤖</div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-[#1a1a2e] border-t border-gray-100 dark:border-gray-700">
            <div className="relative flex gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                className="flex-1 w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 pr-12 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none min-h-[50px] max-h-[120px]"
                placeholder={t('typeMessage')}
                style={{ height: 'auto', overflow: 'hidden' }}
              // Auto grow script could go here but kept simple
              />
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                className="absolute right-2 bottom-2 p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors shadow-sm"
              >
                <PaperAirplaneIcon className="w-5 h-5 -rotate-90" />
              </button>
            </div>
            <div className="text-center mt-2 text-xs text-gray-400 dark:text-gray-500">
              {t('noteDisclaimer')}
            </div>
          </div>
        </main>
      </div>
    );
  };

export default TeacherChat;
