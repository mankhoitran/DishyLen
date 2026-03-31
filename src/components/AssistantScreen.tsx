import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Sparkles } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const SUGGESTIONS = [
  "What's the healthiest dish?",
  "Any gluten-free options?",
  "Low calorie meals?",
  "High protein dishes?",
];

const BOT_RESPONSES: Record<string, string> = {
  "what's the healthiest dish?":
    "Based on your last scan, the **Grilled Salmon Bowl** is the best choice! It has 42g protein, healthy omega-3 fats, and only 620 calories. The quinoa base adds fiber and complex carbs. 🐟",
  "any gluten-free options?":
    "From the scanned menu, **Grilled Salmon Bowl** and **Thai Green Curry** are both gluten-free! The Caesar Salad and Risotto contain gluten from croutons and arborio rice respectively. 🌾",
  "low calorie meals?":
    "The **Caesar Salad** at 320 cal is your lightest option. The **Thai Green Curry** at 480 cal is also moderate. I'd recommend the salad if you're counting calories! 🥗",
  "high protein dishes?":
    "The **Grilled Salmon Bowl** leads with 42g protein, followed by **Thai Green Curry** at 32g. Both are excellent choices for muscle recovery! 💪",
};

function getBotResponse(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const [key, val] of Object.entries(BOT_RESPONSES)) {
    if (lower.includes(key.split(" ").slice(0, 3).join(" ")) || key.includes(lower.slice(0, 15))) {
      return val;
    }
  }
  return `Great question! Based on the menu I analyzed, I'd recommend checking the nutritional breakdown for each dish. Want me to compare specific items? 🍽️`;
}

const AssistantScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hey there! 👋 I'm your food assistant. Ask me anything about the menu — nutrition, allergens, or recommendations!",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(text),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Bot size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-foreground text-lg">DishyLen AI</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Online — Ready to help
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-40">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card text-card-foreground border border-border rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
            </div>
          </motion.div>
        )}

        {/* Suggestions (show only when 1 message) */}
        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-2"
          >
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
              <Sparkles size={12} /> Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs bg-card border border-border text-foreground px-3 py-2 rounded-full hover:bg-secondary transition-colors active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-3 bg-background/90 backdrop-blur-md border-t border-border">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the menu..."
            className="flex-1 bg-card border border-border rounded-full px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-90 transition-all"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AssistantScreen;
