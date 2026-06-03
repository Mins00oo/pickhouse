// Pickhouse — 비교 화면 (2개 1:1)
// A: 풀 비교표(동기화 2열, 스크롤)  B: 한눈에 요약(무스크롤)  + 진입(2개 고르기)

const { PH, HOUSES, Icon, Screen, CL_META, CL_LABELS, clColor, clLabel, clValue, priceLong, priceShort, formatDeposit } = window;

// ── helpers ──────────────────────────────────────────────────
const SCHOOL = '#7B5FCC';
const CA = PH.primary;  // 집 A 아이덴티티 색 (그린)
const CB = PH.coral;    // 집 B 아이덴티티 색 (코랄)
const monthlyCost = (h) => h.type === 'jeonse' ? null : h.rent + h.mgmt; // 월 부담(전세는 비교 제외)
// 향 → 햇빛 색 레벨 (남향계열 좋음 / 동·서 보통 / 북향 주의) — 단순 클라이언트 매핑
const dirLevel = (dir) => /남/.test(dir) ? 3 : /북/.test(dir) ? 1 : 2;

// ── 상단: 두 집 헤더 (grid [1fr 54px 1fr], 가운데 VS) ─────────────
function CompareHeader({ a, b }) {
  const cell = (h, side) => {
    const photoBg = `linear-gradient(135deg, hsl(${h.photoHue},22%,76%), hsl(${(h.photoHue+30)%360},22%,58%))`;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ width: '100%', height: 92, borderRadius: 12, background: photoBg, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.18))' }}/>
          <div style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 22, background: 'rgba(255,255,255,0.45)', borderRadius: 2 }}/>
          <div style={{ position: 'absolute', top: 14, right: 50, width: 22, height: 22, background: 'rgba(255,255,255,0.32)', borderRadius: 2 }}/>
          <div style={{ position: 'absolute', left: 7, bottom: 7, padding: '2px 6px', borderRadius: 5, background: 'rgba(0,0,0,0.5)', color: '#fff', font: '600 9px Pretendard' }}>변경</div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: side === 'l' ? CA : CB }}/>
          <span style={{ padding: '1px 6px', borderRadius: 4, background: h.type === 'jeonse' ? PH.primarySoft : '#FCEFE7', color: h.type === 'jeonse' ? PH.primary : PH.coral, font: '700 9.5px Pretendard' }}>{h.type === 'jeonse' ? '전세' : '월세'}</span>
        </div>
        <div style={{ font: '700 13.5px Pretendard', color: PH.ink, letterSpacing: '-0.3px', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{h.name}</div>
        <div style={{ font: '700 16px Pretendard', color: PH.ink, letterSpacing: '-0.5px', marginTop: 2 }}>
          {priceLong(h).value}
        </div>
      </div>
    );
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', alignItems: 'start', gap: 0, padding: '4px 16px 14px' }}>
      {cell(a, 'l')}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 36 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: PH.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '800 11px Pretendard' }}>VS</div>
      </div>
      {cell(b, 'r')}
    </div>
  );
}

// ── 비교 한 줄 (가운데 라벨 + 좌우 값) ──────────────────────────
// hi: 'l'|'r'|null — 숫자상 더 '높은' 쪽 (▲ 높음 / ▼ 낮음, 판단 아닌 사실)
function Row({ label, left, right, hi, leftSub, rightSub, dense }) {
  const arrow = (side) => {
    if (!hi) return null;
    const up = hi === side;
    return (
      <Icon name={up ? 'tri-up' : 'tri-down'} size={dense ? 10 : 11}
        color={up ? PH.ink70 : '#C2BEB2'} />
    );
  };
  const valCell = (val, sub, side) => (
    <div style={{
      borderRadius: 10, padding: dense ? '6px 4px' : '9px 6px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <div style={{ font: `700 ${dense ? 13.5 : 15}px Pretendard`, color: PH.ink, letterSpacing: '-0.3px', textAlign: 'center', lineHeight: 1.25 }}>
          {val}
        </div>
        {arrow(side)}
      </div>
      {sub && <div style={{ font: '500 10px Pretendard', color: PH.muted }}>{sub}</div>}
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 1fr', alignItems: 'center', padding: '2px 0' }}>
      {valCell(left, leftSub, 'l')}
      <div style={{ font: '600 11px Pretendard', color: PH.muted, textAlign: 'center', letterSpacing: '-0.2px' }}>{label.t}</div>
      {valCell(right, rightSub, 'r')}
    </div>
  );
}

function SectionLabel({ icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '16px 4px 6px' }}>
      <Icon name={icon} size={13} color={PH.ink70} stroke={2}/>
      <span style={{ font: '700 12px Pretendard', color: PH.ink70, letterSpacing: '-0.2px' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: PH.borderSoft, marginLeft: 4 }}/>
    </div>
  );
}

// 숫자 비교 — 가운데서 양옆으로 뻗는 막대 + 큰 숫자 + 델타 (집 색으로 강조)
function MetricBar({ label, la, rb, unit = '', dense }) {
  const max = Math.max(la, rb) || 1;
  const lp = Math.max(10, Math.round(la / max * 100));
  const rp = Math.max(10, Math.round(rb / max * 100));
  const diff = Math.abs(la - rb);
  const num = (v, color) => <span style={{ font: '800 17px Pretendard', color, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>{v}<span style={{ font: '600 11px Pretendard' }}>{unit}</span></span>;
  const track = { height: 9, borderRadius: 5, background: PH.borderSoft, flex: 1, overflow: 'hidden', display: 'flex' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 62px 1fr', alignItems: 'center', padding: '7px 0' }}>
      {/* left: number + bar(grows toward center) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {num(la, CA)}
        <div style={{ ...track, justifyContent: 'flex-end' }}>
          <div style={{ width: `${lp}%`, background: CA, borderRadius: 5 }}/>
        </div>
      </div>
      {/* center label + delta */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <span style={{ font: '600 11px Pretendard', color: PH.ink70 }}>{label}</span>
        {diff > 0 && <span style={{ font: '700 9.5px Pretendard', color: PH.muted }}>{diff}{unit} 차이</span>}
      </div>
      {/* right: bar + number */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ ...track, justifyContent: 'flex-start' }}>
          <div style={{ width: `${rp}%`, background: CB, borderRadius: 5 }}/>
        </div>
        {num(rb, CB)}
      </div>
    </div>
  );
}

// 시설 비교 한 줄 — 있음(집 색) / 없음(흐리게)
function FacCmp({ label, la, rb }) {
  const cell = (on, color) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '7px 0' }}>
      {on
        ? <><Icon name="check" size={14} color={color} stroke={2.8}/><span style={{ font: '700 13px Pretendard', color }}>있음</span></>
        : <><span style={{ width: 12, height: 2, borderRadius: 2, background: '#CFCBBF' }}/><span style={{ font: '600 13px Pretendard', color: PH.muted }}>없음</span></>}
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 62px 1fr', alignItems: 'center' }}>
      {cell(la, CA)}
      <div style={{ font: '600 11px Pretendard', color: PH.muted, textAlign: 'center' }}>{label}</div>
      {cell(rb, CB)}
    </div>
  );
}

// 컨디션 한 줄 — 항목별 실제 값(햇빛=남향, 곰팡이=없음 …) + 색
// level: 색 칠하는 용도(1~3), text: 화면에 보일 실제 단어
function ClRow({ k, lLevel, rLevel, lText, rText, dense }) {
  const cell = (level, text) => (
    <div style={{ borderRadius: 10, padding: dense ? '5px 6px' : '7px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: clColor(level), flexShrink: 0 }}/>
      <span style={{ font: `700 ${dense ? 12.5 : 13}px Pretendard`, color: clColor(level), letterSpacing: '-0.2px' }}>{text}</span>
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 1fr', alignItems: 'center', padding: '1px 0' }}>
      {cell(lLevel, lText)}
      <div style={{ font: '600 11px Pretendard', color: PH.muted, textAlign: 'center' }}>{CL_META[k].label}</div>
      {cell(rLevel, rText)}
    </div>
  );
}

// 한 집의 컨디션 행 묶음 (햇빛=향, 나머지=항목 어휘)
function condRows(a, b, dense) {
  return (
    <>
      <ClRow dense={dense} k="sun"   lLevel={dirLevel(a.dir)} rLevel={dirLevel(b.dir)} lText={a.dir} rText={b.dir}/>
      <ClRow dense={dense} k="water" lLevel={a.cl.water} rLevel={b.cl.water} lText={clValue('water', a.cl.water)} rText={clValue('water', b.cl.water)}/>
      <ClRow dense={dense} k="mold"  lLevel={a.cl.mold}  rLevel={b.cl.mold}  lText={clValue('mold', a.cl.mold)}   rText={clValue('mold', b.cl.mold)}/>
      <ClRow dense={dense} k="noise" lLevel={a.cl.noise} rLevel={b.cl.noise} lText={clValue('noise', a.cl.noise)} rText={clValue('noise', b.cl.noise)}/>
      <ClRow dense={dense} k="vent"  lLevel={a.cl.vent}  rLevel={b.cl.vent}  lText={clValue('vent', a.cl.vent)}   rText={clValue('vent', b.cl.vent)}/>
    </>
  );
}

// 시설 O/X 한 줄
function FacRow({ label, la, rb }) {
  const cell = (on) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0' }}>
      {on
        ? <><Icon name="check" size={13} color={PH.green} stroke={2.6}/><span style={{ font: '700 12.5px Pretendard', color: PH.ink }}>있음</span></>
        : <><Icon name="close" size={12} color={PH.muted} stroke={2.4}/><span style={{ font: '600 12.5px Pretendard', color: PH.muted }}>없음</span></>}
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 1fr', alignItems: 'center', padding: '1px 0' }}>
      {cell(la)}
      <div style={{ font: '600 11px Pretendard', color: PH.muted, textAlign: 'center' }}>{label}</div>
      {cell(rb)}
    </div>
  );
}

// 헤더(검색 영역 대체) — 타이틀 + 닫기
function CompareTopBar({ title = '집 비교', right }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, background: PH.white, borderBottom: `1px solid ${PH.borderSoft}` }}>
      <div style={{ padding: '52px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, height: 96 }}>
        <div style={{ width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 20 20" style={{ width: 18, height: 18 }}><path d="M12 5l-5 5 5 5" fill="none" stroke={PH.ink70} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ flex: 1, font: '700 17px Pretendard', color: PH.ink, letterSpacing: '-0.4px' }}>{title}</div>
        {right}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// A — 풀 비교표 (스크롤)
// ─────────────────────────────────────────────────────────────
function CompareFull({ aId = 1, bId = 3 }) {
  const a = HOUSES.find(h => h.id === aId), b = HOUSES.find(h => h.id === bId);
  const hi = (x, y) => x === y ? null : (x > y ? 'l' : 'r'); // 어느 쪽이 더 큰 값인가

  return (
    <Screen>
      <CompareTopBar right={
        <div style={{ height: 32, padding: '0 11px', borderRadius: 16, background: PH.surface, border: `1px solid ${PH.border}`, display: 'flex', alignItems: 'center', gap: 4, font: '600 12px Pretendard', color: PH.ink70 }}>
          <Icon name="grid" size={13} color={PH.ink70} stroke={2}/> 요약
        </div>
      }/>
      {/* sticky header */}
      <div style={{ position: 'absolute', top: 96, left: 0, right: 0, zIndex: 20, background: PH.white, borderBottom: `1px solid ${PH.borderSoft}` }}>
        <CompareHeader a={a} b={b}/>
      </div>
      {/* scroll body */}
      <div style={{ position: 'absolute', top: 318, bottom: 0, left: 0, right: 0, overflowY: 'auto', padding: '4px 16px 30px' }}>
        <SectionLabel icon="home">가격</SectionLabel>
        <Row label={{ t: '거래' }} left={a.type === 'jeonse' ? '전세' : '월세'} right={b.type === 'jeonse' ? '전세' : '월세'} hi={null}/>
        <Row label={{ t: '보증금' }} left={formatDeposit(a.deposit)} right={formatDeposit(b.deposit)} hi={null}/>
        {a.type === 'rent' && <Row label={{ t: '월세' }} left={`${a.rent}만`} right={b.type==='rent'?`${b.rent}만`:'—'} hi={b.type==='rent'?hi(a.rent,b.rent):null}/>}
        <Row label={{ t: '관리비' }} left={`${a.mgmt}만`} right={`${b.mgmt}만`} hi={hi(a.mgmt, b.mgmt)}/>

        <SectionLabel icon="grid">공간</SectionLabel>
        <Row label={{ t: '평수' }} left={`${a.pyeong}평`} right={`${b.pyeong}평`} hi={hi(a.pyeong, b.pyeong)}/>
        <Row label={{ t: '방' }} left={a.rooms} right={b.rooms} hi={null}/>
        <Row label={{ t: '층' }} left={a.floor} right={b.floor} hi={null}/>

        <SectionLabel icon="sun">컨디션</SectionLabel>
        {condRows(a, b, false)}

        <SectionLabel icon="layers">시설</SectionLabel>
        <FacRow label="엘베" la={a.elevator} rb={b.elevator}/>
        <FacRow label="주차" la={a.parking} rb={b.parking}/>
        <FacRow label="풀옵션" la={a.full} rb={b.full}/>

        <SectionLabel icon="route">통근</SectionLabel>
        <Row label={{ t: '직장' }} left={`${a.commute}분`} right={`${b.commute}분`} hi={hi(a.commute, b.commute)}/>
        <Row label={{ t: '학교' }} left={`${a.commuteSchool}분`} right={`${b.commuteSchool}분`} hi={hi(a.commuteSchool, b.commuteSchool)}/>
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// B — 한눈에 요약 (무스크롤)
// ─────────────────────────────────────────────────────────────
function CompareSummary({ aId = 1, bId = 3, diffOnly = false }) {
  const a = HOUSES.find(h => h.id === aId), b = HOUSES.find(h => h.id === bId);
  const hi = (x, y) => x === y ? null : (x > y ? 'l' : 'r');

  return (
    <Screen>
      <CompareTopBar right={
        <div style={{ height: 32, padding: '0 11px', borderRadius: 16, background: PH.ink, display: 'flex', alignItems: 'center', gap: 4, font: '600 12px Pretendard', color: '#fff' }}>
          <Icon name="list" size={13} color="#fff" stroke={2}/> 전체
        </div>
      }/>
      <div style={{ position: 'absolute', top: 96, bottom: 0, left: 0, right: 0, overflow: 'hidden', padding: '6px 16px 0' }}>
        <CompareHeader a={a} b={b}/>

        {/* 가격·공간·통근 — 막대 + 큰 숫자 (집 색) */}
        <div style={{ background: PH.white, borderRadius: 16, border: `1px solid ${PH.borderSoft}`, padding: '6px 14px' }}>
          <MetricBar label="관리비" la={a.mgmt} rb={b.mgmt} unit="만"/>
          <div style={{ height: 1, background: PH.borderSoft }}/>
          <MetricBar label="평수" la={a.pyeong} rb={b.pyeong} unit="평"/>
          <div style={{ height: 1, background: PH.borderSoft }}/>
          <MetricBar label="직장" la={a.commute} rb={b.commute} unit="분"/>
          <div style={{ height: 1, background: PH.borderSoft }}/>
          <MetricBar label="학교" la={a.commuteSchool} rb={b.commuteSchool} unit="분"/>
        </div>

        {/* 컨디션 — 항목별 실제 값 + 색 */}
        <div style={{ background: PH.white, borderRadius: 16, border: `1px solid ${PH.borderSoft}`, padding: '10px 12px', marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ font: '700 12px Pretendard', color: PH.ink70 }}>컨디션</span>
            <span style={{ font: '500 10px Pretendard', color: PH.muted }}>초록 좋음 · 노랑 보통 · 빨강 주의</span>
          </div>
          {condRows(a, b, true)}
        </div>

        {/* 시설 — 비교 행 (있음 집 색 / 없음 흐리게) */}
        <div style={{ background: PH.white, borderRadius: 16, border: `1px solid ${PH.borderSoft}`, padding: '8px 12px', marginTop: 10 }}>
          <FacCmp label="엘베" la={a.elevator} rb={b.elevator}/>
          <FacCmp label="주차" la={a.parking} rb={b.parking}/>
          <FacCmp label="풀옵션" la={a.full} rb={b.full}/>
        </div>
      </div>
    </Screen>
  );
}

// ─────────────────────────────────────────────────────────────
// 진입 — 비교할 2개 고르기
// ─────────────────────────────────────────────────────────────
function ComparePicker({ selected = [1, 3] }) {
  return (
    <Screen>
      <CompareTopBar title="비교할 집 고르기"/>
      <div style={{ position: 'absolute', top: 96, bottom: 96, left: 0, right: 0, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {/* selected slots */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[0, 1].map(i => {
            const h = selected[i] ? HOUSES.find(x => x.id === selected[i]) : null;
            if (!h) return (
              <div key={i} style={{ height: 96, borderRadius: 14, border: `1.5px dashed ${PH.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, color: PH.muted }}>
                <Icon name="plus" size={20} color={PH.muted} stroke={2}/>
                <span style={{ font: '600 12px Pretendard' }}>{i + 1}번째 집</span>
              </div>
            );
            return (
              <div key={i} style={{ height: 96, borderRadius: 14, background: PH.white, border: `1.5px solid ${PH.ink}`, padding: 10, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 7, right: 7, width: 20, height: 20, borderRadius: 10, background: PH.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="close" size={12} color="#fff" stroke={2.4}/>
                </div>
                <span style={{ padding: '1px 6px', borderRadius: 4, alignSelf: 'flex-start', background: h.type === 'jeonse' ? PH.primarySoft : '#FCEFE7', color: h.type === 'jeonse' ? PH.primary : PH.coral, font: '700 9.5px Pretendard' }}>{h.type === 'jeonse' ? '전세' : '월세'}</span>
                <div>
                  <div style={{ font: '700 13.5px Pretendard', color: PH.ink, letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.name}</div>
                  <div style={{ font: '700 14px Pretendard', color: PH.ink, marginTop: 1 }}>{priceLong(h).value}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ font: '700 13px Pretendard', color: PH.ink70, marginBottom: 10 }}>내가 기록한 집 <span style={{ color: PH.primary }}>7</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {HOUSES.map(h => {
            const on = selected.includes(h.id);
            const photoBg = `linear-gradient(135deg, hsl(${h.photoHue},22%,76%), hsl(${(h.photoHue+30)%360},22%,58%))`;
            return (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 10, borderRadius: 13, background: PH.white, border: `1.5px solid ${on ? PH.ink : PH.borderSoft}` }}>
                <div style={{ width: 50, height: 50, borderRadius: 10, background: photoBg, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ padding: '1px 5px', borderRadius: 4, background: h.type === 'jeonse' ? PH.primarySoft : '#FCEFE7', color: h.type === 'jeonse' ? PH.primary : PH.coral, font: '700 9px Pretendard' }}>{h.type === 'jeonse' ? '전세' : '월세'}</span>
                    <span style={{ font: '700 14px Pretendard', color: PH.ink, letterSpacing: '-0.3px' }}>{h.name}</span>
                  </div>
                  <div style={{ font: '500 11px Pretendard', color: PH.muted, marginTop: 2 }}>{priceShort(h)} · {h.pyeong}평 · {h.rooms}</div>
                </div>
                <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, background: on ? PH.ink : 'transparent', border: `1.5px solid ${on ? PH.ink : PH.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Icon name="check" size={14} color="#fff" stroke={2.6}/>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: PH.white, padding: '12px 16px 30px', borderTop: `1px solid ${PH.borderSoft}` }}>
        <div style={{ height: 52, borderRadius: 14, background: PH.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, font: '700 15px Pretendard' }}>
          <Icon name="grid" size={16} color="#fff" stroke={2.2}/> 2개 비교하기
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { CompareFull, CompareSummary, ComparePicker });
