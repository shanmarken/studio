import * as React from "react";

export function ProjectPulseLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width="32"
      height="32"
      {...props}
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--accent))", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path
        fill="url(#grad1)"
        d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Z"
      />
      <path
        fill="hsl(var(--primary))"
        d="m168 99.43-40 33.33-16-12.31a8 8 0 0 0-10.13 1.25l-40 48a8 8 0 0 0 11.38 9.5l34.87-41.84 16 12.3a8 8 0 0 0 10.13-1.25l48-64a8 8 0 1 0-14.25-10.68Z"
      />
    </svg>
  );
}
