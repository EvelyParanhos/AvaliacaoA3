import React, { useState, useEffect } from 'react';
import { especialidadeAPI, servicoAPI, profissionalAPI, administradorAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const AdminEspecialidades = () => {
  const [especialidades, setEspecialidades] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModalCriar, setShowModalCriar] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [showModalAssociar, setShowModalAssociar] = useState(false);
  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState(null);
  const [tipoAssociacao, setTipoAssociacao] = useState('servico'); // 'servico' ou 'profissional'

  const [formNova, setFormNova] = useState({
    nome: '',
    descricao: ''
  });

  const [formEditar, setFormEditar] = useState({
    nome: '',
    descricao: ''
  });

  const [servicoSelecionado, setServicoSelecionado] = useState('');
  const [profissionalSelecionado, setProfissionalSelecionado] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [espRes, servRes, profRes] = await Promise.all([
        especialidadeAPI.listar(),
        servicoAPI.listar(),
        administradorAPI.listarProfissionais()
      ]);
      setEspecialidades(espRes.data);
      setServicos(servRes.data);
      setProfissionais(profRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCriar = async (e) => {
    e.preventDefault();
    try {
      await especialidadeAPI.criar(formNova);
      toast.success('Especialidade criada com sucesso!');
      setShowModalCriar(false);
      setFormNova({ nome: '', descricao: '' });
      carregarDados();
    } catch (error) {
      toast.error('Erro ao criar especialidade');
      console.error(error);
    }
  };

  const abrirModalEditar = (esp) => {
    setEspecialidadeSelecionada(esp);
    setFormEditar({
      nome: esp.nome,
      descricao: esp.descricao
    });
    setShowModalEditar(true);
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    try {
      await especialidadeAPI.atualizar(especialidadeSelecionada.idEspecialidade, formEditar);
      toast.success('Especialidade atualizada!');
      setShowModalEditar(false);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao atualizar especialidade');
      console.error(error);
    }
  };

  const handleDeletar = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta especialidade?')) {
      try {
        await especialidadeAPI.deletar(id);
        toast.success('Especialidade excluída!');
        carregarDados();
      } catch (error) {
        const mensagem = error.response?.data?.message || 
                        error.response?.data || 
                        'Erro ao excluir. Pode haver profissionais ou serviços associados.';
        toast.error(mensagem);
        console.error(error);
      }
    }
  };

  const abrirModalAssociar = (esp, tipo) => {
    setEspecialidadeSelecionada(esp);
    setTipoAssociacao(tipo);
    setServicoSelecionado('');
    setProfissionalSelecionado('');
    setShowModalAssociar(true);
  };

  const handleAssociar = async () => {
    try {
      if (tipoAssociacao === 'servico') {
        if (!servicoSelecionado) {
          toast.error('Selecione um serviço');
          return;
        }
        await especialidadeAPI.associarServico(
          especialidadeSelecionada.idEspecialidade,
          parseInt(servicoSelecionado)
        );
        toast.success('Serviço associado com sucesso!');
      } else {
        if (!profissionalSelecionado) {
          toast.error('Selecione um profissional');
          return;
        }
        await especialidadeAPI.associarProfissional(
          especialidadeSelecionada.idEspecialidade,
          parseInt(profissionalSelecionado)
        );
        toast.success('Profissional associado com sucesso!');
      }
      setShowModalAssociar(false);
      carregarDados();
    } catch (error) {
      toast.error('Erro ao associar');
      console.error(error);
    }
  };

  const handleDesassociarServico = async (especialidadeId, servicoId) => {
    if (window.confirm('Desassociar este serviço?')) {
      try {
        await especialidadeAPI.desassociarServico(especialidadeId, servicoId);
        toast.success('Serviço desassociado!');
        carregarDados();
      } catch (error) {
        toast.error('Erro ao desassociar');
      }
    }
  };

  const handleDesassociarProfissional = async (especialidadeId, profissionalId) => {
    if (window.confirm('Desassociar este profissional?')) {
      try {
        await especialidadeAPI.desassociarProfissional(especialidadeId, profissionalId);
        toast.success('Profissional desassociado!');
        carregarDados();
      } catch (error) {
        toast.error('Erro ao desassociar');
      }
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>Especialidades</h1>
          <button className="btn btn-primary" onClick={() => setShowModalCriar(true)}>
            + Nova Especialidade
          </button>
        </div>

        {especialidades.length > 0 ? (
          <div className="grid grid-2">
            {especialidades.map(esp => (
              <div key={esp.idEspecialidade} className="card">
                <div className="card-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{esp.nome}</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button 
                        className="btn btn-outline"
                        style={{ padding: '5px 10px', fontSize: '0.9rem' }}
                        onClick={() => abrirModalEditar(esp)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-danger"
                        style={{ padding: '5px 10px', fontSize: '0.9rem' }}
                        onClick={() => handleDeletar(esp.idEspecialidade)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <p style={{ marginBottom: '15px' }}>{esp.descricao}</p>
                  
                  <div style={{ marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong>Serviços Associados:</strong>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '3px 8px', fontSize: '0.85rem' }}
                        onClick={() => abrirModalAssociar(esp, 'servico')}
                      >
                        + Associar
                      </button>
                    </div>
                    {esp.servicos && esp.servicos.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {esp.servicos.map(serv => (
                          <span 
                            key={serv.id} 
                            className="badge badge-primary"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleDesassociarServico(esp.idEspecialidade, serv.id)}
                            title="Clique para desassociar"
                          >
                            {serv.nome} ×
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Nenhum serviço associado</p>
                    )}
                  </div>

                  <div style={{ marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong>Profissionais:</strong>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '3px 8px', fontSize: '0.85rem' }}
                        onClick={() => abrirModalAssociar(esp, 'profissional')}
                      >
                        + Associar
                      </button>
                    </div>
                    {esp.profissionais && esp.profissionais.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {esp.profissionais.map(prof => (
                          <span 
                            key={prof.idUsuario} 
                            className="badge badge-success"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleDesassociarProfissional(esp.idEspecialidade, prof.idUsuario)}
                            title="Clique para desassociar"
                          >
                            {prof.nome} ×
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Nenhum profissional associado</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🎓</div>
            <h2 className="empty-state-title">Nenhuma especialidade cadastrada</h2>
            <p>Crie especialidades para organizar seus serviços e profissionais</p>
          </div>
        )}
      </div>

      {/* Modal Criar */}
      {showModalCriar && (
        <div className="modal-overlay" onClick={() => setShowModalCriar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nova Especialidade</h2>
              <button className="modal-close" onClick={() => setShowModalCriar(false)}>×</button>
            </div>
            <form onSubmit={handleCriar}>
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formNova.nome}
                  onChange={(e) => setFormNova({ ...formNova, nome: e.target.value })}
                  required
                  minLength="3"
                  maxLength="100"
                  placeholder="Ex: Estética Facial"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição *</label>
                <textarea
                  className="form-control"
                  value={formNova.descricao}
                  onChange={(e) => setFormNova({ ...formNova, descricao: e.target.value })}
                  required
                  maxLength="500"
                  rows="3"
                  placeholder="Descreva esta especialidade..."
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModalCriar(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showModalEditar && (
        <div className="modal-overlay" onClick={() => setShowModalEditar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Especialidade</h2>
              <button className="modal-close" onClick={() => setShowModalEditar(false)}>×</button>
            </div>
            <form onSubmit={handleEditar}>
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formEditar.nome}
                  onChange={(e) => setFormEditar({ ...formEditar, nome: e.target.value })}
                  required
                  minLength="3"
                  maxLength="100"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição *</label>
                <textarea
                  className="form-control"
                  value={formEditar.descricao}
                  onChange={(e) => setFormEditar({ ...formEditar, descricao: e.target.value })}
                  required
                  maxLength="500"
                  rows="3"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModalEditar(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Associar */}
      {showModalAssociar && (
        <div className="modal-overlay" onClick={() => setShowModalAssociar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Associar {tipoAssociacao === 'servico' ? 'Serviço' : 'Profissional'}
              </h2>
              <button className="modal-close" onClick={() => setShowModalAssociar(false)}>×</button>
            </div>
            <p>Especialidade: <strong>{especialidadeSelecionada?.nome}</strong></p>
            <div className="form-group">
              <label className="form-label">
                Selecione {tipoAssociacao === 'servico' ? 'o serviço' : 'o profissional'} *
              </label>
              {tipoAssociacao === 'servico' ? (
                <select
                  className="form-control"
                  value={servicoSelecionado}
                  onChange={(e) => setServicoSelecionado(e.target.value)}
                  required
                >
                  <option value="">Selecione um serviço</option>
                  {servicos.map(serv => (
                    <option key={serv.id} value={serv.id}>{serv.nome}</option>
                  ))}
                </select>
              ) : (
                <select
                  className="form-control"
                  value={profissionalSelecionado}
                  onChange={(e) => setProfissionalSelecionado(e.target.value)}
                  required
                >
                  <option value="">Selecione um profissional</option>
                  {profissionais.map(prof => (
                    <option key={prof.idUsuario} value={prof.idUsuario}>{prof.nome}</option>
                  ))}
                </select>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModalAssociar(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAssociar}>
                Associar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminEspecialidades;