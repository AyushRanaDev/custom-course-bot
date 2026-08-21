import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const MESSAGES_KEY = "logiclore.tutor.messages.v1";

function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(MESSAGES_KEY);
    return raw ? (JSON.parse(raw) as UIMessage[]) : [];
  } catch {
    return [];
  }
}

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

type Props = {
  knowledge: string;
  lessonTitle: string;
  depth: string;
  pendingPrompt: string | null;
  onPromptConsumed: () => void;
};

export function TutorChat({ knowledge, lessonTitle, depth, pendingPrompt, onPromptConsumed }: Props) {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInitial(loadMessages());
  }, []);

  const contextRef = useRef({ knowledge, lessonTitle, depth });
  contextRef.current = { knowledge, lessonTitle, depth };

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: {
            messages,
            context: {
              knowledge: contextRef.current.knowledge,
              lesson: contextRef.current.lessonTitle,
              depth: contextRef.current.depth,
            },
          },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status } = useChat({
    id: "logiclore-tutor",
    messages: initial ?? [],
    transport,
    onError: (error) => toast.error(error.message || "The tutor could not answer that request."),
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (typeof window === "undefined" || initial === null) return;
    window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }, [messages, initial]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (!busy) inputRef.current?.focus();
  }, [busy]);

  useEffect(() => {
    if (!pendingPrompt || busy) return;
    void sendMessage({ text: pendingPrompt });
    onPromptConsumed();
  }, [pendingPrompt, busy, sendMessage, onPromptConsumed]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void sendMessage({ text });
  };

  return (
    <div className="flex h-full flex-col bg-panel/60">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-accent" />
          <span className="font-mono text-xs font-bold">AI TUTOR SIBYL</span>
        </div>
        <span className="label-mono text-muted-foreground">Context: {lessonTitle.slice(0, 22)}</span>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex flex-col gap-1">
            <span className="label-mono text-muted-foreground">SYSTEM</span>
            <div className="rounded-lg rounded-tl-none bg-track/60 p-3 text-sm">
              I can see your knowledge state. Ask me anything about {lessonTitle}, or tell me which part felt shaky
              and I&apos;ll re-explain it at your level.
            </div>
          </div>
        )}

        {messages.map((message) => {
          const text = textOf(message);
          if (!text) return null;
          const isUser = message.role === "user";
          return (
            <div key={message.id} className={`flex flex-col gap-1 ${isUser ? "items-end" : ""}`}>
              <span className={`label-mono ${isUser ? "text-muted-foreground" : "font-bold text-accent"}`}>
                {isUser ? "YOU" : "SIBYL"}
              </span>
              <div
                className={
                  isUser
                    ? "max-w-[92%] rounded-lg rounded-tr-none bg-accent p-3 text-sm text-accent-foreground"
                    : "max-w-[95%] rounded-lg rounded-tl-none border border-border bg-surface p-3 text-sm shadow-sm"
                }
              >
                {isUser ? (
                  text
                ) : (
                  <div className="prose prose-sm max-w-none prose-pre:bg-ink prose-pre:text-ink-foreground">
                    <ReactMarkdown>{text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {status === "submitted" && (
          <div className="flex flex-col gap-1">
            <span className="label-mono font-bold text-accent">SIBYL</span>
            <div className="flex w-fit gap-1 rounded-lg rounded-tl-none border border-border bg-surface p-3">
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="border-t border-border bg-surface p-4">
        <div className="relative">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a follow-up..."
            className="w-full rounded-lg border border-border bg-muted py-3 pl-4 pr-10 text-sm transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send message"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-muted-foreground transition-colors hover:text-accent disabled:opacity-40"
          >
            <span className="text-xs">↵</span>
          </button>
        </div>
      </form>
    </div>
  );
}
