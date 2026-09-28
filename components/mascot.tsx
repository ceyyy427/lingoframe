export function Mascot({ variant = "pig", size = 150 }: { variant?: "pig"; size?: number }) {
  return <div className="mascot mascot-pig" aria-label="Cute pink pig mascot" role="img">
    <svg width={size} height={size} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M44 49C26 48 23 28 31 21C40 14 53 24 58 39M116 49C134 48 137 28 129 21C120 14 107 24 102 39" fill="#F5A8BB" stroke="#17231F" strokeWidth="5" strokeLinejoin="round" />
      <path d="M31 22C39 20 47 27 50 39L38 36Z" fill="#F784A3" />
      <path d="M129 22C121 20 113 27 110 39L122 36Z" fill="#F784A3" />
      <circle cx="80" cy="82" r="62" fill="#F7A9BE" stroke="#17231F" strokeWidth="5" />
      <ellipse cx="80" cy="98" rx="42" ry="33" fill="#FFD4DF" stroke="#17231F" strokeWidth="4" />
      <circle cx="59" cy="76" r="6" fill="#17231F" /><circle cx="101" cy="76" r="6" fill="#17231F" />
      <ellipse cx="80" cy="98" rx="19" ry="14" fill="#F58EAA" stroke="#17231F" strokeWidth="4" />
      <ellipse cx="73" cy="98" rx="3.5" ry="5" fill="#17231F" /><ellipse cx="87" cy="98" rx="3.5" ry="5" fill="#17231F" />
      <path d="M80 105C77 111 72 112 68 109M80 105C83 111 88 112 92 109" stroke="#17231F" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M57 104C48 102 43 99 38 95M103 104C112 102 117 99 122 95" stroke="#D65F82" strokeWidth="3" strokeLinecap="round" opacity=".75" />
      <path d="M61 126C69 137 91 137 99 126" stroke="#235C4F" strokeWidth="7" strokeLinecap="round" />
      <circle cx="39" cy="105" r="6" fill="#F47F9F" opacity=".8" /><circle cx="121" cy="105" r="6" fill="#F47F9F" opacity=".8" />
    </svg>
  </div>;
}
