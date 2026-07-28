import "./SageLoader.css";

export default function SageLoader() {
  return (
    <>
      <div className="sage-backdrop" />
      <div className="sage-overlay">
        <svg style={{ width: 180, height: 200, overflow: "visible" }} viewBox="0 0 200 220" fill="none">
          <defs>
            <radialGradient id="shadowGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="auraGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse className="ground-shadow" cx="100" cy="195" rx="45" ry="8" fill="url(#shadowGlow)" />
          <circle className="aura-1" cx="100" cy="100" r="70" fill="url(#auraGlow)" />
          <circle className="aura-2" cx="100" cy="100" r="85" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="4 6" />
          <g className="float-group">
            <circle className="head-glow" cx="100" cy="65" r="38" fill="#60a5fa" opacity="0.15" />
            <path d="M 60 148 C 65 135, 95 135, 100 148 C 105 135, 135 135, 140 148 C 145 160, 115 165, 100 162 C 85 165, 55 160, 60 148 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2.5" strokeLinejoin="round" />
            <g className="breathe-torso">
              <path d="M 82 98 C 82 90, 118 90, 118 98 L 114 142 C 108 148, 92 148, 86 142 Z" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2.5" strokeLinejoin="round" />
            </g>
            <path d="M 84 100 C 68 102, 52 120, 52 130 C 52 135, 60 138, 68 130" fill="none" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 84 100 C 68 102, 52 120, 52 130 C 52 135, 60 138, 68 130" fill="none" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="48" cy="126" r="4" fill="none" stroke="#e2e8f0" strokeWidth="2" />
            <path d="M 44 123 C 40 120, 36 125, 40 129" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <path d="M 116 100 C 132 102, 148 120, 148 130 C 148 135, 140 138, 132 130" fill="none" stroke="#ffffff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 116 100 C 132 102, 148 120, 148 130 C 148 135, 140 138, 132 130" fill="none" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="152" cy="126" r="4" fill="none" stroke="#e2e8f0" strokeWidth="2" />
            <path d="M 156 123 C 160 120, 164 125, 160 129" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
            <circle cx="100" cy="65" r="30" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2.5" />
            <path d="M 88 64 Q 93 70 98 64" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 102 64 Q 107 70 112 64" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 94 76 Q 100 81 106 76" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <circle className="sparkle s1" cx="50" cy="60" r="2" fill="#60a5fa" />
          <circle className="sparkle s2" cx="150" cy="70" r="3" fill="#93c5fd" />
          <circle className="sparkle s3" cx="100" cy="20" r="2.5" fill="#3b82f6" />
        </svg>
        <div className="loading-label">
          <span>Finding inner peace</span>
          <span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span>
        </div>
      </div>
    </>
  );
}