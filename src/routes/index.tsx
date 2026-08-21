import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TutorChat } from "@/components/TutorChat";
import {
  depthLabels,
  depthForMastery,
  getLesson,
  lessons,
  topics,
  type Depth,
} from "@/lib/curriculum";
import { knowledgeSummary, recommendedLesson, useLearnerState } from "@/lib/learner-state";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LogicLore — Adaptive AI Tutor for CS Students" },
      {
        name: "description",
        content:
          "An adaptive learning workspace for computer science: mastery tracking, depth-adjusted lessons, instant assessment feedback and an AI tutor that knows your knowledge state.",
      },
      { property: "og:title", content: "LogicLore — Adaptive AI Tutor for CS Students" },
      {
        property: "og:description",
        content:
          "Track your evolving knowledge state across data structures, algorithms and operating systems while an AI tutor adapts every explanation to you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { state, hydrated, setActiveLesson, setDepthOverride, recordAttempt, reset } = useLearnerState();
  const [selected, setSelected] = useState<string | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const lesson = getLesson(state.activeLessonId);
  const topicMastery = state.mastery[lesson.topicId] ?? 0;
  const depth: Depth = state.depthOverride ?? depthForMastery(topicMastery);
  const next = useMemo(() => recommendedLesson(state), [state]);
  const knowledge = knowledgeSummary(state);

  const chosen = selected ? lesson.quiz.options.find((o) => o.id === selected) : null;

  const answer = (optionId: string) => {
    if (selected) return;
    const option = lesson.quiz.options.find((o) => o.id === optionId);
    if (!option) return;
    setSelected(optionId);
    recordAttempt(lesson.id, lesson.topicId, option.correct);
    if (!option.correct) {
      setPendingPrompt(
        `I answered "${option.label}" to: ${lesson.quiz.prompt} — that was wrong. Explain the correct reasoning at my level and give me one similar practice question.`,
      );
    }
  };

  const openLesson = (id: string) => {
    setActiveLesson(id);
    setSelected(null);
  };

  return (
    <div className="grid-bg min-h-screen bg-background text-foreground selection:bg-accent/20">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-sm bg-foreground">
              <span className="font-mono text-[10px] font-bold text-background">λ</span>
            </div>
            <span className="text-lg font-bold tracking-tight">LOGICLORE</span>
          </div>
          <div className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
            <span className="text-foreground">Dashboard</span>
            <button onClick={() => openLesson(next.id)} className="transition-colors hover:text-foreground">
              Curriculum
            </button>
            <button onClick={reset} className="transition-colors hover:text-foreground">
              Reset progress
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-sm border border-accent/20 bg-accent/10 px-2 py-1 font-mono text-xs text-accent">
            LVL {Math.max(1, Math.floor(state.xp / 100))} • {state.xp} XP
          </div>
          <div className="size-8 rounded-full bg-track outline outline-offset-2 outline-border" />
        </div>
      </nav>

      <main className="mx-auto grid min-h-[calc(100vh-57px)] max-w-7xl grid-cols-1 lg:grid-cols-12">
        <aside className="flex flex-col gap-8 border-b border-border p-6 lg:col-span-3 lg:border-b-0 lg:border-r">
          <section className="animate-slide-up">
            <h2 className="label-mono mb-4 text-muted-foreground">Mastery overview</h2>
            <div className="space-y-5">
              {topics.map((topic) => {
                const value = Math.round(state.mastery[topic.id] ?? 0);
                return (
                  <div key={topic.id}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="font-medium">{topic.name}</span>
                      <span className="font-mono">{hydrated ? `${value}%` : "—"}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-track">
                      <div
                        className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                          value >= 70 ? "bg-foreground" : value >= 30 ? "bg-accent" : "bg-muted-foreground"
                        }`}
                        style={{ width: hydrated ? `${value}%` : "0%" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="animate-slide-up">
            <h2 className="label-mono mb-4 text-muted-foreground">Current path</h2>
            <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
              <p className="mb-1 font-mono text-xs text-accent">NEXT LESSON</p>
              <h3 className="mb-3 font-bold leading-tight">{next.title}</h3>
              <button
                onClick={() => openLesson(next.id)}
                className="w-full cursor-pointer rounded bg-foreground py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                {next.id === lesson.id ? "Continue lesson" : "Start this lesson"}
              </button>
            </div>
          </section>

          <section className="animate-slide-up">
            <h2 className="label-mono mb-4 text-muted-foreground">All modules</h2>
            <div className="space-y-2">
              {lessons.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openLesson(item.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                    item.id === lesson.id
                      ? "border-accent/40 bg-accent/10 text-foreground"
                      : "border-border bg-surface hover:bg-muted"
                  }`}
                >
                  <span className="block font-mono text-[10px] text-muted-foreground">{item.module}</span>
                  <span className="font-medium">{item.title}</span>
                  {state.completed.includes(item.id) && (
                    <span className="ml-1 font-mono text-[10px] text-success">✓</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <div className="bg-surface p-6 lg:col-span-6 lg:p-10">
          <div className="mx-auto max-w-2xl animate-slide-up space-y-10">
            <header>
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px]">
                  {lesson.module}
                </span>
                <span className="text-xs text-muted-foreground">{lesson.minutes} min read</span>
                <span className="font-mono text-[10px] text-accent">
                  AUTO-DEPTH · {Math.round(topicMastery)}% MASTERY
                </span>
              </div>
              <h1 className="mb-4 text-balance text-4xl font-extrabold tracking-tighter">{lesson.title}</h1>

              <div className="flex w-fit items-center gap-3 rounded-md border border-border bg-muted p-1">
                {depthLabels.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setDepthOverride(option.id === depth ? null : option.id)}
                    className={`rounded px-3 py-1 text-[11px] font-bold uppercase transition-colors ${
                      option.id === depth
                        ? "border border-border bg-surface shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </header>

            <article className="space-y-5 text-pretty text-lg leading-relaxed text-foreground/85">
              <p>{lesson.body[depth][0]}</p>

              <figure className="my-8 rounded-lg border border-dashed border-border bg-panel p-6">
                <img
                  src={lesson.image}
                  alt={lesson.imageAlt}
                  loading="lazy"
                  width={1024}
                  height={512}
                  className="w-full rounded outline-1 -outline-offset-1 outline-border"
                />
                <figcaption className="mt-3 text-center text-xs italic text-muted-foreground">
                  {lesson.figure}
                </figcaption>
              </figure>

              {lesson.body[depth].slice(1).map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}

              <button
                onClick={() =>
                  setPendingPrompt(
                    `Re-explain "${lesson.title}" at ${depth} depth using a completely different analogy than a textbook would.`,
                  )
                }
                className="rounded-md border border-border bg-panel px-3 py-2 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
              >
                Ask Sibyl to re-explain this differently
              </button>
            </article>

            <section className="rounded-xl bg-ink p-8 text-ink-foreground shadow-xl">
              <h2 className="mb-4 text-lg font-bold">Check your logic</h2>
              <p className="mb-6 text-ink-foreground/70">{lesson.quiz.prompt}</p>

              <div className="space-y-3">
                {lesson.quiz.options.map((option) => {
                  const isChosen = option.id === selected;
                  const revealCorrect = selected && option.correct;
                  return (
                    <button
                      key={option.id}
                      onClick={() => answer(option.id)}
                      disabled={!!selected}
                      className={`w-full rounded-lg border p-4 text-left text-sm transition-colors ${
                        revealCorrect
                          ? "border-success/40 bg-success/15"
                          : isChosen
                            ? "border-destructive/40 bg-destructive/15"
                            : "border-ink-foreground/10 bg-ink-foreground/5 hover:bg-ink-foreground/10"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {chosen && (
                <div
                  className={`mt-6 rounded-lg border p-4 text-sm ${
                    chosen.correct
                      ? "border-success/20 bg-success/10 text-success"
                      : "border-destructive/20 bg-destructive/10 text-destructive"
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2 font-bold">
                    <span>{chosen.correct ? "✓ Correct" : "✗ Not quite"}</span>
                    <span className="rounded-sm bg-ink-foreground/10 px-1.5 py-0.5 font-mono text-[10px]">
                      {chosen.correct ? "+50 XP" : "+10 XP"}
                    </span>
                  </div>
                  <p className="leading-snug opacity-90">{chosen.rationale}</p>
                  <p className="mt-2 text-xs opacity-70">
                    Knowledge state updated — {topics.find((t) => t.id === lesson.topicId)?.name} is now{" "}
                    {Math.round(topicMastery)}%.
                  </p>
                </div>
              )}

              {selected && (
                <button
                  onClick={() => setSelected(null)}
                  className="mt-4 font-mono text-[10px] uppercase tracking-widest text-ink-foreground/60 hover:text-ink-foreground"
                >
                  Try again
                </button>
              )}
            </section>
          </div>
        </div>

        <aside className="sticky top-[57px] h-[calc(100vh-57px)] border-t border-border lg:col-span-3 lg:border-l lg:border-t-0">
          <TutorChat
            knowledge={knowledge}
            lessonTitle={lesson.title}
            depth={depth}
            pendingPrompt={pendingPrompt}
            onPromptConsumed={() => setPendingPrompt(null)}
          />
        </aside>
      </main>
    </div>
  );
}
