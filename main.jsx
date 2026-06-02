import React, {useMemo, useState} from 'react';
import { createRoot } from 'react-dom/client';
import { QRCodeCanvas } from 'qrcode.react';
import { Building2, FileText, Upload, QrCode, Shield, History, Users, Search, CheckCircle, AlertTriangle, ClipboardList, LogOut, Smartphone, Eye, Download, PlusCircle } from 'lucide-react';
import './style.css';

const perfis = {
  admin: ['dashboard','obras','projetos','upload','usuarios','auditoria','tarefas'],
  engenharia: ['dashboard','obras','projetos','upload','auditoria','tarefas'],
  projetista: ['projetos','upload','tarefas'],
  encarregado: ['projetos','tarefas'],
  visualizador: ['projetos']
};

const initialProjects = [
  {id:1, obra:'AG Genebra', setor:'Térreo', disciplina:'Arquitetura', codigo:'GEN-ARQ-PL-001', titulo:'Planta baixa térreo', revisao:'R04', status:'Vigente', responsavel:'Engenharia', data:'30/05/2026', arquivo:'GEN-ARQ-PL-001-R04.pdf'},
  {id:2, obra:'AG Genebra', setor:'Fachada', disciplina:'Fachada', codigo:'GEN-FAC-DET-012', titulo:'Detalhe fachada aerada', revisao:'R02', status:'Em análise', responsavel:'Projetista', data:'28/05/2026', arquivo:'GEN-FAC-DET-012-R02.pdf'},
  {id:3, obra:'AG Pompeia', setor:'1ª Laje', disciplina:'Estrutura', codigo:'POM-EST-FOR-006', titulo:'Forma 1ª laje', revisao:'R03', status:'Vigente', responsavel:'Engenharia', data:'27/05/2026', arquivo:'POM-EST-FOR-006-R03.pdf'},
  {id:4, obra:'AG Bilbao', setor:'G1', disciplina:'Hidrossanitário', codigo:'BIL-HID-ESG-004', titulo:'Esgoto G1', revisao:'R01', status:'Obsoleto', responsavel:'Projetista', data:'21/05/2026', arquivo:'BIL-HID-ESG-004-R01.pdf'},
  {id:5, obra:'AG Genebra', setor:'Esquadrias', disciplina:'Esquadrias', codigo:'GEN-ESQ-MAP-009', titulo:'Mapa de esquadrias', revisao:'R05', status:'Pendente', responsavel:'Fornecedor', data:'29/05/2026', arquivo:'GEN-ESQ-MAP-009-R05.pdf'}
];

const initialTasks = [
  {id:1, obra:'AG Genebra', projeto:'GEN-ESQ-MAP-009', titulo:'Validar medidas divergentes das esquadrias', prazo:'03/06/2026', dono:'Engenharia', status:'Pendente', prioridade:'Alta'},
  {id:2, obra:'AG Pompeia', projeto:'POM-EST-FOR-006', titulo:'Conferir aço da 1ª laje e vigas', prazo:'01/06/2026', dono:'Engenharia', status:'Em andamento', prioridade:'Alta'},
  {id:3, obra:'AG Bilbao', projeto:'BIL-HID-ESG-004', titulo:'Verificar ligações hidráulicas do G1', prazo:'02/06/2026', dono:'Encarregado', status:'Pendente', prioridade:'Média'}
];

function badge(status){return 'badge '+status.toLowerCase().replaceAll(' ','-').replace('á','a').replace('ê','e');}
function can(user, mod){ return perfis[user.perfil]?.includes(mod); }

function App(){
  const [user,setUser]=useState(null);
  const [email,setEmail]=useState('admin@obra.com');
  const [perfil,setPerfil]=useState('admin');
  const [tab,setTab]=useState('dashboard');
  const [projects,setProjects]=useState(initialProjects);
  const [tasks,setTasks]=useState(initialTasks);
  const [busca,setBusca]=useState('');
  const [obra,setObra]=useState('Todas');
  const [novo,setNovo]=useState({obra:'AG Genebra',setor:'',disciplina:'',codigo:'',titulo:'',revisao:'R00',responsavel:'',arquivo:''});
  const [logs,setLogs]=useState([{id:1,acao:'Sistema criado',usuario:'admin@obra.com',data:'02/06/2026 16:40',detalhe:'Ambiente inicial configurado'}]);

  const lista = useMemo(()=>projects.filter(p=>(obra==='Todas'||p.obra===obra)&&[p.obra,p.setor,p.disciplina,p.codigo,p.titulo,p.revisao,p.status].join(' ').toLowerCase().includes(busca.toLowerCase())),[projects,busca,obra]);
  const stats = {total:projects.length, vigentes:projects.filter(p=>p.status==='Vigente').length, obsoletos:projects.filter(p=>p.status==='Obsoleto').length, pendentes:projects.filter(p=>['Pendente','Em análise'].includes(p.status)).length};

  function login(){ const u={email,perfil}; setUser(u); setTab(can(u,'dashboard')?'dashboard':'projetos'); }
  function addLog(acao,detalhe){ setLogs(l=>[{id:Date.now(),acao,usuario:user?.email||'sistema',data:new Date().toLocaleString('pt-BR'),detalhe},...l]); }
  function cadastrar(){
    if(!novo.codigo || !novo.titulo || !novo.revisao) return alert('Preencha código, título e revisão.');
    const atualizados = projects.map(p=>p.codigo===novo.codigo && p.status==='Vigente'?{...p,status:'Obsoleto'}:p);
    const arquivo = novo.arquivo || `${novo.codigo}-${novo.revisao}.pdf`;
    setProjects([{...novo,id:Date.now(),status:'Vigente',data:new Date().toLocaleDateString('pt-BR'),arquivo},...atualizados]);
    addLog('Nova revisão cadastrada',`${novo.codigo} ${novo.revisao}. Revisão anterior marcada como obsoleta quando existia.`);
    setNovo({obra:'AG Genebra',setor:'',disciplina:'',codigo:'',titulo:'',revisao:'R00',responsavel:'',arquivo:''});
    setTab('projetos');
  }
  function alterarStatus(id,status){ setProjects(projects.map(p=>p.id===id?{...p,status}:p)); addLog('Status alterado',`Projeto ${id} alterado para ${status}`); }
  function concluirTarefa(id){ setTasks(tasks.map(t=>t.id===id?{...t,status:'Concluída'}:t)); addLog('Tarefa concluída',`Tarefa ${id} concluída`); }

  if(!user) return <div className="loginPage"><div className="loginCard"><div className="brand"><Building2/><h1>ObraCode Profissional</h1></div><p>Sistema profissional de gerenciamento de projetos de obra, revisões, QR Code, obsoletos e permissões.</p><label>E-mail</label><input value={email} onChange={e=>setEmail(e.target.value)}/><label>Perfil de teste</label><select value={perfil} onChange={e=>setPerfil(e.target.value)}><option value="admin">Administrador</option><option value="engenharia">Engenharia</option><option value="projetista">Projetista</option><option value="encarregado">Encarregado</option><option value="visualizador">Visualizador</option></select><button onClick={login}>Entrar no sistema</button><small>Depois, o login real pode ser ligado ao Supabase Auth.</small></div></div>;

  const menu=[['dashboard','Dashboard',Building2],['obras','Obras',Building2],['projetos','Projetos',FileText],['upload','Nova Revisão',Upload],['tarefas','Tarefas',ClipboardList],['usuarios','Usuários',Users],['auditoria','Auditoria',History]];

  return <div className="app"><aside><div className="brand side"><Building2/><div><h2>ObraCode</h2><span>{user.perfil}</span></div></div>{menu.filter(m=>can(user,m[0])).map(([id,nome,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={18}/>{nome}</button>)}<button className="logout" onClick={()=>setUser(null)}><LogOut size={18}/>Sair</button></aside><main><header><div><h1>{menu.find(m=>m[0]===tab)?.[1]}</h1><p>Usuário: {user.email}</p></div><div className="mobile"><Smartphone size={18}/>Pronto para celular/PWA</div></header>

  {tab==='dashboard'&&<section><div className="cards"><Card icon={FileText} title="Projetos" value={stats.total}/><Card icon={CheckCircle} title="Vigentes" value={stats.vigentes}/><Card icon={AlertTriangle} title="Obsoletos" value={stats.obsoletos}/><Card icon={ClipboardList} title="Pendências" value={stats.pendentes}/></div><div className="panel"><h3>Fluxo documental</h3><div className="flow"><span>Upload</span><b>→</b><span>Análise</span><b>→</b><span>Vigente</span><b>→</b><span>QR Code em campo</span><b>→</b><span>Obsoleto automático</span></div></div></section>}

  {tab==='obras'&&<section className="grid3">{['AG Genebra','AG Bilbao','AG Pompeia'].map(o=><div className="panel" key={o}><h3>{o}</h3><p>Projetos: {projects.filter(p=>p.obra===o).length}</p><p>Vigentes: {projects.filter(p=>p.obra===o&&p.status==='Vigente').length}</p><p>Pendências: {tasks.filter(t=>t.obra===o&&t.status!=='Concluída').length}</p></div>)}</section>}

  {tab==='projetos'&&<section><div className="toolbar"><div className="search"><Search size={18}/><input placeholder="Buscar projeto, código, disciplina..." value={busca} onChange={e=>setBusca(e.target.value)}/></div><select value={obra} onChange={e=>setObra(e.target.value)}><option>Todas</option><option>AG Genebra</option><option>AG Bilbao</option><option>AG Pompeia</option></select></div><div className="table"><table><thead><tr><th>Código</th><th>Título</th><th>Obra</th><th>Setor</th><th>Disciplina</th><th>Rev.</th><th>Status</th><th>QR</th><th>Ações</th></tr></thead><tbody>{lista.map(p=><tr key={p.id}><td><b>{p.codigo}</b></td><td>{p.titulo}<small>{p.arquivo}</small></td><td>{p.obra}</td><td>{p.setor}</td><td>{p.disciplina}</td><td>{p.revisao}</td><td><span className={badge(p.status)}>{p.status}</span></td><td>{p.status==='Vigente'?<QRCodeCanvas value={`${location.origin}/projeto/${p.codigo}`} size={48}/>:<span className="lock">bloqueado</span>}</td><td><button className="mini"><Eye size={15}/></button><button className="mini"><Download size={15}/></button>{can(user,'upload')&&<select onChange={e=>alterarStatus(p.id,e.target.value)} value={p.status}><option>Vigente</option><option>Em análise</option><option>Pendente</option><option>Obsoleto</option></select>}</td></tr>)}</tbody></table></div></section>}

  {tab==='upload'&&<section><div className="panel"><h3>Cadastrar nova revisão</h3><p>Regra: se já existir projeto vigente com o mesmo código, ele será marcado como obsoleto automaticamente.</p><div className="formgrid"><select value={novo.obra} onChange={e=>setNovo({...novo,obra:e.target.value})}><option>AG Genebra</option><option>AG Bilbao</option><option>AG Pompeia</option></select><input placeholder="Setor/Pavimento" value={novo.setor} onChange={e=>setNovo({...novo,setor:e.target.value})}/><input placeholder="Disciplina" value={novo.disciplina} onChange={e=>setNovo({...novo,disciplina:e.target.value})}/><input placeholder="Código do projeto" value={novo.codigo} onChange={e=>setNovo({...novo,codigo:e.target.value})}/><input placeholder="Título" value={novo.titulo} onChange={e=>setNovo({...novo,titulo:e.target.value})}/><input placeholder="Revisão ex: R06" value={novo.revisao} onChange={e=>setNovo({...novo,revisao:e.target.value})}/><input placeholder="Responsável" value={novo.responsavel} onChange={e=>setNovo({...novo,responsavel:e.target.value})}/><input placeholder="Nome do arquivo PDF/DWG" value={novo.arquivo} onChange={e=>setNovo({...novo,arquivo:e.target.value})}/></div><div className="drop"><Upload/><b>Área de upload preparada</b><span>Nesta versão de base, o envio real será ligado ao Supabase Storage.</span></div><button className="primary" onClick={cadastrar}><PlusCircle size={18}/>Cadastrar revisão</button></div></section>}

  {tab==='tarefas'&&<section>{tasks.map(t=><div className="task" key={t.id}><div><h3>{t.titulo}</h3><p>{t.obra} • Projeto {t.projeto} • Dono: {t.dono} • Prazo: {t.prazo}</p></div><div><span className={badge(t.status)}>{t.status}</span><span className="badge neutro">{t.prioridade}</span>{t.status!=='Concluída'&&<button onClick={()=>concluirTarefa(t.id)}>Dar baixa</button>}</div></div>)}</section>}

  {tab==='usuarios'&&<section className="panel"><h3>Permissões por perfil</h3><table><thead><tr><th>Perfil</th><th>Acessos</th></tr></thead><tbody>{Object.entries(perfis).map(([p,mods])=><tr key={p}><td><b>{p}</b></td><td>{mods.join(', ')}</td></tr>)}</tbody></table></section>}

  {tab==='auditoria'&&<section className="panel"><h3>Histórico de auditoria</h3>{logs.map(l=><div className="log" key={l.id}><b>{l.acao}</b><span>{l.data} • {l.usuario}</span><p>{l.detalhe}</p></div>)}</section>}

  </main></div>
}
function Card({icon:Icon,title,value}){return <div className="card"><Icon/><div><span>{title}</span><b>{value}</b></div></div>}
createRoot(document.getElementById('root')).render(<App/>);
