import React, { useState, useEffect } from 'react';
import { especialidadeAPI, administradorAPI, servicoAPI } from '../../services/api'; 
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const AdminEspecialidades = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false); // Para os forms

  // --- Estados dos Modais ---
  const [showAssociarProfissional, setShowAssociarProfissional] = useState(false);
  const [showAssociarServico, setShowAssociarServico] = useState(false);
  const [showCriarEspecialidade, setShowCriarEspecialidade] = useState(false);
  
  // Controla se o modal de associação está em modo "Criar" ou "Selecionar"
  const [isCreatingNew, setIsCreatingNew] = useState(false); 

  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState(null);
  
  // IDs para os <select>
  const [profissionalId, setProfissionalId] = useState('');
  const [servicoId, setServicoId] = useState('');

  // Forms de cadastro
  const [formEspecialidade, setFormEspecialidade] = useState({ nome: '', descricao: '' });
  const [formServico, setFormServico] = useState({ nome: '', descricao: '', preco: 0, duracao_em_minutos: 30 });
  const [formProfissional, setFormProfissional] = useState({
    nome: '', cpf: '', data_nascimento: '', email: '', senha: '',
    telefone: '', cep: '', complemento: '', bairro: '', cidade: '',
    estado: '', registroProfissional: ''
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [resEsp, resProf, resServ] = await Promise.all([
        especialidadeAPI.listar(),
        administradorAPI.listarProfissionais(),
        servicoAPI.listar()
      ]);
      setEspecialidades(resEsp.data);
      setProfissionais(resProf.data);
      setServicos(resServ.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Limpa todos os formulários e seleções
  const resetarForms = () => {
    setFormEspecialidade({ nome: '', descricao: '' });
    setFormServico({ nome: '', descricao: '', preco: 0, duracao_em_minutos: 30 });
    setFormProfissional({
      nome: '', cpf: '', data_nascimento: '', email: '', senha: '',
      telefone: '', cep: '', complemento: '', bairro: '', cidade: '',
      estado: '', registroProfissional: ''
    });
    setServicoId('');
    setProfissionalId('');
    setIsCreatingNew(false);
  };
  
  const fecharModais = () => {
    setShowAssociarProfissional(false);
    setShowAssociarServico(false);
    setShowCriarEspecialidade(false);
    resetarForms();
  }

  // --- Handlers de ESPECIALIDADE ---
  const handleCriarEspecialidade = async (e) => {
    e.preventDefault();
    setProcessando(true);
    try {
      await especialidadeAPI.criar(formEspecialidade);
      toast.success('Especialidade criada!');
      fecharModais();
      carregarDados();
    } catch (error) { toast.error('Erro ao criar especialidade'); }
    finally { setProcessando(false); }
  };

  // --- Handlers de ASSOCIAÇÃO (Selecionar existente) ---
  const handleAssociarProfissional = async (e) => {
    e.preventDefault();
    if (!especialidadeSelecionada || !profissionalId) {
      toast.error('Selecione um profissional');
      return;
    }
    setProcessando(true);
    try {
      await administradorAPI.associarProfissional(especialidadeSelecionada.idEspecialidade, profissionalId);
      toast.success('Profissional associado!');
      fecharModais();
      carregarDados();
    } catch (error) { toast.error('Erro ao associar'); }
    finally { setProcessando(false); }
  };

  const handleAssociarServico = async (e) => {
    e.preventDefault();
    if (!especialidadeSelecionada || !servicoId) {
       toast.error('Selecione um serviço');
      return;
    }
     setProcessando(true);
    try {
      await administradorAPI.associarServico(especialidadeSelecionada.idEspecialidade, servicoId);
      toast.success('Serviço associado!');
      fecharModais();
      carregarDados();
    } catch (error) { toast.error('Erro ao associar'); }
    finally { setProcessando(false); }
  };
  
  // --- Handlers de CADASTRO E ASSOCIAÇÃO (Sua Lógica) ---
  const handleCriarEAssociarServico = async (e) => {
    e.preventDefault();
    setProcessando(true);
    try {
      // 1. Criar o serviço
      const servicoResponse = await servicoAPI.criar(formServico);
      const novoServicoId = servicoResponse.data.id;
      toast.info('Serviço criado... associando...');
      
      // 2. Associar o serviço recém-criado
      await administradorAPI.associarServico(especialidadeSelecionada.idEspecialidade, novoServicoId);
      
      toast.success('Serviço criado e associado com sucesso!');
      fecharModais();
      carregarDados(); // Recarrega tudo (especialidades, serviços, profissionais)
    } catch (error) { 
      toast.error('Erro ao criar e associar serviço'); 
      console.error(error);
    } finally { setProcessando(false); }
  };

  const handleCriarEAssociarProfissional = async (e) => {
    e.preventDefault();
    setProcessando(true);
    try {
      // 1. Criar o profissional
      const profResponse = await administradorAPI.criarProfissional(formProfissional);
      const novoProfissionalId = profResponse.data.idUsuario;
      toast.info('Profissional criado... associando...');

      // 2. Associar o profissional recém-criado
      await administradorAPI.associarProfissional(especialidadeSelecionada.idEspecialidade, novoProfissionalId);

      toast.success('Profissional criado e associado com sucesso!');
      fecharModais();
      carregarDados(); // Recarrega tudo
    } catch (error) { 
      toast.error('Erro ao criar e associar profissional'); 
      console.error(error);
    } finally { setProcessando(false); }
  };
  
  // Handler genérico para os formulários
  const handleChange = (e, setForm) => {
    let { name, value } = e.target;
    
    // Máscaras
    if (name === 'cpf') value = value.replace(/\D/g, '').slice(0, 11);
    else if (name === 'telefone') value = value.replace(/\D/g, '').slice(0, 11);
    else if (name === 'cep') value = value.replace(/\D/g, '').slice(0, 8);
    else if (name === 'estado') value = value.toUpperCase().slice(0, 2);

    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  // --- Funções para abrir modais (limpando o estado) ---
  const abrirModalAssociarServico = (esp) => {
    resetarForms();
    setEspecialidadeSelecionada(esp);
    setShowAssociarServico(true);
  };
  
  const abrirModalAssociarProfissional = (esp) => {
    resetarForms();
    setEspecialidadeSelecionada(esp);
    setShowAssociarProfissional(true);
  };
  
  const abrirModalCriarEspecialidade = () => {
    resetarForms();
    setShowCriarEspecialidade(true);
  };

if (loading) {
     return (
        <>
          <Navbar />
          <div className="container">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Carregando profissionais...</p>
            </div>
          </div>
        </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container fade-in">
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap' }}>
          <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>
            Especialidades
          </h1>
          <button className="btn btn-primary" onClick={abrirModalCriarEspecialidade}>
            + Nova Especialidade
          </button>
        </div>
        <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>
          Esta é a tela principal. Crie especialidades e associe serviços e profissionais a elas.
        </p>

        {especialidades.length > 0 ? (
          <div className="grid grid-3">
            {especialidades.map(esp => (
              <div key={esp.idEspecialidade} className="card">
                <div className="card-header">{esp.nome}</div>
                <div className="card-body">
                  <p>{esp.descricao}</p>
                  
                  {/* Lista de Profissionais Associados */}
                  <div>
                    <strong>Profissionais:</strong>
                    {esp.profissionais && esp.profissionais.length > 0 ? (
                      <ul>{esp.profissionais.map(p => <li key={p.idUsuario}>{p.nome}</li>)}</ul>
                    ) : (<p style={{fontSize: '0.9rem', color: 'var(--text-light)'}}>Nenhum</p>)}
                  </div>
                  
                  {/* Lista de Serviços Associados */}
                  <div style={{marginTop: '15px'}}>
                    <strong>Serviços:</strong>
                    {esp.servicos && esp.servicos.length > 0 ? (
                      <ul>{esp.servicos.map(s => <li key={s.id}>{s.nome}</li>)}</ul>
                    ) : (<p style={{fontSize: '0.9rem', color: 'var(--text-light)'}}>Nenhum</p>)}
                  </div>
                </div>
                
                <div className="card-footer" style={{ justifyContent: 'space-around' }}>
                  <button className="btn btn-outline" onClick={() => abrirModalAssociarServico(esp)}>
                    + Associar Serviço
                  </button>
                  <button className="btn btn-outline" onClick={() => abrirModalAssociarProfissional(esp)}>
                    + Associar Prof.
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Nenhuma especialidade cadastrada</p>
          </div>
        )}
      </div>

      {/* --- MODAIS --- */}

      {/* Modal Criar Especialidade */}
      {showCriarEspecialidade && (
        <div className="modal-overlay" onClick={fecharModais}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nova Especialidade</h2>
              <button className="modal-close" onClick={fecharModais}>×</button>
            </div>
            <form onSubmit={handleCriarEspecialidade}>
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input type="text" className="form-control" value={formEspecialidade.nome} onChange={(e) => handleChange(e, setFormEspecialidade)} name="nome" required />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="form-control" value={formEspecialidade.descricao} onChange={(e) => handleChange(e, setFormEspecialidade)} name="descricao" rows="3"></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={processando}>
                {processando ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Associar/Criar Serviço */}
      {showAssociarServico && (
        <div className="modal-overlay" onClick={fecharModais}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Associar Serviço</h2>
              <button className="modal-close" onClick={fecharModais}>×</button>
            </div>
            
            {/* Botão de Toggle */}
            <button type="button" className="btn btn-link" onClick={() => setIsCreatingNew(!isCreatingNew)}>
              {isCreatingNew ? 'Ou, selecionar um serviço existente' : 'Ou, cadastrar um novo serviço para associar'}
            </button>

            {/* --- SEÇÃO DE SELECIONAR (Default) --- */}
            {!isCreatingNew && (
              <form onSubmit={handleAssociarServico} style={{marginTop: '10px'}}>
                <div className="form-group">
                  <label className="form-label">Selecione o Serviço *</label>
                  <select className="form-control" value={servicoId} onChange={(e) => setServicoId(e.target.value)} required>
                    <option value="">-- Selecione --</option>
                    {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={processando}>
                  {processando ? 'Associando...' : 'Associar Serviço Existente'}
                </button>
              </form>
            )}
            
            {/* --- SEÇÃO DE CADASTRAR (Toggle) --- */}
            {isCreatingNew && (
              <form onSubmit={handleCriarEAssociarServico} style={{marginTop: '10px'}}>
                <div className="form-group">
                    <label className="form-label">Nome do Novo Serviço *</label>
                    <input type="text" name="nome" className="form-control" value={formServico.nome} onChange={(e) => handleChange(e, setFormServico)} required />
                </div>
                <div className="form-group">
                    <label className="form-label">Descrição</label>
                    <textarea name="descricao" className="form-control" rows="3" value={formServico.descricao} onChange={(e) => handleChange(e, setFormServico)}></textarea>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Preço (R$) *</label>
                        <input type="number" name="preco" className="form-control" value={formServico.preco} onChange={(e) => handleChange(e, setFormServico)} required min="0" step="0.01" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Duração (min) *</label>
                        <input type="number" name="duracao_em_minutos" className="form-control" value={formServico.duracao_em_minutos} onChange={(e) => handleChange(e, setFormServico)} required min="1" />
                    </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={processando}>
                  {processando ? 'Salvando...' : 'Cadastrar e Associar'}
                </button>
              </form>
            )}
            
          </div>
        </div>
      )}

      {/* Modal Associar/Criar Profissional */}
      {showAssociarProfissional && (
         <div className="modal-overlay" onClick={fecharModais}>
         <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
           <div className="modal-header">
             <h2 className="modal-title">Associar Profissional</h2>
             <button className="modal-close" onClick={fecharModais}>×</button>
           </div>
           
           {/* Botão de Toggle */}
            <button type="button" className="btn btn-link" onClick={() => setIsCreatingNew(!isCreatingNew)}>
              {isCreatingNew ? 'Ou, selecionar um profissional existente' : 'Ou, cadastrar um novo profissional para associar'}
            </button>
            
            {/* --- SEÇÃO DE SELECIONAR (Default) --- */}
            {!isCreatingNew && (
              <form onSubmit={handleAssociarProfissional} style={{marginTop: '10px'}}>
                <div className="form-group">
                  <label className="form-label">Selecione o Profissional *</label>
                  <select className="form-control" value={profissionalId} onChange={(e) => setProfissionalId(e.target.value)} required>
                    <option value="">-- Selecione --</option>
                    {profissionais.map(p => <option key={p.idUsuario} value={p.idUsuario}>{p.nome}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={processando}>
                  {processando ? 'Associando...' : 'Associar Profissional Existente'}
                </button>
              </form>
            )}
            
            {/* --- SEÇÃO DE CADASTRAR (Toggle) --- */}
            {isCreatingNew && (
              <form onSubmit={handleCriarEAssociarProfissional} style={{marginTop: '10px'}}>
                {/* ... (formulário completo de profissional) ... */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nome Completo *</label>
                    <input type="text" name="nome" className="form-control" value={formProfissional.nome} onChange={(e) => handleChange(e, setFormProfissional)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CPF *</label>
                    <input type="text" name="cpf" className="form-control" value={formProfissional.cpf} onChange={(e) => handleChange(e, setFormProfissional)} required placeholder="00000000000" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Data de Nascimento *</label>
                    <input type="date" name="data_nascimento" className="form-control" value={formProfissional.data_nascimento} onChange={(e) => handleChange(e, setFormProfissional)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone *</label>
                    <input type="text" name="telefone" className="form-control" value={formProfissional.telefone} onChange={(e) => handleChange(e, setFormProfissional)} required placeholder="00000000000" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input type="email" name="email" className="form-control" value={formProfissional.email} onChange={(e) => handleChange(e, setFormProfissional)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Senha *</label>
                    <input type="password" name="senha" className="form-control" value={formProfissional.senha} onChange={(e) => handleChange(e, setFormProfissional)} required minLength="6" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">CEP *</label>
                    <input type="text" name="cep" className="form-control" value={formProfissional.cep} onChange={(e) => handleChange(e, setFormProfissional)} required placeholder="00000000" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bairro *</label>
                    <input type="text" name="bairro" className="form-control" value={formProfissional.bairro} onChange={(e) => handleChange(e, setFormProfissional)} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Cidade *</label>
                    <input type="text" name="cidade" className="form-control" value={formProfissional.cidade} onChange={(e) => handleChange(e, setFormProfissional)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado (UF) *</label>
                    <input type="text" name="estado" className="form-control" value={formProfissional.estado} onChange={(e) => handleChange(e, setFormProfissional)} required placeholder="BA" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Complemento</label>
                    <input type="text" name="complemento" className="form-control" value={formProfissional.complemento} onChange={(e) => handleChange(e, setFormProfissional)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Registro Profissional</label>
                    <input type="text" name="registroProfissional" className="form-control" value={formProfissional.registroProfissional} onChange={(e) => handleChange(e, setFormProfissional)} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={processando}>
                  {processando ? 'Salvando...' : 'Cadastrar e Associar'}
                </button>
              </form>
            )}

         </div>
       </div>
      )}

    </>
  );
};

export default AdminEspecialidades;