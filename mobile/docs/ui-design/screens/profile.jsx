// Tab 3 — My Houses
// User's lived-in timeline. The houses they've ACTUALLY lived in over time.
// Currently hunting (no entry for "now") — header shows that and links
// back into Records.

function ScreenProfile({ nav }) {
  const total = LIVED_HOMES.reduce((a, h) => a + h.months, 0);

  return (
    <div style={{
      width: '100%', height: '100%', background: T.surface, color: T.ink,
      fontFamily: T.family, display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      <StatusBarSpacer/>

      {/* Header */}
      <div style={{ padding: '8px 20px 14px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 99,
              background: 'linear-gradient(135deg, #C8D8A8, #7A9C5C)',
            }}/>
            <div>
              <div style={{ ...TYPE.headline }}>지호</div>
              <div style={{ ...TYPE.caption, color: T.muted, marginTop: 1 }}>
                @jiho · 서울에서 살고 있어요
              </div>
            </div>
          </div>
          <button style={{
            width: 36, height: 36, borderRadius: 99,
            background: T.wash, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{Icons.more(18, T.body)}</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {/* Summary */}
        <div style={{
          margin: '0 20px 20px',
          padding: '16px',
          background: T.wash, borderRadius: 16,
          display: 'flex', gap: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...TYPE.meta, color: T.muted, fontSize: 10 }}>살아온 집</div>
            <div style={{ ...TYPE.title, ...TYPE.num, marginTop: 4 }}>{LIVED_HOMES.length}</div>
          </div>
          <div style={{ width: 1, background: T.divider }}/>
          <div style={{ flex: 1, paddingLeft: 14 }}>
            <div style={{ ...TYPE.meta, color: T.muted, fontSize: 10 }}>자취 기간</div>
            <div style={{ ...TYPE.title, ...TYPE.num, marginTop: 4 }}>{fmtMonths(total)}</div>
          </div>
          <div style={{ width: 1, background: T.divider }}/>
          <div style={{ flex: 1, paddingLeft: 14 }}>
            <div style={{ ...TYPE.meta, color: T.muted, fontSize: 10 }}>둘러보는 중</div>
            <div style={{
              ...TYPE.title, ...TYPE.num, marginTop: 4,
              display: 'inline-flex', alignItems: 'baseline', gap: 4,
            }}>
              {HOUSES.length}
              <span style={{ ...TYPE.caption, color: T.muted, fontWeight: 500 }}>채</span>
            </div>
          </div>
        </div>

        {/* "Hunting now" callout */}
        <div style={{
          margin: '0 20px 28px',
          padding: '14px 16px',
          border: `1px dashed ${T.hairline}`, borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: T.accentSoft, color: T.accent,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{Icons.search(18, T.accent)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...TYPE.body, fontWeight: 700 }}>지금 다음 집 찾는 중</div>
            <div style={{ ...TYPE.caption, color: T.muted, marginTop: 1 }}>
              마포구에서 {HOUSES.length}채 보는 중 · 2주째
            </div>
          </div>
          <button onClick={() => nav.setTab('records')} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: T.body, padding: 4,
          }}>{Icons.chevR(16, T.body)}</button>
        </div>

        {/* Timeline */}
        <div style={{ padding: '0 20px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginBottom: 16,
          }}>
            <div style={{ ...TYPE.title, fontSize: 20 }}>살아온 집</div>
            <div style={{ ...TYPE.caption, color: T.muted }}>
              2018 — 2026
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            {/* timeline rule */}
            <div style={{
              position: 'absolute', left: 18, top: 8, bottom: 8,
              width: 1, background: T.hairline,
            }}/>
            {[...LIVED_HOMES].reverse().map((h, i, arr) => (
              <TimelineItem key={h.id} h={h} isLast={i === arr.length - 1}/>
            ))}
            {/* Top: still hunting */}
            <div style={{
              position: 'relative', paddingLeft: 50, marginBottom: 16,
            }}>
              <div style={{
                position: 'absolute', left: 11, top: 4,
                width: 16, height: 16, borderRadius: 99,
                border: `2px dashed ${T.faint}`,
                background: T.surface,
              }}/>
              <div style={{ ...TYPE.caption, color: T.muted, fontStyle: 'italic' }}>
                지금 — 다음 집을 찾는 중
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ h, isLast }) {
  return (
    <div style={{
      position: 'relative', paddingLeft: 50, marginBottom: 22,
    }}>
      {/* node */}
      <div style={{
        position: 'absolute', left: 11, top: 4,
        width: 16, height: 16, borderRadius: 99,
        background: T.ink, border: `3px solid ${T.surface}`,
        boxShadow: `0 0 0 1px ${T.hairline}`,
      }}/>
      <div style={{
        ...TYPE.meta, color: T.muted, fontSize: 10, marginBottom: 6,
      }}>
        {fmtYM(h.from)} — {fmtYM(h.to)} · {fmtMonths(h.months)}
      </div>
      <div style={{
        background: T.surface, border: `1px solid ${T.hairline}`,
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex' }}>
          <HousePhoto swatch={h.swatch} swatch2={h.swatch2}
            style={{ width: 90, height: 90, flexShrink: 0 }}/>
          <div style={{ flex: 1, padding: '10px 12px', minWidth: 0 }}>
            <div style={{ ...TYPE.headline }}>{h.nick}</div>
            <div style={{ ...TYPE.caption, color: T.muted, marginTop: 2 }}>
              {h.addr} · {h.area}평
            </div>
            <div style={{
              ...TYPE.caption, ...TYPE.num, color: T.body,
              marginTop: 6, fontWeight: 600,
            }}>
              {fmtMoney(h.deal, h.deposit, h.rent)}
              <span style={{ color: T.muted, fontWeight: 500, marginLeft: 4 }}>{h.deal}</span>
            </div>
          </div>
        </div>
        <div style={{
          padding: '10px 12px', borderTop: `1px solid ${T.divider}`,
          ...TYPE.caption, color: T.body, fontStyle: 'italic',
          lineHeight: 1.5,
        }}>
          "{h.memory}"
        </div>
      </div>
    </div>
  );
}

window.ScreenProfile = ScreenProfile;
