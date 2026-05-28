// Pickhouse Main Screen — single canonical design with state props.
// Props:
//   initialSelected: house id to focus initially
//   filterOpen: bool — show filter bottom sheet
//   zoom: 'far' | 'medium' | 'close'
//   compact: bool — collapse bottom sheet (for "지도 더 보기" state)

const { PH, HOUSES, MapBg, PricePin, ClusterPin, DetailPin, PinAt, MyLocation,
        Icon, CL_META, clColor, clLabel, Screen, priceShort, priceLong, formatDeposit } = window;

// ─────────────────────────────────────────────────────────────
// Top bar: search (clean) + standalone filter icon button
// ─────────────────────────────────────────────────────────────
function TopBar({ filterCount = 0 }) {
  return (
    <div style={{ padding: '54px 14px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
      {/* search pill */}
      <div style={{
        flex: 1, height: 48, background: PH.white, borderRadius: 24,
        display: 'flex', alignItems: 'center', padding: '0 6px 0 16px', gap: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
        border: `1px solid ${PH.borderSoft}`,
      }}>
        <Icon name="menu" size={18} color={PH.ink70}/>
        <div style={{ flex: 1, font: '500 14.5px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>
          장소, 지명, 집 이름 검색
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: PH.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="search" size={17} color="white" stroke={2.2}/>
        </div>
      </div>

      {/* filter icon button — standalone */}
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 24,
          background: filterCount > 0 ? PH.ink : PH.white,
          border: `1px solid ${filterCount > 0 ? PH.ink : PH.borderSoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
        }}>
          <Icon name="sliders" size={20} color={filterCount > 0 ? '#fff' : PH.ink} stroke={2}/>
        </div>
        {filterCount > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 18, height: 18, borderRadius: 9, padding: '0 5px',
            background: PH.coral, color: '#fff',
            font: '700 10.5px Pretendard',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
          }}>{filterCount}</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Floating map controls (right side)
// ─────────────────────────────────────────────────────────────
function MapTools({ bottom = 290 }) {
  const btn = (icon, key) => (
    <div key={key} style={{
      width: 40, height: 40, borderRadius: 20, background: PH.white,
      boxShadow: '0 2px 6px rgba(0,0,0,0.12), 0 6px 16px rgba(0,0,0,0.06)',
      border: `1px solid ${PH.borderSoft}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={icon} size={17} color={PH.ink70} stroke={1.8}/>
    </div>
  );
  return (
    <div style={{ position: 'absolute', right: 14, bottom, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 25 }}>
      {btn('layers', 'l')}
      {btn('navigate', 'n')}
    </div>
  );
}

// "목록보기" pill floating above bottom sheet
function ListTogglePill({ bottom = 280 }) {
  return (
    <div style={{
      position: 'absolute', left: '50%', bottom, transform: 'translateX(-50%)', zIndex: 25,
      height: 38, padding: '0 16px', borderRadius: 19,
      background: PH.ink, color: '#fff',
      display: 'flex', alignItems: 'center', gap: 6,
      font: '700 13px Pretendard', letterSpacing: '-0.2px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
    }}>
      <Icon name="list" size={15} color="#fff" stroke={2}/>
      목록 보기
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom card carousel
// ─────────────────────────────────────────────────────────────
function HouseCard({ h, active }) {
  const price = priceLong(h);
  // Stylized photo placeholder using hue
  const photoBg = `linear-gradient(135deg,
    hsl(${h.photoHue}, 22%, 78%),
    hsl(${(h.photoHue + 30) % 360}, 22%, 60%))`;
  return (
    <div style={{
      scrollSnapAlign: 'center',
      minWidth: 320, width: 320, height: 188,
      background: PH.white, borderRadius: 16,
      border: active ? `1.5px solid ${PH.ink}` : `1px solid ${PH.borderSoft}`,
      boxShadow: active
        ? '0 4px 16px rgba(0,0,0,0.10), 0 12px 28px rgba(0,0,0,0.08)'
        : '0 2px 8px rgba(0,0,0,0.05)',
      padding: 12, display: 'flex', gap: 12, position: 'relative',
    }}>
      {/* photo */}
      <div style={{
        width: 118, height: 164, borderRadius: 10, background: photoBg,
        position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        {/* fake interior shapes */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.18) 100%)' }}/>
        <div style={{ position: 'absolute', top: 16, right: 12, width: 38, height: 30, background: 'rgba(255,255,255,0.45)', borderRadius: 2 }}/>
        <div style={{ position: 'absolute', top: 16, right: 56, width: 30, height: 30, background: 'rgba(255,255,255,0.35)', borderRadius: 2 }}/>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'rgba(255,255,255,0.18)' }}/>
        <div style={{
          position: 'absolute', top: 8, left: 8,
          padding: '3px 7px', borderRadius: 5,
          background: 'rgba(0,0,0,0.55)', color: '#fff',
          font: '600 10px Pretendard', letterSpacing: '-0.2px',
        }}>{h.visited} 방문</div>
        <div style={{
          position: 'absolute', bottom: 8, left: 8,
          padding: '2px 7px', borderRadius: 5,
          background: PH.coral, color: '#fff',
          font: '700 10px Pretendard',
        }}>{h.tag}</div>
      </div>

      {/* info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* type badge + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
          <span style={{
            padding: '1.5px 6px', borderRadius: 4,
            background: h.type === 'jeonse' ? PH.primarySoft : '#FCEFE7',
            color: h.type === 'jeonse' ? PH.primary : PH.coral,
            font: '700 10px Pretendard', letterSpacing: '-0.2px',
          }}>{h.type === 'jeonse' ? '전세' : '월세'}</span>
          <Icon name="bookmark" size={14} color={PH.muted} stroke={1.6}/>
        </div>

        <div style={{
          font: '700 15px Pretendard', color: PH.ink, letterSpacing: '-0.4px',
          marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{h.name}</div>
        <div style={{
          font: '500 11px Pretendard', color: PH.muted, marginBottom: 8,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{h.addr}</div>

        {/* price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
          <span style={{ font: '700 18px Pretendard', color: PH.ink, letterSpacing: '-0.6px' }}>
            {price.value}
          </span>
          {h.type === 'rent' && (
            <span style={{ font: '500 11px Pretendard', color: PH.muted }}>관리비 {h.mgmt}</span>
          )}
        </div>

        {/* chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          <MiniChip>{h.pyeong}평</MiniChip>
          <MiniChip>{h.rooms}</MiniChip>
          <MiniChip>{h.floor}</MiniChip>
        </div>

        {/* checklist dots */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: 7, alignItems: 'center' }}>
          {Object.entries(h.cl).map(([k, v]) => (
            <div key={k} title={CL_META[k].label} style={{
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              <Icon name={CL_META[k].icon} size={11} color={clColor(v)} stroke={1.8}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniChip({ children }) {
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 4,
      background: PH.surface, border: `1px solid ${PH.borderSoft}`,
      font: '600 10.5px Pretendard', color: PH.ink70,
      letterSpacing: '-0.2px',
    }}>{children}</span>
  );
}

function BottomSheet({ houses, activeIdx, onScrollIdx }) {
  const scrollerRef = React.useRef(null);

  // Sync scroll → active index
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardW = 320 + 10; // card + gap
      const idx = Math.round(el.scrollLeft / cardW);
      onScrollIdx(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [onScrollIdx]);

  // Set initial scroll position to match initialSelected
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardW = 320 + 10;
    el.scrollLeft = activeIdx * cardW;
  }, []); // run once

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: PH.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
      boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
      paddingBottom: 28,
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 4 }}>
        <div style={{ width: 40, height: 4.5, borderRadius: 3, background: '#D8D5CD' }}/>
      </div>

      {/* sheet header */}
      <div style={{ padding: '6px 18px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ font: '700 16px Pretendard', color: PH.ink, letterSpacing: '-0.4px' }}>이 근처 내 집</span>
          <span style={{ font: '700 16px Pretendard', color: PH.primary }}>{houses.length}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 3,
          color: PH.ink70, font: '600 12px Pretendard', padding: '4px 8px',
          border: `1px solid ${PH.border}`, borderRadius: 14,
        }}>
          최근 본 순
          <Icon name="chev-d" size={12} color={PH.muted}/>
        </div>
      </div>

      {/* carousel */}
      <div
        ref={scrollerRef}
        style={{
          display: 'flex', gap: 10, overflowX: 'auto', overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          padding: '4px 41px 8px',
          scrollbarWidth: 'none',
        }}
      >
        {houses.map((h, i) => (
          <HouseCard key={h.id} h={h} active={i === activeIdx}/>
        ))}
      </div>

      {/* pagination dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 8 }}>
        {houses.map((_, i) => (
          <div key={i} style={{
            width: i === activeIdx ? 18 : 6, height: 6, borderRadius: 3,
            background: i === activeIdx ? PH.ink : '#D8D5CD',
            transition: 'width 0.2s',
          }}/>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Filter bottom sheet (overlay)
// ─────────────────────────────────────────────────────────────
function FilterSheet() {
  return (
    <>
      {/* dim */}
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(14,26,20,0.35)', zIndex: 70,
      }}/>
      {/* sheet */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 80,
        background: PH.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
        paddingBottom: 32, maxHeight: 580, display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 8 }}>
          <div style={{ width: 40, height: 4.5, borderRadius: 3, background: '#D8D5CD' }}/>
        </div>

        {/* header */}
        <div style={{ padding: '0 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ font: '700 18px Pretendard', color: PH.ink, letterSpacing: '-0.5px' }}>필터</div>
          <div style={{ font: '600 13px Pretendard', color: PH.muted }}>초기화</div>
        </div>

        {/* type toggle */}
        <FilterSection title="거래 유형">
          <SegToggle options={['전체', '월세', '전세']} active={1}/>
        </FilterSection>

        {/* deposit range */}
        <FilterSection title="보증금" value="500 ~ 2,000만">
          <RangeBar lo={0.18} hi={0.55}/>
        </FilterSection>

        {/* monthly */}
        <FilterSection title="월세" value="40 ~ 70만">
          <RangeBar lo={0.32} hi={0.62}/>
        </FilterSection>

        {/* pyeong */}
        <FilterSection title="평수">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['전체', '~5평', '~10평', '~15평', '~20평', '20평~'].map((p, i) => (
              <PillBtn key={p} active={i === 2 || i === 3}>{p}</PillBtn>
            ))}
          </div>
        </FilterSection>

        {/* rooms */}
        <FilterSection title="방 개수">
          <div style={{ display: 'flex', gap: 6 }}>
            {['원룸', '1.5룸', '투룸', '쓰리룸+'].map((p, i) => (
              <PillBtn key={p} active={i === 0 || i === 1}>{p}</PillBtn>
            ))}
          </div>
        </FilterSection>

        {/* apply */}
        <div style={{ padding: '12px 18px 0', display: 'flex', gap: 8 }}>
          <div style={{
            height: 50, flex: '0 0 88px', borderRadius: 14,
            border: `1px solid ${PH.border}`, background: PH.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: '700 14px Pretendard', color: PH.ink70,
          }}>닫기</div>
          <div style={{
            height: 50, flex: 1, borderRadius: 14,
            background: PH.ink, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            font: '700 14.5px Pretendard', letterSpacing: '-0.3px',
          }}>5개 매물 보기</div>
        </div>
      </div>
    </>
  );
}

function FilterSection({ title, value, children }) {
  return (
    <div style={{ padding: '14px 18px 6px', borderTop: `1px solid ${PH.borderSoft}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ font: '700 13.5px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>{title}</div>
        {value && <div style={{ font: '600 12px Pretendard', color: PH.primary }}>{value}</div>}
      </div>
      {children}
    </div>
  );
}

function SegToggle({ options, active }) {
  return (
    <div style={{ display: 'flex', gap: 0, background: PH.surface, padding: 3, borderRadius: 10 }}>
      {options.map((o, i) => (
        <div key={o} style={{
          flex: 1, height: 36, borderRadius: 8,
          background: i === active ? PH.white : 'transparent',
          color: i === active ? PH.ink : PH.muted,
          boxShadow: i === active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          font: '700 13px Pretendard', letterSpacing: '-0.3px',
        }}>{o}</div>
      ))}
    </div>
  );
}

function RangeBar({ lo, hi }) {
  return (
    <div style={{ padding: '4px 8px 0' }}>
      <div style={{ position: 'relative', height: 28 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 12, height: 4, borderRadius: 2, background: PH.borderSoft }}/>
        <div style={{
          position: 'absolute', left: `${lo * 100}%`, right: `${(1 - hi) * 100}%`,
          top: 12, height: 4, borderRadius: 2, background: PH.primary,
        }}/>
        <div style={{
          position: 'absolute', left: `calc(${lo * 100}% - 11px)`, top: 2,
          width: 22, height: 22, borderRadius: '50%', background: PH.white,
          border: `2px solid ${PH.primary}`, boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
        }}/>
        <div style={{
          position: 'absolute', left: `calc(${hi * 100}% - 11px)`, top: 2,
          width: 22, height: 22, borderRadius: '50%', background: PH.white,
          border: `2px solid ${PH.primary}`, boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
        }}/>
      </div>
    </div>
  );
}

function PillBtn({ active, children }) {
  return (
    <div style={{
      padding: '6px 12px', borderRadius: 18, whiteSpace: 'nowrap',
      background: active ? PH.primarySoft : PH.white,
      color: active ? PH.primary : PH.ink70,
      border: `1px solid ${active ? PH.primary : PH.border}`,
      font: '600 12.5px Pretendard', letterSpacing: '-0.3px',
      display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {active && <Icon name="check" size={11} color={PH.primary} stroke={2.4}/>}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Zoom indicator (bottom-left "+/-" stack)
// ─────────────────────────────────────────────────────────────
function ZoomBadge({ zoom }) {
  const label = zoom === 'far' ? '동 단위' : zoom === 'close' ? '건물 단위' : '구역 단위';
  return (
    <div style={{
      position: 'absolute', left: 14, bottom: 290, zIndex: 25,
      background: 'rgba(14,26,20,0.78)', color: '#fff',
      padding: '4px 10px', borderRadius: 10, font: '600 10.5px Pretendard',
      letterSpacing: '-0.2px',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
    }}>
      <span style={{ opacity: 0.7, marginRight: 4 }}>지도 보기</span>
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Map layer — renders pins by zoom level
// ─────────────────────────────────────────────────────────────
function MapLayer({ zoom, selectedId, houses }) {
  if (zoom === 'far') {
    // Group houses into clusters
    const clusters = [
      { x: 158, y: 240, ids: [1, 2, 3] },
      { x: 280, y: 360, ids: [4, 6] },
      { x: 105, y: 440, ids: [5, 7] },
    ];
    return (
      <>
        <MyLocation x={200} y={310}/>
        {clusters.map((c, i) => (
          <PinAt key={i} x={c.x} y={c.y}>
            <ClusterPin count={c.ids.length} selected={c.ids.includes(selectedId)}/>
          </PinAt>
        ))}
      </>
    );
  }
  if (zoom === 'close') {
    // Show only a subset (zoomed in), but those visible get detail pins
    const nearbyIds = [1, 3, 5, 6];
    const visible = houses.filter(h => nearbyIds.includes(h.id));
    // Spread them across map
    const positions = {
      1: { x: 90, y: 180 }, 3: { x: 250, y: 290 },
      5: { x: 110, y: 460 }, 6: { x: 300, y: 470 },
    };
    return (
      <>
        <MyLocation x={200} y={350}/>
        {visible.map(h => {
          const pos = positions[h.id];
          return (
            <PinAt key={h.id} x={pos.x} y={pos.y}>
              <DetailPin house={h} selected={h.id === selectedId}/>
            </PinAt>
          );
        })}
      </>
    );
  }
  // medium
  return (
    <>
      <MyLocation x={200} y={340}/>
      {houses.map(h => (
        <PinAt key={h.id} x={h.x} y={h.y}>
          <PricePin house={h} selected={h.id === selectedId}/>
        </PinAt>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MainScreen — the screen
// ─────────────────────────────────────────────────────────────
function MainScreen({ initialSelected = 1, filterOpen = false, zoom = 'medium', showZoomBadge = false }) {
  const initialIdx = HOUSES.findIndex(h => h.id === initialSelected);
  const [activeIdx, setActiveIdx] = React.useState(initialIdx);
  const selectedId = HOUSES[activeIdx]?.id ?? initialSelected;

  return (
    <Screen>
      {/* Map */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 402, height: 600 }}>
        <MapBg w={402} h={600} zoom={zoom}/>
        <MapLayer zoom={zoom} selectedId={selectedId} houses={HOUSES}/>
      </div>

      {/* gradient fade between map and sheet */}
      <div style={{
        position: 'absolute', top: 540, left: 0, right: 0, height: 60, zIndex: 10,
        background: 'linear-gradient(180deg, transparent, rgba(250,250,246,0.0) 0%, rgba(0,0,0,0.06) 100%)',
        pointerEvents: 'none',
      }}/>

      {/* Top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
        <TopBar filterCount={filterOpen ? 0 : 2}/>
      </div>

      {/* Map controls */}
      <MapTools bottom={335}/>
      <ListTogglePill bottom={325}/>
      {showZoomBadge && <ZoomBadge zoom={zoom}/>}

      {/* Bottom carousel */}
      <BottomSheet houses={HOUSES} activeIdx={activeIdx} onScrollIdx={setActiveIdx}/>

      {/* Filter overlay */}
      {filterOpen && <FilterSheet/>}
    </Screen>
  );
}

Object.assign(window, { MainScreen });
