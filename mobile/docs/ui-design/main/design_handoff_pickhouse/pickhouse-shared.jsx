// Pickhouse shared: tokens, sample data, Naver-style map, pins, icons.

const PH = {
  // tokens
  primary: '#1B7A53',
  primaryDark: '#0F5A3D',
  primarySoft: '#E8F3EC',
  ink: '#0E1A14',
  ink70: '#3B4641',
  muted: '#6B7068',
  border: '#E5E2DA',
  borderSoft: '#EFEDE5',
  surface: '#FAFAF6',
  white: '#FFFFFF',
  coral: '#E8754A',
  amber: '#E9B949',
  red: '#D94A4A',
  green: '#3DA773',

  // map palette — naver-ish
  mapBg: '#F2EFE6',
  road: '#FFFFFF',
  roadMajor: '#FCE9A8',     // yellow main roads
  roadMajorEdge: '#E8C97A',
  roadMinor: '#FFFFFF',
  roadMinorEdge: '#E8E2D2',
  block: '#E6DFCD',
  blockAlt: '#EBE5D2',
  park: '#D4E5C5',
  parkDeep: '#B6CFA1',
  water: '#BBD6E1',
  mapLabel: '#7B7567',
  mapLabelDim: '#A39C8C',
};

// ─────────────────────────────────────────────────────────────
// Sample data — 7 houses near 용산/서울역 area
// type: 'rent' (월세, deposit=보증금, rent=월세)
//        'jeonse' (전세, deposit=전세금, rent=0)
// ─────────────────────────────────────────────────────────────
const HOUSES = [
  { id: 1, name: '청파동 빌라', addr: '청파로47길 22', type: 'rent',
    deposit: 1000, rent: 65, mgmt: 7, pyeong: 9, rooms: '1.5룸', floor: '3/5층',
    visited: '5/24', x: 110, y: 240, cl: { sun: 3, water: 3, mold: 2, noise: 3, vent: 2 },
    tag: '햇빛 좋음', note: '엘리베이터 있음, 옥상 사용가능', photoHue: 32, commute: 32, commuteSchool: 41 },
  { id: 2, name: '후암동 오피스텔', addr: '후암로 88', type: 'rent',
    deposit: 1000, rent: 55, mgmt: 9, pyeong: 8, rooms: '원룸', floor: '5/12층',
    visited: '5/24', x: 220, y: 180, cl: { sun: 2, water: 3, mold: 3, noise: 2, vent: 2 },
    tag: '역세권', note: '서울역 도보 7분', photoHue: 200, commute: 24, commuteSchool: 33 },
  { id: 3, name: '서계동 신축빌라', addr: '서계로 12', type: 'jeonse',
    deposit: 18000, rent: 0, mgmt: 5, pyeong: 11, rooms: '1.5룸', floor: '2/4층',
    visited: '5/25', x: 165, y: 320, cl: { sun: 3, water: 3, mold: 3, noise: 2, vent: 3 },
    tag: '신축', note: '24년 준공, 빌트인 풀옵션', photoHue: 145, commute: 38, commuteSchool: 47 },
  { id: 4, name: '용산동2가 투룸', addr: '두텁바위로 60', type: 'jeonse',
    deposit: 25000, rent: 0, mgmt: 11, pyeong: 12, rooms: '투룸', floor: '4/6층',
    visited: '5/26', x: 290, y: 290, cl: { sun: 2, water: 2, mold: 3, noise: 3, vent: 2 },
    tag: '넓음', note: '주차장 있음, 분리형 투룸', photoHue: 18, commute: 41, commuteSchool: 52 },
  { id: 5, name: '갈월동 단독', addr: '청파로 200', type: 'rent',
    deposit: 1000, rent: 60, mgmt: 6, pyeong: 9, rooms: '원룸', floor: '6/7층',
    visited: '5/26', x: 80, y: 380, cl: { sun: 2, water: 1, mold: 2, noise: 1, vent: 2 },
    tag: '수압 약함', note: '수압 확인 필요, 채광은 OK', photoHue: 280, commute: 29, commuteSchool: 38 },
  { id: 6, name: '남영동 리모델링', addr: '한강대로77길', type: 'rent',
    deposit: 1500, rent: 65, mgmt: 8, pyeong: 10, rooms: '1.5룸', floor: '2/4층',
    visited: '5/27', x: 250, y: 410, cl: { sun: 3, water: 2, mold: 2, noise: 2, vent: 3 },
    tag: '리모델링', note: '23년 전체 리모델링', photoHue: 50, commute: 26, commuteSchool: 44 },
  { id: 7, name: '효창동 빌라', addr: '효창원로 33', type: 'jeonse',
    deposit: 15000, rent: 0, mgmt: 6, pyeong: 8, rooms: '원룸', floor: '3/4층',
    visited: '5/27', x: 140, y: 460, cl: { sun: 2, water: 2, mold: 1, noise: 3, vent: 2 },
    tag: '곰팡이 흔적', note: '북향 곰팡이 흔적 확인', photoHue: 220, commute: 35, commuteSchool: 29 },
];

// ─────────────────────────────────────────────────────────────
// Price formatting helpers
// ─────────────────────────────────────────────────────────────
function formatDeposit(d) {
  if (d >= 10000) {
    const eok = d / 10000;
    return Number.isInteger(eok) ? `${eok}억` : `${eok.toFixed(1)}억`;
  }
  return `${d}`;
}
function priceShort(h) {
  if (h.type === 'jeonse') return `전세 ${formatDeposit(h.deposit)}`;
  return `${formatDeposit(h.deposit)}/${h.rent}`;
}
function priceLong(h) {
  if (h.type === 'jeonse') return { label: '전세', value: formatDeposit(h.deposit) };
  return { label: '월세', value: `${formatDeposit(h.deposit)}/${h.rent}` };
}

// ─────────────────────────────────────────────────────────────
// Map background — Naver-ish: yellow main roads, white minor,
// building blocks, parks, river, place labels
// ─────────────────────────────────────────────────────────────
function MapBg({ w = 402, h = 600, zoom = 'medium' }) {
  // zoom: 'far' (out), 'medium' (default), 'close' (in)
  // far: hide small labels & minor roads
  // close: show more sub-labels
  const showMinorLabels = zoom !== 'far';
  const showSubLabels = zoom === 'close';
  const scale = zoom === 'far' ? 0.65 : zoom === 'close' ? 1.5 : 1;

  return (
    <svg width={w} height={h} viewBox="0 0 402 600" style={{ display: 'block', background: PH.mapBg }}>
      <defs>
        <pattern id="grain" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill={PH.mapBg}/>
          <rect width="1" height="1" fill="rgba(0,0,0,0.02)"/>
        </pattern>
      </defs>
      <rect width="402" height="600" fill="url(#grain)"/>

      <g style={{ transformOrigin: '201px 300px', transform: `scale(${scale})` }}>

      {/* parks */}
      <path d="M -20 -20 L 95 -20 L 115 75 L 60 140 L -20 110 Z" fill={PH.park}/>
      <circle cx="58" cy="65" r="22" fill={PH.parkDeep} opacity="0.5"/>
      <path d="M 320 380 L 430 360 L 430 490 L 340 510 Z" fill={PH.park}/>
      <ellipse cx="380" cy="430" rx="32" ry="26" fill={PH.parkDeep} opacity="0.5"/>
      <path d="M 180 545 L 290 555 L 280 625 L 180 625 Z" fill={PH.park}/>
      <circle cx="232" cy="585" r="14" fill={PH.parkDeep} opacity="0.4"/>

      {/* water — han river hint at bottom */}
      <path d="M -20 525 Q 110 505 210 530 T 430 540 L 430 575 Q 290 565 200 568 T -20 555 Z" fill={PH.water} opacity="0.85"/>

      {/* MAIN ROADS — yellow with edges */}
      {/* horizontal main */}
      <path d="M -20 200 L 430 222" stroke={PH.roadMajorEdge} strokeWidth="26" fill="none"/>
      <path d="M -20 200 L 430 222" stroke={PH.roadMajor} strokeWidth="22" fill="none"/>
      {/* vertical main */}
      <path d="M 200 -20 L 222 630" stroke={PH.roadMajorEdge} strokeWidth="22" fill="none"/>
      <path d="M 200 -20 L 222 630" stroke={PH.roadMajor} strokeWidth="18" fill="none"/>
      {/* diagonal bottom main */}
      <path d="M -20 420 L 430 442" stroke={PH.roadMajorEdge} strokeWidth="22" fill="none"/>
      <path d="M -20 420 L 430 442" stroke={PH.roadMajor} strokeWidth="18" fill="none"/>

      {/* SECONDARY ROADS — white with light edge */}
      <path d="M -20 100 L 430 112" stroke={PH.roadMinorEdge} strokeWidth="11" fill="none"/>
      <path d="M -20 100 L 430 112" stroke={PH.roadMinor} strokeWidth="9" fill="none"/>
      <path d="M -20 320 L 430 342" stroke={PH.roadMinorEdge} strokeWidth="11" fill="none"/>
      <path d="M -20 320 L 430 342" stroke={PH.roadMinor} strokeWidth="9" fill="none"/>
      <path d="M -20 480 L 430 492" stroke={PH.roadMinorEdge} strokeWidth="10" fill="none"/>
      <path d="M -20 480 L 430 492" stroke={PH.roadMinor} strokeWidth="8" fill="none"/>
      <path d="M 90 -20 L 110 630" stroke={PH.roadMinorEdge} strokeWidth="10" fill="none"/>
      <path d="M 90 -20 L 110 630" stroke={PH.roadMinor} strokeWidth="8" fill="none"/>
      <path d="M 310 -20 L 330 630" stroke={PH.roadMinorEdge} strokeWidth="10" fill="none"/>
      <path d="M 310 -20 L 330 630" stroke={PH.roadMinor} strokeWidth="8" fill="none"/>

      {/* TERTIARY ROADS */}
      <path d="M 150 -20 L 162 630" stroke={PH.roadMinor} strokeWidth="4" fill="none"/>
      <path d="M 260 -20 L 272 630" stroke={PH.roadMinor} strokeWidth="4" fill="none"/>
      <path d="M -20 150 L 430 162" stroke={PH.roadMinor} strokeWidth="4" fill="none"/>
      <path d="M -20 260 L 430 272" stroke={PH.roadMinor} strokeWidth="4" fill="none"/>
      <path d="M -20 370 L 430 382" stroke={PH.roadMinor} strokeWidth="4" fill="none"/>

      {/* BUILDING BLOCKS */}
      {[
        [10,210,72,18], [10,232,32,76], [50,232,35,38], [50,275,35,33],
        [120,118,30,40], [156,118,40,40], [120,166,35,36], [161,166,38,30],
        [120,212,30,12], [156,212,38,12], [120,232,18,76], [142,232,28,76], [175,232,22,76],
        [120,320,30,18], [156,320,38,18], [120,346,30,22], [156,346,38,22],
        [230,118,28,40], [264,118,40,40], [230,166,30,36], [266,166,38,30],
        [230,212,28,12], [262,212,40,12], [230,232,22,86], [258,232,28,86], [290,232,18,86],
        [230,326,28,18], [264,326,40,18],
        [10,346,28,68], [42,346,38,68], [10,420,30,18], [45,420,40,18],
        [120,346,28,68], [152,346,38,68],
        [230,346,28,68], [264,346,40,68],
        [10,450,28,28], [42,450,38,28], [10,510,32,28], [48,510,36,28],
        [230,450,28,28], [264,450,40,28],
      ].map(([x,y,bw,bh], i) => (
        <g key={i}>
          <rect x={x} y={y} width={bw} height={bh} fill={i % 3 === 0 ? PH.blockAlt : PH.block} rx="1.5"/>
          {i % 7 === 0 && (
            <rect x={x+1} y={y+1} width={bw-2} height={bh-2} fill="none"
              stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" rx="1.5"/>
          )}
        </g>
      ))}

      </g>

      {/* MAJOR LABELS (always visible) */}
      <g style={{ font: '600 11px Pretendard, sans-serif', fill: PH.mapLabel }}>
        <text x="50" y="42">효창공원</text>
        <text x="380" y="425" textAnchor="end">남산공원</text>
        <text x="60" y="555" fill="#5C8294">한강</text>
      </g>
      <g style={{ font: '500 9.5px Pretendard, sans-serif', fill: PH.mapLabel, letterSpacing: '0.3px' }}>
        <text x="200" y="217" textAnchor="middle" opacity="0.85">청파로</text>
        <text x="225" y="437" opacity="0.85">한강대로</text>
      </g>
      {showMinorLabels && (
        <g style={{ font: '500 8.5px Pretendard, sans-serif', fill: PH.mapLabelDim }}>
          <text x="120" y="115">서계동</text>
          <text x="232" y="115">후암동</text>
          <text x="38" y="395">갈월동</text>
          <text x="148" y="395">청파동</text>
          <text x="265" y="395">남영동</text>
          <text x="130" y="495">효창동</text>
        </g>
      )}
      {showSubLabels && (
        <g style={{ font: '500 7.5px Pretendard, sans-serif', fill: PH.mapLabelDim }}>
          <text x="118" y="180">청파초</text>
          <text x="240" y="280">후암빌딩</text>
          <text x="50" y="270">갈월교회</text>
          <text x="280" y="455">남영역</text>
        </g>
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Pins
// ─────────────────────────────────────────────────────────────

// Price pin — used at medium zoom. Selected variant is filled coral.
function PricePin({ house, selected }) {
  const p = priceShort(house);
  const isJeonse = house.type === 'jeonse';
  const bg = selected ? PH.coral : PH.white;
  const fg = selected ? '#fff' : PH.ink;
  const border = selected ? PH.coral : PH.borderSoft;
  return (
    <div style={{ position: 'relative', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))' }}>
      <div style={{
        background: bg, color: fg,
        border: `1.5px solid ${border}`,
        padding: '5px 11px 5px 8px', borderRadius: 16,
        whiteSpace: 'nowrap',
        font: '700 12px Pretendard, sans-serif', letterSpacing: '-0.2px',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{
          width: 16, height: 16, borderRadius: 4,
          background: selected ? 'rgba(255,255,255,0.25)' : (isJeonse ? PH.primarySoft : '#FCEFE7'),
          color: selected ? '#fff' : (isJeonse ? PH.primary : PH.coral),
          font: '700 8.5px Pretendard',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          letterSpacing: '-0.3px',
        }}>{isJeonse ? '전' : '월'}</span>
        <span>{p.replace(/^전세 /, '')}</span>
      </div>
      <div style={{
        position: 'absolute', left: '50%', bottom: -3.5,
        transform: 'translateX(-50%) rotate(45deg)',
        width: 7, height: 7, background: bg,
        borderRight: `1.5px solid ${border}`,
        borderBottom: `1.5px solid ${border}`,
      }}/>
    </div>
  );
}

// Cluster pin — used at far zoom (multiple houses grouped)
function ClusterPin({ count, selected }) {
  return (
    <div style={{
      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))',
      width: 48, height: 48, borderRadius: '50%',
      background: selected ? PH.coral : PH.white,
      border: `2.5px solid ${selected ? PH.coral : PH.primary}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column',
      color: selected ? '#fff' : PH.ink,
    }}>
      <div style={{ font: '800 16px Pretendard', letterSpacing: '-0.5px', lineHeight: 1 }}>{count}</div>
      <div style={{ font: '600 8px Pretendard', opacity: 0.6, marginTop: 1 }}>매물</div>
    </div>
  );
}

// Detail pin — used at close zoom (shows name + price)
function DetailPin({ house, selected }) {
  const isJeonse = house.type === 'jeonse';
  const bg = selected ? PH.coral : PH.white;
  const fg = selected ? '#fff' : PH.ink;
  return (
    <div style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.22))' }}>
      <div style={{
        background: bg, color: fg, borderRadius: 12,
        border: `1.5px solid ${selected ? PH.coral : PH.borderSoft}`,
        padding: '6px 11px', whiteSpace: 'nowrap', minWidth: 100,
      }}>
        <div style={{
          font: '600 10px Pretendard', opacity: 0.7, letterSpacing: '-0.2px',
          marginBottom: 1,
        }}>{house.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            width: 15, height: 15, borderRadius: 4,
            background: selected ? 'rgba(255,255,255,0.22)' : (isJeonse ? PH.primarySoft : '#FCEFE7'),
            color: selected ? '#fff' : (isJeonse ? PH.primary : PH.coral),
            font: '700 8px Pretendard',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{isJeonse ? '전' : '월'}</span>
          <span style={{ font: '700 12.5px Pretendard', letterSpacing: '-0.3px' }}>
            {priceShort(house).replace(/^전세 /, '')}
          </span>
        </div>
      </div>
    </div>
  );
}

// position helper
function PinAt({ x, y, z = 5, children }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, transform: 'translate(-50%, -100%)',
      zIndex: z,
    }}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// Teardrop house pin (야놀자-style) + count badge
// ─────────────────────────────────────────────────────────────
function HousePin({ count = 1, selected = false, size = 40 }) {
  const c = selected ? PH.ink : PH.coral;
  return (
    <div style={{ position: 'relative', width: size, height: size * 1.15,
      filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.28))' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: size, height: size,
        background: c, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
        border: '2.5px solid white',
      }}/>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="home" size={size * 0.45} color="#fff" stroke={2}/>
      </div>
      {count > 1 && (
        <div style={{
          position: 'absolute', right: -4, bottom: size * 0.12,
          minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px',
          background: PH.white, color: c, border: `1.5px solid ${c}`,
          font: '800 10px Pretendard',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{count}</div>
      )}
    </div>
  );
}

// Selected-pin callout bubble (white pill with house icon + name + price, tail down)
function HouseCallout({ house }) {
  const isJeonse = house.type === 'jeonse';
  return (
    <div style={{ position: 'relative', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' }}>
      <div style={{
        background: PH.white, borderRadius: 16, padding: '6px 12px 6px 6px',
        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 9,
        border: `1.5px solid ${PH.coral}`,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 11, background: PH.coral,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name="home" size={17} color="#fff" stroke={2}/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ font: '700 12.5px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>{house.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 15, height: 15, borderRadius: 4,
              background: isJeonse ? PH.primarySoft : '#FCEFE7',
              color: isJeonse ? PH.primary : PH.coral,
              font: '700 8px Pretendard',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{isJeonse ? '전' : '월'}</span>
            <span style={{ font: '800 13px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>
              {priceShort(house).replace(/^전세 /, '')}
            </span>
          </div>
        </div>
      </div>
      {/* tail */}
      <div style={{
        position: 'absolute', left: '50%', bottom: -7, transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
        borderTop: `8px solid ${PH.coral}`,
      }}/>
      <div style={{
        position: 'absolute', left: '50%', bottom: -4.5, transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
        borderTop: `6px solid ${PH.white}`,
      }}/>
    </div>
  );
}

// "내 위치"
function MyLocation({ x = 200, y = 350 }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', zIndex: 4 }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(28,127,231,0.28), rgba(28,127,231,0) 70%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, margin: 'auto', width: 14, height: 14,
        borderRadius: '50%', background: '#1C7FE7', border: '2.5px solid white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline icons
// ─────────────────────────────────────────────────────────────
function Icon({ name, size = 16, color = 'currentColor', stroke = 1.6 }) {
  const s = { width: size, height: size, display: 'inline-block', verticalAlign: 'middle' };
  const p = { fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'search': return <svg viewBox="0 0 20 20" style={s}><circle cx="9" cy="9" r="6" {...p}/><path d="M14 14l4 4" {...p}/></svg>;
    case 'close': return <svg viewBox="0 0 20 20" style={s}><path d="M5 5l10 10M15 5l-10 10" {...p}/></svg>;
    case 'mic': return <svg viewBox="0 0 20 20" style={s}><rect x="7.5" y="3" width="5" height="9" rx="2.5" {...p}/><path d="M4.5 9.5a5.5 5.5 0 0011 0M10 15v3" {...p}/></svg>;
    case 'menu': return <svg viewBox="0 0 20 20" style={s}><path d="M3 6h14M3 10h14M3 14h14" {...p}/></svg>;
    case 'filter': return <svg viewBox="0 0 20 20" style={s}><path d="M3 5h14M5.5 10h9M8.5 15h3" {...p}/></svg>;
    case 'sliders': return <svg viewBox="0 0 20 20" style={s}><path d="M4 6h12M4 10h6M4 14h9" {...p}/><circle cx="13" cy="6" r="2" {...p}/><circle cx="9" cy="10" r="2" {...p}/><circle cx="12" cy="14" r="2" {...p}/></svg>;
    case 'plus': return <svg viewBox="0 0 20 20" style={s}><path d="M10 4v12M4 10h12" {...p}/></svg>;
    case 'minus': return <svg viewBox="0 0 20 20" style={s}><path d="M4 10h12" {...p}/></svg>;
    case 'sun': return <svg viewBox="0 0 20 20" style={s}><circle cx="10" cy="10" r="3.5" {...p}/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.5 4.5l1.4 1.4M14.1 14.1l1.4 1.4M4.5 15.5l1.4-1.4M14.1 5.9l1.4-1.4" {...p}/></svg>;
    case 'drop': return <svg viewBox="0 0 20 20" style={s}><path d="M10 2.5C7 6 4.5 9 4.5 12a5.5 5.5 0 0011 0c0-3-2.5-6-5.5-9.5z" {...p}/></svg>;
    case 'mold': return <svg viewBox="0 0 20 20" style={s}><circle cx="7" cy="9" r="2" {...p}/><circle cx="13" cy="7" r="2" {...p}/><circle cx="12" cy="13" r="2.5" {...p}/></svg>;
    case 'ear': return <svg viewBox="0 0 20 20" style={s}><path d="M7 16c0-2-2-2-2-5a5 5 0 0110 0c0 2-1.5 2.5-3 3.5s-1 2.5-2.5 2.5S7 16 7 16z" {...p}/></svg>;
    case 'wind': return <svg viewBox="0 0 20 20" style={s}><path d="M3 8h10a2.5 2.5 0 100-5M3 12h13a2.5 2.5 0 110 5M3 16h6" {...p}/></svg>;
    case 'home': return <svg viewBox="0 0 20 20" style={s}><path d="M3 10l7-6 7 6v7a1 1 0 01-1 1h-3v-5H7v5H4a1 1 0 01-1-1v-7z" {...p}/></svg>;
    case 'compass': return <svg viewBox="0 0 20 20" style={s}><circle cx="10" cy="10" r="7" {...p}/><path d="M13 7l-1.5 4.5L7 13l1.5-4.5L13 7z" {...p}/></svg>;
    case 'layers': return <svg viewBox="0 0 20 20" style={s}><path d="M10 3l7 3.5L10 10 3 6.5 10 3zM3 10l7 3.5L17 10M3 13.5l7 3.5L17 13.5" {...p}/></svg>;
    case 'list': return <svg viewBox="0 0 20 20" style={s}><path d="M7 6h10M7 10h10M7 14h10" {...p}/><circle cx="4" cy="6" r="0.8" fill={color} stroke="none"/><circle cx="4" cy="10" r="0.8" fill={color} stroke="none"/><circle cx="4" cy="14" r="0.8" fill={color} stroke="none"/></svg>;
    case 'navigate': return <svg viewBox="0 0 20 20" style={s}><path d="M10 3l4 14-4-3-4 3 4-14z" {...p}/></svg>;
    case 'check': return <svg viewBox="0 0 20 20" style={s}><path d="M4 11l4 4 8-9" {...p}/></svg>;
    case 'chev-r': return <svg viewBox="0 0 20 20" style={s}><path d="M8 5l5 5-5 5" {...p}/></svg>;
    case 'chev-d': return <svg viewBox="0 0 20 20" style={s}><path d="M5 8l5 5 5-5" {...p}/></svg>;
    case 'dot-3': return <svg viewBox="0 0 20 20" style={s}><circle cx="5" cy="10" r="1.4" fill={color} stroke="none"/><circle cx="10" cy="10" r="1.4" fill={color} stroke="none"/><circle cx="15" cy="10" r="1.4" fill={color} stroke="none"/></svg>;
    case 'bookmark': return <svg viewBox="0 0 20 20" style={s}><path d="M5 3h10v15l-5-3-5 3V3z" {...p}/></svg>;
    case 'edit': return <svg viewBox="0 0 20 20" style={s}><path d="M13 3l4 4-9 9H4v-4l9-9z" {...p}/></svg>;
    case 'user': return <svg viewBox="0 0 20 20" style={s}><circle cx="10" cy="6.5" r="3.2" {...p}/><path d="M4 17c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" {...p}/></svg>;
    case 'heart': return <svg viewBox="0 0 20 20" style={s}><path d="M10 16.5C4 12.5 3 9.5 3 7.3 3 5 4.8 3.5 6.8 3.5c1.4 0 2.6.8 3.2 1.9.6-1.1 1.8-1.9 3.2-1.9C15.2 3.5 17 5 17 7.3c0 2.2-1 5.2-7 9.2z" {...p}/></svg>;
    case 'grid': return <svg viewBox="0 0 20 20" style={s}><rect x="3" y="3" width="6" height="6" rx="1.5" {...p}/><rect x="11" y="3" width="6" height="6" rx="1.5" {...p}/><rect x="3" y="11" width="6" height="6" rx="1.5" {...p}/><rect x="11" y="11" width="6" height="6" rx="1.5" {...p}/></svg>;
    case 'briefcase': return <svg viewBox="0 0 20 20" style={s}><rect x="3" y="6.5" width="14" height="10" rx="2" {...p}/><path d="M7.5 6.5V5a1.5 1.5 0 011.5-1.5h2A1.5 1.5 0 0112.5 5v1.5M3 11h14" {...p}/></svg>;
    case 'school': return <svg viewBox="0 0 20 20" style={s}><path d="M10 3l8 4-8 4-8-4 8-4z" {...p}/><path d="M5 8.5V13c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V8.5M18 7v4.5" {...p}/></svg>;
    case 'train': return <svg viewBox="0 0 20 20" style={s}><rect x="5" y="3" width="10" height="11" rx="2.5" {...p}/><path d="M5 9h10M7.5 17l-2 1.5M12.5 17l2 1.5" {...p}/><circle cx="7.5" cy="11.5" r="0.8" fill={color} stroke="none"/><circle cx="12.5" cy="11.5" r="0.8" fill={color} stroke="none"/></svg>;
    case 'car': return <svg viewBox="0 0 20 20" style={s}><path d="M3 13v-2.5l1.8-4A2 2 0 016.7 5h6.6a2 2 0 011.9 1.5l1.8 4V13M3 13h14M3 13v2M17 13v2" {...p}/><circle cx="6.5" cy="13" r="1.3" {...p}/><circle cx="13.5" cy="13" r="1.3" {...p}/></svg>;
    case 'walk': return <svg viewBox="0 0 20 20" style={s}><circle cx="11" cy="3.8" r="1.6" {...p}/><path d="M11 7l-2.5 1.5L7 13M11 7l2 2 2 1M11 7v4l-1.5 6M11 11l1.5 6" {...p}/></svg>;
    case 'bike': return <svg viewBox="0 0 20 20" style={s}><circle cx="5" cy="14" r="3" {...p}/><circle cx="15" cy="14" r="3" {...p}/><path d="M5 14l3.5-6h3M8.5 8l3 6M11.5 8h2M11.5 5.5h1.5" {...p}/></svg>;
    case 'clock': return <svg viewBox="0 0 20 20" style={s}><circle cx="10" cy="10" r="7" {...p}/><path d="M10 6v4l2.5 2" {...p}/></svg>;
    case 'pin': return <svg viewBox="0 0 20 20" style={s}><path d="M10 18s6-5.3 6-10A6 6 0 004 8c0 4.7 6 10 6 10z" {...p}/><circle cx="10" cy="8" r="2.2" {...p}/></svg>;
    case 'route': return <svg viewBox="0 0 20 20" style={s}><circle cx="5" cy="5" r="2" {...p}/><circle cx="15" cy="15" r="2" {...p}/><path d="M5 7v4a3 3 0 003 3h4" {...p}/></svg>;
    default: return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Checklist meta
// ─────────────────────────────────────────────────────────────
const CL_META = {
  sun: { label: '햇빛', icon: 'sun' },
  water: { label: '수압', icon: 'drop' },
  mold: { label: '곰팡이', icon: 'mold' },
  noise: { label: '방음', icon: 'ear' },
  vent: { label: '환기', icon: 'wind' },
};
const clColor = (v) => v >= 3 ? PH.green : v === 2 ? PH.amber : PH.red;
const clLabel = (v) => v >= 3 ? '좋음' : v === 2 ? '보통' : '나쁨';

// ─────────────────────────────────────────────────────────────
// iPhone Screen shell
// ─────────────────────────────────────────────────────────────
function Screen({ children }) {
  return (
    <div style={{ width: 402, height: 874, position: 'relative', background: PH.surface, overflow: 'hidden', borderRadius: 48 }}>
      <div style={{
        width: 402, height: 874, position: 'absolute', inset: 0, borderRadius: 48,
        boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
        pointerEvents: 'none', zIndex: 100,
      }}/>
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 50,
      }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
        <IOSStatusBar dark={false} />
      </div>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 60,
        height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        paddingBottom: 8, pointerEvents: 'none',
      }}>
        <div style={{ width: 139, height: 5, borderRadius: 100, background: 'rgba(0,0,0,0.25)' }} />
      </div>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 48, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, {
  PH, HOUSES, MapBg,
  PricePin, ClusterPin, DetailPin, PinAt, MyLocation,
  HousePin, HouseCallout,
  Icon, CL_META, clColor, clLabel, Screen,
  priceShort, priceLong, formatDeposit,
});
