export function Mascot({ variant = "fox", size = 150 }: { variant?: "fox" | "bear"; size?: number }) {
  const bear = variant === "bear";
  return <div className={`mascot mascot-${variant}`} aria-label={bear ? "Cartoon bear mascot" : "Cartoon fox mascot"} role="img">
    <svg width={size} height={size} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="82" r="62" fill={bear ? "#D6A26E" : "#F2A65A"} />
      <path d={bear ? "M34 53C20 48 21 26 40 29L56 43M126 53C140 48 139 26 120 29L104 43" : "M35 54L29 18L61 39M125 54L131 18L99 39"} fill={bear ? "#C58C5A" : "#E6843D"} stroke="#17231F" strokeWidth="5" strokeLinejoin="round" />
      <ellipse cx="80" cy="91" rx="39" ry="32" fill="#FFE8C6" />
      <circle cx="59" cy="76" r="6" fill="#17231F" /><circle cx="101" cy="76" r="6" fill="#17231F" />
      <path d="M74 92C78 96 82 96 86 92" stroke="#17231F" strokeWidth="4" strokeLinecap="round" />
      <path d="M80 96V103" stroke="#17231F" strokeWidth="4" strokeLinecap="round" />
      <path d="M57 99C48 98 43 96 38 93M103 99C112 98 117 96 122 93" stroke="#17231F" strokeWidth="3" strokeLinecap="round" />
      <path d="M62 122C69 133 91 133 98 122" stroke="#235C4F" strokeWidth="7" strokeLinecap="round" />
      <circle cx="37" cy="101" r="5" fill="#F17B6D" opacity=".7" /><circle cx="123" cy="101" r="5" fill="#F17B6D" opacity=".7" />
    </svg>
  </div>;
}
