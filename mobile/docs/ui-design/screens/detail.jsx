// Modal — House Detail
// Full stat sheet, photos, notes. Slides up from bottom over the map.

function ScreenDetail({ id, nav }) {
  const h = HOUSES.find(x => x.id === id);
  if (!h) return null;

  return (
    <div style={{
      width: '100%', height: '100%', background: T.surface, color: T.ink,
      fontFamily: T.family, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {/* Hero photo */}
        <div style={{ position: 'relative' }}>
          <HousePhoto swatch={h.swatch} swatch2={h.swatch2}
            style={{ width: '100%', height: 280 }}/>
          {/* status bar gradient overlay */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 100,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}/>
          {/* top controls */}
          <div style={{
            position: 'absolute', top: 56, left: 16, right: 16,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <button onClick={() => nav.close()} style={{
              width: 36, height: 36, borderRadius: 99,
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(8px)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}>{Icons.arrowL(16, T.ink)}</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                width: 36, height: 36, borderRadius: 99,
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{Icons.share(16, T.ink)}</button>
              <button style={{
                width: 36, height: 36, borderRadius: 99,
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{Icons.more(18, T.ink)}</button>
            </div>
          </div>
          {/* photo count */}
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            padding: '5px 10px', borderRadius: 99,
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 600, fontFamily: T.family,
          }}>
            {Icons.camera(12, '#fff')} {h.photos}
          </div>
          {/* photo dots indicator */}
          <div style={{
            position: 'absolute', bottom: 16, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 4,
          }}>
            {[0,1,2,3,4].map(i => (
              <div key={i} style={{
                width: i === 0 ? 16 : 5, height: 5, borderRadius: 99,
                background: i === 0 ? '#fff' : 'rgba(255,255,255,0.5)',
              }}/>
            ))}
          </div>
        </div>

        {/* Title block */}
        <div style={{ padding: '20px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ ...TYPE.display, fontSize: 26 }}>{h.nick}</div>
              <div style={{ ...TYPE.caption, color: T.muted, marginTop: 4 }}>
                {h.addr}
              </div>
              <div style={{ ...TYPE.caption, color: T.muted, marginTop: 2 }}>
                {h.line}
              </div>
            </div>
          </div>
        </div>

        {/* Quick fact grid */}
        <div style={{
          margin: '0 20px', padding: '14px 0',
          borderTop: `1px solid ${T.hairline}`,
          borderBottom: `1px solid ${T.hairline}`,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
        }}>
          {[
            { l: '시세', v: fmtMoney(h.deal, h.deposit, h.rent), sub: h.deal },
            { l: '평수', v: h.area + '평', sub: h.areaM + '㎡' },
            { l: '층', v: typeof h.floor === 'number' ? `${h.floor}/${h.totalFloor}` : h.floor, sub: typeof h.floor === 'number' ? '층' : `${h.totalFloor}층 건물` },
            { l: '향', v: h.facing, sub: h.type },
          ].map((f, i, a) => (
            <div key={i} style={{
              textAlign: i === 0 ? 'left' : 'center',
              paddingRight: i === a.length-1 ? 0 : 4,
              borderLeft: i ? `1px solid ${T.divider}` : 'none',
              paddingLeft: i ? 8 : 0,
            }}>
              <div style={{ ...TYPE.meta, color: T.muted, fontSize: 10 }}>{f.l}</div>
              <div style={{ ...TYPE.body, fontWeight: 700, ...TYPE.num, marginTop: 4 }}>{f.v}</div>
              <div style={{ ...TYPE.caption, color: T.muted, fontSize: 11, marginTop: 1 }}>{f.sub}</div>
            </div>
          ))}
        </div>

        {/* Stats — radar/bar */}
        <Section title="스탯">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, rowGap: 14 }}>
            {Object.entries(h.stats).map(([k, v]) => (
              <div key={k}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', marginBottom: 6,
                }}>
                  <div style={{ ...TYPE.caption, color: T.body, fontWeight: 600 }}>
                    {STAT_LABELS[k]}
                  </div>
                  <div style={{ ...TYPE.caption, color: T.muted, ...TYPE.num }}>{v}/5</div>
                </div>
                <StatBar value={v} color={T.ink}/>
              </div>
            ))}
          </div>
        </Section>

        {/* Has options */}
        <Section title="옵션">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(h.has).map(([k, v]) => (
              <div key={k} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 99,
                background: v ? T.wash : 'transparent',
                border: v ? 'none' : `1px dashed ${T.hairline}`,
                color: v ? T.ink : T.faint,
                fontSize: 12, fontWeight: 500, fontFamily: T.family,
                textDecoration: v ? 'none' : 'line-through',
              }}>
                {v && Icons.check(10, T.ink)}
                {HAS_LABELS[k]}
              </div>
            ))}
          </div>
        </Section>

        {/* Note */}
        <Section title="메모">
          <div style={{
            background: T.wash, borderRadius: 12, padding: '12px 14px',
            ...TYPE.body, color: T.body, lineHeight: 1.5,
          }}>
            {h.note}
          </div>
        </Section>

        {/* Visit meta */}
        <Section title="방문">
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0', borderBottom: `1px solid ${T.divider}`,
            fontSize: 13, fontFamily: T.family,
          }}>
            <span style={{ color: T.muted, fontWeight: 500 }}>방문일</span>
            <span style={{ color: T.body, fontWeight: 600, ...TYPE.num }}>{h.visited}</span>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 0',
            fontSize: 13, fontFamily: T.family,
          }}>
            <span style={{ color: T.muted, fontWeight: 500 }}>준공</span>
            <span style={{ color: T.body, fontWeight: 600, ...TYPE.num }}>{h.yearBuilt}년</span>
          </div>
        </Section>
      </div>

      {/* Bottom action bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '12px 16px 28px',
        background: T.surface, borderTop: `1px solid ${T.hairline}`,
        display: 'flex', gap: 8,
      }}>
        <button style={{
          width: 48, height: 48, borderRadius: 12,
          background: T.wash, border: 'none', color: T.body,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>{Icons.edit(18, T.body)}</button>
        <button onClick={() => nav.openCompare(h.id)} style={{
          flex: 1, height: 48, borderRadius: 12,
          background: T.ink, color: T.surface, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontSize: 15, fontWeight: 700, fontFamily: T.family, cursor: 'pointer',
        }}>
          {Icons.compare(16, T.surface)} 다른 집과 비교
        </button>
        <button style={{
          width: 48, height: 48, borderRadius: 12,
          background: T.accent, color: T.surface, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}>{Icons.home(18, T.surface)}</button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ padding: '20px 20px 8px' }}>
      <div style={{ ...TYPE.meta, color: T.muted, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

window.ScreenDetail = ScreenDetail;
