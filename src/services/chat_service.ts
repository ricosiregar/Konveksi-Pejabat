import { supabase } from "@/lib/supabase";

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  mode: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  image_url?: string;
  model?: string;
  hf_image_base64?: string;
  hf_mime_type?: string;
  poll_image_url?: string;
  is_comparison: boolean;
  prompt?: string;
  created_at: string;
}

// ─── SESSION ───────────────────────────────────────────

// Buat sesi baru
export const createSession = async (
  userId: string,
  title: string,
  mode: string
): Promise<ChatSession | null> => {
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: userId, title, mode })
    .select()
    .single();

  if (error) {
    console.error("Error creating session:", error);
    return null;
  }
  return data;
};

// Ambil semua sesi user (diurutkan terbaru dulu)
export const getSessions = async (userId: string): Promise<ChatSession[]> => {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }
  return data || [];
};

// Update judul sesi (diambil dari pesan pertama user)
export const updateSessionTitle = async (
  sessionId: string,
  title: string
): Promise<void> => {
  await supabase
    .from("chat_sessions")
    .update({ title: title.slice(0, 60) }) // max 60 karakter
    .eq("id", sessionId);
};

// Hapus sesi
export const deleteSession = async (sessionId: string): Promise<void> => {
  await supabase.from("chat_sessions").delete().eq("id", sessionId);
};

// ─── MESSAGES ──────────────────────────────────────────

// Simpan pesan biasa (teks / single model image)
export const saveMessage = async (params: {
  sessionId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  model?: string;
}): Promise<void> => {
  const { error } = await supabase.from("chat_messages").insert({
    session_id: params.sessionId,
    user_id: params.userId,
    role: params.role,
    content: params.content,
    image_url: params.imageUrl || null,
    model: params.model || null,
    is_comparison: false,
  });

  if (error) console.error("Error saving message:", error);
};

// Simpan hasil comparison (HF + Pollinations)
export const saveComparison = async (params: {
  sessionId: string;
  userId: string;
  prompt: string;
  hfImageBase64?: string;
  hfMimeType?: string;
  pollImageUrl?: string;
}): Promise<void> => {
  const { error } = await supabase.from("chat_messages").insert({
    session_id: params.sessionId,
    user_id: params.userId,
    role: "assistant",
    content: `Perbandingan: "${params.prompt}"`,
    is_comparison: true,
    prompt: params.prompt,
    hf_image_base64: params.hfImageBase64 || null,
    hf_mime_type: params.hfMimeType || null,
    poll_image_url: params.pollImageUrl || null,
    model: "both",
  });

  if (error) console.error("Error saving comparison:", error);
};

// Ambil semua pesan dalam sesi
export const getMessages = async (
  sessionId: string
): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data || [];
};

// Helper: format waktu relatif untuk sidebar
export const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return `${Math.floor(diffDays / 30)} bulan lalu`;
};