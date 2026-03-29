import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/widgets/button";
import { Textarea } from "@/components/widgets/textarea";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

const examplePrompts = [
  "Buatkan desain jersey bola warna merah dengan aksen hitam",
  "Desain kemeja kantor biru navy dengan logo perusahaan",
  "Kaos tim outing dengan tema pantai dan warna cerah",
];

// Format messages untuk API
const formatMessagesForApi = (messages: Message[]) => {
  return messages
    .filter((msg) => !msg.imageUrl)
    .map(({ role, content }) => ({
      role,
      parts: [{ text: content }],
    }));
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Halo! Saya adalah Jabat AI, asisten desain konveksi Anda. Ceritakan desain apa yang ingin Anda buat hari ini? 🎨\n\nGunakan perintah /generate di awal pesan untuk langsung membuat gambar desain.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    try {
      const webhookUrl = "/webhook-test/chat-design";
      const apiMessages = formatMessagesForApi(newMessages);

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          messages: apiMessages,
          lastMessage: userMessage,
        }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const responseText = await response.text();
      if (!responseText.trim()) throw new Error("Empty response");

      const data = JSON.parse(responseText);

      if (data.type === "image") {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: data.imageUrl
              ? "Berikut desain yang sudah saya buat untuk Anda:"
              : "Maaf, gagal membuat gambar. Coba lagi ya.",
            imageUrl: data.imageUrl,
            timestamp: new Date(),
          },
        ]);
      } else if (data.type === "text") {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: data.content || "Maaf, saya tidak bisa memproses itu.",
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Maaf, terjadi kesalahan: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Silakan coba lagi.`,
          timestamp: new Date(),
        },
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  message.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted border border-border"
                )}
              >
                {message.role === "assistant" ? (
                  <Bot className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "flex max-w-[78%] flex-col gap-2 rounded-2xl px-4 py-3 text-sm shadow-sm",
                  message.role === "assistant"
                    ? "bg-card border border-border text-foreground rounded-tl-sm"
                    : "bg-primary text-primary-foreground rounded-tr-sm"
                )}
              >
                {/* Image preview (user upload) */}
                {message.imageUrl && message.role === "user" && (
                  <img
                    src={message.imageUrl}
                    alt="Uploaded reference"
                    className="mb-1 max-h-40 w-auto rounded-lg object-cover"
                  />
                )}

                <p className="leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* Generated image */}
                {message.imageUrl && message.role === "assistant" && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-border">
                    <img
                      src={message.imageUrl}
                      alt="Generated Design"
                      className="w-full"
                    />
                  </div>
                )}

                <span
                  className={cn(
                    "text-[10px] self-end",
                    message.role === "assistant"
                      ? "text-muted-foreground"
                      : "text-primary-foreground/60"
                  )}
                >
                  {message.timestamp.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* Loading dots */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span
                    className="h-2 w-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-2 w-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  Membuat desain...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Example prompts — only on first message */}
      {messages.length === 1 && (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              💡 Coba contoh prompt:
            </p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted hover:border-primary/40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image preview strip */}
      {previewImage && (
        <div className="border-t border-border bg-card px-4 pt-3">
          <div className="mx-auto max-w-3xl">
            <div className="relative inline-block">
              <img
                src={previewImage}
                alt="Preview"
                className="h-16 w-16 rounded-lg object-cover border border-border"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Upload gambar referensi"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Textarea */}
          <div className="relative flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Deskripsikan desain atau gunakan /generate..."
              className="min-h-[42px] max-h-32 resize-none rounded-xl bg-background pr-4 text-sm"
              rows={1}
              disabled={isLoading}
            />
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-10 w-10 shrink-0 rounded-xl p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}