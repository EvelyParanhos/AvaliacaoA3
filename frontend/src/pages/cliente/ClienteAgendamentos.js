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
    if (user?.idUsuario) {
      carregarAgendamentos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, user]);

  const carregarAgendamentos = async () => {
    if (!user?.idUsuario) {
      toast.error('Usuário não identificado');
      return;
    }

    try {
      setLoading(true);
      
      // Busca TODOS os agendamentos do cliente
      const response = await clienteAPI.buscarAgendamentos(user.idUsuario, '');
      
      if (!response.data) {
        setAgendamentos([]);
        return;
      }

      const agora = new Date();
      let agendamentosFiltrados = [];

      // Aplica o filtro localmente
      if (filtro === 'futuros') {
        agendamentosFiltrados = response.data.filter(ag => {
          const dataAgendamento = new Date(ag.dataHora);
          const statusValido = ag.status === 'AGENDADO' || ag.status === 'ALTERADO';
          return statusValido && dataAgendamento > agora;
        });
      } else if (filtro === 'passados') {
        agendamentosFiltrados = response.data.filter(ag => {
          const dataAgendamento = new Date(ag.dataHora);
          return ag.status === 'CONCLUÍDO' || 
                 ag.status === 'CANCELADO' || 
                 dataAgendamento <= agora;
        });
      } else {
        // Todos
        agendamentosFiltrados = response.data;
      }

      // Ordena por data (mais recentes primeiro para passados, próximos primeiro para futuros)
      agendamentosFiltrados.sort((a, b) => {
        const dataA = new Date(a.dataHora);
        const dataB = new Date(b.dataHora);
        return filtro === 'passados' ? dataB - dataA : dataA - dataB;
      });

      setAgendamentos(agendamentosFiltrados);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataHora) => {
    if (!dataHora) return 'Data inválida';
    try {
      const data = new Date(dataHora);
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const formatarMoeda = (valor) => {
    if (!valor) return 'R$ 0,00';
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

  const getStatusTexto = (status) => {
    const textos = {
      'AGENDADO': 'Agendado',
      'CONCLUÍDO': 'Concluído',
      'CANCELADO': 'Cancelado',
      'ALTERADO': 'Alterado'
    };
    return textos[status] || status;
  };

  const podeCancelar = (agendamento) => {
    if (!agendamento || !agendamento.dataHora) return false;
    
    try {
      const dataAgendamento = new Date(agendamento.dataHora);
      const agora = new Date();
      const diferencaHoras = (dataAgendamento - agora) / (1000 * 60 * 60);
      
      return agendamento.status === 'AGENDADO' && diferencaHoras >= 24;
    } catch (error) {
      return false;
    }
  };

  const podeReagendar = (agendamento) => {
    if (!agendamento || !agendamento.dataHora) return false;
    
    try {
      const dataAgendamento = new Date(agendamento.dataHora);
      const agora = new Date();
      const diferencaHoras = (dataAgendamento - agora) / (1000 * 60 * 60);
      
      return agendamento.status === 'AGENDADO' && diferencaHoras >= 24;
    } catch (error) {
      return false;
    }
  };

  const podeAvaliar = (agendamento) => {
    return agendamento && 
           agendamento.status === 'CONCLUÍDO' && 
           !agendamento.avaliacao;
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
    if (!agendamentoSelecionado?.idAgendamento) {
      toast.error('Agendamento inválido');
      return;
    }

    setProcessando(true);
    try {
      const response = await agendamentoAPI.cancelar(agendamentoSelecionado.idAgendamento);
      
      if (response.status === 204 || response.status === 200) {
        toast.success('Agendamento cancelado com sucesso!');
        setShowModalCancelar(false);
        setAgendamentoSelecionado(null);
        carregarAgendamentos();
      }
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      const mensagem = error.response?.data?.message || 
                      error.response?.data || 
                      'Erro ao cancelar agendamento';
      toast.error(mensagem);
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

  const validarReagendamento = (dataHoraString) => {
    if (!dataHoraString) {
      toast.error('Selecione uma nova data e hora');
      return false;
    }

    const dataHoraSelecionada = new Date(dataHoraString);
    const agora = new Date();

    if (dataHoraSelecionada <= agora) {
      toast.error('Não é possível reagendar para data passada');
      return false;
    }

    const hora = dataHoraSelecionada.getHours();
    if (hora < 8 || hora >= 18) {
      toast.error('Horário fora do expediente (8h-18h)');
      return false;
    }

    const diaSemana = dataHoraSelecionada.getDay();
    if (diaSemana === 0) {
      toast.error('A clínica não funciona aos domingos');
      return false;
    }

    return true;
  };

  const handleReagendar = async (e) => {
    e.preventDefault();
    
    if (!agendamentoSelecionado?.idAgendamento) {
      toast.error('Agendamento inválido');
      return;
    }

    if (!novaDataHora) {
      toast.error('Selecione uma nova data e hora');
      return;
    }
    
    if (!validarReagendamento(novaDataHora)) {
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

      console.log('Enviando solicitação de reagendamento:', solicitacao);

      const response = await solicitacaoAPI.criarReagendamento(solicitacao);
      
      if (response.status === 201) {
        toast.success('Solicitação de reagendamento enviada! Aguarde aprovação do administrador.');
        setShowModalReagendar(false);
        setAgendamentoSelecionado(null);
        setNovaDataHora('');
        setDescricaoReagendamento('');
        carregarAgendamentos();
      }
    } catch (error) {
      console.error('Erro ao reagendar:', error);
      const mensagem = error.response?.data?.message || 
                      error.response?.data || 
                      'Erro ao solicitar reagendamento';
      toast.error(mensagem);
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
    
    if (!agendamentoSelecionado?.idAgendamento) {
      toast.error('Agendamento inválido');
      return;
    }

    if (!avaliacao.comentario || avaliacao.comentario.trim().length === 0) {
      toast.error('Por favor, escreva um comentário sobre o atendimento');
      return;
    }

    if (avaliacao.comentario.trim().length < 10) {
      toast.error('O comentário deve ter pelo menos 10 caracteres');
      return;
    }

    setProcessando(true);
    try {
      const response = await avaliacaoAPI.criar(agendamentoSelecionado.idAgendamento, avaliacao);
      
      if (response.status === 201) {
        toast.success('Avaliação enviada com sucesso! Obrigado pelo seu feedback.');
        setShowModalAvaliar(false);
        setAgendamentoSelecionado(null);
        setAvaliacao({ nota: 5, comentario: '' });
        carregarAgendamentos();
      }
    } catch (error) {
      console.error('Erro ao avaliar:', error);
      const mensagem = error.response?.data?.message || 
                      error.response?.data || 
                      'Erro ao enviar avaliação';
      toast.error(mensagem);
    } finally {
      setProcessando(false);
    }
  };

  const getMinDateTime = () => {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(8, 0, 0, 0);
    
    const ano = amanha.getFullYear();
    const mes = String(amanha.getMonth() + 1).padStart(2, '0');
    const dia = String(amanha.getDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}T08:00`;
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
                  📅 Próximos ({agendamentos.filter(a => {
                    const dataAg = new Date(a.dataHora);
                    const agora = new Date();
                    return (a.status === 'AGENDADO' || a.status === 'ALTERADO') && dataAg > agora;
                  }).length})
                </button>
                <button
                  className={`btn ${filtro === 'passados' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFiltro('passados')}
                >
                  📋 Passados
                </button>
                <button
                  className={`btn ${filtro === '' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setFiltro('')}
                >
                  📊 Todos
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ fontWeight: 'bold' }}>
                        {agendamento.servico?.nome || 'Serviço não informado'}
                      </span>
                      <span className={`badge ${getStatusBadge(agendamento.status)}`}>
                        {getStatusTexto(agendamento.status)}
                      </span>
                    </div>
                  </div>
                  <div className="card-body">
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '5px 0' }}>
                        <strong>📅 Data e Hora:</strong> {formatarData(agendamento.dataHora)}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>👤 Profissional:</strong> {agendamento.profissional?.nome || 'Não informado'}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>💰 Valor:</strong> {formatarMoeda(agendamento.servico?.preco)}
                      </p>
                      {agendamento.pagamentoParcial && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--warning)', margin: '5px 0' }}>
                          ⚠️ Pagamento parcial (50% pago)
                        </p>
                      )}
                    </div>

                    {agendamento.avaliacao && (
                      <div style={{ 
                        marginTop: '15px', 
                        padding: '12px', 
                        background: 'var(--background)', 
                        borderRadius: '5px',
                        borderLeft: '3px solid var(--success)'
                      }}>
                        <p style={{ margin: '0 0 8px 0' }}>
                          <strong>⭐ Sua avaliação:</strong> {agendamento.avaliacao.nota}/5
                        </p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', margin: 0 }}>
                          "{agendamento.avaliacao.comentario}"
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {(podeCancelar(agendamento) || podeReagendar(agendamento) || podeAvaliar(agendamento)) && (
                    <div className="card-footer">
                      {podeCancelar(agendamento) && (
                        <button
                          className="btn btn-danger"
                          onClick={() => abrirModalCancelar(agendamento)}
                        >
                          ❌ Cancelar
                        </button>
                      )}
                      {podeReagendar(agendamento) && (
                        <button
                          className="btn btn-outline"
                          onClick={() => abrirModalReagendar(agendamento)}
                        >
                          📝 Reagendar
                        </button>
                      )}
                      {podeAvaliar(agendamento) && (
                        <button
                          className="btn btn-success"
                          onClick={() => abrirModalAvaliar(agendamento)}
                        >
                          ⭐ Avaliar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <h2 className="empty-state-title">Nenhum agendamento encontrado</h2>
              <p>
                {filtro === 'futuros' && 'Você não tem agendamentos futuros'}
                {filtro === 'passados' && 'Você não tem agendamentos passados'}
                {!filtro && 'Você ainda não fez nenhum agendamento'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Cancelar */}
      {showModalCancelar && agendamentoSelecionado && (
        <div className="modal-overlay" onClick={() => !processando && setShowModalCancelar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">⚠️ Confirmar Cancelamento</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowModalCancelar(false)}
                disabled={processando}
              >
                ×
              </button>
            </div>
            
            <p style={{ marginBottom: '15px' }}>
              Tem certeza que deseja cancelar este agendamento?
            </p>
            
            <div style={{ 
              padding: '15px', 
              backgroundColor: 'var(--background)', 
              borderRadius: '5px',
              marginBottom: '15px'
            }}>
              <p><strong>Serviço:</strong> {agendamentoSelecionado.servico?.nome}</p>
              <p><strong>Data/Hora:</strong> {formatarData(agendamentoSelecionado.dataHora)}</p>
              <p><strong>Profissional:</strong> {agendamentoSelecionado.profissional?.nome}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowModalCancelar(false)}
                disabled={processando}
              >
                Não, manter agendamento
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleCancelar}
                disabled={processando}
              >
                {processando ? 'Cancelando...' : 'Sim, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reagendar */}
      {showModalReagendar && agendamentoSelecionado && (
        <div className="modal-overlay" onClick={() => !processando && setShowModalReagendar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">📝 Solicitar Reagendamento</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowModalReagendar(false)}
                disabled={processando}
              >
                ×
              </button>
            </div>
            
            <div style={{ 
              padding: '15px', 
              backgroundColor: 'var(--background)', 
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <p><strong>Agendamento atual:</strong></p>
              <p>{agendamentoSelecionado.servico?.nome}</p>
              <p>{formatarData(agendamentoSelecionado.dataHora)}</p>
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
                  min={getMinDateTime()}
                />
                <small style={{ color: 'var(--text-light)', fontSize: '0.85rem', display: 'block', marginTop: '5px' }}>
                  ⏰ Horário: Segunda a Sábado, das 8h às 18h
                </small>
              </div>
              
              <div className="form-group">
                <label className="form-label">Motivo (opcional)</label>
                <textarea
                  className="form-control"
                  value={descricaoReagendamento}
                  onChange={(e) => setDescricaoReagendamento(e.target.value)}
                  rows="3"
                  maxLength="500"
                  placeholder="Descreva o motivo do reagendamento (opcional)"
                />
                <small style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                  {descricaoReagendamento.length}/500 caracteres
                </small>
              </div>

              <div style={{ 
                padding: '12px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '5px',
                marginBottom: '15px',
                border: '1px solid #ffc107'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#856404' }}>
                  ℹ️ Sua solicitação será enviada ao administrador para aprovação
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
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
      {showModalAvaliar && agendamentoSelecionado && (
        <div className="modal-overlay" onClick={() => !processando && setShowModalAvaliar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">⭐ Avaliar Atendimento</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowModalAvaliar(false)}
                disabled={processando}
              >
                ×
              </button>
            </div>
            
            <div style={{ 
              padding: '15px', 
              backgroundColor: 'var(--background)', 
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <p><strong>Serviço:</strong> {agendamentoSelecionado.servico?.nome}</p>
              <p><strong>Profissional:</strong> {agendamentoSelecionado.profissional?.nome}</p>
              <p><strong>Data:</strong> {formatarData(agendamentoSelecionado.dataHora)}</p>
            </div>

            <form onSubmit={handleAvaliar}>
              <div className="form-group">
                <label className="form-label">Nota (1 a 5) *</label>
                <div style={{ 
                  display: 'flex', 
                  gap: '15px', 
                  fontSize: '2.5rem', 
                  justifyContent: 'center',
                  margin: '20px 0'
                }}>
                  {[1, 2, 3, 4, 5].map((nota) => (
                    <span
                      key={nota}
                      onClick={() => setAvaliacao({ ...avaliacao, nota })}
                      style={{
                        cursor: 'pointer',
                        color: nota <= avaliacao.nota ? 'gold' : 'lightgray',
                        transition: 'all 0.2s',
                        transform: nota <= avaliacao.nota ? 'scale(1.1)' : 'scale(1)',
                        textShadow: nota <= avaliacao.nota ? '0 0 10px rgba(255, 215, 0, 0.5)' : 'none'
                      }}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <p style={{ 
                  textAlign: 'center', 
                  marginTop: '10px', 
                  color: 'var(--primary-color)',
                  fontWeight: 'bold',
                  fontSize: '1.1rem'
                }}>
                  {avaliacao.nota} {avaliacao.nota === 1 ? 'estrela' : 'estrelas'}
                </p>
              </div>
              
              <div className="form-group">
                <label className="form-label">Seu comentário *</label>
                <textarea
                  className="form-control"
                  value={avaliacao.comentario}
                  onChange={(e) => setAvaliacao({ ...avaliacao, comentario: e.target.value })}
                  rows="5"
                  required
                  minLength="10"
                  maxLength="500"
                  placeholder="Conte-nos sobre sua experiência... O que você achou do atendimento? O profissional foi atencioso? O resultado foi satisfatório?"
                  style={{ resize: 'vertical' }}
                />
                <small style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                  {avaliacao.comentario.length}/500 caracteres (mínimo 10)
                </small>
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
                  disabled={processando || avaliacao.comentario.length < 10}
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