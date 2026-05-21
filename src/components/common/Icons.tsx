import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function svg({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconPlay = (p: IconProps) => svg({ ...p, children: <polygon points="6 4 20 12 6 20 6 4" /> });
export const IconPause = (p: IconProps) => svg({ ...p, children: (<>
  <rect x="6" y="4" width="4" height="16" />
  <rect x="14" y="4" width="4" height="16" />
</>) });
export const IconReset = (p: IconProps) => svg({ ...p, children: (<>
  <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
  <polyline points="3 3 3 8 8 8" />
</>) });
export const IconRefresh = (p: IconProps) => svg({ ...p, children: (<>
  <polyline points="23 4 23 10 17 10" />
  <path d="M20.49 15A9 9 0 1 1 5.64 5.64L23 10" />
</>) });
export const IconEdit = (p: IconProps) => svg({ ...p, children: (<>
  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
</>) });
export const IconEye = (p: IconProps) => svg({ ...p, children: (<>
  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
  <circle cx="12" cy="12" r="3" />
</>) });
export const IconEyeOff = (p: IconProps) => svg({ ...p, children: (<>
  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a19.45 19.45 0 0 1 5.06-5.94" />
  <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a19.59 19.59 0 0 1-2.16 3.19" />
  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
  <line x1="1" y1="1" x2="23" y2="23" />
</>) });
export const IconPlus = (p: IconProps) => svg({ ...p, children: (<>
  <line x1="12" y1="5" x2="12" y2="19" />
  <line x1="5" y1="12" x2="19" y2="12" />
</>) });
export const IconTrash = (p: IconProps) => svg({ ...p, children: (<>
  <polyline points="3 6 5 6 21 6" />
  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  <path d="M10 11v6M14 11v6" />
  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
</>) });
export const IconCopy = (p: IconProps) => svg({ ...p, children: (<>
  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
</>) });
export const IconDownload = (p: IconProps) => svg({ ...p, children: (<>
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline points="7 10 12 15 17 10" />
  <line x1="12" y1="15" x2="12" y2="3" />
</>) });
export const IconUpload = (p: IconProps) => svg({ ...p, children: (<>
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline points="17 8 12 3 7 8" />
  <line x1="12" y1="3" x2="12" y2="15" />
</>) });
export const IconChevronDown = (p: IconProps) => svg({ ...p, children: <polyline points="6 9 12 15 18 9" /> });
export const IconChevronRight = (p: IconProps) => svg({ ...p, children: <polyline points="9 6 15 12 9 18" /> });
export const IconChevronUp = (p: IconProps) => svg({ ...p, children: <polyline points="6 15 12 9 18 15" /> });
export const IconGear = (p: IconProps) => svg({ ...p, children: (<>
  <circle cx="12" cy="12" r="3" />
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.42.18.85.31 1.29.39A2 2 0 0 1 22 11v2a2 2 0 0 1-1.39 1.91c-.44.08-.87.21-1.21.39z" />
</>) });
export const IconBracket = (p: IconProps) => svg({ ...p, children: (<>
  <path d="M9 3H5a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h4" />
  <path d="M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4" />
</>) });
export const IconShadow = (p: IconProps) => svg({ ...p, children: (<>
  <circle cx="9" cy="9" r="6" />
  <circle cx="15" cy="15" r="6" />
</>) });
export const IconHash = (p: IconProps) => svg({ ...p, children: (<>
  <line x1="4" y1="9" x2="20" y2="9" />
  <line x1="4" y1="15" x2="20" y2="15" />
  <line x1="10" y1="3" x2="8" y2="21" />
  <line x1="16" y1="3" x2="14" y2="21" />
</>) });
export const IconClose = (p: IconProps) => svg({ ...p, children: (<>
  <line x1="18" y1="6" x2="6" y2="18" />
  <line x1="6" y1="6" x2="18" y2="18" />
</>) });
export const IconMenu = (p: IconProps) => svg({ ...p, children: (<>
  <line x1="3" y1="6" x2="21" y2="6" />
  <line x1="3" y1="12" x2="21" y2="12" />
  <line x1="3" y1="18" x2="21" y2="18" />
</>) });
export const IconClock = (p: IconProps) => svg({ ...p, children: (<>
  <circle cx="12" cy="12" r="10" />
  <polyline points="12 6 12 12 16 14" />
</>) });
export const IconPalette = (p: IconProps) => svg({ ...p, children: (<>
  <circle cx="12" cy="12" r="10" />
  <circle cx="7.5" cy="10.5" r="1.5" />
  <circle cx="12" cy="7.5" r="1.5" />
  <circle cx="16.5" cy="10.5" r="1.5" />
  <path d="M12 22a4 4 0 0 1-4-4c0-1.5 1-2 1-3.5C9 13 10 12.5 12 12.5c4 0 6 1.5 6 4 0 2.5-2.5 5.5-6 5.5z" />
</>) });
export const IconFlag = (p: IconProps) => svg({ ...p, children: (<>
  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
  <line x1="4" y1="22" x2="4" y2="15" />
</>) });
export const IconGithub = (p: IconProps) => svg({ ...p, children: (<>
  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
</>) });
export const IconKeyboard = (p: IconProps) => svg({ ...p, children: (<>
  <rect x="2" y="6" width="20" height="12" rx="2" ry="2" />
  <line x1="6" y1="10" x2="6" y2="10" />
  <line x1="10" y1="10" x2="10" y2="10" />
  <line x1="14" y1="10" x2="14" y2="10" />
  <line x1="18" y1="10" x2="18" y2="10" />
  <line x1="7" y1="14" x2="17" y2="14" />
</>) });
