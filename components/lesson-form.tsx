"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LessonForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    try { new URL(url); } catch { setError("Please enter a valid video URL."); return; }
    setLoading(true);
    const response = await fetch("/api/lessons", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({url}) });
    if (!response.ok) { const payload = await response.json().catch(() => null); setError(payload?.error ?? "We couldn't start this lesson yet. Check the URL and try again."); setLoading(false); return; }
    const result = await response.json(); router.push(`/learn/${result.lessonId}`);
  }
  return <form onSubmit={submit} style={{marginTop:32,padding:24,border:"1px solid var(--line)",borderRadius:20,background:"var(--paper)"}}><label htmlFor="url" style={{display:"block",fontWeight:600,marginBottom:10}}>Video URL</label><input id="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={{width:"100%",padding:"15px 16px",border:"1px solid var(--line)",borderRadius:12,font: "inherit",background:"#fff"}} />{error&&<p style={{color:"#b13a35",fontSize:14}}>{error}</p>}<button className="button" disabled={loading} style={{marginTop:18}}>{loading?"Preparing lesson…":"Create lesson →"}</button><p style={{color:"var(--muted)",fontSize:13,lineHeight:1.5,marginBottom:0}}>For the MVP, we only analyze captions or transcripts that the application is authorized to access.</p></form>;
}
