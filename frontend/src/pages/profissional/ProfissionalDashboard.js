import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { profissionalAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const ProfissionalDashboard = () => {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const carregarAgendamentos = async () => {
    try {
      setLoading(true);
      const response = await profissionalAPI.buscarAgendamentos(user.idUsuario);
      // Filtrar apenas agendamentos futuros e ordenar
      const agendamentosFuturos = Array.from(response.data)
        .filter(a => new Date(a.dataHora) > new Date() && a.status === 'AGENDADO')
        .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora))
        .slice(0, 10);
      setAgendamentos(agendamentosFuturos);
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agenda');
    } finally {
      setLoading(false);
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
            <p>Carregando...</p>
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
          Olá, {user.nome}! 👋
        </h1>

        <div className="card">
          <div className="card-header">📅 Próximos Atendimentos</div>
          <div className="card-body">
            {agendamentos.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data/Hora</th>
                      <th>Cliente</th>
                      <th>Serviço</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentos.map(ag => (
                      <tr key={ag.idAgendamento}>
                        <td>{formatarData(ag.dataHora)}</td>
                        <td>{ag.cliente?.nome}</td>
                        <td>{ag.servico?.nome}</td>
                        <td><span className="badge badge-info">{ag.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>Nenhum atendimento agendado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfissionalDashboard;
