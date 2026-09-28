"use client";
import { useState } from "react";

export function ReviewCard({ sentence, onDone }: { sentence: { id:string; original_text:string; translation:string; review_count:number; correct_streak:number }; onDone: () => void }) {
  const [busy, setBusy] = useState(false); const [showAnswer, setShowAnswer] = useState(false);
  async function answer(quality: number) { setBusy(true); const response = await fetch(`/api/review/${sentence.id}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({quality}) }); if (response.ok) onDone(); setBusy(false); }
  return <article className="feature review-card"><small style={{color:"var(--muted)"}}>Review {sentence.review_count + 1} · Streak {sentence.correct_streak}</small><h2 style={{fontSize:32,margin:"18px 0"}}>{sentence.original_text}</h2>{showAnswer?<p>{sentence.translation}</p>:<button className="button secondary" onClick={()=>setShowAnswer(true)}>Show meaning</button>}<div style={{display:"flex",gap:8,marginTop:22,flexWrap:"wrap"}}><button className="button secondary" disabled={busy} onClick={()=>answer(1)}>Again</button><button className="button secondary" disabled={!showAnswer||busy} onClick={()=>answer(3)}>Hard</button><button className="button" disabled={!showAnswer||busy} onClick={()=>answer(4)}>Good</button><button className="button" disabled={!showAnswer||busy} onClick={()=>answer(5)}>Easy</button></div></article>;
}
