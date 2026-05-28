// Tab 2 / Modal — Compare
// Two-step flow: pick A & B → result view (stat-by-stat).
// Entered from tab bar (empty pickers), from detail (one pre-filled),
// or from records bottom sheet (one pre-filled).

function ScreenCompare({ nav, preselect = {} }) {
  const [a, setA] = React.useState(preselect.a || 'h04');
  const [b, setB] = React.useState(preselect.b || 'h09');
  const [picking, setPicking] = React.useState(null); // 'a' | 'b' | null

  if (picking) {
    return <PickHouseScreen
      title={picking === 'a' ? '비교 1번 선택' : '비교 2번 선택'}
      currentA={a} currentB={b} side={picking}
      onPick={(id) => {
        if (picking === 'a') setA(id); else setB(id);
        setPicking(null);
      }}
      onCancel={() => setPicking(null)}
    />;
  }

  const A = HOUSES.find(h => h.id === a);
  const B = HOUSES.find(h => h.id === b);

  return (
    <div style={{
      width: '100%', height: '100%', background: T.surface, color: T.ink,
      fontFamily: T.family, display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <StatusBarSpacer/>
      <div style={{
        padding: '4px 16px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {nav.tab === 'compare' ? (
          <div style={{ ...TYPE.display, fontSize: 24 }}>비교</div>
        ) : (
          <>
            <button onClick={() => nav.close()} style={{
              background: 'transparent', border: 'none', padding: 8, cursor: 'pointer',
              color: T.body,
            }}>{Icons.arrowL(18, T.body)}</button>
            <div style={{ ...TYPE.headline }}>비교</div>
            <button style={{
              background: 'transparent', border: 'none', padding: 8, cursor: 'pointer',
              color: T.body,
            }}>{Icons.share(18, T.body)}</button>
          </>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 110 }}>
        {/* Hero pair */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 24px 1fr', gap: 0,
          padding: '0 16px',
        }}>
          <CompareHero side="A" h={A} onChange={() => setPicking('a')}/>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            ...TYPE.meta, color: T.faint,
          }}>VS</div>
          <CompareHero side="B" h={B} onChange={() => setPicking('b')}/>
        </div>

        {/* Key facts comparison */}
        <CompareSection title="기본">
          <FactRow label="시세" a={fmtMoney(A.deal, A.deposit, A.rent)} b={fmtMoney(B.deal, B.deposit, B.rent)}
            aSub={A.deal} bSub={B.deal}/>
          <FactRow label="평수" a={`${A.area}평`} b={`${B.area}평`}
            aSub={`${A.areaM}㎡`} bSub={`${B.areaM}㎡`}
            winner={A.area > B.area ? 'a' : A.area < B.area ? 'b' : null}/>
          <FactRow label="층" a={typeof A.floor === 'number' ? `${A.floor}/${A.totalFloor}` : A.floor}
            b={typeof B.floor === 'number' ? `${B.floor}/${B.totalFloor}` : B.floor}/>
          <FactRow label="향" a={A.facing} b={B.facing}/>
          <FactRow label="유형" a={A.type} b={B.type}/>
          <FactRow label="준공" a={`${A.yearBuilt}년`} b={`${B.yearBuilt}년`}
            winner={A.yearBuilt > B.yearBuilt ? 'a' : A.yearBuilt < B.yearBuilt ? 'b' : null}/>
        </CompareSection>

        {/* Stat bars — facing each other */}
        <CompareSection title="스탯">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.keys(A.stats).map(k => {
              const av = A.stats[k], bv = B.stats[k];
              const winner = av > bv ? 'a' : av < bv ? 'b' : null;
              return (
                <div key={k}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center', gap: 8, marginBottom: 6,
                  }}>
                    <div style={{
                      ...TYPE.caption, color: winner === 'a' ? T.ink : T.muted,
                      fontWeight: winner === 'a' ? 700 : 500, textAlign: 'right',
                      ...TYPE.num,
                    }}>{av}</div>
                    <div style={{
                      ...TYPE.caption, color: T.body, fontWeight: 600, textAlign: 'center',
                    }}>{STAT_LABELS[k]}</div>
                    <div style={{
                      ...TYPE.caption, color: winner === 'b' ? T.ink : T.muted,
                      fontWeight: winner === 'b' ? 700 : 500, textAlign: 'left',
                      ...TYPE.num,
                    }}>{bv}</div>
                  </div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
                    alignItems: 'center',
                  }}>
                    <div style={{ transform: 'scaleX(-1)' }}>
                      <StatBar value={av} color={winner === 'a' ? T.ink : T.faint}/>
                    </div>
                    <StatBar value={bv} color={winner === 'b' ? T.ink : T.faint}/>
                  </div>
                </div>
              );
            })}
          </div>
        </CompareSection>

        {/* Options diff */}
        <CompareSection title="옵션 차이">
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            <OptionsCol h={A} other={B}/>
            <OptionsCol h={B} other={A}/>
          </div>
        </CompareSection>

        {/* Memos */}
        <CompareSection title="메모">
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            <MemoCard h={A}/>
            <MemoCard h={B}/>
          </div>
        </CompareSection>
      </div>

      {/* Verdict / share bar */}
      <div style={{
        position: 'absolute', bottom: nav.tab === 'compare' ? 80 : 0,
        left: 0, right: 0, padding: '12px 16px 28px',
        background: T.surface, borderTop: `1px solid ${T.hairline}`,
        display: 'flex', gap: 8,
      }}>
        <button style={{
          flex: 1, height: 46, borderRadius: 12,
          background: T.wash, border: 'none', color: T.body,
          fontSize: 14, fontWeight: 600, fontFamily: T.family, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {Icons.share(15, T.body)} 공유
        </button>
        <button style={{
          flex: 2, height: 46, borderRadius: 12,
          background: T.ink, color: T.surface, border: 'none',
          fontSize: 14, fontWeight: 700, fontFamily: T.family, cursor: 'pointer',
        }}>
          A로 결정하기
        </button>
      </div>
    </div>
  );
}

// ── Pieces ─────────────────────────────────────────────────────────────

function CompareHero({ side, h, onChange }) {
  return (
    <button onClick={onChange} style={{
      background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
      textAlign: 'left',
    }}>
      <div style={{ position: 'relative' }}>
        <HousePhoto swatch={h.swatch} swatch2={h.swatch2}
          style={{ width: '100%', aspectRatio: '1', borderRadius: 14 }}/>
        <div style={{
          position: 'absolute', top: 8, left: 8,
          width: 24, height: 24, borderRadius: 99,
          background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, fontFamily: T.family, color: T.ink,
        }}>{side}</div>
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ ...TYPE.body, fontWeight: 700 }}>{h.nick}</div>
        <div style={{ ...TYPE.caption, color: T.muted, marginTop: 1 }}>
          {h.area}평 · {h.facing}
        </div>
      </div>
    </button>
  );
}

function CompareSection({ title, children }) {
  return (
    <div style={{
      padding: '20px 16px 12px',
    }}>
      <div style={{ ...TYPE.meta, color: T.muted, marginBottom: 12, padding: '0 4px' }}>{title}</div>
      {children}
    </div>
  );
}

function FactRow({ label, a, b, aSub, bSub, winner }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 60px 1fr',
      alignItems: 'baseline', padding: '10px 0',
      borderBottom: `1px solid ${T.divider}`,
    }}>
      <div style={{ textAlign: 'right', paddingRight: 8 }}>
        <div style={{
          ...TYPE.body, ...TYPE.num,
          fontWeight: winner === 'a' ? 700 : 500,
          color: winner === 'a' ? T.ink : T.body,
        }}>{a}</div>
        {aSub && <div style={{ ...TYPE.caption, color: T.muted, fontSize: 11 }}>{aSub}</div>}
      </div>
      <div style={{ ...TYPE.meta, color: T.faint, textAlign: 'center' }}>{label}</div>
      <div style={{ textAlign: 'left', paddingLeft: 8 }}>
        <div style={{
          ...TYPE.body, ...TYPE.num,
          fontWeight: winner === 'b' ? 700 : 500,
          color: winner === 'b' ? T.ink : T.body,
        }}>{b}</div>
        {bSub && <div style={{ ...TYPE.caption, color: T.muted, fontSize: 11 }}>{bSub}</div>}
      </div>
    </div>
  );
}

function OptionsCol({ h, other }) {
  const unique = Object.keys(h.has).filter(k => h.has[k] && !other.has[k]);
  const shared = Object.keys(h.has).filter(k => h.has[k] && other.has[k]);
  return (
    <div style={{
      background: T.wash, borderRadius: 12, padding: 12,
    }}>
      {unique.length > 0 && (
        <>
          <div style={{ ...TYPE.meta, color: T.ink, marginBottom: 6, fontSize: 10 }}>
            여기만 있음
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {unique.map(k => (
              <div key={k} style={{
                padding: '4px 8px', borderRadius: 6, background: T.surface,
                fontSize: 11, fontWeight: 600, fontFamily: T.family, color: T.ink,
              }}>{HAS_LABELS[k]}</div>
            ))}
          </div>
        </>
      )}
      <div style={{ ...TYPE.meta, color: T.muted, marginBottom: 6, fontSize: 10 }}>
        공통 ({shared.length})
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {shared.map(k => (
          <div key={k} style={{
            padding: '4px 8px', borderRadius: 6, background: 'transparent',
            border: `1px solid ${T.hairline}`,
            fontSize: 11, fontWeight: 500, fontFamily: T.family, color: T.muted,
          }}>{HAS_LABELS[k]}</div>
        ))}
      </div>
    </div>
  );
}

function MemoCard({ h }) {
  return (
    <div style={{
      background: T.wash, borderRadius: 12, padding: 12,
      ...TYPE.caption, color: T.body, lineHeight: 1.5,
    }}>
      "{h.note}"
    </div>
  );
}

// ── Pick screen — for selecting a side of the compare ────────────────
function PickHouseScreen({ title, currentA, currentB, side, onPick, onCancel }) {
  const taken = side === 'a' ? currentB : currentA;
  return (
    <div style={{
      width: '100%', height: '100%', background: T.surface, color: T.ink,
      fontFamily: T.family, display: 'flex', flexDirection: 'column',
    }}>
      <StatusBarSpacer/>
      <div style={{
        padding: '4px 16px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${T.hairline}`,
      }}>
        <button onClick={onCancel} style={{
          background: 'transparent', border: 'none', padding: 8, cursor: 'pointer',
          fontSize: 15, color: T.body, fontFamily: T.family, fontWeight: 500,
        }}>취소</button>
        <div style={{ ...TYPE.headline }}>{title}</div>
        <div style={{ width: 48 }}/>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 80px' }}>
        {HOUSES.map(h => {
          const isTaken = h.id === taken;
          return (
            <button key={h.id} onClick={() => !isTaken && onPick(h.id)} style={{
              width: '100%', textAlign: 'left', background: 'transparent',
              border: 'none', padding: '12px 4px',
              borderBottom: `1px solid ${T.divider}`,
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: isTaken ? 'not-allowed' : 'pointer',
              opacity: isTaken ? 0.35 : 1,
            }}>
              <HousePhoto swatch={h.swatch} swatch2={h.swatch2}
                style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...TYPE.body, fontWeight: 600 }}>{h.nick}</div>
                <div style={{ ...TYPE.caption, color: T.muted, marginTop: 1 }}>
                  {h.area}평 · {h.facing} · {h.type}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ ...TYPE.caption, ...TYPE.num, fontWeight: 700 }}>
                  {fmtMoney(h.deal, h.deposit, h.rent)}
                </div>
                {isTaken && (
                  <div style={{ ...TYPE.meta, color: T.faint, fontSize: 9, marginTop: 2 }}>
                    이미 선택됨
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

window.ScreenCompare = ScreenCompare;
