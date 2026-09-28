import Link from "next/link";
import { Mascot } from "@/components/mascot";

const features = [
  ["01", "Learn in context", "Turn the videos you already love into lessons built around real expressions and natural speech."],
  ["02", "Understand the nuance", "Get clear explanations for slang, grammar, tone, and when a phrase actually belongs in conversation."],
  ["03", "Speak with confidence", "Practice each sentence, record yourself, and build a personal history of the sounds you want to improve."],
];

export default function HomePage() {
  return <main className="shell">
    <nav className="nav">
      <Link className="brand" href="/"><span className="brand-mark">L</span><span>LingoFrame</span></Link>
      <div className="nav-links"><Link href="#how-it-works">How it works</Link><Link href="#features">Features</Link><Link href="/auth/login">Sign in</Link><Link className="button" href="/learn/new">Start learning</Link></div>
    </nav>
    <section className="hero">
      <div>
        <div className="eyebrow">English, in your frame of reference</div>
        <h1>Learn the English people <em>actually speak.</em></h1>
        <p className="lede">Bring a video you care about. LingoFrame turns it into a sentence-by-sentence lesson with natural explanations, pronunciation practice, and a learning history made for you.</p>
        <div className="hero-actions"><Link className="button" href="/learn/new">Turn a video into a lesson →</Link><Link className="button secondary" href="#how-it-works">See how it works</Link></div>
      </div>
      <div className="hero-card"><div className="card-top"><span>LESSON 001</span><span>● Authentic speech</span></div><Mascot /><div className="video-title">The quiet confidence of saying “no.”</div><div className="sentence"><small>Sentence 04 / 18</small><strong>“I’m just not feeling it today.”</strong><small>自然表达 · 拒绝但语气柔和</small></div></div>
    </section>
    <section id="features"><div className="section-head"><div><div className="eyebrow">A better way to study</div><h2>From watching to knowing.</h2></div><p>One real sentence at a time.</p></div><div className="feature-grid">{features.map(([number,title,body])=><article className="feature" key={number}><div className="feature-icon">{number}</div><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section id="how-it-works" className="footer"><span>Built for curious learners.</span><span>© 2026 LingoFrame</span></section>
  </main>;
}
