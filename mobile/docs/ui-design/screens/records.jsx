// Tab 1 — Records
// Naver-Maps pattern: map fills the screen; bottom sheet drags between
// 3 snap points (peek / half / full). No toggle — the sheet IS the list.

const SHEET_SNAPS = { peek: 0.22, half: 0.55, full: 0.88 };

function ScreenRecords({ nav }) {
  const [selected, setSelected] = React.useState(null);
  const [snap, setSnap] = React.useState('peek');
  const sheetRef = React.useRef(null);
  const listRef  = React.useRef(null);

  // Sort: selected first; rest by recent visit.
  const ordered = React.useMemo(() => {
    return [...HOUSES].sort((a, b) => {
      if (a.id === selected) return -1;
      if (b.id === selected) return 1;
      return new Date(b.visited) - new Date(a.visited);
    });
  }, [selected]);

  // Scroll the list so the selected row is visible when one is picked from map
  React.useEffect(() => {
    if (!selected || !listRef.current) return;
    listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selected]);

  const onPinSelect = (id) => {
    setSelected(id);
    // If sheet was hidden, bring it to peek so the card is visible
    if (snap === 'hidden') setSnap('peek');
  };

  const onRowSelect = (id) => {
    setSelected(id);
    // Stay on current snap; user is already in the list
  };

  // Drag handlers — pointer events on the handle area
  const dragState = React.useRef(null);
  const onPointerDown = (e) => {
    e.preventDefault();
    dragState.current = {
      startY: e.clientY,
      startHeight: sheetRef.current.getBoundingClientRect().height,
      parentHeight: sheetRef.current.parentElement.getBoundingClientRect().height,
    };
    sheetRef.current.style.transition = 'none';
  };
  const onPointerMove = (e) => {
    if (!dragState.current) return;
    const dy = dragState.current.startY - e.clientY;
    const newH = Math.max(40, dragState.current.startHeight + dy);
    sheetRef.current.style.height = `${newH}px`;
  };
  const onPointerUp = (e) => {
    if (!dragState.current) return;
    const { parentHeight, startHeight, startY } = dragState.current;
    const dy = startY - e.clientY;
    const ratio = (startHeight + dy) / parentHeight;
    // snap to nearest
    let next = 'peek';
    if (ratio < 0.10) next = 'hidden';
    else if (ratio < 0.38) next = 'peek';
    else if (ratio < 0.72) next = 'half';
    else next = 'full';
    sheetRef.current.style.transition = 'height 0.28s cubic-bezier(0.32, 0.72, 0, 1)';
    sheetRef.current.style.height = '';
    setSnap(next);
    dragState.current = null;
  };

  React.useEffect(() => {
    const up = (e) => onPointerUp(e);
    const move = (e) => onPointerMove(e);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  const sheetHeightPct = SHEET_SNAPS[snap] != null ? SHEET_SNAPS[snap] : 0;

  return (
    <div style={{
      width: '100%', height: '100%', background: T.paper, color: T.ink,
      fontFamily: T.family, position: 'relative', overflow: 'hidden',
    }}>
      {/* Map */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <StreetMap
          houses={HOUSES}
          selectedId={selected}
          onSelect={onPinSelect}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <StatusBarSpacer/>

      {/* Floating search bar */}
      <div style={{
        position: 'absolute', top: 62, left: 12, right: 12,
        display: 'flex', alignItems: 'center', gap: 8,
        zIndex: 30, pointerEvents: 'none',
      }}>
        <div style={{
          flex: 1, height: 46, paddingLeft: 14, paddingRight: 6,
          background: T.surface, borderRadius: 23,
          boxShadow: '0 4px 16px rgba(15,14,12,0.10)',
          display: 'flex', alignItems: 'center', gap: 10,
          pointerEvents: 'auto',
        }}>
          {Icons.search(18, T.muted)}
          <input placeholder="주소·이름·메모로 찾기" style={{
            flex: 1, border: 'none', outline: 'none',
            background: 'transparent', color: T.ink,
            fontSize: 15, fontWeight: 500, fontFamily: T.family,
            minWidth: 0,
          }}/>
          <button style={{
            width: 34, height: 34, borderRadius: 99, border: 'none',
            background: 'rgba(15,14,12,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>{Icons.filter(16, T.body)}</button>
        </div>
      </div>

      {/* Map-side action buttons (locate + add) — pinned above the sheet */}
      <div style={{
        position: 'absolute', right: 12,
        bottom: `calc(80px + ${sheetHeightPct * 100}% + 12px)`,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 25, transition: 'bottom 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        <button style={{
          width: 44, height: 44, borderRadius: 12,
          background: T.surface, border: 'none',
          boxShadow: '0 2px 12px rgba(15,14,12,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>{Icons.locate(20, T.body)}</button>
        <button onClick={() => nav.openAdd()} style={{
          width: 52, height: 52, borderRadius: 99,
          background: T.accent, color: T.surface, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 18px rgba(31,77,63,0.42)',
          cursor: 'pointer',
        }}>{Icons.plus(22, T.surface)}</button>
      </div>

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        style={{
          position: 'absolute', bottom: 80, left: 0, right: 0,
          height: `${sheetHeightPct * 100}%`,
          background: T.surface,
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          boxShadow: '0 -6px 32px rgba(15,14,12,0.14)',
          display: 'flex', flexDirection: 'column',
          transition: 'height 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          zIndex: 20,
        }}
      >
        {/* Drag handle area — full width, comfortable hit target */}
        <div
          onPointerDown={onPointerDown}
          style={{
            padding: '8px 0 4px', cursor: 'grab', touchAction: 'none',
            userSelect: 'none', flexShrink: 0,
          }}
        >
          <div style={{
            width: 40, height: 5, borderRadius: 99,
            background: 'rgba(15,14,12,0.18)', margin: '0 auto',
          }}/>
        </div>

        {/* Sheet header */}
        <div
          onPointerDown={onPointerDown}
          style={{
            padding: '6px 20px 12px',
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            cursor: 'grab', touchAction: 'none', userSelect: 'none', flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ ...TYPE.headline, fontSize: 18 }}>본 집</div>
            <div style={{ ...TYPE.body, ...TYPE.num, color: T.muted, fontWeight: 600 }}>
              {HOUSES.length}
            </div>
            <div style={{ ...TYPE.caption, color: T.faint }}>
              · 마포구
            </div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            color: T.body, fontSize: 13, fontWeight: 600, fontFamily: T.family,
          }}>
            {Icons.layers(13, T.body)} 최근순
          </div>
        </div>

        {/* List */}
        <div ref={listRef} style={{
          flex: 1, overflowY: snap === 'peek' ? 'hidden' : 'auto',
          paddingBottom: 24,
        }}>
          {ordered.map(h => (
            <RecordRow
              key={h.id}
              h={h}
              selected={h.id === selected}
              onSelect={() => onRowSelect(h.id)}
              onOpen={() => nav.openDetail(h.id)}
              onCompare={() => nav.openCompare(h.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact row — taps to focus on map, chevron to open detail
function RecordRow({ h, selected, onSelect, onOpen, onCompare }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: selected ? T.wash : 'transparent',
      cursor: 'pointer',
      borderLeft: selected ? `3px solid ${T.ink}` : '3px solid transparent',
      paddingLeft: selected ? 13 : 16,
    }} onClick={onSelect}>
      <HousePhoto swatch={h.swatch} swatch2={h.swatch2}
        style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0 }}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...TYPE.body, fontWeight: 600 }}>{h.nick}</div>
        <div style={{ ...TYPE.caption, color: T.muted, marginTop: 1 }}>
          {h.type} · {h.area}평 · {h.facing} · {typeof h.floor === 'number' ? `${h.floor}/${h.totalFloor}F` : h.floor}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <div style={{ ...TYPE.caption, ...TYPE.num, fontWeight: 700, color: T.ink }}>
            {fmtMoney(h.deal, h.deposit, h.rent)}
          </div>
          <div style={{ ...TYPE.meta, color: T.muted, fontSize: 10 }}>{h.deal}</div>
          <div style={{ flex: 1 }}/>
          <div style={{
            ...TYPE.meta, color: T.faint, fontSize: 10,
            display: 'inline-flex', alignItems: 'center', gap: 3,
          }}>
            {h.visitedShort}
          </div>
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onOpen(); }} style={{
        background: 'transparent', border: 'none', padding: 6,
        cursor: 'pointer', color: T.muted, flexShrink: 0,
      }}>{Icons.chevR(16, T.muted)}</button>
    </div>
  );
}

window.ScreenRecords = ScreenRecords;
