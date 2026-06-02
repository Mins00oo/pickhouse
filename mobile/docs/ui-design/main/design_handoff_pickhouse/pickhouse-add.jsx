// Pickhouse — 집 추가 (비선형 인터랙티브 위저드)
// 탭을 눌러 원하는 항목부터 입력 가능. 조건부 필드 동작.
// Reuses PH, Icon, Screen from shared.

const { PH, Icon, Screen, clColor } = window;

// ─────────────────────────────────────────────────────────────
// Small atoms
// ─────────────────────────────────────────────────────────────
function BackChevron({ color = PH.ink70 }) {
  return (
    <svg viewBox="0 0 20 20" style={{ width: 18, height: 18 }}>
      <path d="M12 5l-5 5 5 5" fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function FieldLabel({ children, required, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 9 }}>
      <span style={{ font: '700 14px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>{children}</span>
      {required && <span style={{ color: PH.coral, font: '700 13px Pretendard' }}>*</span>}
      {hint && <span style={{ font: '500 11.5px Pretendard', color: PH.muted, marginLeft: 'auto' }}>{hint}</span>}
    </div>
  );
}

function Field({ children, style }) {
  return <div style={{ marginBottom: 22, ...style }}>{children}</div>;
}

function Segmented({ options, active, onChange, accent = PH.primary }) {
  return (
    <div style={{ display: 'flex', gap: 0, background: PH.surface, padding: 3, borderRadius: 12 }}>
      {options.map((o, i) => (
        <div key={o} onClick={() => onChange && onChange(i)} style={{
          flex: 1, height: 44, borderRadius: 9, cursor: 'pointer',
          background: i === active ? PH.white : 'transparent',
          color: i === active ? PH.ink : PH.muted,
          boxShadow: i === active ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          font: `${i === active ? 700 : 600} 14px Pretendard`, letterSpacing: '-0.3px',
          border: i === active ? `1px solid ${accent}` : '1px solid transparent',
          transition: 'all 0.15s',
        }}>
          {i === active && <span style={{ width: 7, height: 7, borderRadius: 4, background: accent }}/>}
          {o}
        </div>
      ))}
    </div>
  );
}

function TextInput({ value, placeholder, icon, suffix }) {
  return (
    <div style={{
      height: 52, background: PH.white, borderRadius: 13,
      border: `1px solid ${value ? PH.border : PH.borderSoft}`,
      display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10,
    }}>
      {icon && <Icon name={icon} size={17} color={PH.muted}/>}
      <span style={{ flex: 1, font: '600 15px Pretendard', letterSpacing: '-0.3px', color: value ? PH.ink : PH.muted }}>
        {value || placeholder}
      </span>
      {suffix && <span style={{ font: '600 13px Pretendard', color: PH.muted }}>{suffix}</span>}
    </div>
  );
}

// 주소 필드: 검색 버튼 → 선택된 기본주소(잠금) + 상세주소 입력
function AddressField({ baseAddr, detail, onSearch }) {
  if (!baseAddr) {
    return (
      <div onClick={onSearch} style={{
        height: 52, background: PH.white, borderRadius: 13, cursor: 'pointer',
        border: `1px solid ${PH.borderSoft}`,
        display: 'flex', alignItems: 'center', padding: '0 6px 0 14px', gap: 10,
      }}>
        <Icon name="search" size={17} color={PH.muted}/>
        <span style={{ flex: 1, font: '600 15px Pretendard', letterSpacing: '-0.3px', color: PH.muted }}>
          도로명, 지번, 건물명으로 검색
        </span>
        <div style={{ height: 38, padding: '0 14px', borderRadius: 10, background: PH.ink, color: '#fff', display: 'flex', alignItems: 'center', font: '700 13px Pretendard' }}>
          주소 검색
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* selected base address (locked) */}
      <div style={{
        background: PH.white, borderRadius: 13, border: `1px solid ${PH.border}`,
        padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: PH.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
          <Icon name="navigate" size={15} color={PH.primary}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '700 14px Pretendard', color: PH.ink, letterSpacing: '-0.3px', lineHeight: 1.4 }}>
            {baseAddr.road}
          </div>
          <div style={{ font: '500 11.5px Pretendard', color: PH.muted, marginTop: 2 }}>
            지번 {baseAddr.jibun}
          </div>
        </div>
        <div onClick={onSearch} style={{ font: '600 12.5px Pretendard', color: PH.primary, cursor: 'pointer', flexShrink: 0 }}>변경</div>
      </div>
      {/* detail address input */}
      <div style={{
        height: 52, background: PH.white, borderRadius: 13,
        border: `1.5px solid ${detail ? PH.border : PH.primary}`,
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8,
      }}>
        <span style={{ flex: 1, font: '600 15px Pretendard', letterSpacing: '-0.3px', color: detail ? PH.ink : '#C7C3B8' }}>
          {detail || '상세 주소 (동/호수 등)'}
        </span>
        {!detail && <div style={{ width: 2, height: 22, background: PH.primary }}/>}
      </div>
    </div>
  );
}

// 주소 검색 오버레이 (juso/kakao API 결과 흉내)
function AddressSearchOverlay({ onClose, onPick }) {
  const results = [
    { road: '서울 용산구 청파로47길 22', jibun: '청파동1가 56-3', zip: '04303', bld: '청파빌라' },
    { road: '서울 용산구 청파로47길 22-1', jibun: '청파동1가 56-4', zip: '04303', bld: '' },
    { road: '서울 용산구 청파로 211', jibun: '청파동2가 1-12', zip: '04310', bld: '드림타워' },
    { road: '서울 용산구 청파로47가길 8', jibun: '청파동1가 47-9', zip: '04304', bld: '한성빌딩' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: PH.surface, borderRadius: 48, overflow: 'hidden' }}>
      {/* header */}
      <div style={{ background: PH.white, padding: '52px 16px 14px', borderBottom: `1px solid ${PH.borderSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44 }}>
          <div onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <BackChevron/>
          </div>
          <div style={{ font: '700 16px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>주소 검색</div>
        </div>
        <div style={{
          height: 48, background: PH.surface, borderRadius: 13, marginTop: 6,
          display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10,
          border: `1.5px solid ${PH.primary}`,
        }}>
          <Icon name="search" size={18} color={PH.primary} stroke={2}/>
          <span style={{ flex: 1, font: '600 15px Pretendard', color: PH.ink }}>청파로47길</span>
          <div style={{ width: 2, height: 22, background: PH.primary }}/>
        </div>
      </div>
      {/* results */}
      <div style={{ padding: '6px 0', overflowY: 'auto', position: 'absolute', top: 168, bottom: 0, left: 0, right: 0 }}>
        <div style={{ padding: '8px 18px', font: '600 12px Pretendard', color: PH.muted }}>
          검색결과 <span style={{ color: PH.primary }}>{results.length}</span>건
        </div>
        {results.map((r, i) => (
          <div key={i} onClick={() => onPick(r)} style={{
            padding: '13px 18px', cursor: 'pointer',
            borderTop: `1px solid ${PH.borderSoft}`,
            display: 'flex', alignItems: 'flex-start', gap: 11,
          }}>
            <span style={{
              flexShrink: 0, marginTop: 1, padding: '2px 7px', borderRadius: 5,
              background: PH.primarySoft, color: PH.primary, font: '700 10px Pretendard',
            }}>{r.zip}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ padding: '1px 5px', borderRadius: 4, background: PH.ink, color: '#fff', font: '700 9px Pretendard' }}>도로명</span>
                <span style={{ font: '700 14px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>{r.road}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ padding: '1px 5px', borderRadius: 4, background: PH.borderSoft, color: PH.muted, font: '700 9px Pretendard' }}>지번</span>
                <span style={{ font: '500 12px Pretendard', color: PH.ink70 }}>{r.jibun}{r.bld && ` · ${r.bld}`}</span>
              </div>
            </div>
            <Icon name="chev-r" size={16} color={PH.muted}/>
          </div>
        ))}
      </div>
    </div>
  );
}

function AmountInput({ value, placeholder = '0', label, focused }) {
  return (
    <div style={{
      height: 56, background: PH.white, borderRadius: 13,
      border: `1.5px solid ${focused ? PH.primary : value ? PH.border : PH.borderSoft}`,
      display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, position: 'relative',
    }}>
      {label && <span style={{ font: '600 13px Pretendard', color: PH.muted, minWidth: 42 }}>{label}</span>}
      <span style={{ flex: 1, textAlign: 'right', font: '700 20px Pretendard', letterSpacing: '-0.5px', color: value ? PH.ink : '#C7C3B8' }}>
        {value || placeholder}
      </span>
      <span style={{ font: '600 14px Pretendard', color: PH.ink70 }}>만원</span>
      {focused && <div style={{ position: 'absolute', right: 64, top: '50%', width: 2, height: 24, transform: 'translateY(-50%)', background: PH.primary }}/>}
    </div>
  );
}

function Chips({ options, selected = [], multi = false, onToggle, accent = PH.primary }) {
  const sel = Array.isArray(selected) ? selected : [selected];
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
      {options.map((o, i) => {
        const on = sel.includes(i);
        return (
          <div key={o} onClick={() => onToggle && onToggle(i)} style={{
            height: 40, padding: '0 15px', borderRadius: 20, cursor: 'pointer',
            background: on ? (multi ? accent : PH.primarySoft) : PH.white,
            color: on ? (multi ? '#fff' : accent) : PH.ink70,
            border: `1px solid ${on ? accent : PH.border}`,
            display: 'flex', alignItems: 'center', gap: 5,
            font: `${on ? 700 : 600} 13.5px Pretendard`, letterSpacing: '-0.3px',
            transition: 'all 0.12s',
          }}>
            {on && <Icon name="check" size={13} color={multi ? '#fff' : accent} stroke={2.6}/>}
            {o}
          </div>
        );
      })}
    </div>
  );
}

function TriState({ icon, label, value, onChange }) {
  const opts = [
    { v: 3, label: '좋음', color: PH.green },
    { v: 2, label: '보통', color: PH.amber },
    { v: 1, label: '나쁨', color: PH.red },
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
      background: PH.white, borderRadius: 13, border: `1px solid ${PH.borderSoft}`,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: PH.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={18} color={value ? clColor(value) : PH.muted} stroke={1.8}/>
      </div>
      <span style={{ font: '700 14px Pretendard', color: PH.ink, letterSpacing: '-0.3px', flex: 1 }}>{label}</span>
      <div style={{ display: 'flex', gap: 5 }}>
        {opts.map(o => {
          const on = value === o.v;
          return (
            <div key={o.v} onClick={() => onChange && onChange(o.v)} style={{
              minWidth: 46, height: 34, padding: '0 8px', borderRadius: 9, cursor: 'pointer',
              background: on ? o.color : PH.surface, color: on ? '#fff' : PH.muted,
              border: `1px solid ${on ? o.color : PH.borderSoft}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: `${on ? 700 : 600} 12.5px Pretendard`, letterSpacing: '-0.3px',
              transition: 'all 0.12s',
            }}>{o.label}</div>
          );
        })}
      </div>
    </div>
  );
}

function SwitchRow({ icon, label, on, onToggle }) {
  return (
    <div onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', cursor: 'pointer',
      background: PH.white, borderRadius: 13, border: `1px solid ${PH.borderSoft}`,
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: PH.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={17} color={on ? PH.primary : PH.muted} stroke={1.8}/>
      </div>
      <span style={{ font: '700 14px Pretendard', color: PH.ink, letterSpacing: '-0.3px', flex: 1 }}>{label}</span>
      <div style={{ width: 48, height: 28, borderRadius: 14, padding: 3, background: on ? PH.primary : '#D8D5CD', display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start', transition: 'all 0.15s' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }}/>
      </div>
    </div>
  );
}

// 평수 입력: 직접 입력 + 자주 쓰는 평수 칩 + ㎡ 환산
function PyeongInput({ value, onChange }) {
  const presets = [6, 9, 12, 15, 18, 24];
  const sqm = (value * 3.305785).toFixed(1);
  return (
    <div>
      <div style={{
        height: 56, background: PH.white, borderRadius: 13, border: `1.5px solid ${PH.primary}`,
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, position: 'relative',
      }}>
        <span style={{ font: '600 13px Pretendard', color: PH.muted }}>전용면적</span>
        <span style={{ flex: 1, textAlign: 'right', font: '700 20px Pretendard', letterSpacing: '-0.5px', color: PH.ink }}>
          {value}
        </span>
        <div style={{ width: 2, height: 24, background: PH.primary }}/>
        <span style={{ font: '600 14px Pretendard', color: PH.ink70 }}>평</span>
        <span style={{ font: '600 12px Pretendard', color: PH.muted, minWidth: 58, textAlign: 'right' }}>≈ {sqm}㎡</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {presets.map(p => {
          const on = p === value;
          return (
            <div key={p} onClick={() => onChange(p)} style={{
              height: 34, padding: '0 13px', borderRadius: 17, cursor: 'pointer',
              background: on ? PH.primarySoft : PH.white,
              color: on ? PH.primary : PH.ink70,
              border: `1px solid ${on ? PH.primary : PH.border}`,
              display: 'flex', alignItems: 'center',
              font: `${on ? 700 : 600} 13px Pretendard`, letterSpacing: '-0.3px',
            }}>{p}평</div>
          );
        })}
      </div>
    </div>
  );
}

// 층 입력: 유형 토글(지상/반지하/옥탑) → 아래 필드 가변
function FloorInput({ floorType, onTypeChange, cur, total }) {
  return (
    <div>
      <Segmented options={['지상', '반지하', '옥탑']} active={floorType} onChange={onTypeChange}/>
      <div style={{ marginTop: 8 }}>
        {floorType === 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <NumBox label="해당 층" value={cur} unit="층" focused/>
            <NumBox label="전체 층" value={total} unit="층"/>
          </div>
        )}
        {floorType === 1 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <NumBox label="전체 층" value={total} unit="층" focused/>
            <div style={{ flex: 1, padding: '0 14px', height: 56, display: 'flex', alignItems: 'center', font: '600 12.5px Pretendard', color: PH.muted, background: PH.surface, borderRadius: 13, border: `1px dashed ${PH.border}` }}>
              반지하는 채광·습기 꼭 확인하세요
            </div>
          </div>
        )}
        {floorType === 2 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <NumBox label="전체 층" value={total} unit="층" focused/>
            <div style={{ flex: 1, padding: '0 14px', height: 56, display: 'flex', alignItems: 'center', font: '600 12.5px Pretendard', color: PH.muted, background: PH.surface, borderRadius: 13, border: `1px dashed ${PH.border}` }}>
              옥탑은 단열·방수 확인하세요
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NumBox({ label, value, unit, focused }) {
  return (
    <div style={{
      flex: 1, height: 56, background: PH.white, borderRadius: 13,
      border: `1.5px solid ${focused ? PH.primary : PH.border}`,
      display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6,
    }}>
      <span style={{ font: '600 12.5px Pretendard', color: PH.muted, minWidth: 44 }}>{label}</span>
      <span style={{ flex: 1, textAlign: 'right', font: '700 20px Pretendard', letterSpacing: '-0.5px', color: PH.ink }}>{value}</span>
      {focused && <div style={{ width: 2, height: 22, background: PH.primary }}/>}
      <span style={{ font: '600 13px Pretendard', color: PH.ink70 }}>{unit}</span>
    </div>
  );
}

// 향 선택
function DirectionPicker({ active, onChange }) {
  const dirs = ['남향', '남동향', '남서향', '동향', '서향', '북향'];
  return (
    <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
      {dirs.map((d, i) => {
        const on = i === active;
        const good = i <= 2;
        return (
          <div key={d} onClick={() => onChange(i)} style={{
            height: 40, padding: '0 14px', borderRadius: 20, cursor: 'pointer',
            background: on ? PH.primarySoft : PH.white,
            border: `1px solid ${on ? PH.primary : PH.border}`,
            color: on ? PH.primary : PH.ink70,
            display: 'flex', alignItems: 'center', gap: 5,
            font: `${on ? 700 : 600} 13.5px Pretendard`, letterSpacing: '-0.3px',
          }}>
            {good && <Icon name="sun" size={13} color={on ? PH.primary : PH.amber} stroke={1.8}/>}
            {d}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tappable step tabs (non-linear)
// ─────────────────────────────────────────────────────────────
function StepTabs({ step, onJump, doneSet }) {
  const labels = ['기본', '가격', '구조', '체크'];
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, background: PH.white }}>
      <div style={{ padding: '52px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: PH.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="close" size={18} color={PH.ink70} stroke={2}/>
          </div>
          <div style={{ font: '700 15px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>집 추가</div>
          <div style={{ width: 36, height: 36 }}/>
        </div>

        {/* underline tabs */}
        <div style={{ display: 'flex', marginTop: 10, borderBottom: `1px solid ${PH.borderSoft}`, position: 'relative' }}>
          {labels.map((lb, i) => {
            const n = i + 1;
            const active = n === step;
            return (
              <div key={lb} onClick={() => onJump(n)} style={{
                flex: 1, cursor: 'pointer', paddingBottom: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
                font: `${active ? 700 : 600} 14.5px Pretendard`, letterSpacing: '-0.3px',
                color: active ? PH.ink : PH.muted,
                transition: 'color 0.15s',
              }}>
                {lb}
                {n === 1 && <span style={{ color: PH.coral, font: '700 13px Pretendard', marginTop: -2 }}>*</span>}
              </div>
            );
          })}
          {/* sliding underline indicator */}
          <div style={{
            position: 'absolute', bottom: -1, height: 2.5, borderRadius: 2,
            background: PH.ink,
            width: `calc(${100 / labels.length}% - 24px)`,
            left: `calc(${(step - 1) * (100 / labels.length)}% + 12px)`,
            transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
          }}/>
        </div>
        <div style={{ font: '500 11px Pretendard', color: PH.muted, marginTop: 10, paddingBottom: 12, textAlign: 'center', letterSpacing: '-0.2px' }}>
          순서 상관없이 원하는 항목부터 입력하세요
        </div>
      </div>
    </div>
  );
}

function Body({ children }) {
  return (
    <div style={{ position: 'absolute', top: 174, bottom: 102, left: 0, right: 0, overflowY: 'auto', padding: '16px 18px 8px' }}>
      {children}
    </div>
  );
}

function BottomBar({ step, onNext, onSave }) {
  const last = step === 4;
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: PH.white, padding: '14px 18px 30px', borderTop: `1px solid ${PH.borderSoft}`,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.05)', display: 'flex', gap: 10,
    }}>
      {last ? (
        <div onClick={onSave} style={{ height: 54, flex: 1, borderRadius: 15, background: PH.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, font: '700 15.5px Pretendard', letterSpacing: '-0.3px', cursor: 'pointer' }}>
            <Icon name="check" size={17} color="#fff" stroke={2.4}/> 집 저장하기
          </div>
      ) : (
        <>
          <div onClick={onSave} style={{ height: 54, flex: '0 0 96px', borderRadius: 15, border: `1px solid ${PH.border}`, background: PH.white, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 14.5px Pretendard', color: PH.ink70, cursor: 'pointer' }}>
            저장
          </div>
          <div onClick={onNext} style={{ height: 54, flex: 1, borderRadius: 15, background: PH.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, font: '700 15.5px Pretendard', letterSpacing: '-0.3px', cursor: 'pointer' }}>
            다음 항목 <Icon name="chev-r" size={17} color="#fff" stroke={2.2}/>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// The Wizard
// ─────────────────────────────────────────────────────────────
function AddWizard({ initialStep = 1 }) {
  const [step, setStep] = React.useState(initialStep);
  const [txType, setTxType] = React.useState(0);            // 0 월세 / 1 전세
  // 관리비 포함 항목: [수도, 전기, 가스, 인터넷]
  const [included, setIncluded] = React.useState([0, 3]);   // 수도·인터넷 포함
  const [rooms, setRooms] = React.useState(2);
  const [pyeong, setPyeong] = React.useState(9);
  const [floorType, setFloorType] = React.useState(0);
  const [dir, setDir] = React.useState(0);
  const [cond, setCond] = React.useState({ sun: 3, water: 3, mold: 2, noise: 3, vent: 2 });
  const [fac, setFac] = React.useState({ elevator: true, parking: false, full: true });
  const [addrOpen, setAddrOpen] = React.useState(false);
  const [baseAddr, setBaseAddr] = React.useState({ road: '서울 용산구 청파로47길 22', jibun: '청파동1가 56-3', zip: '04303' });
  const [detail, setDetail] = React.useState('302호');

  const toggleInc = (i) => setIncluded(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i]);
  const doneSet = [1, 2, 3, 4];

  const METER = [{ key: 1, label: '전기', icon: 'sun' }, { key: 2, label: '가스', icon: 'wind' }];
  const sepItems = METER.filter(m => !included.includes(m.key)); // 포함 안 된 전기/가스 = 별도

  const incNames = ['수도', '전기', '가스', '인터넷'];
  const incLabel = included.map(i => incNames[i]).join('·') || '없음';
  const sepLabel = incNames.filter((_, i) => !included.includes(i)).join('·') || '없음';

  return (
    <Screen>
      <StepTabs step={step} onJump={setStep} doneSet={doneSet}/>

      <Body>
        {/* STEP 1 — 기본 */}
        {step === 1 && (
          <>
            <Field>
              <FieldLabel required>거래 유형</FieldLabel>
              <Segmented options={['월세', '전세']} active={txType} onChange={setTxType}/>
            </Field>
            <Field>
              <FieldLabel required>집 별칭</FieldLabel>
              <TextInput value="청파동 빌라" icon="home"/>
            </Field>
            <Field>
              <FieldLabel required>주소</FieldLabel>
              <AddressField baseAddr={baseAddr} detail={detail} onSearch={() => setAddrOpen(true)}/>
            </Field>
            <Field>
              <FieldLabel hint="기본: 오늘">방문일</FieldLabel>
              <TextInput value="2026년 5월 29일" icon="bookmark"/>
            </Field>
          </>
        )}

        {/* STEP 2 — 가격 */}
        {step === 2 && (
          <>
            <Field>
              <FieldLabel required>{txType === 0 ? '보증금 / 월세' : '전세금'}</FieldLabel>
              {txType === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <AmountInput label="보증금" value="1,000"/>
                  <AmountInput label="월세" value="65" focused/>
                </div>
              ) : (
                <AmountInput label="전세금" value="18,000" focused/>
              )}
            </Field>

            <Field>
              <FieldLabel hint="없으면 0">관리비</FieldLabel>
              <AmountInput label="관리비" value="7"/>
            </Field>

            <Field>
              <FieldLabel hint="관리비에 포함된 항목을 골라주세요">관리비 포함 항목</FieldLabel>
              <Chips multi options={incNames} selected={included} onToggle={toggleInc}/>
            </Field>

            {/* 조건부: 포함 안 된 전기/가스만 별도 입력 */}
            {sepItems.length > 0 && (
              <Field>
                <FieldLabel hint="관리비에 안 들어간 항목">별도 납부 (월 예상)</FieldLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {sepItems.map(m => (
                    <AmountInput key={m.key} label={`${m.label} 별도`} value={m.key === 1 ? '4' : '3'}/>
                  ))}
                </div>
              </Field>
            )}

            {/* 요약 배너 */}
            <div style={{ padding: '11px 13px', borderRadius: 11, background: PH.primarySoft, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <Icon name="check" size={14} color={PH.primary} stroke={2.4}/>
              <span style={{ font: '600 12.5px Pretendard', color: PH.primaryDark, letterSpacing: '-0.2px', lineHeight: 1.5 }}>
                관리비 <b>7만원</b>에 <b>{incLabel}</b> 포함{sepLabel !== '없음' && <> · <b>{sepLabel}</b> 별도 납부</>}
              </span>
            </div>
          </>
        )}

        {/* STEP 3 — 구조 */}
        {step === 3 && (
          <>
            <Field>
              <FieldLabel required>방 구조</FieldLabel>
              <Chips options={['원룸', '분리형 원룸', '1.5룸', '투룸', '쓰리룸+']} selected={rooms} onToggle={setRooms}/>
            </Field>
            <Field>
              <FieldLabel required hint="직접 입력하거나 눌러서 선택">평수</FieldLabel>
              <PyeongInput value={pyeong} onChange={setPyeong}/>
            </Field>
            <Field>
              <FieldLabel required hint="층 유형을 먼저 선택">층수</FieldLabel>
              <FloorInput floorType={floorType} onTypeChange={setFloorType} cur={3} total={5}/>
            </Field>
            <Field>
              <FieldLabel hint="햇빛과 직결돼요">향</FieldLabel>
              <DirectionPicker active={dir} onChange={setDir}/>
            </Field>
          </>
        )}

        {/* STEP 4 — 체크 */}
        {step === 4 && (
          <>
            <Field>
              <FieldLabel hint="보면서 느낀 점을 빠르게">컨디션 체크</FieldLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <TriState icon="sun" label="햇빛" value={cond.sun} onChange={v => setCond({ ...cond, sun: v })}/>
                <TriState icon="drop" label="수압" value={cond.water} onChange={v => setCond({ ...cond, water: v })}/>
                <TriState icon="mold" label="곰팡이" value={cond.mold} onChange={v => setCond({ ...cond, mold: v })}/>
                <TriState icon="ear" label="방음" value={cond.noise} onChange={v => setCond({ ...cond, noise: v })}/>
                <TriState icon="wind" label="환기" value={cond.vent} onChange={v => setCond({ ...cond, vent: v })}/>
              </div>
            </Field>
            <Field>
              <FieldLabel>시설</FieldLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <SwitchRow icon="layers" label="엘리베이터" on={fac.elevator} onToggle={() => setFac({ ...fac, elevator: !fac.elevator })}/>
                <SwitchRow icon="navigate" label="주차 가능" on={fac.parking} onToggle={() => setFac({ ...fac, parking: !fac.parking })}/>
                <SwitchRow icon="home" label="풀옵션 (빌트인)" on={fac.full} onToggle={() => setFac({ ...fac, full: !fac.full })}/>
              </div>
            </Field>
            <Field>
              <FieldLabel hint="최대 10장">사진</FieldLabel>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 76, height: 76, borderRadius: 13, border: `1.5px dashed ${PH.border}`, background: PH.white, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <Icon name="plus" size={20} color={PH.muted} stroke={2}/>
                  <span style={{ font: '600 10px Pretendard', color: PH.muted }}>2/10</span>
                </div>
                {[32, 200].map((hue, i) => (
                  <div key={i} style={{ width: 76, height: 76, borderRadius: 13, overflow: 'hidden', background: `linear-gradient(135deg, hsl(${hue},22%,76%), hsl(${(hue+30)%360},22%,58%))`, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="close" size={11} color="#fff" stroke={2.4}/>
                    </div>
                  </div>
                ))}
              </div>
            </Field>
            <Field>
              <FieldLabel hint="자유롭게">메모</FieldLabel>
              <div style={{ minHeight: 80, background: PH.white, borderRadius: 13, padding: '12px 14px', border: `1px solid ${PH.border}`, font: '500 13.5px Pretendard', color: PH.ink70, lineHeight: 1.5, letterSpacing: '-0.2px' }}>
                엘베 있고 옥상 사용가능. 집주인 친절함. 채광 좋은데 환기는 살짝 아쉬움. 곰팡이 흔적 약간 있어서 재확인 필요.
              </div>
            </Field>
          </>
        )}
      </Body>

      <BottomBar step={step} onNext={() => setStep(s => Math.min(4, s + 1))} onSave={() => {}}/>

      {addrOpen && (
        <AddressSearchOverlay
          onClose={() => setAddrOpen(false)}
          onPick={(r) => { setBaseAddr(r); setDetail(''); setAddrOpen(false); }}
        />
      )}
    </Screen>
  );
}

Object.assign(window, { AddWizard });
