// pickhouse — interactive app shell
// Tab state + modal stack. Tabs swap the main screen; modals overlay it
// with a slide-up sheet that pushes the underlying tab off-screen.

function PickhouseApp({ initial = {} }) {
  const [tab, setTab] = React.useState(initial.tab || 'records');
  const [modal, setModal] = React.useState(initial.modal || null);

  const nav = {
    tab, setTab,
    openDetail:  (id)        => setModal({ type: 'detail',  id }),
    openAdd:     ()          => setModal({ type: 'add' }),
    openCompare: (id, idB)   => setModal({ type: 'compare', a: id, b: idB }),
    close:       ()          => setModal(null),
  };

  let screen;
  if (tab === 'records') screen = <ScreenRecords nav={nav}/>;
  else if (tab === 'compare') screen = <ScreenCompare nav={{ ...nav, tab }} />;
  else if (tab === 'profile') screen = <ScreenProfile nav={nav}/>;

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: T.paper, overflow: 'hidden',
    }}>
      {/* Persistent main + tab bar */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {screen}
        {tab !== 'compare' && (
          // compare screen has its own bottom action bar; tab bar still shows below it
          null
        )}
        <TabBar active={tab} onChange={(t) => { setTab(t); setModal(null); }}/>
      </div>

      {/* Modal layer — slides up over everything */}
      {modal && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: T.surface,
          animation: 'pickhouse-slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        }}>
          {modal.type === 'detail'  && <ScreenDetail id={modal.id} nav={nav}/>}
          {modal.type === 'add'     && <ScreenAdd nav={nav}/>}
          {modal.type === 'compare' && <ScreenCompare nav={nav} preselect={{ a: modal.a, b: modal.b }}/>}
        </div>
      )}
    </div>
  );
}

// inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('pickhouse-anim')) {
  const s = document.createElement('style');
  s.id = 'pickhouse-anim';
  s.textContent = `
    @keyframes pickhouse-slide-up {
      from { transform: translateY(100%); opacity: 0.6; }
      to   { transform: translateY(0);    opacity: 1; }
    }
  `;
  document.head.appendChild(s);
}

window.PickhouseApp = PickhouseApp;
