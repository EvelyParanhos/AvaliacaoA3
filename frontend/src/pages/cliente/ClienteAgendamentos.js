import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { clienteAPI, agendamentoAPI, avaliacaoAPI, solicitacaoAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const ClienteAgendamentos = () => {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [filtro, setFiltro] = useState('futuros');
  const [loading, setLoading] = useState(true);
  const [showModalCancelar, setShowModalCancelar] = useState(false);
  const [showModalReagendar, setShowModalReagendar] = useState(false);
  const [showModalAvaliar, setShowModalAvaliar] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [processando, setProcessando] = useState(false);

  const [novaDataHora, setNovaDataHora] = useState('');
  const [descricaoReagendamento, setDescricaoReagendamento] = useState('');
  
  const [avaliacao, setAvaliacao] = useState({
    nota: 5,
    comentario: ''
  });

  useEffect(() => {
    carregarAgendamentos();
  }, [filtro]);

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      const response = await clienteAPI.buscarAgendamentos(user.idUsuario, filtro);
      setAgendamentos(response.data);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataHora) => {
    const data = new Date(dataHora);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'AGENDADO': 'badge-info',
      'CONCLUÍDO': 'badge-success',
      'CANCELADO': 'badge-error',
      'ALTERADO': 'badge-warning'
    };
    return badges[status] || 'badge-info';
  };

  const podeCancelar = (agendamento) => {
    const dataAgendamento = new Date(agendamento.dataHora);
    const agora = new Date();
    const diferencaHoras = (dataAgendamento - agora) / (1000 * 60 * 60);
    
    return agendamento.status === 'AGENDADO' && diferencaHoras >= 24;
  };

  const podeReagendar = (agendamento) => {
    const dataAgendamento = new Date(agendamento.dataHora);
    const agora = new Date();
    const diferencaHoras = (dataAgendamento - agora) / (1000 * 60 * 60);
    
    return agendamento.status === 'AGENDADO' && diferencaHoras >= 24;
  };

  const podeAvaliar = (agendamento) => {
    return agendamento.status === 'CONCLUÍDO' && !agendamento.avaliacao;
  };

  const abrirModalCancelar = (agendamento) => {
    if (!podeCancelar(agendamento)) {
      toast.error('Não é possível cancelar agendamentos com menos de 24h de antecedência');
      return;
    }
    setAgendamentoSelecionado(agendamento);
    setShowModalCancelar(true);
  };

  const handleCancelar = async () => {
    setProcessando(true);
    try {
      const response = await agendamentoAPI.cancelar(agendamentoSelecionado.idAgendamento);
      if (response.status === 204) {
        toast.success('Agendamento cancelado com sucesso!');
        setShowModalCancelar(false);
        carregarAgendamentos();
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erro ao cancelar agendamento');
      }
      console.error('Erro ao cancelar:', error);
    } finally {
      setProcessando(false);
    }
  };

  const abrirModalReagendar = (agendamento) => {
    if (!podeReagendar(agendamento)) {
      toast.error('Não é possível reagendar agendamentos com menos de 24h de antecedência');
      return;
    }
    setAgendamentoSelecionado(agendamento);
    setNovaDataHora('');
    setDescricaoReagendamento('');
    setShowModalReagendar(true);
  };

  const handleReagendar = async (e) => {
    e.preventDefault();
    
    // Validar horário de funcionamento
    const dataHoraSelecionada = new Date(novaDataHora);
    const hora = dataHoraSelecionada.getHours();
    
    if (hora < 8 || hora >= 18) {
      toast.error('Horário fora do expediente. Funcionamos das 8h às 18h.');
      return;
    }

    if (dataHoraSelecionada < new Date()) {
      toast.error('Não é possível reagendar para data passada');
      return;
    }

    setProcessando(true);
    try {
      const solicitacao = {
        agendamentoId: agendamentoSelecionado.idAgendamento,
        profissionalId: agendamentoSelecionado.profissional.idUsuario,
        descricao: descricaoReagendamento || 'Solicitação de reagendamento',
        novaDataHora: novaDataHora
      };

      const response = await solicitacaoAPI.criarReagendamento(solicitacao);
      
      if (response.status === 201) {
        toast.success('Solicitação de reagendamento enviada! Aguarde aprovação.');
        setShowModalReagendar(false);
        carregarAgendamentos();
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erro ao solicitar reagendamento');
      }
      console.error('Erro ao reagendar:', error);
    } finally {
      setProcessando(false);
    }
  };

  const abrirModalAvaliar = (agendamento) => {
    if (!podeAvaliar(agendamento)) {
      toast.error('Apenas agendamentos concluídos podem ser avaliados');
      return;
    }
    setAgendamentoSelecionado(agendamento);
    setAvaliacao({ nota: 5, comentario: '' });
    setShowModalAvaliar(true);
  };

  const handleAvaliar = async (e) => {
    e.preventDefault();
    setProcessando(true);
    try {
      const response = await avaliacaoAPI.criar(agendamentoSelecionado.idAgendamento, avaliacao);
      
      if (response.status === 201) {
        toast.success('Avaliação enviada com sucesso!');
        setShowModalAvaliar(false);
        carregarAgendamentos();
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erro ao enviar avaliação');
      }
      console.error('Erro ao avaliar:', error);
    } finally {
      setProcessando(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando agendamentos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="fade-in">
          <h1 style={{ marginBottom: '10px', color: 'var(--primary-color)' }}>
            Meus Agendamentos 📅
          </h1>
          <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>
            Gerencie seus agendamentos
          </p>

          {/* Filtros */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-body">
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className={`btn ${filtro === 'futuros' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFiltro('futuros')}
                >
                  Próximos
                </button>
                <button
                  className={`btn ${filtro === 'passados' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFiltro('passados')}
                >
                  Passados
                </button>
                <button
                  className={`btn ${filtro === '' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFiltro('')}
                >
                  Todos
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Agendamentos */}
          {agendamentos.length > 0 ? (
            <div className="grid grid-2">
              {agendamentos.map((agendamento) => (
                <div key={agendamento.idAgendamento} className="card">
                  <div className="card-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{agendamento.servico?.nome}</span>
                      <span className={`badge ${getStatusBadge(agendamento.status)}`}>
                        {agendamento.status}
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    <p><strong>📅 Data:</strong> {formatarData(agendamento.dataHora)}</p>
                    <p><strong>👤 Profissional:</strong> {agendamento.profissional?.nome}</p>
                    <p><strong>💰 Valor:</strong> {formatarMoeda(agendamento.servico?.preco)}</p>
                    {agendamento.pagamentoParcial && (
                      <p style={{ fontSize: '0.9rem', color: 'var(--warning)' }}>
                        ⚠️ Pagamento parcial (50%)
                      </p>
                    )}
                    {agendamento.avaliacao && (
                      <div style={{ marginTop: '10px', padding: '10px', background: 'var(--background)', borderRadius: '5px' }}>
                        <p><strong>⭐ Sua avaliação:</strong> {agendamento.avaliacao.nota}/5</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                          {agendamento.avaliacao.comentario}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="card-footer">
                    {podeCancelar(agendamento) && (
                      <button
                        className="btn btn-danger"
                        onClick={() => abrirModalCancelar(agendamento)}
                      >
                        Cancelar
                      </button>
                    )}
                    {podeReagendar(agendamento) && (
                      <button
                        className="btn btn-outline"
                        onClick={() => abrirModalReagendar(agendamento)}
                      >
                        Reagendar
                      </button>
                    )}
                    {podeAvaliar(agendamento) && (
                      <button
                        className="btn btn-success"
                        onClick={() => abrirModalAvaliar(agendamento)}
                      >
                        Avaliar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <h2 className="empty-state-title">Nenhum agendamento encontrado</h2>
              <p>Você não tem agendamentos {filtro === 'futuros' ? 'futuros' : filtro === 'passados' ? 'passados' : ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Cancelar */}
      {showModalCancelar && (
        <div className="modal-overlay" onClick={() => setShowModalCancelar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirmar Cancelamento</h2>
              <button className="modal-close" onClick={() => setShowModalCancelar(false)}>×</button>
            </div>
            <p>Tem certeza que deseja cancelar este agendamento?</p>
            <p><strong>{agendamentoSelecionado?.servico?.nome}</strong></p>
            <p>{formatarData(agendamentoSelecionado?.dataHora)}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowModalCancelar(false)}
                disabled={processando}
              >
                Não
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleCancelar}
                disabled={processando}
              >
                {processando ? 'Cancelando...' : 'Sim, Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reagendar */}
      {showModalReagendar && (
        <div className="modal-overlay" onClick={() => setShowModalReagendar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Solicitar Reagendamento</h2>
              <button className="modal-close" onClick={() => setShowModalReagendar(false)}>×</button>
            </div>
            <form onSubmit={handleReagendar}>
              <div className="form-group">
                <label className="form-label">Nova Data e Hora *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={novaDataHora}
                  onChange={(e) => setNovaDataHora(e.target.value)}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Motivo (opcional)</label>
                <textarea
                  className="form-control"
                  value={descricaoReagendamento}
                  onChange={(e) => setDescricaoReagendamento(e.target.value)}
                  rows="3"
                  maxLength="500"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowModalReagendar(false)}
                  disabled={processando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={processando}
                >
                  {processando ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Avaliar */}
      {showModalAvaliar && (
        <div className="modal-overlay" onClick={() => setShowModalAvaliar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Avaliar Atendimento</h2>
              <button className="modal-close" onClick={() => setShowModalAvaliar(false)}>×</button>
            </div>
            <form onSubmit={handleAvaliar}>
              <div className="form-group">
                <label className="form-label">Nota (1 a 5) *</label>
                <div style={{ display: 'flex', gap: '10px', fontSize: '2rem' }}>
                  {[1, 2, 3, 4, 5].map((nota) => (
                    <span
                      key={nota}
                      onClick={() => setAvaliacao({ ...avaliacao, nota })}
                      style={{
                        cursor: 'pointer',
                        color: nota <= avaliacao.nota ? 'gold' : 'lightgray'
                      }}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Comentário *</label>
                <textarea
                  className="form-control"
                  value={avaliacao.comentario}
                  onChange={(e) => setAvaliacao({ ...avaliacao, comentario: e.target.value })}
                  rows="4"
                  required
                  maxLength="500"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowModalAvaliar(false)}
                  disabled={processando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{ flex: 1 }}
                  disabled={processando}
                >
                  {processando ? 'Enviando...' : 'Enviar Avaliação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ClienteAgendamentos;
