import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { profissionalAPI, solicitacaoAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const ProfissionalSolicitacoes = () => {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
  const [tipo, setTipo] = useState('CANCELAR');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    carregarAgendamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarAgendamentos = async () => {
    if (!user?.idUsuario) {
      toast.error('Usuário não identificado');
      return;
    }

    try {
      setLoading(true);
      const response = await profissionalAPI.buscarAgendamentos(user.idUsuario);
      
      if (!response.data) {
        setAgendamentos([]);
        return;
      }

      // CORREÇÃO: Filtrar apenas agendamentos ativos do profissional logado
      const agora = new Date();
      const agendamentosAtivos = Array.from(response.data)
        .filter(a => 
          a.profissional?.idUsuario === user.idUsuario &&
          a.status === 'AGENDADO' &&
          new Date(a.dataHora) > agora
        )
        .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora));
        
      setAgendamentos(agendamentosAtivos);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar agendamentos');
      setAgendamentos([]);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (agendamento) => {
    if (!agendamento || !agendamento.idAgendamento) {
      toast.error('Agendamento inválido');
      return;
    }
    setAgendamentoSelecionado(agendamento);
    setTipo('CANCELAR');
    setDescricao('');
    setShowModal(true);
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    
    // VALIDAÇÕES BÁSICAS
    if (!agendamentoSelecionado?.idAgendamento) {
      toast.error('Agendamento inválido');
      console.error('Agendamento selecionado:', agendamentoSelecionado);
      return;
    }
    
    if (!user?.idUsuario) {
      toast.error('Usuário não identificado');
      console.error('User:', user);
      return;
    }

    if (!descricao || descricao.trim().length === 0) {
      toast.error('Por favor, descreva o motivo da solicitação');
      return;
    }

    if (descricao.trim().length < 10) {
      toast.error('A descrição deve ter pelo menos 10 caracteres');
      return;
    }
    
    setEnviando(true);

    try {
      // CORREÇÃO: Enviar dados no formato correto
      const solicitacao = {
        agendamentoId: agendamentoSelecionado.idAgendamento,
        profissionalId: user.idUsuario,
        descricao: descricao.trim(),
        tipo: tipo
      };

      console.log('Enviando solicitação:', solicitacao);
      
      const response = await solicitacaoAPI.criar(solicitacao);
      
      if (response.status === 201) {
        toast.success('Solicitação enviada com sucesso! Aguarde aprovação do administrador.');
        setShowModal(false);
        setDescricao('');
        setAgendamentoSelecionado(null);
        carregarAgendamentos();
      }
    } catch (error) {
      console.error('Erro completo:', error);
      console.error('Response:', error.response);
      
      const mensagem = error.response?.data?.message || 
                      error.response?.data || 
                      'Erro ao enviar solicitação. Verifique os dados e tente novamente.';
      toast.error(mensagem);
    } finally {
      setEnviando(false);
    }
  };

  const formatarData = (dataHora) => {
    if (!dataHora) return 'Data inválida';
    try {
      return new Date(dataHora).toLocaleString('pt-BR', {
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
      <div className="container fade-in">
        <h1 style={{ color: 'var(--primary-color)', marginBottom: '10px' }}>
          Solicitar Alteração/Cancelamento 📋
        </h1>
        <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>
          Envie uma solicitação ao administrador para alterar ou cancelar um agendamento
        </p>

        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '5px',
          marginBottom: '20px',
          border: '1px solid #2196f3'
        }}>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#1565c0' }}>
            ℹ️ <strong>Importante:</strong> Todas as solicitações precisam ser aprovadas pelo administrador. 
            Você receberá uma notificação após a análise.
          </p>
        </div>

        <div className="card">
          <div className="card-header">Seus Agendamentos Ativos</div>
          <div className="card-body">
            {agendamentos.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data/Hora</th>
                      <th>Cliente</th>
                      <th>Serviço</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentos.map(ag => (
                      <tr key={ag.idAgendamento}>
                        <td>{formatarData(ag.dataHora)}</td>
                        <td>{ag.cliente?.nome || 'Cliente não informado'}</td>
                        <td>{ag.servico?.nome || 'Serviço não informado'}</td>
                        <td>
                          <button
                            className="btn btn-outline"
                            onClick={() => abrirModal(ag)}
                          >
                            📝 Solicitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <h2 className="empty-state-title">Nenhum agendamento ativo</h2>
                <p>Você não tem agendamentos futuros para gerenciar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && agendamentoSelecionado && (
        <div className="modal-overlay" onClick={() => !enviando && setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nova Solicitação</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
                disabled={enviando}
              >
                ×
              </button>
            </div>
            
            <div style={{ 
              marginBottom: '20px', 
              padding: '15px', 
              backgroundColor: 'var(--background)', 
              borderRadius: '5px' 
            }}>
              <p style={{ margin: '5px 0' }}><strong>Agendamento:</strong></p>
              <p style={{ margin: '5px 0' }}>Cliente: {agendamentoSelecionado.cliente?.nome}</p>
              <p style={{ margin: '5px 0' }}>Serviço: {agendamentoSelecionado.servico?.nome}</p>
              <p style={{ margin: '5px 0' }}>Data/Hora: {formatarData(agendamentoSelecionado.dataHora)}</p>
            </div>

            <form onSubmit={handleEnviar}>
              <div className="form-group">
                <label className="form-label">Tipo de Solicitação *</label>
                <select 
                  className="form-control" 
                  value={tipo} 
                  onChange={(e) => setTipo(e.target.value)} 
                  required
                  disabled={enviando}
                >
                  <option value="CANCELAR">Cancelamento</option>
                  <option value="ALTERAR">Alteração</option>
                </select>
                <small style={{ color: 'var(--text-light)', fontSize: '0.85rem', display: 'block', marginTop: '5px' }}>
                  {tipo === 'CANCELAR' 
                    ? '🚫 Solicite o cancelamento deste agendamento' 
                    : '✏️ Solicite uma alteração (data, horário, etc.)'}
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Motivo da Solicitação *</label>
                <textarea
                  className="form-control"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                  minLength="10"
                  rows="5"
                  maxLength="500"
                  placeholder="Descreva detalhadamente o motivo da sua solicitação... (mínimo 10 caracteres)"
                  disabled={enviando}
                  style={{ resize: 'vertical' }}
                />
                <small style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                  {descricao.length}/500 caracteres (mínimo 10)
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
                  ⚠️ <strong>Atenção:</strong> Esta solicitação será enviada ao administrador para aprovação. 
                  Você será notificado sobre a decisão.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }} 
                  onClick={() => setShowModal(false)} 
                  disabled={enviando}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }} 
                  disabled={enviando || descricao.trim().length < 10}
                >
                  {enviando ? 'Enviando...' : '📤 Enviar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfissionalSolicitacoes;