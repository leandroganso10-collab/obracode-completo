import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QRCodeCanvas } from 'qrcode.react';
import { createClient } from '@supabase/supabase-js';
import {
  Building2,
  FileText,
  Upload,
  History,
  Users,
  Search,
  CheckCircle,
  AlertTriangle,
  ClipboardList,
  LogOut,
  Smartphone,
  Eye,
  Download,
  PlusCircle,
  FolderOpen,
  ExternalLink,
  Shield
} from 'lucide-react';
import './style.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const perfis = {
  admin: ['dashboard', 'obras', 'projetos', 'upload', 'usuarios', 'auditoria', 'tarefas'],
  engenharia: ['dashboard', 'obras', 'projetos', 'upload', 'auditoria', 'tarefas'],
  projetista: ['projetos', 'upload', 'tarefas'],
  encarregado: ['projetos', 'tarefas'],
  visualizador: ['projetos']
};

const obrasPadrao = [
  { nome: 'AG BILBAO' },
  { nome: 'AG GENEBRA' },
  { nome: 'AG POMPEIA' }
];

function normalizarStatus(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'vigente') return 'Vigente';
  if (s === 'em_analise' || s === 'em análise') return 'Em análise';
  if (s === 'obsoleto') return 'Obsoleto';
  if (s === 'bloqueado') return 'Bloqueado';
  if (s === 'pendente') return 'Pendente';
  return status || 'Em análise';
}

function statusBanco(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('vigente')) return 'vigente';
  if (s.includes('obsoleto')) return 'obsoleto';
  if (s.includes('bloqueado')) return 'bloqueado';
  return 'em_analise';
}

function badge(status) {
  return 'badge ' + String(status || '').toLowerCase().replaceAll(' ', '-').replace('á', 'a').replace('ê', 'e');
}

function can(user, mod) {
  return perfis[user?.perfil]?.includes(mod);
}

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('leandro.eng2018@outlook.com');
  const [senha, setSenha] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [obras, setObras] = useState(obrasPadrao);
  const [busca, setBusca] = useState('');
  const [obraFiltro, setObraFiltro] = useState('Todas');
  const [obraAberta, setObraAberta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const [novo, setNovo] = useState({
    obra_id: '',
    obra: 'AG GENEBRA',
    setor: '',
    disciplina: '',
    codigo: '',
    titulo: '',
    revisao: 'R00',
    responsavel: '',
    arquivo_nome: '',
    arquivo_url: ''
  });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) carregarUsuario(data.session.user);
    });
  }, []);

  async function carregarUsuario(authUser) {
    const { data: perfil } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    const u = {
      id: authUser.id,
      email: authUser.email,
      perfil: perfil?.role || 'visualizador',
      nome: perfil?.full_name || authUser.email
    };

    setUser(u);
    setTab(can(u, 'dashboard') ? 'dashboard' : 'projetos');
    await carregarDados();
  }

  async function carregarDados() {
    setLoading(true);

    const { data: obrasData } = await supabase
      .from('obras')
      .select('*')
      .order('nome');

    const obrasFinal = obrasData?.length ? obrasData : obrasPadrao;
    setObras(obrasFinal);

    const { data: projetosData } = await supabase
      .from('projetos')
      .select('*, obras(nome)')
      .order('created_at', { ascending: false });

    setProjects((projetosData || []).map(p => ({
      id: p.id,
      obra_id: p.obra_id,
      obra: p.obras?.nome || '',
      setor: p.setor || '',
      disciplina: p.disciplina || '',
      codigo: p.codigo || '',
      titulo: p.titulo || '',
      revisao: p.revisao || 'R00',
      status: normalizarStatus(p.status),
      responsavel: p.responsavel || '',
      data: p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '',
      arquivo: p.arquivo_nome || '',
      arquivo_url: p.arquivo_url || p.qr_text || ''
    })));

    const { data: tarefasData } = await supabase
      .from('tarefas')
      .select('*, obras(nome), projetos(codigo)')
      .order('created_at', { ascending: false });

    setTasks((tarefasData || []).map(t => ({
      id: t.id,
      obra: t.obras?.nome || '',
      projeto: t.projetos?.codigo || '',
      titulo: t.titulo,
      prazo: t.prazo || '',
      dono: t.responsavel || '',
      status: t.status || 'pendente',
      prioridade: t.prioridade || 'media'
    })));

    const { data: auditoriaData } = await supabase
      .from('auditoria')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    setLogs((auditoriaData || []).map(l => ({
      id: l.id,
      acao: l.acao,
      usuario: l.user_id || 'sistema',
      data: l.created_at ? new Date(l.created_at).toLocaleString('pt-BR') : '',
      detalhe: typeof l.detalhe === 'string' ? l.detalhe : JSON.stringify(l.detalhe || {})
    })));

    setLoading(false);
  }

  async function login(e) {
    e?.preventDefault();

    if (!supabase) {
      return alert('Supabase não configurado. Confira as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel.');
    }

    if (!email || !senha) {
      return alert('Informe e-mail e senha.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) return alert('Erro no login: ' + error.message);

    await carregarUsuario(data.user);
  }

  async function sair() {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  }

  async function addLog(acao, detalhe, entidade = null, entidade_id = null) {
    if (!supabase || !user) return;

    await supabase.from('auditoria').insert({
      user_id: user.id,
      acao,
      entidade,
      entidade_id,
      detalhe: { texto: detalhe }
    });

    await carregarDados();
  }

  async function cadastrar() {
    if (!can(user, 'upload')) return alert('Seu perfil não tem permissão para cadastrar revisão.');
    if (!novo.codigo || !novo.titulo || !novo.revisao || !novo.obra_id) return alert('Preencha obra, código, título e revisão.');
    if (!novo.arquivo_url) return alert('Cole o link do arquivo no Google Drive ou OneDrive.');

    const obraSelecionada = obras.find(o => o.id === novo.obra_id);
    const arquivoNome = novo.arquivo_nome || `${novo.codigo}-${novo.revisao}.pdf`;

    await supabase
      .from('projetos')
      .update({ status: 'obsoleto' })
      .eq('codigo', novo.codigo)
      .eq('status', 'vigente');

    const { data, error } = await supabase.from('projetos').insert({
      obra_id: novo.obra_id,
      codigo: novo.codigo,
      titulo: novo.titulo,
      setor: novo.setor,
      disciplina: novo.disciplina,
      revisao: novo.revisao,
      status: 'vigente',
      responsavel: novo.responsavel,
      arquivo_nome: arquivoNome,
      arquivo_url: novo.arquivo_url,
      qr_text: novo.arquivo_url,
      created_by: user.id
    }).select().single();

    if (error) return alert('Erro ao cadastrar revisão: ' + error.message);

    await addLog(
      'Nova revisão cadastrada',
      `${novo.codigo} ${novo.revisao} - ${obraSelecionada?.nome || ''}`,
      'projetos',
      data.id
    );

    setNovo({
      obra_id: obras[0]?.id || '',
      obra: obras[0]?.nome || 'AG GENEBRA',
      setor: '',
      disciplina: '',
      codigo: '',
      titulo: '',
      revisao: 'R00',
      responsavel: '',
      arquivo_nome: '',
      arquivo_url: ''
    });

    setTab('projetos');
    await carregarDados();
  }

  async function alterarStatus(id, status) {
    if (!can(user, 'upload')) return alert('Sem permissão.');

    const { error } = await supabase
      .from('projetos')
      .update({ status: statusBanco(status) })
      .eq('id', id);

    if (error) return alert(error.message);

    await addLog('Status alterado', `Projeto ${id} alterado para ${status}`, 'projetos', id);
    await carregarDados();
  }

  async function concluirTarefa(id) {
    const { error } = await supabase
      .from('tarefas')
      .update({ status: 'Concluída' })
      .eq('id', id);

    if (error) return alert(error.message);

    await addLog('Tarefa concluída', `Tarefa ${id} concluída`, 'tarefas', id);
    await carregarDados();
  }

  const lista = useMemo(() => projects.filter(p =>
    (obraFiltro === 'Todas' || p.obra === obraFiltro) &&
    [p.obra, p.setor, p.disciplina, p.codigo, p.titulo, p.revisao, p.status]
      .join(' ')
      .toLowerCase()
      .includes(busca.toLowerCase())
  ), [projects, busca, obraFiltro]);

  const stats = {
    total: projects.length,
    vigentes: projects.filter(p => p.status === 'Vigente').length,
    obsoletos: projects.filter(p => p.status === 'Obsoleto').length,
    pendentes: projects.filter(p => ['Pendente', 'Em análise'].includes(p.status)).length
  };

  if (!user) {
    return (
      <div className="loginPage">
        <form className="loginCard" onSubmit={login}>
          <div className="brand">
            <Building2 />
            <h1>ObraCode Profissional</h1>
          </div>

          <p>Sistema profissional de gerenciamento de projetos de obra, revisões, QR Code, obsoletos e permissões.</p>

          <label>E-mail</label>
          <input value={email} onChange={e => setEmail(e.target.value)} />

          <label>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            placeholder="Digite sua senha"
          />

          <button type="submit">Entrar no sistema</button>
          <small>Login real conectado ao Supabase Auth.</small>
        </form>
      </div>
    );
  }

  const menu = [
    ['dashboard', 'Dashboard', Building2],
    ['obras', 'Obras', Building2],
    ['projetos', 'Projetos', FileText],
    ['upload', 'Nova Revisão', Upload],
    ['tarefas', 'Tarefas', ClipboardList],
    ['usuarios', 'Usuários', Users],
    ['auditoria', 'Auditoria', History]
  ];

  return (
    <div className="app">
      <aside>
        <div className="brand side">
          <Building2 />
          <div>
            <h2>ObraCode</h2>
            <span>{user.perfil}</span>
          </div>
        </div>

        {menu.filter(m => can(user, m[0])).map(([id, nome, Icon]) => (
          <button
            key={id}
            className={tab === id ? 'active' : ''}
            onClick={() => setTab(id)}
          >
            <Icon size={18} />
            {nome}
          </button>
        ))}

        <button className="logout" onClick={sair}>
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      <main>
        <header>
          <div>
            <h1>{menu.find(m => m[0] === tab)?.[1]}</h1>
            <p>Usuário: {user.email}</p>
          </div>

          <div className="mobile">
            <Smartphone size={18} />
            Pronto para celular/PWA
          </div>
        </header>

        {loading && (
          <div className="panel">
            <b>Carregando dados...</b>
          </div>
        )}

        {tab === 'dashboard' && (
          <section>
            <div className="cards">
              <Card icon={FileText} title="Projetos" value={stats.total} />
              <Card icon={CheckCircle} title="Vigentes" value={stats.vigentes} />
              <Card icon={AlertTriangle} title="Obsoletos" value={stats.obsoletos} />
              <Card icon={ClipboardList} title="Pendências" value={stats.pendentes} />
            </div>

            <div className="panel">
              <h3>Fluxo documental</h3>
              <div className="flow">
                <span>Link Drive</span>
                <b>→</b>
                <span>Análise</span>
                <b>→</b>
                <span>Vigente</span>
                <b>→</b>
                <span>QR Code em campo</span>
                <b>→</b>
                <span>Obsoleto automático</span>
              </div>
            </div>
          </section>
        )}

        {tab === 'obras' && (
          <section>
            <div className="grid3">
              {obras.map(o => (
                <div
                  className="panel obraCard"
                  key={o.id || o.nome}
                  onClick={() => setObraAberta(obraAberta === o.nome ? null : o.nome)}
                  style={{ cursor: 'pointer' }}
                >
                  <h3>{o.nome}</h3>
                  <p>Projetos: {projects.filter(p => p.obra === o.nome).length}</p>
                  <p>Vigentes: {projects.filter(p => p.obra === o.nome && p.status === 'Vigente').length}</p>
                  <small>Clique para abrir as pastas</small>

                  {obraAberta === o.nome && (
                    <div className="driveButtons" onClick={e => e.stopPropagation()}>
                      {o.drive_arquitetonico && (
                        <a className="mini linkbtn" href={o.drive_arquitetonico} target="_blank">
                          Arquitetônico <ExternalLink size={14} />
                        </a>
                      )}

                      {o.drive_estrutura && (
                        <a className="mini linkbtn" href={o.drive_estrutura} target="_blank">
                          Estrutura <ExternalLink size={14} />
                        </a>
                      )}

                      {o.drive_instalacoes && (
                        <a className="mini linkbtn" href={o.drive_instalacoes} target="_blank">
                          Instalações <ExternalLink size={14} />
                        </a>
                      )}

                      {o.drive_documentos && (
                        <a className="mini linkbtn" href={o.drive_documentos} target="_blank">
                          Documentos da Obra <ExternalLink size={14} />
                        </a>
                      )}

                      {o.drive_obsoletos && (
                        <a className="mini linkbtn" href={o.drive_obsoletos} target="_blank">
                          Obsoletos <ExternalLink size={14} />
                        </a>
                      )}

                      {o.drive_url && (
                        <a className="mini linkbtn" href={o.drive_url} target="_blank">
                          <FolderOpen size={14} /> Pasta principal
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'projetos' && (
          <section>
            <div className="toolbar">
              <div className="search">
                <Search size={18} />
                <input
                  placeholder="Buscar projeto, código, disciplina..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>

              <select value={obraFiltro} onChange={e => setObraFiltro(e.target.value)}>
                <option>Todas</option>
                {obras.map(o => (
                  <option key={o.id || o.nome}>{o.nome}</option>
                ))}
              </select>
            </div>

            <div className="table">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Título</th>
                    <th>Obra</th>
                    <th>Setor</th>
                    <th>Disciplina</th>
                    <th>Rev.</th>
                    <th>Status</th>
                    <th>QR</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {lista.map(p => (
                    <tr key={p.id}>
                      <td><b>{p.codigo}</b></td>
                      <td>{p.titulo}<small>{p.arquivo}</small></td>
                      <td>{p.obra}</td>
                      <td>{p.setor}</td>
                      <td>{p.disciplina}</td>
                      <td>{p.revisao}</td>
                      <td><span className={badge(p.status)}>{p.status}</span></td>

                      <td>
                        {p.status === 'Vigente' && p.arquivo_url ? (
                          <QRCodeCanvas value={p.arquivo_url} size={48} />
                        ) : (
                          <span className="lock">bloqueado</span>
                        )}
                      </td>

                      <td>
                        {p.arquivo_url && (
                          <a
                            className="mini"
                            href={p.arquivo_url}
                            target="_blank"
                            onClick={() => addLog('Projeto visualizado', p.codigo, 'projetos', p.id)}
                          >
                            <Eye size={15} />
                          </a>
                        )}

                        {p.arquivo_url && (
                          <a
                            className="mini"
                            href={p.arquivo_url}
                            target="_blank"
                            onClick={() => addLog('Download/acesso ao arquivo', p.codigo, 'projetos', p.id)}
                          >
                            <Download size={15} />
                          </a>
                        )}

                        {can(user, 'upload') && (
                          <select onChange={e => alterarStatus(p.id, e.target.value)} value={p.status}>
                            <option>Vigente</option>
                            <option>Em análise</option>
                            <option>Obsoleto</option>
                            <option>Bloqueado</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'upload' && (
          <section>
            <div className="panel">
              <h3>Cadastrar nova revisão</h3>
              <p>Regra: se já existir projeto vigente com o mesmo código, ele será marcado como obsoleto automaticamente.</p>

              <div className="formgrid">
                <select
                  value={novo.obra_id}
                  onChange={e => {
                    const ob = obras.find(o => o.id === e.target.value);
                    setNovo({ ...novo, obra_id: e.target.value, obra: ob?.nome || '' });
                  }}
                >
                  <option value="">Selecione a obra</option>
                  {obras.map(o => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>

                <input placeholder="Setor/Pavimento" value={novo.setor} onChange={e => setNovo({ ...novo, setor: e.target.value })} />
                <input placeholder="Disciplina" value={novo.disciplina} onChange={e => setNovo({ ...novo, disciplina: e.target.value })} />
                <input placeholder="Código do projeto" value={novo.codigo} onChange={e => setNovo({ ...novo, codigo: e.target.value.toUpperCase() })} />
                <input placeholder="Título" value={novo.titulo} onChange={e => setNovo({ ...novo, titulo: e.target.value })} />
                <input placeholder="Revisão ex: R06" value={novo.revisao} onChange={e => setNovo({ ...novo, revisao: e.target.value.toUpperCase() })} />
                <input placeholder="Responsável" value={novo.responsavel} onChange={e => setNovo({ ...novo, responsavel: e.target.value })} />
                <input placeholder="Nome do arquivo PDF/DWG" value={novo.arquivo_nome} onChange={e => setNovo({ ...novo, arquivo_nome: e.target.value })} />
              </div>

              <label>Link do arquivo no Google Drive / OneDrive</label>
              <input
                className="fullInput"
                placeholder="Cole aqui o link compartilhado do PDF/DWG"
                value={novo.arquivo_url}
                onChange={e => setNovo({ ...novo, arquivo_url: e.target.value })}
              />

              <div className="drop">
                <Upload />
                <b>Arquivo externo via Drive/OneDrive</b>
                <span>O Supabase guarda apenas o cadastro, link, QR Code, revisão e auditoria.</span>
              </div>

              <button className="primary" onClick={cadastrar}>
                <PlusCircle size={18} />
                Cadastrar revisão
              </button>
            </div>
          </section>
        )}

        {tab === 'tarefas' && (
          <section>
            {tasks.map(t => (
              <div className="task" key={t.id}>
                <div>
                  <h3>{t.titulo}</h3>
                  <p>{t.obra} • Projeto {t.projeto} • Dono: {t.dono} • Prazo: {t.prazo}</p>
                </div>

                <div>
                  <span className={badge(t.status)}>{t.status}</span>
                  <span className="badge neutro">{t.prioridade}</span>

                  {t.status !== 'Concluída' && (
                    <button onClick={() => concluirTarefa(t.id)}>Dar baixa</button>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === 'usuarios' && (
          <section className="panel">
            <h3>Permissões por perfil</h3>

            <table>
              <thead>
                <tr>
                  <th>Perfil</th>
                  <th>Acessos</th>
                </tr>
              </thead>

              <tbody>
                {Object.entries(perfis).map(([p, mods]) => (
                  <tr key={p}>
                    <td><b>{p}</b></td>
                    <td>{mods.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p>
              <Shield size={16} /> Os usuários reais são criados em Supabase → Authentication → Users.
              O perfil fica na tabela public.profiles.
            </p>
          </section>
        )}

        {tab === 'auditoria' && (
          <section className="panel">
            <h3>Histórico de auditoria</h3>

            {logs.map(l => (
              <div className="log" key={l.id}>
                <b>{l.acao}</b>
                <span>{l.data} • {l.usuario}</span>
                <p>{l.detalhe}</p>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function Card({ icon: Icon, title, value }) {
  return (
    <div className="card">
      <Icon />
      <div>
        <span>{title}</span>
        <b>{value}</b>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
