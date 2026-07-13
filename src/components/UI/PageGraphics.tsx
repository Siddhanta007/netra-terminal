import type { ReactNode } from 'react';

type PageGraphicVariant =
  | 'home'
  | 'terminal'
  | 'portfolio'
  | 'profile'
  | 'auth'
  | 'model-pinaka'
  | 'model-trishul';

type Props = {
  variant?: PageGraphicVariant;
  accent?: string;
  muted?: string;
  opacity?: number;
};

const BLUE = '#4169E1';
const ICE = '#dce8fb';
const ICE_DEEP = '#9fb2e8';
const PLUM = '#9b87d4';
const CORAL = '#d9a1a3';
const ORANGE = '#d49a5b';
const SKY = '#8cc6e8';
const VIOLET = '#8a78b8';
const STEEL = '#7aa7d9';
const AMBER_SOFT = '#efd0a6';
const ROSE_SOFT = '#e4b3c2';
const SLATE_SOFT = '#b7c0d4';
const INK = '#111827';
const GRAD_A = 'url(#pg-grad-a)';
const GRAD_B = 'url(#pg-grad-b)';
const GRAD_C = 'url(#pg-grad-c)';

function Shell({ children, opacity = 1 }: { children: ReactNode; opacity?: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden', opacity }}>
      {children}
    </div>
  );
}

function CornerSvg({
  corner,
  viewBox,
  children,
  width,
}: {
  corner: 'tr' | 'bl';
  viewBox: string;
  children: ReactNode;
  width?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      style={{
        position: 'absolute',
        display: 'block',
        width: width || (corner === 'tr' ? 'min(900px, 58vw)' : 'min(760px, 50vw)'),
        height: 'auto',
        top: corner === 'tr' ? 0 : undefined,
        right: corner === 'tr' ? 0 : undefined,
        bottom: corner === 'bl' ? 0 : undefined,
        left: corner === 'bl' ? 0 : undefined,
      }}
    >
      <defs>
        <linearGradient id="pg-grad-a" x1="0" y1="0" x2="760" y2="420" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4169E1" />
          <stop offset="52%" stopColor="#8cc6e8" />
          <stop offset="100%" stopColor="#9b87d4" />
        </linearGradient>
        <linearGradient id="pg-grad-b" x1="0" y1="420" x2="760" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d49a5b" />
          <stop offset="50%" stopColor="#d9a1a3" />
          <stop offset="100%" stopColor="#8a78b8" />
        </linearGradient>
        <linearGradient id="pg-grad-c" x1="0" y1="200" x2="760" y2="200" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#dce8fb" />
          <stop offset="46%" stopColor="#8cc6e8" />
          <stop offset="100%" stopColor="#4169E1" />
        </linearGradient>
      </defs>
      {children}
    </svg>
  );
}

function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (30 + i * 60);
    return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
}

function triPoints(cx: number, cy: number, r: number, flip = false) {
  const offset = flip ? 180 : 0;
  return Array.from({ length: 3 }, (_, i) => {
    const a = (Math.PI / 180) * (offset - 90 + i * 120);
    return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
}

function HexTile({
  cx,
  cy,
  r,
  color = ICE,
  opacity = 0.78,
  width = 6,
  fill = 'none',
}: {
  cx: number;
  cy: number;
  r: number;
  color?: string;
  opacity?: number;
  width?: number;
  fill?: string;
}) {
  return <polygon points={hexPoints(cx, cy, r)} stroke={color} strokeOpacity={opacity} strokeWidth={width} fill={fill} />;
}

function TriangleTile({
  cx,
  cy,
  r,
  color = ICE,
  opacity = 0.72,
  flip = false,
  fill = 'none',
  width = 6,
}: {
  cx: number;
  cy: number;
  r: number;
  color?: string;
  opacity?: number;
  flip?: boolean;
  fill?: string;
  width?: number;
}) {
  return <polygon points={triPoints(cx, cy, r, flip)} stroke={color} strokeOpacity={opacity} strokeWidth={width} fill={fill} />;
}

function HexMarket({ accent = BLUE }: { accent?: string }) {
  const topHexes = [
    [210, 44, 74, ICE], [338, 44, 74, SKY], [466, 44, 74, PLUM],
    [594, 44, 74, ICE], [274, 154, 74, AMBER_SOFT], [402, 154, 74, '#ffffff'],
    [530, 154, 74, STEEL], [658, 154, 74, ICE], [338, 264, 74, ROSE_SOFT],
    [466, 264, 74, ICE], [594, 264, 74, CORAL],
  ] as const;
  const bottomHexes = [
    [78, 324, 74, ICE], [206, 324, 74, SKY], [334, 324, 74, AMBER_SOFT],
    [142, 214, 74, PLUM], [270, 214, 74, '#ffffff'], [398, 214, 74, ICE],
    [78, 104, 74, STEEL], [206, 104, 74, CORAL], [334, 104, 74, SLATE_SOFT],
  ] as const;

  return (
    <>
      <CornerSvg corner="tr" viewBox="0 0 760 420" width="min(880px, 58vw)">
        {topHexes.map(([cx, cy, r, color], i) => (
          <HexTile key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} color={color} opacity={color === '#ffffff' ? 0.92 : 0.62} width={5} />
        ))}
        <path d="M160 208H316L388 82H542L620 218" stroke="#ffffff" strokeOpacity="0.88" strokeWidth="8" />
        <path d="M84 102L210 320H466L656 210" stroke={GRAD_A} strokeOpacity="0.62" strokeWidth="10" />
        <HexTile cx={466} cy={264} r={74} color={GRAD_A} opacity={0.76} width={7} />
      </CornerSvg>
      <CornerSvg corner="bl" viewBox="0 0 560 420" width="min(720px, 48vw)">
        {bottomHexes.map(([cx, cy, r, color]) => (
          <HexTile key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} color={color} opacity={color === '#ffffff' ? 0.8 : 0.56} width={5} />
        ))}
        <path d="M0 384H184L270 214L450 214" stroke={GRAD_C} strokeOpacity="0.5" strokeWidth="10" />
        <path d="M30 104H206L334 324" stroke={GRAD_A} strokeOpacity="0.42" strokeWidth="9" />
      </CornerSvg>
    </>
  );
}

function TriangleMarket({ accent = ORANGE }: { accent?: string }) {
  const top = [
    [240, 58, 64, false, ICE], [354, 58, 64, true, SKY], [468, 58, 64, false, PLUM],
    [582, 58, 64, true, AMBER_SOFT], [410, 188, 138, true, ICE], [570, 236, 86, false, ROSE_SOFT],
    [640, 336, 62, true, STEEL],
  ] as const;
  const bottom = [
    [50, 330, 92, false, ICE], [178, 278, 88, true, SKY], [300, 334, 92, false, AMBER_SOFT],
    [118, 158, 66, false, accent], [236, 152, 66, true, PLUM],
  ] as const;
  return (
    <>
      <CornerSvg corner="tr" viewBox="0 0 760 440" width="min(860px, 56vw)">
        {top.map(([cx, cy, r, flip, color], i) => (
          <g key={`${cx}-${cy}`}>
            <TriangleTile cx={cx} cy={cy} r={r} flip={flip} color={color} opacity={i === 1 || i === 3 || i === 6 ? 0.78 : 0.54} width={7} />
            {i < 5 && <TriangleTile cx={cx} cy={cy} r={r * 0.52} flip={!flip} color={ICE} opacity={0.46} width={5} />}
          </g>
        ))}
        <path d="M190 70H640L514 296H690" stroke={GRAD_B} strokeOpacity="0.54" strokeWidth="9" />
      </CornerSvg>
      <CornerSvg corner="bl" viewBox="0 0 520 420" width="min(640px, 45vw)">
        {bottom.map(([cx, cy, r, flip, color], i) => (
          <g key={`${cx}-${cy}`}>
            <TriangleTile cx={cx} cy={cy} r={r} flip={flip} color={color} opacity={i === 3 ? 0.62 : 0.48} width={7} />
            <TriangleTile cx={cx} cy={cy} r={r * 0.48} flip={!flip} color={ICE} opacity={0.4} width={4} />
          </g>
        ))}
        <path d="M0 390L118 158L300 334" stroke={GRAD_B} strokeOpacity="0.46" strokeWidth="8" />
      </CornerSvg>
    </>
  );
}

function RectMarket({ accent = BLUE, secondary = VIOLET }: { accent?: string; secondary?: string }) {
  const segments = [
    ['M210 50h74v34h-38v34h92v34h-70v34h120v34h-54v34h142', SKY, 0.5, 12],
    ['M382 24h120v34h-42v34h86v34h-30v34h72v34h-116v34h46', GRAD_B, 0.72, 14],
    ['M548 76h88v34h-34v34h82v34h-66v34h42v34h-112', SLATE_SOFT, 0.56, 12],
    ['M300 338h96v-42h92v-48h78v-42h94', ROSE_SOFT, 0.54, 11],
  ] as const;
  return (
    <>
      <CornerSvg corner="tr" viewBox="0 0 760 420" width="min(880px, 58vw)">
        {segments.map(([d, color, opacity, width]) => (
          <path key={d} d={d} stroke={color} strokeOpacity={opacity} strokeWidth={width} />
        ))}
        <path d="M238 328h104v-40h76v-42h112v46h74" stroke={GRAD_A} strokeOpacity="0.58" strokeWidth="13" />
        <path d="M168 246h86v-42h74v-34h70" stroke={AMBER_SOFT} strokeOpacity="0.66" strokeWidth="10" />
      </CornerSvg>
      <CornerSvg corner="bl" viewBox="0 0 520 420" width="min(620px, 44vw)">
        <path d="M0 340h92v-44h60v-52h66v-72h86v-54h70" stroke={SKY} strokeOpacity="0.46" strokeWidth="13" />
        <path d="M62 388h86v-46h92v-42h76v-60" stroke={GRAD_B} strokeOpacity="0.74" strokeWidth="13" />
        <path d="M0 280h120v-42h90v-50" stroke={GRAD_A} strokeOpacity="0.54" strokeWidth="11" />
        <path d="M138 108h86v46h78v42h84" stroke={PLUM} strokeOpacity="0.38" strokeWidth="10" />
      </CornerSvg>
    </>
  );
}

function OrbitSketch({ accent = BLUE }: { accent?: string }) {
  const ringColors = [SKY, ICE_DEEP, PLUM, SLATE_SOFT];
  return (
    <>
      <CornerSvg corner="tr" viewBox="0 0 760 420" width="min(900px, 58vw)">
        {[46, 70, 94, 122].map((r, i) => (
          <circle key={r} cx="410" cy="160" r={r} stroke={ringColors[i]} strokeOpacity={0.48 - i * 0.03} strokeWidth="6" />
        ))}
        <circle cx="410" cy="160" r="16" stroke={GRAD_A} strokeOpacity="0.82" strokeWidth="8" />
        <path d="M116 326C220 226 300 230 410 160C520 90 610 110 720 38" stroke={GRAD_A} strokeOpacity="0.48" strokeWidth="9" />
        <path d="M190 42L678 318" stroke={ROSE_SOFT} strokeOpacity="0.48" strokeWidth="5" />
        <path d="M278 24L724 238M104 190H720" stroke={SKY} strokeOpacity="0.42" strokeWidth="5" />
        <path d="M488 58C552 126 596 148 702 142" stroke={GRAD_B} strokeOpacity="0.72" strokeWidth="9" />
      </CornerSvg>
      <CornerSvg corner="bl" viewBox="0 0 560 420" width="min(680px, 46vw)">
        {[42, 64, 88, 112].map((r, i) => (
          <circle key={r} cx="154" cy="338" r={r} stroke={ringColors[(i + 1) % ringColors.length]} strokeOpacity={0.46 - i * 0.035} strokeWidth="6" />
        ))}
        <path d="M0 382C88 300 160 298 258 262C362 224 432 140 560 80" stroke={GRAD_A} strokeOpacity="0.42" strokeWidth="8" />
        <path d="M70 108L438 360" stroke={AMBER_SOFT} strokeOpacity="0.44" strokeWidth="5" />
        <path d="M0 260H442" stroke={SLATE_SOFT} strokeOpacity="0.48" strokeWidth="5" />
        <path d="M76 390C138 338 228 344 298 302" stroke={GRAD_B} strokeOpacity="0.68" strokeWidth="9" />
      </CornerSvg>
    </>
  );
}

function RouteMesh({ accent = BLUE, secondary = PLUM }: { accent?: string; secondary?: string }) {
  const meshColors = [ICE, SKY, SLATE_SOFT, PLUM, ROSE_SOFT, AMBER_SOFT];
  return (
    <>
      <CornerSvg corner="tr" viewBox="0 0 760 420" width="min(880px, 58vw)">
        {[0, 1, 2, 3].map(row => (
          [0, 1, 2, 3, 4].map(col => {
            const x = 238 + col * 92 + (row % 2 ? 46 : 0);
            const y = 40 + row * 78;
            return <HexTile key={`${row}-${col}`} cx={x} cy={y} r={52} color={meshColors[(row * 2 + col) % meshColors.length]} opacity={0.44} width={5} />;
          })
        ))}
        <path d="M238 40L376 118L422 196L560 274L698 196" stroke={GRAD_B} strokeOpacity="0.62" strokeWidth="10" />
        <path d="M330 274L422 196L514 118L652 40" stroke={GRAD_A} strokeOpacity="0.54" strokeWidth="9" />
      </CornerSvg>
      <CornerSvg corner="bl" viewBox="0 0 560 420" width="min(680px, 46vw)">
        {[0, 1, 2].map(row => (
          [0, 1, 2].map(col => {
            const x = 68 + col * 104 + (row % 2 ? 52 : 0);
            const y = 326 - row * 88;
            return <HexTile key={`${row}-${col}`} cx={x} cy={y} r={58} color={meshColors[(row + col + 2) % meshColors.length]} opacity={0.44} width={5} />;
          })
        ))}
        <path d="M0 326H68L224 238L328 326" stroke={GRAD_A} strokeOpacity="0.5" strokeWidth="9" />
        <path d="M68 326L172 150L328 238" stroke={GRAD_B} strokeOpacity="0.38" strokeWidth="8" />
      </CornerSvg>
    </>
  );
}

function AuthCircuit() {
  return (
    <>
      <CornerSvg corner="tr" viewBox="0 0 760 420" width="min(820px, 54vw)">
        <path d="M360 80h210v210H360V80Z" stroke={GRAD_A} strokeOpacity="0.58" strokeWidth="8" />
        <path d="M412 80V40h108v40M412 290v48h108v-48" stroke={INK} strokeOpacity="0.2" strokeWidth="7" />
        <path d="M420 150h52v52h-52ZM502 188h52v52h-52ZM470 256h52v52h-52Z" stroke={GRAD_B} strokeOpacity="0.66" strokeWidth="6" />
      </CornerSvg>
      <CornerSvg corner="bl" viewBox="0 0 560 420" width="min(620px, 44vw)">
        <path d="M0 348h100v-74h84v-74h110v-84h122" stroke={SKY} strokeOpacity="0.46" strokeWidth="11" />
        <path d="M70 388v-84h92v-84h98" stroke={GRAD_A} strokeOpacity="0.52" strokeWidth="9" />
        <path d="M258 116h82v82h-82Z" stroke={GRAD_B} strokeOpacity="0.62" strokeWidth="7" />
        <path d="M128 84h76v76h-76ZM206 238h70v70h-70Z" stroke={ROSE_SOFT} strokeOpacity="0.5" strokeWidth="7" />
      </CornerSvg>
    </>
  );
}

function PlatformGraphic({ accent = BLUE }: { accent?: string }) {
  return <HexMarket accent={accent} />;
}

function ModelGraphic({ accent = BLUE, alternate = false }: { accent?: string; alternate?: boolean }) {
  return alternate ? <TriangleMarket accent={accent || ORANGE} /> : <RouteMesh accent={accent} secondary={PLUM} />;
}

function PortfolioGraphic() {
  return <RectMarket accent={ORANGE} secondary={STEEL} />;
}

function ProfileGraphic({ accent = BLUE }: { accent?: string }) {
  return <OrbitSketch accent={accent} />;
}

function AuthGraphic() {
  return <AuthCircuit />;
}

export function PageGraphics({ variant = 'home', accent = BLUE, opacity = 1 }: Props) {
  const content =
    variant === 'portfolio' ? <PortfolioGraphic /> :
    variant === 'profile' ? <ProfileGraphic accent={accent} /> :
    variant === 'auth' ? <AuthGraphic /> :
    variant === 'model-pinaka' ? <ModelGraphic accent={accent} /> :
    variant === 'model-trishul' ? <ModelGraphic accent={accent} alternate /> :
    variant === 'terminal' ? <PlatformGraphic accent={accent} /> :
    <PlatformGraphic accent={accent} />;

  return <Shell opacity={opacity}>{content}</Shell>;
}
