import React, { useState, useEffect, useMemo } from 'react';
import buildsData from './builds.json';

const SLOT_MAP = { flower: 'Flower', feather: 'Feather', sands: 'Sands', goblet: 'Goblet', circlet: 'Circlet' };
const SLOT_EMOJI = { flower: "🌸", feather: "🍃", sands: "⏳", goblet: "🍷", circlet: "👑" };

const MAX_ROLLS = {
  hp: 298.75, hp_: 5.83, atk: 19.45, atk_: 5.83, def: 23.15, def_: 7.29,
  eleMas: 23.31, enerRech_: 6.48, critRate_: 3.89, critDMG_: 7.77,
  physical_dmg_: 7.77, healingBonus_: 5.83
};

const AVG_ROLLS = {
  hp: 238.75, hp_: 4.66, atk: 15.55, atk_: 4.66, def: 18.5, def_: 5.83,
  eleMas: 18.65, enerRech_: 5.18, critRate_: 3.3, critDMG_: 6.6,
  physical_dmg_: 6.6, healingBonus_: 4.66
};

const { parse: deserialize } = JSON;

function btnCls(isActive) {
  const base = "flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all text-sm "
  if (isActive) return base + "bg-purple-600 text-white shadow-lg scale-105"
  return base + 'bg-[#121214] text-gray-400 hover:bg-white/10'
}

function getStatName(s) {
  if (!s) return ''
  const dict = {
    atk_: 'ATK%', atk: 'Flat ATK', hp_: 'HP%', hp: 'Flat HP', def_: 'DEF%', def: 'Flat DEF',
    eleMas: 'Elemental Mastery', enerRech_: 'Energy Recharge', critRate_: 'Crit Rate', critDMG_: 'Crit DMG',
    healingBonus_: 'Healing Bonus', physical_dmg_: 'Physical DMG', pyro_dmg_: 'Pyro DMG', hydro_dmg_: 'Hydro DMG',
    cryo_dmg_: 'Cryo DMG', electro_dmg_: 'Electro DMG', anemo_dmg_: 'Anemo DMG', geo_dmg_: 'Geo DMG', dendro_dmg_: 'Dendro DMG'
  };
  return dict[s] || s.split('_').join(' ').replace(/\b\w/g, (c) => c.toUpperCase())
}


function sanitize(val) {
  if (!val) return '';
  return String(val).replace(/[^a-z0-9]/gi, '').toLowerCase()
}


function getImgName(str) {
  if(!str) return '';
  return str.replace(/[^a-zA-Z0-9]/g, '')
}

function getScoreHex(score) {
  if(score >= 80) return 'text-green-400'
  if(score >= 50) return 'text-yellow-400'
  return "text-red-400"
}

const WindowControls = () => {
  const min = async () => {
    if (window.__TAURI_INTERNALS__) {
      const w = await import('@tauri-apps/api/window')
      w.getCurrentWindow().minimize()
    }
  };
  const max = async () => {
    if (window.__TAURI_INTERNALS__) {
      const w = await import("@tauri-apps/api/window")
      w.getCurrentWindow().toggleMaximize()
    }
  }
  const close = async () => {
    if (window.__TAURI_INTERNALS__) {
      const w = await import('@tauri-apps/api/window');
      w.getCurrentWindow().close()
    }
  };

  return (
    <div className="flex gap-2 z-10">
      <button onClick={min} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-500 hover:text-white transition-colors">−</button>
      <button onClick={max} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-500 hover:text-white transition-colors">□</button>
      <button onClick={close} className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white text-gray-500 transition-colors">✕</button>
    </div>
  );
};

function CharIcon({ id, classes }) {
  const [broken, setBroken] = useState(false)
  if (broken) return <div className={`flex items-center justify-center bg-gray-800 text-white font-black ${classes}`}>{id.charAt(0)}</div>
  return <img src={`/chars/${getImgName(id)}.png`} alt={id} className={`${classes} object-cover bg-black/50`} onError={() => setBroken(true)} />
}

function LeftNav({ currentView, switchView, unloadData }) {
  return (
    <div className="w-64 bg-[#121214] border-r border-white/5 flex flex-col p-4 z-20 shrink-0">
      <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 px-4 mb-8 mt-2">Menu</h1>
      <nav className="space-y-2 flex-1">
        <button onClick={() => switchView('home')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'home' ? 'bg-purple-600 text-white font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
          <span className="text-xl">🏠</span> Dashboard
        </button>
        <button onClick={() => switchView('planner')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'planner' ? 'bg-purple-600 text-white font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
          <span className="text-xl">⚔️</span> Artifact Planner
        </button>
        <button onClick={() => switchView('builds')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'builds' ? 'bg-purple-600 text-white font-bold' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
          <span className="text-xl">📖</span> Character Builds
        </button>
      </nav>
      <button onClick={unloadData} className="w-full mt-auto py-3 rounded-xl border border-white/10 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all font-bold text-sm">Unload File</button>
    </div>
  );
}

function HomeTab({ inv }) {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-black mb-2">Welcome Back!</h2>
        <p className="text-gray-400">Here is a summary of your Genshin Impact account.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-lg">
          <p className="text-gray-400 font-bold mb-1">Characters Owned</p>
          <p className="text-5xl font-black text-white">{inv.characters?.length || 0}</p>
        </div>
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-lg">
          <p className="text-gray-400 font-bold mb-1">Artifacts Owned</p>
          <p className="text-5xl font-black text-white">{inv.artifacts?.length || 0}</p>
        </div>
        <div className="bg-[#121214] border border-white/10 p-6 rounded-2xl shadow-lg">
          <p className="text-gray-400 font-bold mb-1">Weapons Owned</p>
          <p className="text-5xl font-black text-white">{inv.weapons?.length || 0}</p>
        </div>
      </div>
    </div>
  )
}

function ArtifactRow({ art, i, activeB, activeC }) {
  const isEq = art.location === activeC;
  const goodMain = art.mainStatKey === activeB.sands?.[0] || art.mainStatKey === activeB.goblet?.[0] || art.mainStatKey === activeB.circlet?.[0];
  
  return (
    <tr className={`border-b border-white/5 transition-colors group ${isEq ? 'bg-green-900/10' : 'hover:bg-white/5'}`}>
      <td className="p-3 text-gray-500 font-black text-center text-md group-hover:text-purple-400">#{i + 1}</td>
      <td className="p-3">
        <span className={`px-2 py-1 rounded-md text-xs font-black uppercase ${goodMain ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{getStatName(art.mainStatKey)}</span>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-gray-500">+{art.level} • {art.rarity}★</p>
          {art.location && <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 uppercase">{isEq ? 'Equipped' : `On ${art.location}`}</span>}
        </div>
      </td>
      <td className="p-3">
        <div className="flex flex-wrap gap-1.5">
          {art.substats.map((s, j) => (
            <span key={j} className={`text-[11px] px-1.5 py-0.5 rounded font-bold ${activeB.subs?.includes(s.key) ? 'bg-purple-500/20 text-purple-300' : 'bg-black/50 text-gray-500'}`}>
              {getStatName(s.key)}: {s.value.toFixed(1)}{s.key.endsWith('_') ? '%' : ''}
            </span>
          ))}
        </div>
      </td>
      <td className="p-3 text-right"><span className={`text-xl font-black ${getScoreHex(art.score)}`}>{art.score}%</span></td>
    </tr>
  );
}

function ArtifactGroup({ name, items, activeB, activeC }) {
  return (
    <div className="bg-[#121214] border border-white/10 rounded-xl overflow-hidden shadow-xl">
      <div className="bg-black/40 px-5 py-3 border-b border-white/10 flex items-center gap-3">
        <img src={`/artifacts/${getImgName(name)}.png`} alt="" className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
        <h3 className="text-lg font-bold text-white capitalize">{name}</h3>
      </div>
      <table className="w-full text-left">
        <thead className="bg-black/20 border-b border-white/5 text-xs uppercase tracking-wider">
          <tr>
            <th className="p-3 font-bold text-gray-500 w-16 text-center">Rank</th>
            <th className="p-3 font-bold text-gray-500 w-64">Main Stat</th>
            <th className="p-3 font-bold text-gray-500">Substats</th>
            <th className="p-3 font-bold text-gray-500 text-right w-24">Score</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a, i) => <ArtifactRow key={a.id || i} art={a} i={i} activeB={activeB} activeC={activeC} />)}
        </tbody>
      </table>
    </div>
  )
}

function PlannerTab({ activeC, cDB, bIdx, setBIdx, sGrps, activeSlot, setActiveSlot, searchQ, setSearchQ, optimal, setOptimal, openModal, activeB }) {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-black mb-1">Artifact Planner</h2>
          <p className="text-gray-400">Find the best pieces for your characters.</p>
        </div>
        <button onClick={openModal} className="flex items-center gap-3 bg-black hover:bg-white/10 border border-white/20 p-2 pr-6 rounded-xl transition-all shadow-lg">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-purple-500/50"><CharIcon id={activeC} classes="w-full h-full" /></div>
          <div className="text-left">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Selected</p>
            <p className="text-md font-black text-white">{activeC}</p>
          </div>
        </button>
      </div>

      {cDB.builds.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6 bg-[#121214] p-2 rounded-xl border border-white/10 w-fit">
          {cDB.builds.map((b, i) => (
            <button key={i} onClick={() => setBIdx(i)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${bIdx === i ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{b.name}</button>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          {Object.keys(SLOT_MAP).map((k) => (
            <button key={k} onClick={() => setActiveSlot(k)} className={btnCls(activeSlot === k)}>
              <span className="text-lg">{SLOT_EMOJI[k]}</span> {SLOT_MAP[k]}
            </button>
          ))}
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <input type="text" placeholder="Search sets..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="bg-[#121214] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 w-full lg:w-64 transition-colors text-sm" />
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 font-medium bg-[#121214] px-4 py-2.5 rounded-lg border border-white/10">
            <input type="checkbox" checked={optimal} onChange={(e) => setOptimal(e.target.checked)} className="w-4 h-4 accent-purple-500" /> Optimal Only
          </label>
        </div>
      </div>

      {sGrps.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl bg-[#121214]">
          <p className="text-gray-400 text-lg">No artifacts found. Try unchecking "Optimal Only".</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sGrps.map(([n, items]) => <ArtifactGroup key={n} name={n} items={items} activeB={activeB} activeC={activeC} />)}
        </div>
      )}
    </div>
  )
}

function BuildSetBox({ setKey, slots, owned, activeB }) {
  const emptyClass = "bg-black/40 border border-white/5 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center min-h-[160px]";
  
  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <img src={`/artifacts/${getImgName(setKey)}.png`} alt="" className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
        <h4 className="text-lg font-bold text-white capitalize">{getStatName(setKey)}</h4>
        <span className="ml-auto text-xs font-bold text-gray-500 bg-black/40 px-2 py-1 rounded">{owned}/5 Owned</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {['flower', 'feather', 'sands', 'goblet', 'circlet'].map((s) => {
          const a = slots[s];
          if (!a) return <div key={s} className={emptyClass}><p className="text-xs text-gray-600 font-bold uppercase mb-2">{SLOT_MAP[s]}</p><p className="text-xs text-gray-500 italic">None</p></div>;
          return (
            <div key={s} className="bg-[#121214] border border-white/10 rounded-xl p-3 flex flex-col items-center text-center hover:bg-white/5 transition-colors cursor-default">
              <img src={`/artifacts/${getImgName(a.setKey)}.png`} alt="" className="w-12 h-12 object-contain mb-2" onError={(e) => e.target.style.display = 'none'} />
              <p className="text-xs text-gray-400 font-bold uppercase">{SLOT_MAP[s]}</p>
              <p className="text-xs font-black text-white mt-1 uppercase">{getStatName(a.mainStatKey)}</p>
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {a.substats.slice(0, 3).map((x, j) => <span key={j} className="text-[9px] px-1 bg-white/5 rounded text-gray-400">{getStatName(x.key)}</span>)}
              </div>
              <div className={`mt-3 text-lg font-black ${getScoreHex(a.score)}`}>{a.score}%</div>
            </div>
          );
        })}
      </div>
    </div>
  )
}

function BuildsTab({ activeC, cDB, bIdx, setBIdx, hasChar, openModal, eqWeap, bestSets, activeB }) {
  let constellations = <p className="text-sm text-gray-500 italic">No constellation data available.</p>;
  if (cDB.constellations?.length > 0) {
    constellations = cDB.constellations.map((c, i) => (
      <div key={i} className="bg-black/30 p-3 rounded-lg border border-white/5 flex gap-4">
        <span className="text-purple-400 font-black text-lg shrink-0">{c.name}</span>
        <p className="text-sm text-gray-400 leading-snug">{c.effect}</p>
      </div>
    ));
  }

  let recWeapons = <p className="text-sm text-gray-500 italic">No weapon data available.</p>;
  if (cDB.weapons?.length > 0) {
    recWeapons = cDB.weapons.map((w, i) => <span key={i} className="px-3 py-1.5 bg-[#1e1e24] border border-white/10 rounded-lg text-sm text-gray-300 font-medium">{w}</span>);
  }

  let recSets = <p className="text-sm text-gray-500 italic">No set data available.</p>;
  if (cDB.sets?.length > 0) {
    recSets = cDB.sets.map((s, i) => <span key={i} className="px-4 py-2 bg-[#1e1e24] border border-white/10 rounded-lg text-sm text-white font-bold">{s}</span>);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto relative min-h-full">
      <div className="flex items-center gap-6 mb-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
          <CharIcon id={activeC} classes="w-full h-full" />
        </div>
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-white">{activeC}</h2>
            {!hasChar && <span className="px-3 py-1 bg-red-500/20 text-red-500 border border-red-500/50 rounded-lg text-sm font-black uppercase tracking-widest shadow-lg">Not Owned</span>}
          </div>
          <p className="text-gray-400 mt-1 font-bold">Recommended Builds</p>
        </div>
        <button onClick={openModal} className="ml-auto bg-[#121214] hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl font-bold transition-all shadow-lg text-sm">Change Character</button>
      </div>

      {cDB.builds.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-8 bg-[#121214] p-2 rounded-xl border border-white/10 w-fit relative z-10">
          {cDB.builds.map((b, i) => (
            <button key={i} onClick={() => setBIdx(i)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${bIdx === i ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>{b.name}</button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">🗡️ Weapons</h3>
          <div className="space-y-4">
            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Currently Equipped</p>
              {eqWeap ? <p className="text-lg font-bold text-green-400">{eqWeap.key}</p> : <p className="text-sm text-gray-500 italic">No weapon equipped.</p>}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase mb-2">Recommended</p>
              <div className="flex flex-wrap gap-2">{recWeapons}</div>
            </div>
          </div>
        </div>

        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">✨ Best Constellations</h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto scroll-area pr-2">{constellations}</div>
        </div>

        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-2">
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">🛡️ Best Artifacts (Owned)</h3>
          <p className="text-sm text-gray-400 mb-6">Highest scoring pieces from your inventory for the <b>{activeB.name}</b> build. Showing preferred sets.</p>
          <div className="space-y-8">
            {bestSets.map(({ setKey, slots, owned }) => (
              <BuildSetBox key={setKey} setKey={setKey} slots={slots} owned={owned} activeB={activeB} />
            ))}
          </div>
        </div>

        <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 shadow-xl lg:col-span-2">
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">🧩 Recommended Sets</h3>
          <div className="flex flex-wrap gap-2">{recSets}</div>
        </div>
      </div>
    </div>
  )
}

function CharModal({ list, activeC, close, selectChar, search, setSearch }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 transition-opacity">
      <div className="bg-[#121214] border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-black/40">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Select Character</h2>
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 w-full max-w-md ml-auto" />
          <button onClick={close} className="text-gray-400 hover:text-white font-bold text-xl px-4 transition-colors">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 scroll-area">
          {list.map((c) => (
            <button key={c} onClick={() => selectChar(c)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 group ${activeC === c ? 'bg-purple-600/20 border border-purple-500/50' : 'hover:bg-white/10 border border-transparent'}`}>
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-transform group-hover:scale-110 ${activeC === c ? 'border-purple-400' : 'border-white/20'}`}>
                <CharIcon id={c} classes="w-full h-full" />
              </div>
              <span className="text-xs font-bold text-center text-gray-300 group-hover:text-white line-clamp-1">{c}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [inv, setInv] = useState(null);
  const [viewState, setViewState] = useState('home');
  const [activeC, setActiveC] = useState('Kazuha');
  const [activeSlot, setActiveSlot] = useState('flower');
  const [optimal, setOptimal] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [modal, setModal] = useState(false);
  const [charSearch, setCharSearch] = useState('');
  const [bIdx, setBIdx] = useState(0);

  useEffect(() => {
    const ctx = (e) => e.preventDefault();
    const key = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) e.preventDefault();
      if (e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I')) e.preventDefault();
    };
    document.addEventListener('contextmenu', ctx);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('contextmenu', ctx);
      document.removeEventListener('keydown', key);
    };
  }, []);

  const handleUpload = (e) => {
    const f = e.target.files[0]
    if (!f) return;

    f.text().then(txt => {
      try {
        const parsedData = deserialize(txt)
        setInv(parsedData)
        setViewState('home')
      } catch (err) {
        alert("Error reading file. Make sure it's a valid .GOOD file.")
      }
    })
  }

  const cDB = buildsData[activeC] || {
    sets: [], weapons: [], constellations: [],
    builds: [{ name: 'Default', sands: ['atk_'], goblet: ['atk_'], circlet: ['critRate_', 'critDMG_'], subs: ['critRate_', 'critDMG_', 'atk_'] }]
  };
  
  const activeB = cDB.builds[bIdx] || cDB.builds[0];

  const scoredArts = useMemo(() => {
    if (!inv?.artifacts) return [];
    const subs = activeB.subs || [];
    const topCnt = Math.min(subs.length, 4);
    var maxBase = 0;
    
    for (var i = 0; i < topCnt; i++) {
      maxBase += Math.max(0.1, 1.0 - (i * 0.01));
    }

    return inv.artifacts.map((a) => {
      var s = a.slotKey === 'plume' ? 'feather' : a.slotKey;
      let ideal = [];
      if (s === 'sands') ideal = activeB.sands || [];
      else if (s === 'goblet') ideal = activeB.goblet || [];
      else if (s === 'circlet') ideal = activeB.circlet || [];
      else if (s === 'flower') ideal = ['hp'];
      else if (s === 'feather') ideal = ['atk'];

      let mMult = 0.5;
      if (ideal.includes(a.mainStatKey)) {
        mMult = 1.0;
      } else if (s === 'circlet' && (a.mainStatKey === 'critRate_' || a.mainStatKey === 'critDMG_')) {
        if (ideal.includes('critRate_') || ideal.includes('critDMG_')) mMult = 1.0;
      }

      var baseSum = 0
      var totR = 0
      var upgSum = 0
      
      a.substats.forEach((sub) => {
        var pIdx = subs.indexOf(sub.key)
        var avg = AVG_ROLLS[sub.key] || 1
        var rls = Math.round(sub.value / avg)
        
        if (rls < 1) rls = 1
        totR += rls

        if (pIdx !== -1) {
          var pWeight = Math.max(0.1, 1.0 - (pIdx * 0.01))
          baseSum += pWeight
          var mx = MAX_ROLLS[sub.key] || 1
          upgSum += ((rls - 1) * (sub.value / (rls * mx)) * pWeight)
        }
      })

      baseSum = Math.min(baseSum, maxBase)
      var bScr = maxBase > 0 ? (baseSum / maxBase) * 4.0 : 4.0
      var is3 = totR < 9
      var uScr = (upgSum / (is3 ? 4 : 5)) * 5 * (is3 ? 0.95 : 1.0)
      var tScr = ((bScr + uScr) / 9) * 100 * mMult
      
      return { ...a, slotKey: s, score: Math.min(100, Math.max(0, Math.round(tScr))) };
    }).sort((a, b) => b.score - a.score);
  }, [inv, activeB]);

  const bestSets = useMemo(() => {
    var arr = cDB.sets?.length > 0 && cDB.sets[0] !== 'Unknown' ? cDB.sets : [...new Set(scoredArts.map(x => x.setKey))].slice(0, 5)
    return arr.map(pSet => {
      var slts = { flower: null, feather: null, sands: null, goblet: null, circlet: null }
      scoredArts.forEach(a => {
        if (sanitize(a.setKey) === sanitize(pSet) && !slts[a.slotKey]) slts[a.slotKey] = a;
      });
      return { setKey: pSet, slots: slts, owned: Object.values(slts).filter(Boolean).length };
    });
  }, [scoredArts, cDB.sets]);

  let hasChar = false
  if (inv?.characters) {
    hasChar = inv.characters.some((c) => {
      var iN = sanitize(c.key)
      var tN = sanitize(activeC)
      return iN === tN || iN.includes(tN) || tN.includes(iN)
    })
  }

  const eqWeap = inv?.weapons?.find((w) => w.location && sanitize(w.location) === sanitize(activeC));

  if (!inv) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center font-sans p-6 rounded-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-10 flex justify-end items-center px-4 bg-[#09090b] select-none">
          <div data-tauri-drag-region className="absolute inset-0 z-0"></div>
          <WindowControls />
        </div>
        <div className="max-w-xl w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-[0_0_30px_rgba(147,51,234,0.3)]">GenshinZMeows</h1>
            <p className="text-gray-400 text-lg">Upload your <span className="text-white font-bold">.GOOD</span> file to analyze your account.</p>
          </div>
          <label className="block w-full border-2 border-dashed border-white/20 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300 rounded-3xl p-12 cursor-pointer group">
            <div className="flex flex-col items-center gap-4">
              <span className="text-6xl group-hover:scale-110 transition-transform">📂</span>
              <span className="text-xl font-bold text-gray-300 group-hover:text-white">Upload .GOOD File</span>
            </div>
            <input type="file" accept=".json" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </div>
    );
  }

  var pArts = scoredArts.filter((a) => {
    if (a.slotKey !== activeSlot) return false
    var ideal = []
    if (activeSlot === 'sands') ideal = activeB.sands || []
    if (activeSlot === 'goblet') ideal = activeB.goblet || []
    if (activeSlot === 'circlet') ideal = activeB.circlet || []
    if (activeSlot === 'flower') ideal = ['hp']
    if (activeSlot === 'feather') ideal = ['atk']
    return a.setKey?.toLowerCase().includes(searchQ.toLowerCase()) && (!optimal || ideal.includes(a.mainStatKey))
  })

  var grps = pArts.reduce((acc, a) => {
    var n = getStatName(a.setKey)
    if (!acc[n]) acc[n] = []
    acc[n].push(a)
    return acc
  }, {})

  var sGrps = Object.entries(grps).sort(([a], [b]) => {
    var isA = cDB.sets?.some((s) => sanitize(s) === sanitize(a))
    var isB = cDB.sets?.some((s) => sanitize(s) === sanitize(b))
    if (isA && !isB) return -1
    if (!isA && isB) return 1
    return 0
  })

  var filteredList = Object.keys(buildsData).filter((c) => c.toLowerCase().includes(charSearch.toLowerCase())).sort()

  return (
    <div className="flex h-screen bg-[#09090b] text-white font-sans overflow-hidden flex-col">
      <div className="h-10 bg-[#09090b] flex justify-between items-center px-4 border-b border-white/5 select-none shrink-0 relative">
        <div data-tauri-drag-region className="absolute inset-0 z-0"></div>
        <div className="text-sm font-bold text-gray-500 tracking-wider relative z-10 pointer-events-none">GenshinZMeows</div>
        <WindowControls />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <LeftNav currentView={viewState} switchView={setViewState} unloadData={() => setInv(null)} />

        <div className="flex-1 overflow-y-auto scroll-area relative">
          {viewState === 'home' && <HomeTab inv={inv} />}
          
          {viewState === 'planner' && (
            <PlannerTab 
              activeC={activeC} 
              cDB={cDB} 
              bIdx={bIdx} 
              setBIdx={setBIdx} 
              sGrps={sGrps} 
              activeSlot={activeSlot} 
              setActiveSlot={setActiveSlot} 
              searchQ={searchQ} 
              setSearchQ={setSearchQ} 
              optimal={optimal} 
              setOptimal={setOptimal} 
              openModal={() => setModal(true)} 
              activeB={activeB} 
            />
          )}

          {viewState === 'builds' && (
            <BuildsTab 
              activeC={activeC} 
              cDB={cDB} 
              bIdx={bIdx} 
              setBIdx={setBIdx} 
              hasChar={hasChar} 
              openModal={() => setModal(true)} 
              eqWeap={eqWeap} 
              bestSets={bestSets} 
              activeB={activeB} 
            />
          )}
        </div>

        {modal && (
          <CharModal 
            list={filteredList} 
            activeC={activeC} 
            close={() => setModal(false)} 
            selectChar={(c) => { setActiveC(c); setBIdx(0); setModal(false); }} 
            search={charSearch} 
            setSearch={setCharSearch} 
          />
        )}
      </div>
    </div>
  )
}