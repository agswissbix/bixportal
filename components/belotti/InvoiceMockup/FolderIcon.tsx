"use client"

interface FolderIconProps {
  isOpen: boolean
  className?: string
  documentCount?: number
}

export function FolderIcon({ isOpen, className = "", documentCount = 0 }: FolderIconProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Folder body gradient */}
        <linearGradient id="folderBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5D68A" />
          <stop offset="50%" stopColor="#E8C46A" />
          <stop offset="100%" stopColor="#D4A94E" />
        </linearGradient>
        {/* Folder back gradient */}
        <linearGradient id="folderBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D4A94E" />
          <stop offset="100%" stopColor="#B8903A" />
        </linearGradient>
        {/* Folder tab gradient */}
        <linearGradient id="folderTab" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E8C46A" />
          <stop offset="100%" stopColor="#D4A94E" />
        </linearGradient>
        {/* Folder front gradient for open state */}
        <linearGradient id="folderFront" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5D68A" />
          <stop offset="100%" stopColor="#E8C46A" />
        </linearGradient>
        {/* Shadow */}
        <filter id="folderShadow" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#00000020" />
        </filter>
        {/* Document color */}
        <linearGradient id="docGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0F0F0" />
        </linearGradient>
      </defs>

      {/* Shadow ellipse */}
      <ellipse cx="60" cy="95" rx="50" ry="5" fill="#00000012" />

      {isOpen ? (
        /* --- OPEN STATE --- */
        <g filter="url(#folderShadow)">
          {/* Back panel */}
          <rect x="8" y="18" width="104" height="70" rx="4" fill="url(#folderBack)" />

          {/* Documents peeking out */}
          {documentCount > 0 && (
            <g>
              <rect x="22" y="12" width="60" height="42" rx="2" fill="url(#docGrad)" stroke="#D0D0D0" strokeWidth="0.5">
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 0; 0 -8; 0 -6"
                  dur="0.4s"
                  fill="freeze"
                />
              </rect>
              {/* Doc lines */}
              <g opacity="0.4">
                <rect x="28" y="20" width="35" height="2" rx="1" fill="#B0B0B0">
                  <animateTransform attributeName="transform" type="translate" values="0 0; 0 -8; 0 -6" dur="0.4s" fill="freeze" />
                </rect>
                <rect x="28" y="25" width="45" height="2" rx="1" fill="#B0B0B0">
                  <animateTransform attributeName="transform" type="translate" values="0 0; 0 -8; 0 -6" dur="0.4s" fill="freeze" />
                </rect>
                <rect x="28" y="30" width="28" height="2" rx="1" fill="#B0B0B0">
                  <animateTransform attributeName="transform" type="translate" values="0 0; 0 -8; 0 -6" dur="0.4s" fill="freeze" />
                </rect>
              </g>
              {documentCount > 1 && (
                <rect x="28" y="15" width="55" height="40" rx="2" fill="url(#docGrad)" stroke="#D0D0D0" strokeWidth="0.5" opacity="0.6">
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values="0 0; 0 -5; 0 -3"
                    dur="0.35s"
                    fill="freeze"
                  />
                </rect>
              )}
            </g>
          )}

          {/* Tab */}
          <path d="M8 22 L8 14 Q8 10 12 10 L38 10 Q42 10 44 14 L48 22 Z" fill="url(#folderTab)" />

          {/* Front flap - tilted open */}
          <g>
            <path
              d="M6 40 Q6 36 10 34 L110 34 Q114 36 114 40 L110 86 Q110 90 106 90 L14 90 Q10 90 10 86 Z"
              fill="url(#folderFront)"
              opacity="0.85"
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 10; 0 0"
                dur="0.3s"
                fill="freeze"
              />
            </path>
          </g>

          {/* Subtle edge line */}
          <line x1="12" y1="34" x2="108" y2="34" stroke="#C8A040" strokeWidth="0.5" />
        </g>
      ) : (
        /* --- CLOSED STATE --- */
        <g filter="url(#folderShadow)">
          {/* Tab */}
          <path d="M8 28 L8 20 Q8 16 12 16 L38 16 Q42 16 44 20 L48 28 Z" fill="url(#folderTab)" />

          {/* Main body */}
          <rect x="8" y="28" width="104" height="60" rx="4" fill="url(#folderBody)" />

          {/* Subtle highlight line at top */}
          <line x1="12" y1="30" x2="108" y2="30" stroke="#F5E0A0" strokeWidth="1" opacity="0.6" />

          {/* Subtle bottom border */}
          <line x1="12" y1="85" x2="108" y2="85" stroke="#C8A040" strokeWidth="0.5" opacity="0.3" />
        </g>
      )}
    </svg>
  )
}
