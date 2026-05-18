import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/widgets/button";
import { Textarea } from "@/components/widgets/textarea";
import { supabase } from "@/lib/supabase";
import {
  createSession,
  saveMessage,
  updateSessionTitle,
  getMessages,
  type ChatMessage as DBChatMessage,
} from "@/services/chat_service";

// ─── Types ────────────────────────────────────────────────────────────────────

type ShirtColor = "white" | "black" | "blue" | "red" | "green";

interface ColorOption {
  value: ShirtColor;
  label: string;
  hex: string;
  textColor: string;
  border: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  model?: "pollinations";
  timestamp: Date;
  pendingPrompt?: string;
  awaitingColorChoice?: boolean;
}

const WEBHOOK_URL = "http://202.155.143.186:5678/webhook/chat-design";

const COLOR_OPTIONS: ColorOption[] = [
  { value: "white", label: "Putih", hex: "#FFFFFF", textColor: "#374151", border: "#D1D5DB" },
  { value: "black", label: "Hitam", hex: "#1F2937", textColor: "#FFFFFF", border: "#1F2937" },
  { value: "blue",  label: "Biru",  hex: "#2563EB", textColor: "#FFFFFF", border: "#2563EB" },
  { value: "red",   label: "Merah", hex: "#DC2626", textColor: "#FFFFFF", border: "#DC2626" },
  { value: "green", label: "Hijau", hex: "#16A34A", textColor: "#FFFFFF", border: "#16A34A" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatMessagesForApi = (messages: Message[]) =>
  messages
    .filter((m) => !m.imageUrl && !m.awaitingColorChoice)
    .map(({ role, content }) => ({ role, parts: [{ text: content }] }));

// ─── ColorPickerBubble ────────────────────────────────────────────────────────

function ColorPickerBubble({
  prompt,
  onSelect,
  disabled,
}: {
  prompt: string;
  onSelect: (color: ShirtColor) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<ShirtColor | null>(null);

  const handleClick = (color: ShirtColor) => {
    if (disabled || selected) return;
    setSelected(color);
    onSelect(color);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed">
        Desain <span className="font-semibold">"{prompt}"</span> siap dibuat! 🎨
        <br />
        <span className="text-xs text-muted-foreground">Pilih warna dasar baju:</span>
      </p>

      <div className="flex flex-wrap gap-2">
        {COLOR_OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          const isDone = selected !== null;
          return (
            <button
              key={opt.value}
              onClick={() => handleClick(opt.value)}
              disabled={isDone}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all duration-150",
                isSelected ? "ring-2 ring-primary ring-offset-2 scale-105" : "hover:scale-105 active:scale-95",
                isDone && !isSelected ? "opacity-35 cursor-not-allowed" : "cursor-pointer shadow-sm"
              )}
              style={{
                background: opt.hex,
                color: opt.textColor,
                borderColor: opt.border,
              }}
            >
              {isSelected && <span>✓</span>}
              {opt.label}
            </button>
          );
        })}
      </div>

      {selected && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Sedang membuat mockup, mohon tunggu...
        </p>
      )}
    </div>
  );
}

// ─── Webhook ──────────────────────────────────────────────────────────────────

const callWebhook = async (prompt: string, color: ShirtColor, messages: Message[]) => {
  const lastMessage = {
    id: Date.now().toString(),
    role: "user" as const,
    content: `/buatkan ${prompt}`,
    timestamp: new Date(),
  };

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
    body: JSON.stringify({
      messages: formatMessagesForApi(messages),
      lastMessage,
      model: "pollinations",
      shirtColor: color,
    }),
  });

  if (!response.ok) throw new Error(`Error: ${response.status}`);
  const text = await response.text();
  if (!text.trim()) throw new Error("Empty response");
  return JSON.parse(text);
};

const dbMessageToUIMessage = (msg: DBChatMessage): Message => ({
  id: msg.id,
  role: msg.role,
  content: msg.content,
  imageUrl: msg.image_url || undefined,
  model: "pollinations",
  timestamp: new Date(msg.created_at),
});

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "Halo! Saya adalah Jabat AI 🎨\n\nKetik /buatkan diikuti deskripsi desain Anda. Setelah itu pilih warna baju sesuai keinginan, lalu saya buatkan mockupnya!\n\nContoh: /buatkan kucing biru",
    timestamp: new Date(),
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Chat() {
  const location = useLocation();
  const locationState = location.state as { sessionId?: string; newSession?: number } | null;

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const sessionCreatedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (locationState?.sessionId) loadSession(locationState.sessionId);
    else if (locationState?.newSession) resetToNewChat();
  }, [userId, locationState?.sessionId, locationState?.newSession]);

  const resetToNewChat = () => {
    setCurrentSessionId(null);
    sessionCreatedRef.current = false;
    setMessages(INITIAL_MESSAGES);
    setInput("");
  };

  const ensureSession = async (): Promise<string | null> => {
    if (currentSessionId) return currentSessionId;
    if (!userId) return null;
    const session = await createSession(userId, "Chat baru", "single");
    if (session) {
      setCurrentSessionId(session.id);
      sessionCreatedRef.current = true;
      return session.id;
    }
    return null;
  };

  const loadSession = async (sessionId: string) => {
    setIsLoadingHistory(true);
    setCurrentSessionId(sessionId);
    sessionCreatedRef.current = true;
    const dbMessages = await getMessages(sessionId);
    const uiMessages = dbMessages.map(dbMessageToUIMessage);
    setMessages(uiMessages.length > 0 ? uiMessages : INITIAL_MESSAGES);
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Color selected by user ──────────────────────────────────────────────────
  const handleColorSelected = async (messageId: string, prompt: string, color: ShirtColor) => {
    setMessages((prev) =>
      prev.map((m) => m.id === messageId ? { ...m, awaitingColorChoice: false } : m)
    );
    setIsLoading(true);

    const sessionId = await ensureSession();
    const colorLabel = COLOR_OPTIONS.find((c) => c.value === color)?.label ?? color;

    if (userId && sessionId) {
      await saveMessage({ sessionId, userId, role: "user", content: `Pilih warna: ${colorLabel}` });
    }

    try {
      const data = await callWebhook(prompt, color, messages);

      if (data.imageBase64) {
        const imgUrl = `data:${data.mimeType || "image/jpeg"};base64,${data.imageBase64}`;
        const content = `Mockup "${prompt}" — ${colorLabel}`;

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content,
            imageUrl: imgUrl,
            model: "pollinations",
            timestamp: new Date(),
          },
        ]);

        if (userId && sessionId)
          await saveMessage({ sessionId, userId, role: "assistant", content, imageUrl: imgUrl, model: "pollinations" });
      } else {
        throw new Error("Tidak ada gambar di respons.");
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Maaf, gagal membuat mockup: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const isGenerate = input.trim().toLowerCase().startsWith("/buatkan");
    const cleanPrompt = input.replace(/\/buatkan/i, "").trim();
    const sessionId = await ensureSession();

    if (userId && sessionId) {
      await saveMessage({ sessionId, userId, role: "user", content: input });
      const isFirst = messages.length === 1 && messages[0].id === "welcome";
      if (isFirst) await updateSessionTitle(sessionId, cleanPrompt || input);
    }

    if (isGenerate) {
      setMessages((prev) => [
        ...prev,
        {
          id: `picker-${Date.now()}`,
          role: "assistant",
          content: "",
          pendingPrompt: cleanPrompt,
          awaitingColorChoice: true,
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // Plain chat
    setIsLoading(true);
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
        body: JSON.stringify({
          messages: formatMessagesForApi([...messages, userMessage]),
          lastMessage: userMessage,
          model: "pollinations",
        }),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const text = await response.text();
      if (!text.trim()) throw new Error("Empty response");
      const data = JSON.parse(text);
      const chatContent = data.content || "Maaf, tidak bisa memproses itu.";

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: chatContent, timestamp: new Date() },
      ]);
      if (userId && sessionId)
        await saveMessage({ sessionId, userId, role: "assistant", content: chatContent });
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Maaf, terjadi kesalahan: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-card/50 px-6 py-3 backdrop-blur-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">Jabat AI</p>
          <p className="text-xs text-muted-foreground">Asisten Desain Konveksi</p>
        </div>
      </div>

      {isLoadingHistory && (
        <div className="flex items-center justify-center gap-2 py-3 bg-muted/30 border-b border-border">
          <div className="flex gap-1">
            {[0, 150, 300].map((d) => (
              <span key={d} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">Memuat riwayat chat...</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                message.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted border border-border"
              )}>
                {message.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4 text-muted-foreground" />}
              </div>

              <div className={cn(
                "flex flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm max-w-[78%]",
                message.role === "assistant"
                  ? "bg-card border border-border text-foreground rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              )}>
                {/* Color picker */}
                {message.awaitingColorChoice && message.pendingPrompt ? (
                  <ColorPickerBubble
                    prompt={message.pendingPrompt}
                    onSelect={(color) => handleColorSelected(message.id, message.pendingPrompt!, color)}
                    disabled={isLoading}
                  />
                ) : (
                  message.content && <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}

                {/* Mockup image */}
                {message.imageUrl && message.role === "assistant" && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-border">
                    <img
                      src={message.imageUrl}
                      alt="Generated mockup"
                      className="w-full"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                    />
                  </div>
                )}

                {!message.awaitingColorChoice && (
                  <span className={cn(
                    "text-[10px] self-end",
                    message.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/60"
                  )}>
                    {message.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Membuat mockup...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <div className="relative flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik /buatkan lalu deskripsi desain Anda..."
              className="min-h-[42px] max-h-32 resize-none rounded-xl bg-background pr-4 text-sm"
              rows={1}
              disabled={isLoading || isLoadingHistory}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isLoadingHistory}
            className="h-10 w-10 shrink-0 rounded-xl p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}