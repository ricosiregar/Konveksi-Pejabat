import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Bot, User, Sparkles, Zap, GitCompare } from "lucide-react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/widgets/button";
import { Textarea } from "@/components/widgets/textarea";
import { supabase } from "@/lib/supabase";
import {
  createSession,
  saveMessage,
  saveComparison,
  updateSessionTitle,
  getMessages,
  type ChatMessage as DBChatMessage,
} from "@/services/chat_service";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  model?: "huggingface" | "pollinations" | "both";
  timestamp: Date;
}

interface ComparisonResult {
  id: string;
  prompt: string;
  huggingface?: { imageBase64?: string; mimeType?: string; loading: boolean; error?: string };
  pollinations?: { imageUrl?: string; loading: boolean; error?: string };
  timestamp: Date;
}

type Mode = "single" | "compare";
type SingleModel = "huggingface" | "pollinations";

const WEBHOOK_URL = "/webhook-test/chat-design";

const examplePrompts = [
  "Jersey bola merah hitam modern",
  "Kemeja kantor biru navy elegan",
  "Kaos pantai warna cerah tropis",
];

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

const callWebhook = async (prompt: string, model: "huggingface" | "pollinations" | "both", messages: Message[]) => {
  const lastMessage: Message = {
    id: Date.now().toString(),
    role: "user",
    content: `/generate ${prompt}`,
    timestamp: new Date(),
  };

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
    body: JSON.stringify({ messages: formatMessagesForApi(messages), lastMessage, model }),
  });

  if (!response.ok) throw new Error(`Error: ${response.status}`);
  const text = await response.text();
  if (!text.trim()) throw new Error("Empty response");
  return JSON.parse(text);
};

// Convert DB message ke UI message
const dbMessageToUIMessage = (msg: DBChatMessage): Message => ({
  id: msg.id,
  role: msg.role,
  content: msg.content,
  imageUrl: msg.image_url || undefined,
  model: msg.model as Message["model"] | undefined,
  timestamp: new Date(msg.created_at),
});

// Convert DB comparison message ke ComparisonResult
const dbMessageToComparison = (msg: DBChatMessage): ComparisonResult => ({
  id: msg.id,
  prompt: msg.prompt || "",
  huggingface: msg.hf_image_base64
    ? { loading: false, imageBase64: msg.hf_image_base64, mimeType: msg.hf_mime_type || "image/jpeg" }
    : { loading: false, error: "Tidak ada gambar" },
  pollinations: msg.poll_image_url
    ? { loading: false, imageUrl: msg.poll_image_url }
    : { loading: false, error: "Tidak ada gambar" },
  timestamp: new Date(msg.created_at),
});

export default function Chat() {
  const location = useLocation();
  const locationState = location.state as { sessionId?: string; newSession?: number } | null;

  const [mode, setMode] = useState<Mode>("compare");
  const [selectedModel, setSelectedModel] = useState<SingleModel>("huggingface");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Halo! Saya adalah Jabat AI 🎨\n\nGunakan mode **Perbandingan** untuk membandingkan hasil dua model sekaligus, atau pilih satu model di mode **Single**.\n\nKetik /generate diikuti deskripsi desain Anda!",
      timestamp: new Date(),
    },
  ]);
  const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const isFirstUserMessage = useRef(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ambil user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  // Handle navigation state — load session atau buat baru
  useEffect(() => {
    if (!userId) return;

    if (locationState?.sessionId) {
      // Load session dari riwayat
      loadSession(locationState.sessionId);
    } else if (locationState?.newSession || !currentSessionId) {
      // Buat sesi baru
      startNewSession(userId, mode);
    }
  }, [userId, locationState?.sessionId, locationState?.newSession]);

  const startNewSession = async (uid: string, currentMode: string) => {
    const session = await createSession(uid, "Chat baru", currentMode);
    if (session) {
      setCurrentSessionId(session.id);
      isFirstUserMessage.current = true;
      // Reset state
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "Halo! Saya adalah Jabat AI 🎨\n\nGunakan mode **Perbandingan** untuk membandingkan hasil dua model sekaligus, atau pilih satu model di mode **Single**.\n\nKetik /generate diikuti deskripsi desain Anda!",
          timestamp: new Date(),
        },
      ]);
      setComparisons([]);
    }
  };

  // Load sesi dari riwayat
  const loadSession = async (sessionId: string) => {
    setIsLoadingHistory(true);
    setCurrentSessionId(sessionId);
    isFirstUserMessage.current = false;

    const dbMessages = await getMessages(sessionId);

    const uiMessages: Message[] = [];
    const uiComparisons: ComparisonResult[] = [];

    for (const msg of dbMessages) {
      if (msg.is_comparison) {
        uiComparisons.push(dbMessageToComparison(msg));
        // Tambahkan pesan teks companion-nya
        uiMessages.push({
          id: msg.id + "-text",
          role: "assistant",
          content: `Perbandingan: "${msg.prompt}"`,
          model: "both",
          timestamp: new Date(msg.created_at),
        });
      } else {
        uiMessages.push(dbMessageToUIMessage(msg));
      }
    }

    setMessages(
      uiMessages.length > 0
        ? uiMessages
        : [
            {
              id: "1",
              role: "assistant",
              content: "Halo! Saya adalah Jabat AI 🎨\n\nGunakan mode **Perbandingan** untuk membandingkan hasil dua model sekaligus, atau pilih satu model di mode **Single**.\n\nKetik /generate diikuti deskripsi desain Anda!",
              timestamp: new Date(),
            },
          ]
    );
    setComparisons(uiComparisons);
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, comparisons]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const isGenerateCommand = (text: string) =>
    text.trim().toLowerCase().startsWith("/generate");

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

    const isGenerate = isGenerateCommand(input);
    const cleanPrompt = input.replace(/\/generate/i, "").trim();

    // Supabase: simpan pesan user
    if (userId && currentSessionId) {
      await saveMessage({
        sessionId: currentSessionId,
        userId,
        role: "user",
        content: input,
        imageUrl: previewImage ?? undefined,
      });
      if (isFirstUserMessage.current) {
        const title = cleanPrompt || input;
        await updateSessionTitle(currentSessionId, title);
        isFirstUserMessage.current = false;
      }
    }

    try {
      if (isGenerate && mode === "compare") {
        const compId = Date.now().toString();
        setComparisons((prev) => [
          ...prev,
          { id: compId, prompt: cleanPrompt, huggingface: { loading: true }, pollinations: { loading: true }, timestamp: new Date() },
        ]);

        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: `Membandingkan dua model untuk: "${cleanPrompt}"`, model: "both", timestamp: new Date() },
        ]);

        try {
          const data = await callWebhook(cleanPrompt, "both", newMessages);
          const fixedPollUrl = data.imageUrl ? fixImageUrl(data.imageUrl) : undefined;

          setComparisons((prev) =>
            prev.map((c) =>
              c.id !== compId ? c : {
                ...c,
                huggingface: data.imageBase64
                  ? { loading: false, imageBase64: data.imageBase64, mimeType: data.mimeType || "image/jpeg" }
                  : { loading: false, error: "Gagal generate" },
                pollinations: fixedPollUrl
                  ? { loading: false, imageUrl: fixedPollUrl }
                  : { loading: false, error: "Gagal generate" },
              }
            )
          );

          if (userId && currentSessionId) {
            await saveComparison({
              sessionId: currentSessionId,
              userId,
              prompt: cleanPrompt,
              hfImageBase64: data.imageBase64,
              hfMimeType: data.mimeType || "image/jpeg",
              pollImageUrl: fixedPollUrl,
            });
          }
        } catch {
          setComparisons((prev) =>
            prev.map((c) =>
              c.id !== compId ? c : {
                ...c,
                huggingface: { loading: false, error: "Gagal generate" },
                pollinations: { loading: false, error: "Gagal generate" },
              }
            )
          );
        }
      } else if (isGenerate && mode === "single") {
        const data = await callWebhook(cleanPrompt, selectedModel, newMessages);

        let finalImageUrl: string | undefined;
        if (data.imageUrl) finalImageUrl = fixImageUrl(data.imageUrl);
        else if (data.imageBase64) finalImageUrl = `data:${data.mimeType || "image/jpeg"};base64,${data.imageBase64}`;

        const singleContent = finalImageUrl
          ? `Hasil dari ${selectedModel === "huggingface" ? "Stable Diffusion" : "Pollinations Flux"}:`
          : "Maaf, gagal membuat gambar.";

        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "assistant", content: singleContent, imageUrl: finalImageUrl, model: selectedModel, timestamp: new Date() },
        ]);

        if (userId && currentSessionId) {
          await saveMessage({ sessionId: currentSessionId, userId, role: "assistant", content: singleContent, imageUrl: finalImageUrl, model: selectedModel });
        }
      } else {
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
          body: JSON.stringify({ messages: formatMessagesForApi(newMessages), lastMessage: userMessage, model: "huggingface" }),
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

        if (userId && currentSessionId) {
          await saveMessage({ sessionId: currentSessionId, userId, role: "assistant", content: chatContent });
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

  const renderComparison = (comp: ComparisonResult) => (
    <div key={comp.id} className="mx-auto max-w-3xl">
      <p className="text-xs text-muted-foreground mb-3 text-center">
        Perbandingan: <span className="font-medium text-foreground">"{comp.prompt}"</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40">
            <div className="h-2 w-2 rounded-full bg-orange-400" />
            <span className="text-xs font-semibold">Stable Diffusion</span>
            <span className="ml-auto text-[10px] text-muted-foreground">HuggingFace</span>
          </div>
          <div className="aspect-square bg-muted/20 flex items-center justify-center">
            {comp.huggingface?.loading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="h-2 w-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Generating...</span>
              </div>
            ) : comp.huggingface?.error ? (
              <p className="text-xs text-destructive px-3 text-center">{comp.huggingface.error}</p>
            ) : comp.huggingface?.imageBase64 ? (
              <img
                src={`data:${comp.huggingface.mimeType};base64,${comp.huggingface.imageBase64}`}
                alt="HuggingFace result"
                className="w-full h-full object-cover"
                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
              />
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40">
            <div className="h-2 w-2 rounded-full bg-violet-400" />
            <span className="text-xs font-semibold">Flux</span>
            <span className="ml-auto text-[10px] text-muted-foreground">Pollinations</span>
          </div>
          <div className="aspect-square bg-muted/20 flex items-center justify-center">
            {comp.pollinations?.loading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span key={delay} className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">Generating...</span>
              </div>
            ) : comp.pollinations?.error ? (
              <p className="text-xs text-destructive px-3 text-center">{comp.pollinations.error}</p>
            ) : comp.pollinations?.imageUrl ? (
              <PollinationsImage src={comp.pollinations.imageUrl} alt="Pollinations result" className="w-full h-full object-cover" />
            ) : null}
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-right mt-1">
        {comp.timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );

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

        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              onClick={() => setMode("compare")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                mode === "compare" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <GitCompare className="h-3.5 w-3.5" />
              Perbandingan
            </button>
            <button
              onClick={() => setMode("single")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                mode === "single" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              Single
            </button>
          </div>

          {mode === "single" && (
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
              <button
                onClick={() => setSelectedModel("huggingface")}
                className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  selectedModel === "huggingface" ? "bg-orange-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                Stable Diffusion
              </button>
              <button
                onClick={() => setSelectedModel("pollinations")}
                className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  selectedModel === "pollinations" ? "bg-violet-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                Flux
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">Online</span>
          </div>
        </div>
      </div>

      {/* Loading history indicator */}
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

          {comparisons.map((comp) => renderComparison(comp))}

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
                <span className="text-xs text-muted-foreground">
                  {mode === "compare" ? "Membandingkan dua model..." : "Membuat desain..."}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Example prompts */}
      {messages.length === 1 && !isLoadingHistory && (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-xs font-medium text-muted-foreground">💡 Coba contoh prompt:</p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, i) => (
                <button key={i} onClick={() => setInput(`/generate ${prompt}`)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted hover:border-primary/40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <div className="relative flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === "compare" ? "Gunakan /generate untuk membandingkan dua model..." : `Gunakan /generate dengan ${selectedModel === "huggingface" ? "Stable Diffusion" : "Flux"}...`}
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