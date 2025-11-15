import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { servicoAPI, profissionalAPI, agendamentoAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const ClienteServicos = () => {
  const { user } = useAuth();
  const [servicos, setServicos] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [agendando, setAgendando] = useState(false);
  
  const [formAgendamento, setFormAgendamento] = useState({
    profissionalId: '',
    dataHora: '',
    pagamentoParcial: false
  });

  useEffect(() => {
    carregarServicos();
  }, []);

  const carregarServicos = async () => {
    try {
      setLoading(true);
      const response = await servicoAPI.listar();
      setServicos(response.data);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const carregarProfissionais = async () => {
    try {
      // Buscar todos os profissionais através da API de administrador
      // Como não temos endpoint público, vamos usar uma simulação
      // Em produção, você precisaria de um endpoint público para listar profissionais
      setProfissionais([]);
      toast.info('Seleção automática de profissional');
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const abrirModalAgendamento = async (servico) => {
    setServicoSelecionado(servico);
    await carregarProfissionais();
    setShowModal(true);
    // Reset form
    setFormAgendamento({
      profissionalId: '1', // ID fixo para teste - em produção, selecionar da lista
      dataHora: '',
      pagamentoParcial: false
    });
  };

  const handleAgendamento = async (e) => {
    e.preventDefault();
    
    // Validar horário de funcionamento (8h-18h)
    const dataHoraSelecionada = new Date(formAgendamento.dataHora);
    const hora = dataHoraSelecionada.getHours();
    
    if (hora < 8 || hora >= 18) {
      toast.error('Horário fora do expediente. Funcionamos das 8h às 18h.');
      return;
    }

    // Validar data futura
    if (dataHoraSelecionada < new Date()) {
      toast.error('Não é possível agendar em data passada');
      return;
    }

    setAgendando(true);

    try {
      const agendamento = {
        cliente: {
          idUsuario: user.idUsuario
        },
        profissional: {
          idUsuario: parseInt(formAgendamento.profissionalId)
        },
        servico: {
          id: servicoSelecionado.id
        },
        dataHora: formAgendamento.dataHora,
        pagamentoParcial: formAgendamento.pagamentoParcial,
        status: 'AGENDADO'
      };

      const response = await agendamentoAPI.criar(agendamento);
      
      if (response.status === 201) {
        const valorPago = formAgendamento.pagamentoParcial 
          ? servicoSelecionado.preco / 2 
          : servicoSelecionado.preco;
        
        toast.success(
          `Agendamento realizado com sucesso! Valor ${formAgendamento.pagamentoParcial ? 'de entrada' : 'total'}: ${formatarMoeda(valorPago)}`
        );
        setShowModal(false);
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erro ao realizar agendamento. Tente novamente.');
      }
      console.error('Erro no agendamento:', error);
    } finally {
      setAgendando(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando serviços...</p>
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
            Nossos Serviços 💅
          </h1>
          <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>
            Escolha o serviço perfeito para você e agende seu horário
          </p>

          {servicos.length > 0 ? (
            <div className="grid grid-3">
              {servicos.map((servico) => (
                <div key={servico.id} className="card">
                  <div className="card-header">{servico.nome}</div>
                  <div className="card-body">
                    <p style={{ color: 'var(--text-light)', marginBottom: '15px', minHeight: '60px' }}>
                      {servico.descricao}
                    </p>
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontWeight: '500' }}>Preço:</span>
                        <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                          {formatarMoeda(servico.preco)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: '500' }}>Duração:</span>
                        <span style={{ color: 'var(--text-light)' }}>
                          {servico.duracao_em_minutos} minutos
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => abrirModalAgendamento(servico)}
                    >
                      Agendar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💅</div>
              <h2 className="empty-state-title">Nenhum serviço disponível</h2>
              <p>Não há serviços cadastrados no momento</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Agendamento */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Agendar {servicoSelecionado?.nome}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleAgendamento}>
              <div className="form-group">
                <label className="form-label">Serviço</label>
                <input
                  type="text"
                  className="form-control"
                  value={servicoSelecionado?.nome}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor</label>
                <input
                  type="text"
                  className="form-control"
                  value={formatarMoeda(servicoSelecionado?.preco)}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Data e Hora *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formAgendamento.dataHora}
                  onChange={(e) => setFormAgendamento({ ...formAgendamento, dataHora: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
                <small style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                  Horário de funcionamento: 8h às 18h
                </small>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formAgendamento.pagamentoParcial}
                    onChange={(e) => setFormAgendamento({ ...formAgendamento, pagamentoParcial: e.target.checked })}
                  />
                  <span>
                    Pagar 50% agora ({formatarMoeda(servicoSelecionado?.preco / 2)}) e o restante no atendimento
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                  disabled={agendando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={agendando}
                >
                  {agendando ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ClienteServicos;
