"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } }); setMessage(error?.message ?? "Check your email for a magic link."); setBusy(false); }
  return <main className="shell"><nav className="nav"><Link className="brand" href="/"><span className="brand-mark">L</span><span>LingoFrame</span></Link></nav><div style={{maxWidth:480,margin:"70px auto"}}><div className="eyebrow">Your learning space</div><h1 style={{fontSize:56}}>Come on in.</h1><p className="lede">Use your email to receive a secure sign-in link.</p><form onSubmit={submit} style={{marginTop:32,padding:24,border:"1px solid var(--line)",borderRadius:20,background:"var(--paper)"}}><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={{width:"100%",padding:"15px 16px",border:"1px solid var(--line)",borderRadius:12,font:"inherit"}}/><button className="button" disabled={busy} style={{marginTop:18}}>{busy?"Sending…":"Send magic link →"}</button>{message&&<p style={{color:"var(--green)",fontSize:14}}>{message}</p>}</form></div></main>;
}
