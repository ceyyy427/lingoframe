"use client";

import { useMemo, useState } from "react";
import { PracticeRecorder } from "@/components/practice-recorder";

type Sentence = {
  id: string; sequence: number; start_time: number | null; end_time: number | null;
  original_text: string; translation: string; grammar_note: string; slang_note?: string;
  pronunciation_hint?: string; completed_at: string | null; is_favorite: boolean; is_difficult: boolean;
};

function getEmbedUrl(videoUrl: string | undefined, start: number) {
  if (!videoUrl) return "";
  try {
    const parsed = new URL(videoUrl); const host = parsed.hostname.replace(/^www\./, "");
    const id = host === "youtu.be" ? parsed.pathname.split("/").filter(Boolean)[0] : parsed.searchParams.get("v");
    return id ? `https://www.youtube.com/embed/${id}?start=${Math.floor(start)}&rel=0` : "";
  } catch { return ""; }
}

export function LessonPlayer({ sentences, videoUrl, lessonId }: { sentences: Sentence[]; videoUrl?: string; lessonId: string }) {
  const [index, setIndex] = useState(0); const [items, setItems] = useState(sentences);
  const current = items[index]; const completed = useMemo(() => items.filter((item) => item.completed_at).length, [items]);
  if (!current) return <div className="feature"><p>This lesson has no sentences yet.</p></div>;
  const embedUrl = getEmbedUrl(videoUrl, current.start_time ?? 0);

  async function update(patch: { completed?: boolean; favorite?: boolean; difficult?: boolean }) {
    const response = await fetch(`/api/sentences/${current.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (!response.ok) return;
    const next = await response.json();
    setItems(items.map((item) => item.id === current.id ? { ...item, completed_at: next.completed_at, is_favorite: next.is_favorite, is_difficult: next.is_difficult } : item));
  }

  return <div>
    <div className="lesson-layout">
      <div className="feature lesson-video-card">
        {embedUrl ? <iframe title="Lesson video" src={embedUrl} className="lesson-video" allow="autoplay; encrypted-media" /> : <div className="video-fallback">This video cannot be embedded. You can still study the sentence and use the original video URL.</div>}
        <div className="lesson-progress"><div className="lesson-progress-label"><span>Sentence {index + 1} / {items.length}</span><span>{completed} learned · {Math.round(completed / items.length * 100)}%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${completed / items.length * 100}%` }} /></div></div>
      </div>
      <article className="feature">
        <small className="muted">Focus sentence</small><h2 className="lesson-sentence">“{current.original_text}”</h2>
        <p><strong>Meaning:</strong> {current.translation}</p><p><strong>Grammar:</strong> {current.grammar_note}</p>
        {current.slang_note && <p><strong>Natural expression:</strong> {current.slang_note}</p>}
        <p className="pronunciation">Pronunciation: {current.pronunciation_hint}</p>
        <div className="lesson-actions"><button className="button secondary" onClick={() => update({ completed: !current.completed_at })}>{current.completed_at ? "✓ Learned" : "Mark learned"}</button><button className="button secondary" onClick={() => update({ favorite: !current.is_favorite })}>{current.is_favorite ? "★ Saved" : "☆ Save"}</button><button className="button secondary" onClick={() => update({ difficult: !current.is_difficult })}>{current.is_difficult ? "! Difficult" : "Mark difficult"}</button></div>
        <PracticeRecorder sentenceId={current.id} targetText={current.original_text} />
        <div className="lesson-nav"><button className="button secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>← Previous</button><button className="button" disabled={index === items.length - 1} onClick={() => setIndex(index + 1)}>Next →</button></div>
      </article>
    </div>
    {completed === items.length && <div className="feature lesson-complete"><h3>课程完成了 🎉</h3><p>你已经完成本课全部句子。</p><a className="button" href={`/learn/${lessonId}/complete`}>View summary →</a></div>}
  </div>;
}
