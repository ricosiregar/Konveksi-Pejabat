import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Bot, User, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/widgets/button";
import { Textarea } from "@/components/widgets/textarea";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: Date;
}

const examplePrompts = [
  "Buatkan desain jersey bola warna merah dengan aksen hitam",
  "Desain kemeja kantor biru navy dengan logo perusahaan",
  "Kaos tim outing dengan tema pantai",
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Halo! Saya adalah Jabat AI, asisten desain konveksi Anda. Ceritakan desain apa yang ingin Anda buat hari ini? 🎨",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Saya sedang memproses permintaan desain Anda. Untuk menggunakan fitur generate gambar, pastikan Anda sudah menghubungkan n8n webhook. Saat ini saya hanya bisa memberikan preview simulasi.",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-4 animate-fade-in opacity-0",
                message.role === "user" ? "flex-row-reverse" : ""
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                  message.role === "assistant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.role === "assistant" ? (
                  <Bot className="h-5 w-5" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              <div
                className={cn(
                  "flex max-w-[80%] flex-col gap-2 rounded-2xl px-4 py-3",
                  message.role === "assistant"
                    ? "bg-card border border-border"
                    : "bg-primary text-primary-foreground"
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.image && (
                  <div className="mt-2 overflow-hidden rounded-lg">
                    <img
                      src={message.image}
                      alt="Generated design"
                      className="w-full max-w-sm"
                    />
                  </div>
                )}
                <span
                  className={cn(
                    "text-xs",
                    message.role === "assistant"
                      ? "text-muted-foreground"
                      : "text-primary-foreground/70"
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

          {isLoading && (
            <div className="flex gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm text-muted-foreground">Membuat desain...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Example Prompts */}
      {messages.length === 1 && (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Coba contoh prompt:
            </p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInput(prompt)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-3xl gap-3">
          <div className="relative flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Deskripsikan desain yang Anda inginkan..."
              className="min-h-[52px] resize-none pr-12 bg-background"
              rows={1}
            />
            <button className="absolute bottom-3 right-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Image className="h-5 w-5" />
            </button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="h-auto bg-[var(--hero-gradient)] px-4 hover:opacity-90"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
