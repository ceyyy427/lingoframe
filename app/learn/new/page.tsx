import Link from "next/link";
import { LessonForm } from "@/components/lesson-form";
import { Mascot } from "@/components/mascot";

export default function NewLessonPage() {
  return <main className="shell"><nav className="nav"><Link className="brand" href="/"><span className="brand-mark">L</span><span>LingoFrame</span></Link><Link href="/" className="nav-links">← Back home</Link></nav><div className="lesson-intro"><div><div className="eyebrow">Create a lesson</div><h1 style={{fontSize:56}}>Bring us a video.</h1><p className="lede">Paste a YouTube or other supported video URL. We’ll use available captions or an authorized transcript to build your lesson.</p><LessonForm /></div><Mascot size={170}/></div></main>;
}
