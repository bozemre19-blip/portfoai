import { supabase } from '../supabase';

// Chat thread veri tipi
export type ChatThread = {
  id: string;
  user_id: string;
  title: string;
  mode: 'general' | 'class' | 'child';
  classroom?: string | null;
  child_id?: string | null;
  created_at: string;
  updated_at: string;
};

// Chat mesajı veri tipi
export type ChatMessage = {
  id: string;
  thread_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};

// Kullanıcının tüm chat thread'lerini listele
export const listChatThreads = async (userId: string): Promise<ChatThread[]> => {
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as ChatThread[];
};

// Yeni chat thread oluştur
export const createChatThread = async (args: {
  userId: string;
  title: string;
  mode: 'general' | 'class' | 'child';
  classroom?: string;
  childId?: string;
}): Promise<ChatThread> => {
  const { data, error } = await supabase
    .from('chat_threads')
    .insert({
      user_id: args.userId,
      title: args.title,
      mode: args.mode,
      classroom: args.classroom,
      child_id: args.childId,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ChatThread;
};

// Chat thread başlığını güncelle
export const updateChatThread = async (threadId: string, title: string): Promise<void> => {
  const { error } = await supabase
    .from('chat_threads')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', threadId);
  if (error) throw error;
};

// Chat thread ve mesajlarını sil
export const deleteChatThread = async (threadId: string): Promise<void> => {
  // Önce mesajları sil
  const { error: msgError } = await supabase
    .from('chat_messages')
    .delete()
    .eq('thread_id', threadId);
  if (msgError) console.error('Mesajlar silinirken hata:', msgError);

  // Sonra thread'i sil
  const { error } = await supabase
    .from('chat_threads')
    .delete()
    .eq('id', threadId);
  if (error) throw error;
};

// Thread'e ait tüm mesajları getir
export const getChatMessages = async (threadId: string): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as ChatMessage[];
};

// Thread'e yeni mesaj ekle
export const addChatMessage = async (args: {
  threadId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}): Promise<ChatMessage> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      thread_id: args.threadId,
      user_id: args.userId,
      role: args.role,
      content: args.content,
    })
    .select()
    .single();
  if (error) throw error;

  // Thread'in updated_at'ini güncelle
  await supabase
    .from('chat_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', args.threadId);

  return data as ChatMessage;
};

// AI öğretmen asistanından yanıt al (Edge Function)
export const askTeacherAssistant = async (args: {
  message: string;
  mode?: 'general' | 'class' | 'child';
  classroom?: string;
  childId?: string;
  history?: { role: 'user' | 'assistant' | 'system'; content: string; at?: string }[];
}) => {
  const { data, error } = await (supabase as any).functions.invoke('teacher_chat', { body: args });
  if (error) throw error;
  return data as { reply: string; used_model?: string; provider_error?: string };
};

