// Pickhouse — 직장·학교 등록 (마이 > 통근 기준지 관리)
// 집 비교 시 통근 거리/시간 기준으로 쓰이는 장소를 등록.

const { PH, Icon, Screen } = window;

function PageHeader({ title, sub, onBack = true }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, background: PH.white, borderBottom: `1px solid ${PH.borderSoft}` }}>
      <div style={{ padding: '52px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40 }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 20 20" style={{ width: 18, height: 18 }}>
              <path d="M12 5l-5 5 5 5" fill="none" stroke={PH.ink70} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ font: '700 17px Pretendard', color: PH.ink, letterSpacing: '-0.4px' }}>{title}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TRANSPORT = [
  { key: 'transit', icon: 'train', label: '대중교통' },
  { key: 'car', icon: 'car', label: '자동차' },
  { key: 'walk', icon: 'walk', label: '도보' },
  { key: 'bike', icon: 'bike', label: '자전거' },
];

// Registered place card
function PlaceCard({ kind, name, addr, transport, primary, accent }) {
  const meta = kind === 'work'
    ? { icon: 'briefcase', label: '직장', color: PH.primary, soft: PH.primarySoft }
    : kind === 'school'
    ? { icon: 'school', label: '학교', color: '#7B5FCC', soft: '#EFEAFB' }
    : { icon: 'pin', label: '기타', color: PH.coral, soft: '#FCEFE7' };
  const tp = TRANSPORT.find(t => t.key === transport);
  return (
    <div style={{
      background: PH.white, borderRadius: 16, padding: 14,
      border: `1px solid ${primary ? meta.color : PH.borderSoft}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13, background: meta.soft, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={meta.icon} size={22} color={meta.color} stroke={1.8}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ padding: '1.5px 7px', borderRadius: 5, background: meta.soft, color: meta.color, font: '700 10.5px Pretendard' }}>{meta.label}</span>
            {primary && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1.5px 7px', borderRadius: 5, background: PH.ink, color: '#fff', font: '700 10.5px Pretendard' }}>
                <Icon name="check" size={10} color="#fff" stroke={2.6}/> 주 통근지
              </span>
            )}
          </div>
          <div style={{ font: '700 15.5px Pretendard', color: PH.ink, letterSpacing: '-0.4px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{name}</div>
          <div style={{ font: '500 12px Pretendard', color: PH.muted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{addr}</div>
        </div>
        <Icon name="edit" size={17} color={PH.muted} stroke={1.7}/>
      </div>
      {/* transport row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${PH.borderSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 9, background: PH.surface }}>
          <Icon name={tp.icon} size={14} color={PH.ink70} stroke={1.8}/>
          <span style={{ font: '600 12px Pretendard', color: PH.ink70 }}>{tp.label} 기준</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: PH.muted }}>
          <Icon name="route" size={13} color={PH.muted} stroke={1.8}/>
          <span style={{ font: '600 11.5px Pretendard' }}>매물별 통근시간 자동 계산</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen 1 — 등록된 장소 목록 (filled)
// ─────────────────────────────────────────────────────────────
function PlacesList() {
  return (
    <Screen>
      <PageHeader title="직장·학교"/>
      <div style={{ position: 'absolute', top: 110, bottom: 96, left: 0, right: 0, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {/* why card */}
        <div style={{ display: 'flex', gap: 11, padding: '14px', borderRadius: 14, background: PH.primarySoft, marginBottom: 18 }}>
          <Icon name="route" size={20} color={PH.primary} stroke={1.9}/>
          <div style={{ font: '500 12.5px Pretendard', color: PH.primaryDark, lineHeight: 1.55, letterSpacing: '-0.2px' }}>
            등록한 장소까지의 <b>통근시간</b>이 집 카드와 비교 화면에 자동으로 표시돼요. 가격·옵션만큼 중요한 <b>출퇴근 거리</b>를 한눈에 따져보세요.
          </div>
        </div>

        <div style={{ font: '700 13px Pretendard', color: PH.ink70, marginBottom: 10, letterSpacing: '-0.3px' }}>
          등록된 장소 <span style={{ color: PH.primary }}>2</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PlaceCard kind="work" name="㈜카카오엔터프라이즈 판교 오피스" addr="경기 성남시 분당구 판교역로 152" transport="transit" primary/>
          <PlaceCard kind="school" name="한양대학교 서울캠퍼스 공과대학" addr="서울 성동구 왕십리로 222" transport="bike"/>
        </div>

        {/* add button */}
        <div style={{
          marginTop: 14, height: 56, borderRadius: 15, border: `1.5px dashed ${PH.border}`,
          background: PH.white, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          font: '700 14.5px Pretendard', color: PH.ink70, letterSpacing: '-0.3px',
        }}>
          <Icon name="plus" size={18} color={PH.ink70} stroke={2.2}/>
          장소 추가
        </div>
      </div>

      {/* bottom save bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: PH.white, padding: '14px 18px 30px', borderTop: `1px solid ${PH.borderSoft}` }}>
        <div style={{ height: 54, borderRadius: 15, background: PH.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 15.5px Pretendard', letterSpacing: '-0.3px' }}>
          완료
        </div>
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// Kakao 장소(회사·학교 이름) 검색 오버레이
// ─────────────────────────────────────────────────────────────
function KakaoPlaceOverlay({ onClose, onPick }) {
  const results = [
    { name: '㈜카카오엔터프라이즈 판교 오피스', cat: 'IT·기업', addr: '경기 성남시 분당구 판교역로 152', dist: '12.4km' },
    { name: '카카오판교아지트', cat: '회사', addr: '경기 성남시 분당구 판교역로 166', dist: '12.6km' },
    { name: '한양대학교 서울캠퍼스', cat: '대학교', addr: '서울 성동구 왕십리로 222', dist: '3.1km' },
    { name: '삼성전자 서초사옥', cat: '대기업', addr: '서울 서초구 서초대로74길 11', dist: '8.8km' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 90, background: PH.surface, borderRadius: 48, overflow: 'hidden' }}>
      <div style={{ background: PH.white, padding: '52px 16px 14px', borderBottom: `1px solid ${PH.borderSoft}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 40 }}>
          <div onClick={onClose} style={{ width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg viewBox="0 0 20 20" style={{ width: 18, height: 18 }}><path d="M12 5l-5 5 5 5" fill="none" stroke={PH.ink70} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ font: '700 16px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>회사·학교 검색</div>
        </div>
        <div style={{ height: 48, background: PH.surface, borderRadius: 13, marginTop: 6, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10, border: `1.5px solid ${PH.primary}` }}>
          <Icon name="search" size={18} color={PH.primary} stroke={2}/>
          <span style={{ flex: 1, font: '600 15px Pretendard', color: PH.ink }}>카카오</span>
          <div style={{ width: 2, height: 22, background: PH.primary }}/>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10, font: '500 11px Pretendard', color: PH.muted }}>
          <span style={{ padding: '2px 6px', borderRadius: 4, background: '#FEE500', color: '#3A2929', font: '700 9.5px Pretendard' }}>kakao</span>
          카카오맵 장소 검색 기반
        </div>
      </div>
      <div style={{ padding: '6px 0', overflowY: 'auto', position: 'absolute', top: 190, bottom: 0, left: 0, right: 0 }}>
        {results.map((r, i) => (
          <div key={i} onClick={() => onPick(r)} style={{
            padding: '13px 18px', cursor: 'pointer', borderTop: `1px solid ${PH.borderSoft}`,
            display: 'flex', alignItems: 'flex-start', gap: 11,
          }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: PH.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
              <Icon name="pin" size={16} color={PH.primary} stroke={1.9}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ font: '700 14.5px Pretendard', color: PH.ink, letterSpacing: '-0.3px', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                <span style={{ font: '500 10.5px Pretendard', color: PH.muted, flexShrink: 0 }}>{r.dist}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <span style={{ padding: '1px 5px', borderRadius: 4, background: PH.surface, border: `1px solid ${PH.borderSoft}`, color: PH.muted, font: '600 9.5px Pretendard' }}>{r.cat}</span>
                <span style={{ font: '500 11.5px Pretendard', color: PH.ink70, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.addr}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen 2 — 새 장소 추가 (form)
// ─────────────────────────────────────────────────────────────
function AddPlace() {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [place, setPlace] = React.useState({
    name: '㈜카카오엔터프라이즈 판교 오피스',
    cat: 'IT·기업',
    addr: '경기 성남시 분당구 판교역로 152',
  });
  const [kind, setKind] = React.useState(0);
  const [transport, setTransport] = React.useState(0);
  const KINDS = [
    { icon: 'briefcase', label: '직장', color: PH.primary, soft: PH.primarySoft },
    { icon: 'school', label: '학교', color: '#7B5FCC', soft: '#EFEAFB' },
    { icon: 'pin', label: '기타', color: PH.coral, soft: '#FCEFE7' },
  ];

  return (
    <Screen>
      <PageHeader title="장소 추가"/>
      <div style={{ position: 'absolute', top: 110, bottom: 96, left: 0, right: 0, overflowY: 'auto', padding: '18px 16px 8px' }}>
        {/* kind */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ font: '700 14px Pretendard', color: PH.ink, marginBottom: 9, letterSpacing: '-0.3px' }}>장소 종류</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {KINDS.map((k, i) => {
              const on = i === kind;
              return (
                <div key={k.label} onClick={() => setKind(i)} style={{
                  flex: 1, height: 76, borderRadius: 14, cursor: 'pointer',
                  background: on ? k.soft : PH.white,
                  border: `1.5px solid ${on ? k.color : PH.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}>
                  <Icon name={k.icon} size={22} color={on ? k.color : PH.muted} stroke={1.8}/>
                  <span style={{ font: `${on ? 700 : 600} 13px Pretendard`, color: on ? k.color : PH.ink70 }}>{k.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* place search (Kakao) */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ font: '700 14px Pretendard', color: PH.ink, marginBottom: 9, letterSpacing: '-0.3px' }}>회사·학교 검색</div>
          {!place ? (
            <div onClick={() => setSearchOpen(true)} style={{
              height: 52, background: PH.white, borderRadius: 13, cursor: 'pointer',
              border: `1px solid ${PH.borderSoft}`, display: 'flex', alignItems: 'center', padding: '0 6px 0 14px', gap: 10,
            }}>
              <Icon name="search" size={17} color={PH.muted}/>
              <span style={{ flex: 1, font: '600 15px Pretendard', color: PH.muted, letterSpacing: '-0.3px' }}>회사·학교 이름으로 검색</span>
              <div style={{ height: 38, padding: '0 12px', borderRadius: 10, background: '#FEE500', color: '#3A2929', display: 'flex', alignItems: 'center', gap: 5, font: '700 12.5px Pretendard' }}>
                <span style={{ font: '800 11px Pretendard' }}>kakao</span> 검색
              </div>
            </div>
          ) : (
            <div style={{ background: PH.white, borderRadius: 13, border: `1px solid ${PH.border}`, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: PH.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Icon name="pin" size={17} color={PH.primary} stroke={1.9}/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ padding: '1px 6px', borderRadius: 4, background: PH.surface, border: `1px solid ${PH.borderSoft}`, color: PH.muted, font: '600 9.5px Pretendard', flexShrink: 0 }}>{place.cat}</span>
                </div>
                <div style={{ font: '700 14.5px Pretendard', color: PH.ink, letterSpacing: '-0.3px', marginTop: 3, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{place.name}</div>
                <div style={{ font: '500 11.5px Pretendard', color: PH.muted, marginTop: 3 }}>{place.addr}</div>
              </div>
              <div onClick={() => setSearchOpen(true)} style={{ font: '600 12.5px Pretendard', color: PH.primary, cursor: 'pointer', flexShrink: 0 }}>변경</div>
            </div>
          )}
        </div>

        {/* display nickname (optional, auto-filled, editable) */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ font: '700 14px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>표시 이름</span>
            <span style={{ font: '500 11.5px Pretendard', color: PH.muted }}>카드엔 아이콘만 표시 · 짧게 권장</span>
          </div>
          <div style={{ height: 52, background: PH.white, borderRadius: 13, border: `1.5px solid ${PH.primary}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
            <span style={{ flex: 1, font: '600 15px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>판교 회사</span>
            <div style={{ width: 2, height: 22, background: PH.primary }}/>
          </div>
        </div>

        {/* transport */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ font: '700 14px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>주 이동수단</span>
            <span style={{ font: '500 11.5px Pretendard', color: PH.muted }}>통근시간 계산 기준</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {TRANSPORT.map((t, i) => {
              const on = i === transport;
              return (
                <div key={t.key} onClick={() => setTransport(i)} style={{
                  flex: 1, height: 64, borderRadius: 13, cursor: 'pointer',
                  background: on ? PH.primarySoft : PH.white,
                  border: `1.5px solid ${on ? PH.primary : PH.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                }}>
                  <Icon name={t.icon} size={19} color={on ? PH.primary : PH.muted} stroke={1.8}/>
                  <span style={{ font: `${on ? 700 : 600} 11px Pretendard`, color: on ? PH.primary : PH.ink70 }}>{t.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* primary toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', background: PH.white, borderRadius: 13, border: `1px solid ${PH.borderSoft}` }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: PH.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={17} color={PH.primary} stroke={2.2}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ font: '700 13.5px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>주 통근지로 설정</div>
            <div style={{ font: '500 11px Pretendard', color: PH.muted, marginTop: 1 }}>집 카드에 이 장소까지의 시간이 표시돼요</div>
          </div>
          <div style={{ width: 48, height: 28, borderRadius: 14, padding: 3, background: PH.primary, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }}/>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: PH.white, padding: '14px 18px 30px', borderTop: `1px solid ${PH.borderSoft}` }}>
        <div style={{ height: 54, borderRadius: 15, background: PH.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 15.5px Pretendard', letterSpacing: '-0.3px' }}>
          장소 저장하기
        </div>
      </div>

      {searchOpen && (
        <KakaoPlaceOverlay
          onClose={() => setSearchOpen(false)}
          onPick={(r) => { setPlace(r); setSearchOpen(false); }}
        />
      )}
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen 3 — 빈 상태 (onboarding nudge)
// ─────────────────────────────────────────────────────────────
function PlacesEmpty() {
  return (
    <Screen>
      <PageHeader title="직장·학교"/>
      <div style={{ position: 'absolute', top: 110, bottom: 96, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center' }}>
        <div style={{ width: 88, height: 88, borderRadius: 26, background: PH.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22 }}>
          <Icon name="route" size={40} color={PH.primary} stroke={1.7}/>
        </div>
        <div style={{ font: '700 19px Pretendard', color: PH.ink, letterSpacing: '-0.5px', marginBottom: 10 }}>
          통근 기준지를 등록해 보세요
        </div>
        <div style={{ font: '500 13.5px Pretendard', color: PH.muted, lineHeight: 1.6, letterSpacing: '-0.2px' }}>
          직장이나 학교를 등록하면 집을 비교할 때<br/>가격·옵션과 함께 <b style={{ color: PH.ink70 }}>출퇴근 시간</b>까지<br/>한눈에 따져볼 수 있어요.
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: PH.white, padding: '14px 18px 30px', borderTop: `1px solid ${PH.borderSoft}` }}>
        <div style={{ height: 54, borderRadius: 15, background: PH.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, font: '700 15.5px Pretendard', letterSpacing: '-0.3px' }}>
          <Icon name="plus" size={18} color="#fff" stroke={2.2}/> 직장·학교 등록
        </div>
        <div style={{ textAlign: 'center', marginTop: 14, font: '600 13px Pretendard', color: PH.muted }}>나중에 할게요</div>
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// 마이페이지 — 직장·학교 등록 진입점 (안내 문구 포함)
// ─────────────────────────────────────────────────────────────
function MyPage({ registered = true }) {
  const rowItem = (icon, label, value, color) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', background: PH.white, borderBottom: `1px solid ${PH.borderSoft}` }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: PH.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={18} color={color || PH.ink70} stroke={1.8}/>
      </div>
      <span style={{ flex: 1, font: '600 14.5px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>{label}</span>
      {value && <span style={{ font: '600 12.5px Pretendard', color: PH.muted }}>{value}</span>}
      <Icon name="chev-r" size={16} color={PH.muted}/>
    </div>
  );

  return (
    <Screen>
      <PageHeader title="마이"/>
      <div style={{ position: 'absolute', top: 110, bottom: 84, left: 0, right: 0, overflowY: 'auto' }}>
        {/* profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '18px 16px', background: PH.white }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: PH.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="user" size={26} color={PH.primary} stroke={1.7}/>
          </div>
          <div>
            <div style={{ font: '700 17px Pretendard', color: PH.ink, letterSpacing: '-0.4px' }}>내 집 찾기</div>
            <div style={{ font: '500 12px Pretendard', color: PH.muted, marginTop: 2 }}>기록한 집 7곳 · 찜 3곳</div>
          </div>
        </div>

        {/* 통근 기준지 — featured entry with guidance */}
        <div style={{ padding: '16px 16px 8px' }}>
          <div style={{ font: '700 13px Pretendard', color: PH.ink70, marginBottom: 10, letterSpacing: '-0.3px' }}>통근 기준지</div>
          {registered ? (
            <div style={{ background: PH.white, borderRadius: 16, border: `1px solid ${PH.borderSoft}`, overflow: 'hidden' }}>
              <div style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 11, borderBottom: `1px solid ${PH.borderSoft}` }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: PH.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="briefcase" size={19} color={PH.primary} stroke={1.8}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ padding: '1px 6px', borderRadius: 4, background: PH.primarySoft, color: PH.primary, font: '700 9.5px Pretendard' }}>직장</span>
                    <span style={{ padding: '1px 6px', borderRadius: 4, background: PH.ink, color: '#fff', font: '700 9.5px Pretendard' }}>주 통근지</span>
                  </div>
                  <div style={{ font: '700 14px Pretendard', color: PH.ink, letterSpacing: '-0.3px', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>㈜카카오엔터프라이즈 판교 오피스</div>
                </div>
                <Icon name="edit" size={16} color={PH.muted} stroke={1.7}/>
              </div>
              <div style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: '#EFEAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="school" size={19} color="#7B5FCC" stroke={1.8}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ padding: '1px 6px', borderRadius: 4, background: '#EFEAFB', color: '#7B5FCC', font: '700 9.5px Pretendard' }}>학교</span>
                  <div style={{ font: '700 14px Pretendard', color: PH.ink, letterSpacing: '-0.3px', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>한양대학교 서울캠퍼스 공과대학</div>
                </div>
                <Icon name="edit" size={16} color={PH.muted} stroke={1.7}/>
              </div>
              <div style={{ padding: '0 14px 14px' }}>
                <div style={{ height: 44, borderRadius: 12, border: `1px dashed ${PH.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, font: '700 13px Pretendard', color: PH.ink70 }}>
                  <Icon name="plus" size={15} color={PH.ink70} stroke={2.2}/> 장소 추가
                </div>
              </div>
            </div>
          ) : (
            // 안내 문구 (아무것도 등록 안 한 상태)
            <div style={{ background: PH.white, borderRadius: 16, border: `1px solid ${PH.borderSoft}`, padding: 16 }}>
              <div style={{ display: 'flex', gap: 11, marginBottom: 13 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: PH.primarySoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="route" size={20} color={PH.primary} stroke={1.8}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ font: '700 14.5px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>직장·학교를 등록해 보세요</div>
                  <div style={{ font: '500 12px Pretendard', color: PH.muted, marginTop: 4, lineHeight: 1.5, letterSpacing: '-0.2px' }}>
                    등록하면 집 카드와 비교 화면에 <b style={{ color: PH.ink70 }}>통근시간</b>이 표시돼요. 가격·옵션만큼 중요한 출퇴근 거리를 함께 따져보세요.
                  </div>
                </div>
              </div>
              <div style={{ height: 48, borderRadius: 13, background: PH.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, font: '700 14px Pretendard', letterSpacing: '-0.3px' }}>
                <Icon name="plus" size={16} color="#fff" stroke={2.2}/> 직장·학교 등록
              </div>
            </div>
          )}
        </div>

        {/* other menu */}
        <div style={{ marginTop: 14, borderTop: `1px solid ${PH.borderSoft}` }}>
          {rowItem('heart', '찜한 집', '3')}
          {rowItem('list', '내가 기록한 집', '7')}
          {rowItem('grid', '비교 목록', '4')}
          {rowItem('sliders', '설정')}
        </div>
      </div>

      <BottomNavStub active={4}/>
    </Screen>
  );
}

// minimal bottom nav for the my-page artboard
function BottomNavStub({ active = 4 }) {
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
      background: PH.white, paddingBottom: 22, paddingTop: 8, borderTop: `1px solid ${PH.borderSoft}`,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
    }}>
      {tabs.map((t, i) => {
        if (t.center) {
          return (
            <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, marginTop: -2 }}>
              <div style={{ width: 46, height: 46, borderRadius: 16, background: PH.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(27,122,83,0.35)' }}>
                <Icon name="plus" size={24} color="#fff" stroke={2.4}/>
              </div>
              <span style={{ font: '600 10px Pretendard', color: PH.ink70 }}>{t.label}</span>
            </div>
          );
        }
        const on = i === active;
        return (
          <div key={t.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <Icon name={t.icon} size={23} color={on ? PH.ink : PH.muted} stroke={on ? 2 : 1.7}/>
            <span style={{ font: `${on ? 700 : 600} 10px Pretendard`, color: on ? PH.ink : PH.muted }}>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { PlacesList, AddPlace, PlacesEmpty, MyPage });
