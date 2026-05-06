import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Bot, User, Sparkles } from "lucide-react";
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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  model?: "pollinations";
  timestamp: Date;
}

const WEBHOOK_URL = "/webhook-test/chat-design";



const formatMessagesForApi = (messages: Message[]) =>
  messages
    .filter((msg) => !msg.imageUrl)
    .map(({ role, content }) => ({ role, parts: [{ text: content }] }));

const fixImageUrl = (url: string): string =>
  url.startsWith("=") ? url.slice(1) : url;

function PollinationsImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [imgKey, setImgKey] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const attemptRef = useRef(0);
  const maxRetries = 12;
  const retryDelay = 5000;

  useEffect(() => {
    setStatus("loading");
    attemptRef.current = 0;
    setImgKey(0);
  }, [src]);

  const handleError = () => {
    if (attemptRef.current < maxRetries) {
      attemptRef.current += 1;
      setTimeout(() => setImgKey((k) => k + 1), retryDelay);
    } else {
      setStatus("error");
    }
  };

  const directUrl = src.startsWith("/pollinations")
    ? src.replace("/pollinations", "https://image.pollinations.ai")
    : src;

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-2 px-3 text-center">
        <p className="text-xs text-destructive">Gagal memuat gambar</p>
        <a href={directUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 underline">
          Buka di tab baru ↗
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[200px]">
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
          <div className="flex gap-1">
            {[0, 150, 300].map((delay) => (
              <span key={delay} className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {attemptRef.current > 0 ? `Menunggu... (${attemptRef.current}/${maxRetries})` : "Generating..."}
          </span>
        </div>
      )}
      <img
        key={imgKey}
        src={`${directUrl}&_r=${imgKey}`}
        alt={alt}
        className={className}
        style={{ opacity: status === "loaded" ? 1 : 0, position: status === "loaded" ? "relative" : "absolute" }}
        onLoad={() => setStatus("loaded")}
        onError={handleError}
      />
    </div>
  );
}

const callWebhook = async (prompt: string, messages: Message[]) => {
  const lastMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content: `/buatkan ${prompt}`,
    timestamp: new Date(),
  };

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
    body: JSON.stringify({ messages: formatMessagesForApi(messages), lastMessage, model: "pollinations" }),
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
    content: "Halo! Saya adalah Jabat AI 🎨\n\nKetik /buatkan diikuti deskripsi desain Anda, dan saya akan membuatkan gambarnya!\n\nContoh: /buatkan kucing biru",
    timestamp: new Date(),
  },
];

export default function Chat() {
  const location = useLocation();
  const locationState = location.state as { sessionId?: string; newSession?: number } | null;

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const sessionCreatedRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (locationState?.sessionId) {
      loadSession(locationState.sessionId);
    } else if (locationState?.newSession) {
      resetToNewChat();
    }
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const isBuatkanCommand = (text: string) =>
    text.trim().toLowerCase().startsWith("/buatkan");

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      imageUrl: previewImage ?? undefined,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setPreviewImage(null);
    setIsLoading(true);

    const isGenerate = isBuatkanCommand(input);
    const cleanPrompt = input.replace(/\/buatkan/i, "").trim();

    const sessionId = await ensureSession();

    if (userId && sessionId) {
      await saveMessage({
        sessionId,
        userId,
        role: "user",
        content: input,
        imageUrl: previewImage ?? undefined,
      });

      const isFirstMessage = messages.length === 1 && messages[0].id === "welcome";
      if (isFirstMessage) {
        await updateSessionTitle(sessionId, cleanPrompt || input);
      }
    }

    try {
      if (isGenerate) {
        const data = await callWebhook(cleanPrompt, newMessages);

        let finalImageUrl: string | undefined;
        if (data.imageUrl) finalImageUrl = fixImageUrl(data.imageUrl);
        else if (data.imageBase64) finalImageUrl = `data:${data.mimeType || "image/jpeg"};base64,${data.imageBase64}`;

        const content = finalImageUrl ? `Hasil desain untuk: "${cleanPrompt}"` : "Maaf, gagal membuat gambar.";

        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content,
          imageUrl: finalImageUrl,
          model: "pollinations",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (userId && sessionId) {
          await saveMessage({ sessionId, userId, role: "assistant", content, imageUrl: finalImageUrl, model: "pollinations" });
        }
      } else {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
          body: JSON.stringify({ messages: formatMessagesForApi(newMessages), lastMessage: userMessage, model: "pollinations" }),
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

        if (userId && sessionId) {
          await saveMessage({ sessionId, userId, role: "assistant", content: chatContent });
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: `Maaf, terjadi kesalahan: ${error instanceof Error ? error.message : "Unknown error"}`, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
        <div className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Online</span>
        </div>
      </div>

      {/* Loading history */}
      {isLoadingHistory && (
        <div className="flex items-center justify-center gap-2 py-3 bg-muted/30 border-b border-border">
          <div className="flex gap-1">
            {[0, 150, 300].map((delay) => (
              <span key={delay} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${delay}ms` }} />
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
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                message.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted border border-border"
              )}>
                {message.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className={cn("flex max-w-[78%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm",
                message.role === "assistant" ? "bg-card border border-border text-foreground rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm"
              )}>
                {message.imageUrl && message.role === "user" && (
                  <img src={message.imageUrl} alt="Uploaded" className="mb-1 max-h-40 w-auto rounded-lg object-cover" />
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                {message.imageUrl && message.role === "assistant" && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-border">
                    <img src={message.imageUrl} alt="Generated" className="w-full" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                  </div>
                )}
                <span className={cn("text-[10px] self-end", message.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/60")}>
                  {message.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
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
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Membuat desain...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Image preview */}
      {previewImage && (
        <div className="border-t border-border bg-card px-4 pt-3">
          <div className="mx-auto max-w-3xl">
            <div className="relative inline-block">
              <img src={previewImage} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-border" />
              <button onClick={() => setPreviewImage(null)} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <button onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Paperclip className="h-4 w-4" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
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
          <Button onClick={handleSend} disabled={!input.trim() || isLoading || isLoadingHistory} className="h-10 w-10 shrink-0 rounded-xl p-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}