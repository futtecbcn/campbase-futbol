 "use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, CalendarDays, ChartNoAxesCombined, ChevronDown, ClipboardList,
  Cloud, Dumbbell, Goal, LayoutDashboard, Menu, Plus, Search, ShieldCheck,
  Users, X, Clock3, CircleCheck, TrendingUp, Trophy, UserRound, Settings,
  LogIn, LogOut, RefreshCw, AlertCircle
} from "lucide-react";
import { isCloudConfigured, supabase } from "../lib/supabase";

type Player = { id: string; name: string; number: number; position: string; team: string; appearances: number; goals: number; assists: number; minutes: number; };
type Match = { id: string; opponent: string; date: string; competition: string; home: boolean; goalsFor: number | null; goalsAgainst: number | null; status: "Próximo" | "Finalizado"; team: string; };
type Training = { id: string; title: string; date: string; focus: string; duration: number; team: string; };
type Team = { id: string; name: string; category: string; format: string; season: string; };

const initialTeams: Team[] = [
  { id: "team-a", name: "Cadet A", category: "S11", format: "Futbol 7", season: "2026/27" },
  { id: "team-b", name: "Cadet B", category: "S10", format: "Futbol 7", season: "2026/27" }
];
const initialPlayers: Player[] = [
  { id: "p1", name: "Marc Soler", number: 1, position: "Portero", team: "team-a", appearances: 4, goals: 0, assists: 0, minutes: 240 },
  { id: "p2", name: "Jan Ferrer", number: 4, position: "Defensa", team: "team-a", appearances: 4, goals: 1, assists: 1, minutes: 218 },
  { id: "p3", name: "Pol Vidal", number: 8, position: "Centrocampista", team: "team-a", appearances: 4, goals: 2, assists: 3, minutes: 196 },
  { id: "p4", name: "Nil Costa", number: 9, position: "Delantero", team: "team-a", appearances: 3, goals: 4, assists: 1, minutes: 177 },
  { id: "p5", name: "Eric Roca", number: 7, position: "Extremo", team: "team-a", appearances: 4, goals: 2, assists: 2, minutes: 205 },
  { id: "p6", name: "Biel Martí", number: 5, position: "Defensa", team: "team-a", appearances: 3, goals: 0, assists: 0, minutes: 165 },
  { id: "p7", name: "Arnau Puig", number: 10, position: "Centrocampista", team: "team-a", appearances: 4, goals: 1, assists: 2, minutes: 201 },
  { id: "p8", name: "Adrià Gil", number: 11, position: "Delantero", team: "team-a", appearances: 2, goals: 1, assists: 0, minutes: 82 }
];
const initialMatches: Match[] = [
  { id: "m1", opponent: "CF Montclar", date: "2026-10-17T10:30", competition: "Lliga", home: true, goalsFor: null, goalsAgainst: null, status: "Próximo", team: "team-a" },
  { id: "m2", opponent: "UE Vallseca", date: "2026-10-10T12:00", competition: "Lliga", home: false, goalsFor: 3, goalsAgainst: 1, status: "Finalizado", team: "team-a" },
  { id: "m3", opponent: "Atlètic Nord", date: "2026-10-03T09:30", competition: "Amistoso", home: true, goalsFor: 2, goalsAgainst: 2, status: "Finalizado", team: "team-a" }
];
const initialTrainings: Training[] = [
  { id: "t1", title: "Transición tras pérdida", date: "2026-10-15T18:00", focus: "Transición defensiva", duration: 75, team: "team-a" },
  { id: "t2", title: "Progresión y tercer hombre", date: "2026-10-16T18:00", focus: "Ataque organizado", duration: 70, team: "team-a" }
];

type Tab = "Inicio" | "Equipos" | "Jugadores" | "Partidos" | "Entrenamientos" | "Estadísticas";

function loadState<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}
function fmtDate(value: string) {
  return new Date(value).toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" });
}
function fmtTime(value: string) {
  return new Date(value).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("Inicio");
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const [trainings, setTrainings] = useState<Training[]>(initialTrainings);
  const [selectedTeam, setSelectedTeam] = useState("team-a");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"player" | "match" | "training" | "team" | null>(null);
  const [notice, setNotice] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [cloudState, setCloudState] = useState(isCloudConfigured ? "cloud" : "demo");

useEffect(() => {
  let cancelled = false;

  async function initialize() {
    if (supabase) {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!cancelled) {
        setUserEmail(sessionData.session?.user.email ?? null);
      }

      if (sessionData.session) {
        const { data: cloudTeams, error } = await supabase
          .from("teams")
          .select("id, name, category, format, season");
        console.log("Equipos recibidos de Supabase:", cloudTeams);
        if (error) {
          console.error("Error cargando equipos:", error.message);
        } else if (!cancelled && cloudTeams && cloudTeams.length > 0) {
          setTeams(
            cloudTeams.map((t) => ({
              id: String(t.id),
              name: t.name ?? "",
              category: t.category ?? "",
              format: t.format ?? "",
              season: t.season ?? "",
            }))
          );
          return;
        }
      }
    }

    if (!cancelled) {
      setTeams(loadState("campbase-teams", initialTeams));
      setPlayers(loadState("campbase-players", initialPlayers));
      setMatches(loadState("campbase-matches", initialMatches));
      setTrainings(loadState("campbase-trainings", initialTrainings));
    }
  }

  void initialize();

  return () => {
    cancelled = true;
  };
}, []);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("campbase-teams", JSON.stringify(teams)); }, [teams]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("campbase-players", JSON.stringify(players)); }, [players]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("campbase-matches", JSON.stringify(matches)); }, [matches]);
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("campbase-trainings", JSON.stringify(trainings)); }, [trainings]);

  const team = teams.find(t => t.id === selectedTeam) ?? teams[0];
  const teamPlayers = useMemo(() => players.filter(p => p.team === selectedTeam), [players, selectedTeam]);
  const teamMatches = useMemo(() => matches.filter(m => m.team === selectedTeam), [matches, selectedTeam]);
  const teamTrainings = useMemo(() => trainings.filter(t => t.team === selectedTeam), [trainings, selectedTeam]);
  const filteredPlayers = teamPlayers.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.position.toLowerCase().includes(query.toLowerCase()));
  const upcoming = teamMatches.filter(m => m.status === "Próximo").sort((a,b) => a.date.localeCompare(b.date))[0];
  const played = teamMatches.filter(m => m.status === "Finalizado");
  const wins = played.filter(m => m.goalsFor! > m.goalsAgainst!).length;
  const goals = played.reduce((sum,m) => sum + (m.goalsFor ?? 0), 0);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) { setNotice("Configura Supabase en .env.local para activar cuentas online."); return; }
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setNotice(error.message);
    else { setUserEmail(authEmail); setAuthOpen(false); setNotice("Sesión iniciada. La conexión de cuenta está activa."); }
  }
  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setUserEmail(null); setNotice("Sesión cerrada.");
  }
  function addPlayer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget);
    const p: Player = { id: crypto.randomUUID(), name: String(fd.get("name")), number: Number(fd.get("number") || 0), position: String(fd.get("position")), team: selectedTeam, appearances: 0, goals: 0, assists: 0, minutes: 0 };
    setPlayers(old => [...old,p]); setModal(null); setNotice("Jugador añadido.");
  }
  function addMatch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget);
    const status = String(fd.get("status")) as Match["status"];
    const m: Match = { id: crypto.randomUUID(), opponent: String(fd.get("opponent")), date: String(fd.get("date")), competition: String(fd.get("competition") || "Lliga"), home: String(fd.get("venue")) === "home", goalsFor: status === "Finalizado" ? Number(fd.get("goalsFor") || 0) : null, goalsAgainst: status === "Finalizado" ? Number(fd.get("goalsAgainst") || 0) : null, status, team: selectedTeam };
    setMatches(old => [m,...old]); setModal(null); setNotice("Partido añadido.");
  }
  function addTraining(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd = new FormData(e.currentTarget);
    const t: Training = { id: crypto.randomUUID(), title: String(fd.get("title")), date: String(fd.get("date")), focus: String(fd.get("focus")), duration: Number(fd.get("duration") || 75), team: selectedTeam };
    setTrainings(old => [t,...old]); setModal(null); setNotice("Entrenamiento añadido.");
  }
  function exportCsv() {
    const rows = [["Jugador","Dorsal","Posición","Partidos","Minutos","Goles","Asistencias"], ...teamPlayers.map(p => [p.name,p.number,p.position,p.appearances,p.minutes,p.goals,p.assists])];
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff"+csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = "campbase-estadisticas.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const nav: { label: Tab; icon: React.ReactNode }[] = [
    { label: "Inicio", icon: <LayoutDashboard size={18}/> }, { label: "Equipos", icon: <ShieldCheck size={18}/> },
    { label: "Jugadores", icon: <Users size={18}/> }, { label: "Partidos", icon: <Trophy size={18}/> },
    { label: "Entrenamientos", icon: <Dumbbell size={18}/> }, { label: "Estadísticas", icon: <ChartNoAxesCombined size={18}/> }
  ];

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Goal size={23}/></div><div><strong>camp<span>base</span></strong><small>FOOTBALL OS</small></div></div>
      <div className="club-label">ESPACIO DE TRABAJO</div>
      <button className="team-select" onClick={() => setTab("Equipos")}><div className="team-badge">{team?.name?.slice(-1) || "A"}</div><div className="team-info"><strong>{team?.name ?? "Mi equipo"}</strong><small>{team?.category ?? "Categoría"} · {team?.season ?? ""}</small></div><ChevronDown size={15}/></button>
      <div className="nav-label">MENÚ PRINCIPAL</div>
      <nav>{nav.map(item => <button key={item.label} onClick={() => {setTab(item.label);setQuery("");}} className={`nav-item ${tab===item.label?"active":""}`}>{item.icon}<span>{item.label}</span>{item.label==="Partidos" && <span className="nav-count">{teamMatches.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="season-card"><div className="season-icon"><CalendarDays size={17}/></div><div><small>TEMPORADA ACTIVA</small><strong>{team?.season ?? "2026/27"}</strong></div></div><button className="nav-item" onClick={() => setAuthOpen(true)}><Settings size={18}/><span>Cuenta y ajustes</span></button><div className="profile"><div className="avatar">ET</div><div className="profile-info"><strong>Entrenador</strong><small>{userEmail ?? "Espacio personal"}</small></div><button className="icon-button" title={userEmail ? "Cerrar sesión" : "Iniciar sesión"} onClick={() => userEmail ? signOut() : setAuthOpen(true)}>{userEmail ? <LogOut size={16}/> : <LogIn size={16}/>}</button></div></div>
    </aside>

    <section className="main-area">
      <header className="topbar"><div className="mobile-brand"><div className="brand-mark"><Goal size={20}/></div><strong>camp<span>base</span></strong></div><div className="breadcrumb">Gestión deportiva <span>/</span> <strong>{tab}</strong></div><div className="top-actions"><div className={`sync-pill ${cloudState==="cloud"?"cloud":"demo"}`}><span className="sync-dot"/>{cloudState==="cloud"?"Nube configurada":"Modo demo local"}</div><button className="top-avatar" onClick={() => setAuthOpen(true)}>ET</button></div></header>
      <div className="page-content">
        {notice && <div className="notice"><AlertCircle size={16}/><span>{notice}</span><button onClick={() => setNotice("")}><X size={15}/></button></div>}
        {tab==="Inicio" && <>
          <div className="page-heading"><div><div className="eyebrow">TEMPORADA {team?.season}</div><h1>Panel de control<span>.</span></h1><p>Todo lo que necesitas para preparar el próximo partido.</p></div><button className="button primary" onClick={() => setModal("match")}><Plus size={17}/> Añadir partido</button></div>
          <div className="welcome-banner"><div className="banner-copy"><div className="live-label"><span/> TU EQUIPO, DE UN VISTAZO</div><h2>El detalle marca<br/>la diferencia.</h2><p>Planifica. Compite. Analiza. Mejora.</p><button className="banner-button" onClick={() => setTab("Entrenamientos")}>Preparar entrenamiento <span>↗</span></button></div><div className="pitch-art"><div className="pitch-lines"><div className="center-circle"/><div className="penalty left"/><div className="penalty right"/><div className="half-line"/></div><div className="player-dot d1">1</div><div className="player-dot d2">4</div><div className="player-dot d3">8</div><div className="player-dot d4">9</div><div className="player-dot d5">7</div><div className="player-dot d6">10</div></div><div className="banner-watermark">CB</div></div>
          <div className="stats-grid"><Stat icon={<Users size={18}/>} label="Jugadores" value={String(teamPlayers.length).padStart(2,"0")} note="En la plantilla" tone="green"/><Stat icon={<CalendarDays size={18}/>} label="Partidos jugados" value={String(played.length).padStart(2,"0")} note="Esta temporada" tone="blue"/><Stat icon={<Goal size={18}/>} label="Goles a favor" value={String(goals).padStart(2,"0")} note="En partidos registrados" tone="orange"/><Stat icon={<TrendingUp size={18}/>} label="Victorias" value={String(wins).padStart(2,"0")} note={played.length ? `${Math.round(wins/played.length*100)}% de los jugados` : "Sin partidos finalizados"} tone="purple"/></div>
          <div className="content-grid"><section className="panel next-match"><PanelTitle title="Próximo partido" action="Ver calendario" onAction={() => setTab("Partidos")}/>{upcoming ? <><div className="match-meta"><span className="status-tag upcoming">PRÓXIMO</span><span>{fmtDate(upcoming.date)} · {fmtTime(upcoming.date)}</span></div><div className="matchup"><div className="club-crest ours"><Goal size={25}/></div><div className="club-name"><strong>{team?.name}</strong><small>{upcoming.home?"LOCAL":"VISITANTE"}</small></div><div className="versus">VS</div><div className="club-crest rival"><ShieldCheck size={24}/></div><div className="club-name right"><strong>{upcoming.opponent}</strong><small>RIVAL</small></div></div><div className="match-footer"><span><Trophy size={15}/> {upcoming.competition}</span><button className="text-button" onClick={() => setTab("Partidos")}>Preparar partido <span>→</span></button></div></> : <Empty text="No hay próximos partidos" button="Añadir partido" onClick={() => setModal("match")}/>}</section>
          <section className="panel"><PanelTitle title="Próximos entrenamientos" action="Ver todos" onAction={() => setTab("Entrenamientos")}/>{teamTrainings.length ? <div className="training-list">{teamTrainings.slice(0,3).map(t=><div className="training-row" key={t.id}><div className="date-block"><strong>{new Date(t.date).getDate()}</strong><small>{new Date(t.date).toLocaleDateString("es-ES",{month:"short"}).toUpperCase()}</small></div><div className="training-info"><strong>{t.title}</strong><small>{t.focus}</small><span><Clock3 size={13}/> {fmtTime(t.date)} · {t.duration} min</span></div><span className="training-arrow">↗</span></div>)}</div>:<Empty text="No hay entrenamientos" button="Crear sesión" onClick={() => setModal("training")}/>}<button className="button secondary full-button" onClick={() => setModal("training")}><Plus size={16}/> Crear entrenamiento</button></section></div>
          <section className="panel roster-preview"><PanelTitle title="Plantilla del equipo" action="Ver plantilla" onAction={() => setTab("Jugadores")}/><div className="table-wrap"><table><thead><tr><th>JUGADOR</th><th>POSICIÓN</th><th>PARTIDOS</th><th>MINUTOS</th><th>GOLES</th><th>ASIST.</th></tr></thead><tbody>{teamPlayers.slice(0,5).map(p=><tr key={p.id}><td><div className="player-cell"><span className="player-number">{String(p.number).padStart(2,"0")}</span><strong>{p.name}</strong></div></td><td><span className="position-pill">{p.position}</span></td><td>{p.appearances}</td><td>{p.minutes}'</td><td>{p.goals}</td><td>{p.assists}</td></tr>)}</tbody></table></div></section>
        </>}
        {tab==="Equipos" && <><div className="page-heading"><div><div className="eyebrow">ORGANIZACIÓN</div><h1>Mis equipos<span>.</span></h1><p>Gestiona plantillas y temporadas desde un mismo espacio.</p></div><button className="button primary" onClick={() => setModal("team")}><Plus size={17}/> Nuevo equipo</button></div><div className="team-grid">{teams.map(t=><button className={`team-card ${selectedTeam===t.id?"selected":""}`} key={t.id} onClick={() => {setSelectedTeam(t.id);setTab("Inicio");}}><div className="team-card-top"><div className="team-badge big">{t.name.slice(-1)}</div><span className="status-tag active-tag">ACTIVO</span></div><h3>{t.name}</h3><p>{t.category} · {t.format}</p><div className="team-card-foot"><span>{players.filter(p=>p.team===t.id).length} jugadores</span><span>{t.season}</span></div></button>)}</div></>}
        {tab==="Jugadores" && <><div className="page-heading"><div><div className="eyebrow">PLANTILLA · {team?.name}</div><h1>Jugadores<span>.</span></h1><p>Seguimiento individual y estadísticas de temporada.</p></div><button className="button primary" onClick={() => setModal("player")}><Plus size={17}/> Añadir jugador</button></div><div className="toolbar"><div className="search-box"><Search size={17}/><input placeholder="Buscar jugador o posición..." value={query} onChange={e=>setQuery(e.target.value)}/></div><span className="result-count">{filteredPlayers.length} jugadores</span><button className="button secondary" onClick={exportCsv}>Exportar CSV</button></div><section className="panel"><div className="table-wrap"><table><thead><tr><th>JUGADOR</th><th>POSICIÓN</th><th>PARTIDOS</th><th>MINUTOS</th><th>GOLES</th><th>ASISTENCIAS</th><th></th></tr></thead><tbody>{filteredPlayers.map(p=><tr key={p.id}><td><div className="player-cell"><span className="player-number">{String(p.number).padStart(2,"0")}</span><strong>{p.name}</strong></div></td><td><span className="position-pill">{p.position}</span></td><td>{p.appearances}</td><td>{p.minutes}'</td><td><strong>{p.goals}</strong></td><td>{p.assists}</td><td><button className="small-action" onClick={()=>setNotice(`${p.name}: ${p.appearances} partidos, ${p.minutes} minutos, ${p.goals} goles y ${p.assists} asistencias.`)}>Ver ficha</button></td></tr>)}</tbody></table>{filteredPlayers.length===0&&<div className="empty-state">No se han encontrado jugadores.</div>}</div></section></>}
        {tab==="Partidos" && <><div className="page-heading"><div><div className="eyebrow">COMPETICIÓN · {team?.name}</div><h1>Partidos<span>.</span></h1><p>Calendario, resultados y preparación de encuentros.</p></div><button className="button primary" onClick={() => setModal("match")}><Plus size={17}/> Nuevo partido</button></div><div className="match-list">{teamMatches.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(m=><div className="match-card" key={m.id}><div className="match-date"><strong>{new Date(m.date).getDate()}</strong><span>{new Date(m.date).toLocaleDateString("es-ES",{month:"short"}).toUpperCase()}</span></div><div className="match-card-main"><div className="match-card-title"><strong>{team?.name} <span className="muted">vs</span> {m.opponent}</strong><span className={`status-tag ${m.status==="Finalizado"?"done":"upcoming"}`}>{m.status.toUpperCase()}</span></div><small>{fmtDate(m.date)} · {fmtTime(m.date)} · {m.competition} · {m.home?"Local":"Visitante"}</small></div><div className="match-score">{m.status==="Finalizado"?`${m.goalsFor} - ${m.goalsAgainst}`:"— : —"}</div></div>)}</div></>}
        {tab==="Entrenamientos" && <><div className="page-heading"><div><div className="eyebrow">PLANIFICACIÓN · {team?.name}</div><h1>Entrenamientos<span>.</span></h1><p>Diseña sesiones con un objetivo claro y una estructura definida.</p></div><button className="button primary" onClick={() => setModal("training")}><Plus size={17}/> Nueva sesión</button></div><div className="training-cards">{teamTrainings.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(t=><article className="session-card" key={t.id}><div className="session-top"><span className="session-icon"><Dumbbell size={20}/></span><span className="session-duration"><Clock3 size={14}/>{t.duration} min</span></div><div className="eyebrow">{fmtDate(t.date)} · {fmtTime(t.date)}</div><h3>{t.title}</h3><p>{t.focus}</p><div className="session-phases"><span>Activación</span><span>Tarea principal</span><span>Vuelta a la calma</span></div><button className="text-button" onClick={() => setNotice(`Sesión «${t.title}»: añade después ejercicios, espacio, reglas y consignas detalladas en el módulo de planificación avanzada.`)}>Abrir planificación <span>→</span></button></article>)}</div><section className="panel methodology"><div className="method-icon"><ClipboardList size={22}/></div><div><h3>Tu metodología, siempre a mano</h3><p>La siguiente ampliación puede incorporar biblioteca de ejercicios, objetivos tácticos, consignas y planificación semanal.</p></div><span className="coming-soon">SIGUIENTE FASE</span></section></>}
        {tab==="Estadísticas" && <><div className="page-heading"><div><div className="eyebrow">RENDIMIENTO · {team?.name}</div><h1>Estadísticas<span>.</span></h1><p>Indicadores agregados a partir de los datos registrados.</p></div><button className="button secondary" onClick={exportCsv}>Exportar CSV</button></div><div className="stats-grid"><Stat icon={<Users size={18}/>} label="Jugadores" value={String(teamPlayers.length)} note="Plantilla actual" tone="green"/><Stat icon={<Activity size={18}/>} label="Minutos registrados" value={String(teamPlayers.reduce((s,p)=>s+p.minutes,0))} note="Suma de la plantilla" tone="blue"/><Stat icon={<Goal size={18}/>} label="Goles" value={String(teamPlayers.reduce((s,p)=>s+p.goals,0))} note="Estadística individual" tone="orange"/><Stat icon={<ChartNoAxesCombined size={18}/>} label="Asistencias" value={String(teamPlayers.reduce((s,p)=>s+p.assists,0))} note="Estadística individual" tone="purple"/></div><section className="panel"><PanelTitle title="Rendimiento por jugador"/><div className="table-wrap"><table><thead><tr><th>JUGADOR</th><th>MINUTOS</th><th>GOLES</th><th>ASISTENCIAS</th><th>PARTIDOS</th><th>MEDIA MIN/PARTIDO</th></tr></thead><tbody>{teamPlayers.slice().sort((a,b)=>b.minutes-a.minutes).map(p=><tr key={p.id}><td><div className="player-cell"><span className="player-number">{String(p.number).padStart(2,"0")}</span><strong>{p.name}</strong></div></td><td>{p.minutes}'</td><td>{p.goals}</td><td>{p.assists}</td><td>{p.appearances}</td><td>{p.appearances?Math.round(p.minutes/p.appearances):0}'</td></tr>)}</tbody></table></div></section><p className="data-note"><ShieldCheck size={15}/> Los datos iniciales son demostrativos. Sustitúyelos por los datos reales de tu equipo antes de utilizarlos para decisiones deportivas.</p></>}
        <footer className="footer"><span>© 2026 CAMPBASE · FOOTBALL OS</span><span><span className="footer-dot"/> Plataforma de gestión deportiva</span></footer>
      </div>
    </section>

    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><section className="modal"><div className="modal-header"><div><div className="eyebrow">CAMPBASE · NUEVO REGISTRO</div><h2>{modal==="player"?"Añadir jugador":modal==="match"?"Añadir partido":modal==="training"?"Crear entrenamiento":"Crear equipo"}</h2></div><button className="icon-button" onClick={()=>setModal(null)}><X size={19}/></button></div>
      {modal==="player"&&<form onSubmit={addPlayer} className="form-grid"><label className="wide">Nombre completo<input name="name" required placeholder="Nombre y apellidos"/></label><label>Dorsal<input name="number" type="number" min="0" max="99" defaultValue="0"/></label><label>Posición<select name="position"><option>Portero</option><option>Defensa</option><option>Centrocampista</option><option>Extremo</option><option>Delantero</option><option>Polivalente</option></select></label><div className="wide form-note">Los datos de menores deben limitarse a lo necesario y ser accesibles solo a usuarios autorizados.</div><button className="button primary wide" type="submit">Guardar jugador</button></form>}
      {modal==="match"&&<form onSubmit={addMatch} className="form-grid"><label className="wide">Equipo rival<input name="opponent" required placeholder="Nombre del rival"/></label><label>Fecha y hora<input name="date" type="datetime-local" required defaultValue="2026-10-17T10:30"/></label><label>Competición<input name="competition" defaultValue="Lliga"/></label><label>Campo<select name="venue"><option value="home">Local</option><option value="away">Visitante</option></select></label><label>Estado<select name="status"><option>Próximo</option><option>Finalizado</option></select></label><label>Goles a favor (si finalizado)<input name="goalsFor" type="number" min="0" defaultValue="0"/></label><label>Goles en contra (si finalizado)<input name="goalsAgainst" type="number" min="0" defaultValue="0"/></label><button className="button primary wide" type="submit">Guardar partido</button></form>}
      {modal==="training"&&<form onSubmit={addTraining} className="form-grid"><label className="wide">Nombre de la sesión<input name="title" required placeholder="Ej. Transición tras pérdida"/></label><label className="wide">Objetivo principal<input name="focus" required placeholder="Ej. Presionar tras pérdida y cerrar líneas"/></label><label>Fecha y hora<input name="date" type="datetime-local" required defaultValue="2026-10-15T18:00"/></label><label>Duración (minutos)<input name="duration" type="number" min="15" max="180" defaultValue="75"/></label><button className="button primary wide" type="submit">Guardar sesión</button></form>}
      {modal==="team"&&<form onSubmit={e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const t:Team={id:crypto.randomUUID(),name:String(fd.get("name")),category:String(fd.get("category")),format:String(fd.get("format")),season:String(fd.get("season"))};setTeams(old=>[...old,t]);setSelectedTeam(t.id);setModal(null);setTab("Inicio");setNotice("Equipo creado.");}} className="form-grid"><label className="wide">Nombre del equipo<input name="name" required placeholder="Ej. S11 A"/></label><label>Categoría<input name="category" required placeholder="S11"/></label><label>Formato<select name="format"><option>Futbol 7</option><option>Futbol 8</option><option>Futbol 11</option><option>Otro</option></select></label><label className="wide">Temporada<input name="season" required defaultValue="2026/27"/></label><button className="button primary wide" type="submit">Crear equipo</button></form>}
    </section></div>}
    {authOpen && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAuthOpen(false)}}><section className="modal auth-modal"><div className="modal-header"><div><div className="eyebrow">ACCESO SEGURO</div><h2>{userEmail?"Tu cuenta":"Entrar en CampBase"}</h2></div><button className="icon-button" onClick={()=>setAuthOpen(false)}><X size={19}/></button></div>{userEmail?<><p className="auth-help">Sesión activa como <strong>{userEmail}</strong>.</p><button className="button secondary full-button" onClick={signOut}>Cerrar sesión</button></>:<form onSubmit={signIn} className="form-grid"><p className="auth-help wide">{isCloudConfigured?"Inicia sesión con tu cuenta de Supabase.":"La aplicación está en modo demo. Para habilitar cuentas y sincronización, configura las variables de Supabase del proyecto."}</p><label className="wide">Correo electrónico<input type="email" required value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="entrenador@club.cat"/></label><label className="wide">Contraseña<input type="password" required value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="Tu contraseña"/></label><button className="button primary wide" type="submit">Iniciar sesión</button></form>}</section></div>}
  </main>;
}

function Stat({icon,label,value,note,tone}:{icon:React.ReactNode;label:string;value:string;note:string;tone:string}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div><div className={`stat-accent ${tone}`}/></div>;
}
function PanelTitle({title,action,onAction}:{title:string;action?:string;onAction?:()=>void}) {
  return <div className="panel-title"><h3>{title}</h3>{action&&<button className="text-button" onClick={onAction}>{action} <span>→</span></button>}</div>;
}
function Empty({text,button,onClick}:{text:string;button:string;onClick:()=>void}) {
  return <div className="empty-state"><p>{text}</p><button className="button secondary" onClick={onClick}><Plus size={15}/>{button}</button></div>;
}
