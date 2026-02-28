import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { MessageSquare, Image, Palette, Shirt } from "lucide-react";

const actions = [
  {
    icon: MessageSquare,
    title: "Mulai Chat",
    description: "Buat desain dengan AI",
    path: "/chat",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Shirt,
    title: "Jersey & Kaos",
    description: "Desain pakaian olahraga",
    path: "/chat?type=jersey",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Palette,
    title: "Kemeja Formal",
    description: "Desain kemeja kantor",
    path: "/chat?type=shirt",
    color: "from-violet-500 to-purple-500",
  },
];

export function QuickActions() {
  return (
    <div className="animate-fade-in opacity-0" style={{ animationDelay: "300ms" }}>
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        Aksi Cepat
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {actions.map((action, index) => (
          <Link
            key={action.path}
            to={action.path}
            className={cn(
              "group relative overflow-hidden rounded-xl p-5 transition-all",
              "bg-card border border-border/50 hover:border-transparent",
              "shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)]",
              "animate-fade-in opacity-0"
            )}
            style={{ animationDelay: `${350 + index * 50}ms` }}
          >
            {/* Background gradient on hover */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-10",
                action.color
              )}
            />
            
            <div
              className={cn(
                "mb-3 inline-flex rounded-lg bg-gradient-to-br p-2.5",
                action.color
              )}
            >
              <action.icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-foreground">{action.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
