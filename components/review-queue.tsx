"use client";
import { useState } from "react";
import { ReviewCard } from "@/components/review-card";

export function ReviewQueue({ sentences }: { sentences: Array<{id:string;original_text:string;translation:string;review_count:number;correct_streak:number}> }) {
  const [index, setIndex] = useState(0); const current = sentences[index]; if (!current) return <article className="feature" style={{marginTop:34}}><h3>All caught up.</h3><p>没有需要复习的句子。完成新课程后再回来。</p></article>;
  return <div style={{marginTop:34}}><div style={{color:"var(--muted)",fontSize:14,marginBottom:12}}>{index + 1} / {sentences.length}</div><ReviewCard sentence={current} onDone={()=>setIndex(index+1)}/></div>;
}
