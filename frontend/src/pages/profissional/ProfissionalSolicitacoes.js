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
  }, []);

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      const response = await profissionalAPI.buscarAgendamentos(user.idUsuario);
      const agendamentosAtivos = Array.from(response.data)
        .filter(a => a.status === 'AGENDADO');
      setAgendamentos(agendamentosAtivos);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (agendamento) => {
    setAgendamentoSelecionado(agendamento);
    setTipo('CANCELAR');
    setDescricao('');
    setShowModal(true);
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    setEnviando(true);

    try {
      const solicitacao = {
        agendamentoId: agendamentoSelecionado.idAgendamento,
        profissionalId: user.idUsuario,
        descricao,
        tipo
      };

      await solicitacaoAPI.criar(solicitacao);
      toast.success('Solicitação enviada com sucesso!');
      setShowModal(false);
      carregarAgendamentos();
    } catch (error) {
      toast.error('Erro ao enviar solicitação');
    } finally {
      setEnviando(false);
    }
  };

  const formatarData = (dataHora) => {
    return new Date(dataHora).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <h1 style={{ color: 'var(--primary-color)', marginBottom: '30px' }}>
          Solicitar Alteração/Cancelamento
        </h1>

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
                        <td>{ag.cliente?.nome}</td>
                        <td>{ag.servico?.nome}</td>
                        <td>
                          <button
                            className="btn btn-outline"
                            onClick={() => abrirModal(ag)}
                          >
                            Solicitar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>Nenhum agendamento ativo</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Nova Solicitação</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleEnviar}>
              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <select className="form-control" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
                  <option value="CANCELAR">Cancelamento</option>
                  <option value="ALTERAR">Alteração</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Motivo *</label>
                <textarea
                  className="form-control"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                  rows="4"
                  maxLength="500"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={enviando}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Enviar'}
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
