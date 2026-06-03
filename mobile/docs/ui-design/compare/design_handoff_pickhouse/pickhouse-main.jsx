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
// Floating card carousel (sits above bottom nav, peeks next card)
// ─────────────────────────────────────────────────────────────
function FloatingCards({ houses, activeIdx, onScrollIdx, commuteMode }) {
  const scrollerRef = React.useRef(null);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardW = 326 + 12;
      const idx = Math.round(el.scrollLeft / cardW);
      onScrollIdx(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [onScrollIdx]);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = activeIdx * (326 + 12);
  }, []);

  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 96, zIndex: 28 }}>
      {commuteMode === 'none' && (
        <div style={{ padding: '0 16px 8px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: PH.white, borderRadius: 13, padding: '9px 10px 9px 12px',
            border: `1px solid ${PH.borderSoft}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: PH.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="route" size={14} color={PH.primary} stroke={1.9}/>
            </div>
            <span style={{ flex: 1, font: '600 12px Pretendard', color: PH.ink70, letterSpacing: '-0.2px', lineHeight: 1.35 }}>
              직장·학교 등록하고 <b style={{ color: PH.ink }}>통근시간</b> 보기
            </span>
            <div style={{
              height: 30, padding: '0 13px', borderRadius: 15, background: PH.ink, color: '#fff',
              display: 'flex', alignItems: 'center', gap: 3, font: '700 12px Pretendard', flexShrink: 0,
            }}>
              등록
            </div>
          </div>
        </div>
      )}
      <div
        ref={scrollerRef}
        style={{
          display: 'flex', gap: 12, overflowX: 'auto', overflowY: 'hidden',
          scrollSnapType: 'x mandatory', padding: '0 16px 4px', scrollbarWidth: 'none',
        }}
      >
        {houses.map((h, i) => (
          <HouseCard key={h.id} h={h} active={i === activeIdx} commuteMode={commuteMode}/>
        ))}
        <div style={{ minWidth: 4 }}/>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bottom navigation bar
// ─────────────────────────────────────────────────────────────
function BottomNav({ active = 0 }) {
  const tabs = [
    { icon: 'navigate', label: '지도' },
    { icon: 'list', label: '목록' },
    { icon: 'plus', label: '집 추가', center: true },
    { icon: 'grid', label: '비교' },
    { icon: 'user', label: '마이' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 45,
      background: PH.white, paddingBottom: 22, paddingTop: 8,
      borderTop: `1px solid ${PH.borderSoft}`,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.04)',
    }}>
      {tabs.map((t, i) => {
        if (t.center) {
          return (
            <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, marginTop: -2 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 16, background: PH.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(27,122,83,0.35)',
              }}>
                <Icon name="plus" size={24} color="#fff" stroke={2.4}/>
              </div>
              <span style={{ font: '600 10px Pretendard', color: PH.ink70, letterSpacing: '-0.2px' }}>{t.label}</span>
            </div>
          );
        }
        const on = i === active;
        return (
          <div key={t.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <Icon name={t.icon} size={23} color={on ? PH.ink : PH.muted} stroke={on ? 2 : 1.7}/>
            <span style={{ font: `${on ? 700 : 600} 10px Pretendard`, color: on ? PH.ink : PH.muted, letterSpacing: '-0.2px' }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// Workplace context chip (top, below search) — shows commute reference
// Commute reference switcher chip (top, below search).
// Tapping it opens the 통근 기준지 sheet → entry point to 직장·학교 등록.
// mode: 'work' | 'school' | 'both'
function CommuteChip({ mode = 'work' }) {
  if (mode === 'both') {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10,
        height: 34, padding: '0 6px 0 6px', borderRadius: 17,
        background: PH.white, border: `1px solid ${PH.borderSoft}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 8px', height: 24, borderRadius: 12, background: PH.primarySoft }}>
          <Icon name="briefcase" size={12} color={PH.primary} stroke={1.9}/>
          <span style={{ font: '700 11.5px Pretendard', color: PH.primary }}>강남역</span>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 8px', height: 24, borderRadius: 12, background: '#EFEAFB' }}>
          <Icon name="school" size={12} color="#7B5FCC" stroke={1.9}/>
          <span style={{ font: '700 11.5px Pretendard', color: '#7B5FCC' }}>한양대</span>
        </div>
        <Icon name="chev-d" size={13} color={PH.muted}/>
      </div>
    );
  }
  const meta = mode === 'school'
    ? { icon: 'school', color: '#7B5FCC', soft: '#EFEAFB', name: '한양대' }
    : { icon: 'briefcase', color: PH.primary, soft: PH.primarySoft, name: '강남역' };
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
      height: 34, padding: '0 12px 0 10px', borderRadius: 17,
      background: PH.white, border: `1px solid ${PH.borderSoft}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, background: meta.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={meta.icon} size={12} color={meta.color} stroke={1.9}/>
      </div>
      <span style={{ font: '600 12px Pretendard', color: PH.ink, letterSpacing: '-0.2px' }}>
        {mode === 'school' ? '학교' : '직장'} <b style={{ color: meta.color }}>{meta.name}</b> 기준 통근시간
      </span>
      <Icon name="chev-d" size={13} color={PH.muted}/>
    </div>
  );
}

// 통근 기준지 sheet — opened by tapping the commute chip.
// This is the entry point into 직장·학교 등록 / 관리.
function CommuteSheet({ mode = 'both' }) {
  const row = (icon, kind, name, addr, color, soft, on) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
      borderRadius: 14, background: on ? soft : PH.white,
      border: `1.5px solid ${on ? color : PH.borderSoft}`,
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: on ? PH.white : PH.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={20} color={color} stroke={1.8}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ padding: '1px 6px', borderRadius: 4, background: soft, color, font: '700 10px Pretendard' }}>{kind}</span>
          <span style={{ font: '700 14px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>{name}</span>
        </div>
        <div style={{ font: '500 11px Pretendard', color: PH.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{addr}</div>
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        background: on ? color : 'transparent', border: `1.5px solid ${on ? color : PH.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {on && <Icon name="check" size={13} color="#fff" stroke={2.6}/>}
      </div>
    </div>
  );
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,26,20,0.35)', zIndex: 70 }}/>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 80,
        background: PH.white, borderTopLeftRadius: 22, borderTopRightRadius: 22,
        paddingBottom: 30, boxShadow: '0 -8px 30px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, paddingBottom: 8 }}>
          <div style={{ width: 40, height: 4.5, borderRadius: 3, background: '#D8D5CD' }}/>
        </div>
        <div style={{ padding: '0 18px 6px' }}>
          <div style={{ font: '700 17px Pretendard', color: PH.ink, letterSpacing: '-0.4px' }}>통근 기준지</div>
          <div style={{ font: '500 12px Pretendard', color: PH.muted, marginTop: 3, letterSpacing: '-0.2px' }}>
            카드와 비교 화면에 표시할 통근시간 기준을 골라요
          </div>
        </div>
        <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {row('briefcase', '직장', '강남역 (회사)', '서울 강남구 강남대로 396', PH.primary, PH.primarySoft, mode !== 'school')}
          {row('school', '학교', '한양대학교', '서울 성동구 왕십리로 222', '#7B5FCC', '#EFEAFB', mode !== 'work')}
        </div>
        {/* manage link → registration screen */}
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{
            height: 50, borderRadius: 14, border: `1px solid ${PH.border}`, background: PH.white,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            font: '700 14px Pretendard', color: PH.ink70,
          }}>
            <Icon name="edit" size={16} color={PH.ink70} stroke={1.8}/>
            직장·학교 등록·관리
          </div>
        </div>
      </div>
    </>
  );
}

function HouseCard({ h, active, commuteMode = 'work' }) {
  const price = priceLong(h);
  // Stylized photo placeholder using hue
  const photoBg = `linear-gradient(135deg,
    hsl(${h.photoHue}, 22%, 78%),
    hsl(${(h.photoHue + 30) % 360}, 22%, 60%))`;
  return (
    <div style={{
      scrollSnapAlign: 'center',
      minWidth: 326, width: 326, height: 152,
      background: PH.white, borderRadius: 18,
      border: active ? `1.5px solid ${PH.coral}` : `1px solid ${PH.borderSoft}`,
      boxShadow: '0 6px 20px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06)',
      padding: 12, display: 'flex', gap: 12, position: 'relative',
    }}>
      {/* photo */}
      <div style={{
        width: 110, height: 128, borderRadius: 12, background: photoBg,
        position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        {/* fake interior shapes */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.18) 100%)' }}/>
        <div style={{ position: 'absolute', top: 16, right: 12, width: 36, height: 28, background: 'rgba(255,255,255,0.45)', borderRadius: 2 }}/>
        <div style={{ position: 'absolute', top: 16, right: 54, width: 28, height: 28, background: 'rgba(255,255,255,0.35)', borderRadius: 2 }}/>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, background: 'rgba(255,255,255,0.18)' }}/>
        <div style={{
          position: 'absolute', top: 8, left: 8,
          padding: '3px 7px', borderRadius: 5,
          background: 'rgba(0,0,0,0.55)', color: '#fff',
          font: '600 10px Pretendard', letterSpacing: '-0.2px',
        }}>{h.visited} 방문</div>
      </div>

      {/* info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* type badge + name + bookmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <span style={{
            padding: '1.5px 6px', borderRadius: 4,
            background: h.type === 'jeonse' ? PH.primarySoft : '#FCEFE7',
            color: h.type === 'jeonse' ? PH.primary : PH.coral,
            font: '700 10px Pretendard', letterSpacing: '-0.2px',
          }}>{h.type === 'jeonse' ? '전세' : '월세'}</span>
          <span style={{
            padding: '1.5px 6px', borderRadius: 4, background: PH.surface,
            color: PH.ink70, font: '600 10px Pretendard', letterSpacing: '-0.2px',
          }}>{h.tag}</span>
          <div style={{ marginLeft: 'auto' }}>
            <Icon name="heart" size={16} color={PH.muted} stroke={1.6}/>
          </div>
        </div>

        <div style={{
          font: '700 15.5px Pretendard', color: PH.ink, letterSpacing: '-0.4px',
          marginBottom: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{h.name}</div>
        <div style={{
          font: '500 11px Pretendard', color: PH.muted, marginBottom: 7,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{h.addr} · {h.pyeong}평 · {h.rooms} · {h.floor}</div>

        {/* price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 'auto' }}>
          <span style={{ font: '700 19px Pretendard', color: PH.ink, letterSpacing: '-0.6px' }}>
            {price.value}
          </span>
          {h.type === 'rent' && (
            <span style={{ font: '500 11px Pretendard', color: PH.muted }}>관리비 {h.mgmt}만</span>
          )}
        </div>

        {/* checklist dots + commute */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: `1px solid ${PH.borderSoft}` }}>
          <div style={{ display: 'flex', gap: 7 }}>
            {Object.entries(h.cl).map(([k, v]) => (
              <Icon key={k} name={CL_META[k].icon} size={12} color={clColor(v)} stroke={1.8}/>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {(commuteMode === 'work' || commuteMode === 'both') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: PH.primary }}>
                <Icon name="briefcase" size={11} color={PH.primary} stroke={1.8}/>
                <span style={{ font: '700 11px Pretendard', letterSpacing: '-0.2px' }}>{h.commute}분</span>
              </div>
            )}
            {(commuteMode === 'school' || commuteMode === 'both') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#7B5FCC' }}>
                <Icon name="school" size={11} color="#7B5FCC" stroke={1.8}/>
                <span style={{ font: '700 11px Pretendard', letterSpacing: '-0.2px' }}>{h.commuteSchool}분</span>
              </div>
            )}
          </div>
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
            <HousePin count={c.ids.length} selected={c.ids.includes(selectedId)} size={46}/>
          </PinAt>
        ))}
      </>
    );
  }
  if (zoom === 'close') {
    // Show only a subset (zoomed in), but those visible get detail pins
    const nearbyIds = [1, 3, 5, 6];
    const visible = houses.filter(h => nearbyIds.includes(h.id));
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
            <PinAt key={h.id} x={pos.x} y={pos.y} z={h.id === selectedId ? 9 : 5}>
              {h.id === selectedId ? <HouseCallout house={h}/> : <DetailPin house={h} selected={false}/>}
            </PinAt>
          );
        })}
      </>
    );
  }
  // medium — teardrop house pins; selected one shows a callout
  // cluster a couple to mirror the 야놀자 reference
  const clusterMap = { 1: 2, 2: 2 }; // pin shows count badge
  return (
    <>
      <MyLocation x={200} y={340}/>
      {houses.map(h => (
        <PinAt key={h.id} x={h.x} y={h.y} z={h.id === selectedId ? 9 : 5}>
          {h.id === selectedId
            ? <HouseCallout house={h}/>
            : <HousePin count={clusterMap[h.id] || 1} selected={false}/>}
        </PinAt>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// MainScreen — the screen
// ─────────────────────────────────────────────────────────────
function MainScreen({ initialSelected = 1, filterOpen = false, zoom = 'medium', showZoomBadge = false, commuteMode = 'none' }) {
  const initialIdx = HOUSES.findIndex(h => h.id === initialSelected);
  const [activeIdx, setActiveIdx] = React.useState(initialIdx);
  const selectedId = HOUSES[activeIdx]?.id ?? initialSelected;

  return (
    <Screen>
      {/* Full-bleed map */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 402, height: 874, background: PH.mapBg }}>
        <MapBg w={402} h={600} zoom={zoom}/>
        {/* map continues below the detailed area */}
        <div style={{ position: 'absolute', top: 598, left: 0, right: 0, height: 280, background: PH.mapBg }}>
          <div style={{ position: 'absolute', top: 40, left: -20, right: -20, height: 9, background: PH.road, transform: 'rotate(-2deg)' }}/>
          <div style={{ position: 'absolute', top: 150, left: -20, right: -20, height: 7, background: PH.road, transform: 'rotate(1.5deg)' }}/>
          <div style={{ position: 'absolute', top: 0, left: 120, width: 8, height: 280, background: PH.road }}/>
        </div>
        <MapLayer zoom={zoom} selectedId={selectedId} houses={HOUSES}/>
      </div>

      {/* Top — search + filter only (no map-filtering implication) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
        <TopBar filterCount={filterOpen ? 0 : 2}/>
      </div>

      {/* Map controls — above the floating cards */}
      <MapTools bottom={262}/>
      <ListTogglePill bottom={258}/>
      {showZoomBadge && <ZoomBadge zoom={zoom}/>}

      {/* Floating cards + bottom nav */}
      <FloatingCards houses={HOUSES} activeIdx={activeIdx} onScrollIdx={setActiveIdx} commuteMode={commuteMode}/>
      <BottomNav active={0}/>

      {/* Filter overlay */}
      {filterOpen && <FilterSheet/>}
    </Screen>
  );
}

Object.assign(window, { MainScreen });
