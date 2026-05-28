// Modal — Add Visit
// One scrollable form. Sections: photos, basics, contract, structure,
// options (chip toggles), per-stat rating (pip selectors), note.

function ScreenAdd({ nav }) {
  const [photos, setPhotos] = React.useState(['#E8B86C', '#C97E3D', '#A88E5C']);
  const [deal, setDeal] = React.useState('월세');
  const [has, setHas] = React.useState({
    elev: true, fridge: true, ac: true, washer: true,
    gas: false, parking: false, pet: false, builtinCloset: true,
  });
  const [stats, setStats] = React.useState({
    sun: 4, water: 4, noise: 3, view: 3, kitchen: 4, bath: 4, vent: 3, insul: 3,
  });

  return (
    <div style={{
      width: '100%', height: '100%', background: T.surface, color: T.ink,
      fontFamily: T.family, display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Header */}
      <StatusBarSpacer/>
      <div style={{
        padding: '4px 16px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${T.hairline}`,
      }}>
        <button onClick={() => nav.close()} style={{
          background: 'transparent', border: 'none', padding: 8, cursor: 'pointer',
          fontSize: 15, color: T.body, fontFamily: T.family, fontWeight: 500,
        }}>취소</button>
        <div style={{ ...TYPE.headline }}>집 추가</div>
        <button style={{
          background: T.accent, border: 'none', borderRadius: 99,
          padding: '7px 16px', cursor: 'pointer',
          fontSize: 14, color: T.surface, fontFamily: T.family, fontWeight: 700,
        }}>저장</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Photos */}
        <FormSection title="사진" hint={`${photos.length}장`}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            <button style={{
              flex: '0 0 80px', height: 80, borderRadius: 12,
              background: T.wash, border: `1px dashed ${T.hairline}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 4,
              color: T.muted, cursor: 'pointer',
            }}>
              {Icons.camera(20, T.muted)}
              <span style={{ fontSize: 10, fontWeight: 600, fontFamily: T.family }}>촬영</span>
            </button>
            {photos.map((c, i) => (
              <HousePhoto key={i} swatch={c} swatch2={shade(c, -30)}
                style={{ flex: '0 0 80px', height: 80, borderRadius: 12 }}/>
            ))}
          </div>
        </FormSection>

        {/* Basics */}
        <FormSection title="기본 정보">
          <Field label="별명" value="망원 신축 오피" placeholder="이름 붙이기"/>
          <Field label="주소" value="서울 마포구 망원동 200-15" placeholder="동·번지"/>
          <Field label="방문 일시" value="2026-05-16  14:00"/>
        </FormSection>

        {/* Contract */}
        <FormSection title="계약">
          <SubLabel>계약 형태</SubLabel>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {['전세', '반전세', '월세'].map(d => {
              const on = deal === d;
              return (
                <button key={d} onClick={() => setDeal(d)} style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  background: on ? T.ink : T.wash,
                  color: on ? T.surface : T.body,
                  border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, fontFamily: T.family,
                }}>{d}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Field label="보증금" value="8,000" suffix="만원" inline/>
            <Field label={deal === '전세' ? '─' : '월세'} value={deal === '전세' ? '' : '40'}
              suffix={deal === '전세' ? '' : '만원'} inline disabled={deal === '전세'}/>
          </div>
        </FormSection>

        {/* Structure */}
        <FormSection title="집 구조">
          <div style={{ display: 'flex', gap: 8 }}>
            <Field label="평수" value="16" suffix="평" inline/>
            <Field label="층" value="6/7" inline/>
            <Field label="향" value="남향" inline/>
          </div>
          <SubLabel>유형</SubLabel>
          <div style={{ display: 'flex', gap: 6 }}>
            {['아파트', '오피스텔', '빌라', '단독'].map(t => {
              const on = t === '오피스텔';
              return (
                <button key={t} style={{
                  flex: 1, padding: '8px 0', borderRadius: 10,
                  background: on ? T.ink : T.wash,
                  color: on ? T.surface : T.body,
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: T.family,
                }}>{t}</button>
              );
            })}
          </div>
        </FormSection>

        {/* Options */}
        <FormSection title="옵션 / 시설">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(has).map(([k, v]) => (
              <button key={k} onClick={() => setHas({ ...has, [k]: !v })} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 99,
                background: v ? T.ink : T.surface,
                color: v ? T.surface : T.body,
                border: v ? 'none' : `1px solid ${T.hairline}`,
                fontSize: 13, fontWeight: 600, fontFamily: T.family,
                cursor: 'pointer',
              }}>
                {v && Icons.check(11, T.surface)}
                {HAS_LABELS[k]}
              </button>
            ))}
          </div>
        </FormSection>

        {/* Stats */}
        <FormSection title="스탯 평가" hint="1~5점">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 56, ...TYPE.body, fontWeight: 600, color: T.body,
                }}>{STAT_LABELS[k]}</div>
                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                  {[1,2,3,4,5].map(i => {
                    const on = i <= v;
                    return (
                      <button key={i} onClick={() => setStats({ ...stats, [k]: i })} style={{
                        flex: 1, height: 32, borderRadius: 8, border: 'none',
                        background: on ? T.ink : T.wash, cursor: 'pointer',
                      }}/>
                    );
                  })}
                </div>
                <div style={{
                  width: 24, textAlign: 'right',
                  ...TYPE.body, ...TYPE.num, fontWeight: 700,
                }}>{v}</div>
              </div>
            ))}
          </div>
        </FormSection>

        {/* Note */}
        <FormSection title="메모">
          <textarea defaultValue="비싸지만 진짜 좋다. 상수랑 고민" style={{
            width: '100%', minHeight: 90, padding: '12px 14px',
            background: T.wash, border: 'none', borderRadius: 12,
            outline: 'none', resize: 'none',
            fontSize: 15, color: T.body, fontFamily: T.family, fontWeight: 500,
            lineHeight: 1.5,
          }}/>
        </FormSection>

        <div style={{ height: 60 }}/>
      </div>
    </div>
  );
}

// ── Pieces ─────────────────────────────────────────────────────────────

function FormSection({ title, hint, children }) {
  return (
    <div style={{ padding: '20px 20px 4px', borderBottom: `1px solid ${T.divider}` }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 12,
      }}>
        <div style={{ ...TYPE.meta, color: T.muted }}>{title}</div>
        {hint && <div style={{ ...TYPE.caption, color: T.faint }}>{hint}</div>}
      </div>
      <div style={{ paddingBottom: 16 }}>{children}</div>
    </div>
  );
}

function SubLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: T.muted,
      fontFamily: T.family, letterSpacing: -0.1,
      margin: '4px 0 8px',
    }}>{children}</div>
  );
}

function Field({ label, value, placeholder, suffix, inline, disabled }) {
  return (
    <div style={{
      flex: inline ? 1 : 'unset',
      marginBottom: inline ? 0 : 10,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: T.muted,
        fontFamily: T.family, letterSpacing: -0.1, marginBottom: 4,
      }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: T.wash, borderRadius: 10,
        padding: '10px 12px',
        opacity: disabled ? 0.4 : 1,
      }}>
        <input defaultValue={value} placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 14, color: T.ink, fontFamily: T.family, fontWeight: 600,
            ...TYPE.num, minWidth: 0,
          }}/>
        {suffix && (
          <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{suffix}</div>
        )}
      </div>
    </div>
  );
}

// quick color shading helper for placeholder photos
function shade(hex, amt) {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  let n = parseInt(m[1], 16);
  let r = Math.max(0, Math.min(255, (n >> 16) + amt));
  let g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  let b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

window.ScreenAdd = ScreenAdd;
