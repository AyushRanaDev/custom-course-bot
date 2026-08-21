import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = {
  messages?: unknown;
  context?: { knowledge?: string; lesson?: string; depth?: string };
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const system = [
          "You are Sibyl, an adaptive AI tutor for computer science students inside the LogicLore learning app.",
          "You teach adaptively: adjust depth, vocabulary and examples to the learner's current mastery.",
          "Be concise (under 130 words unless asked to go deep), use concrete analogies, and end with one short check-for-understanding question when it helps.",
          "Use markdown, and fenced code blocks for code. Never invent the learner's progress numbers — use the state given below.",
          body.context?.knowledge ? `Learner state: ${body.context.knowledge}` : "",
          body.context?.lesson ? `Current lesson: ${body.context.lesson}` : "",
          body.context?.depth ? `Current explanation depth: ${body.context.depth}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway("google/gemini-3.7-flash"),
            system,
            messages: convertToModelMessages(messages as UIMessage[]),
            abortSignal: request.signal,
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
          });
        } catch (error) {
          const status =
            typeof error === "object" && error && "statusCode" in error
              ? Number((error as { statusCode?: number }).statusCode) || 500
              : 500;
          const message =
            status === 429
              ? "The tutor is rate limited right now. Try again in a moment."
              : status === 402
                ? "AI credits are exhausted for this workspace. Add credits in Lovable to keep tutoring."
                : "The tutor could not answer that request.";
          return new Response(message, { status });
        }
      },
    },
  },
});
