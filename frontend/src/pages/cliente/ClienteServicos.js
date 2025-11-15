import React, { useState, useEffect } from 'react';
import { servicoAPI, agendamentoAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const ClienteServicos = () => {
  const { user } = useAuth();
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [processando, setProcessando] = useState(false);
  
  // State para o agendamento
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [profissionais, setProfissionais] = useState([]);
  const [profissionalId, setProfissionalId] = useState('');
  const [dataHora, setDataHora] = useState('');
  const [pagamentoParcial, setPagamentoParcial] = useState(false);

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

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(valor);
  };

  const abrirModalAgendar = async (servico) => {
    try {
      setLoading(true);
      const response = await servicoAPI.listarProfissionais(servico.id);
      
      if (!response.data || response.data.length === 0) {
        toast.warning('Nenhum profissional disponível para este serviço no momento');
        return;
      }
      
      setProfissionais(response.data);
      setServicoSelecionado(servico);
      setProfissionalId('');
      setDataHora('');
      setPagamentoParcial(false);
      setShowModal(true);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      toast.error('Erro ao buscar profissionais para este serviço');
    } finally {
      setLoading(false);
    }
  };

  // FUNÇÃO CRÍTICA: Validar data e hora antes de enviar
  const validarDataHora = (dataHoraString) => {
    if (!dataHoraString) {
      toast.error('Selecione uma data e hora');
      return false;
    }

    // Converte string para objeto Date
    const dataHoraSelecionada = new Date(dataHoraString);
    const agora = new Date();

    // Valida se a data não é no passado
    if (dataHoraSelecionada <= agora) {
      toast.error('Não é possível agendar em data passada');
      return false;
    }

    // Valida horário de funcionamento (8h às 18h)
    const hora = dataHoraSelecionada.getHours();
    
    if (hora < 8) {
      toast.error('Horário de funcionamento: das 8h às 18h. Horário selecionado é muito cedo.');
      return false;
    }
    
    if (hora >= 18) {
      toast.error('Horário de funcionamento: das 8h às 18h. Horário selecionado é muito tarde.');
      return false;
    }

    // Valida dia da semana (opcional - se a clínica não funciona em certos dias)
    const diaSemana = dataHoraSelecionada.getDay();
    if (diaSemana === 0) { // Domingo
      toast.error('A clínica não funciona aos domingos');
      return false;
    }

    return true;
  };

  const handleAgendar = async (e) => {
    e.preventDefault();
    
    // Validações iniciais
    if (!servicoSelecionado) {
      toast.error('Serviço não selecionado');
      return;
    }

    if (!profissionalId) {
      toast.error('Selecione um profissional');
      return;
    }

    if (!dataHora) {
      toast.error('Selecione uma data e hora');
      return;
    }

    // Valida data e hora
    if (!validarDataHora(dataHora)) {
      return;
    }

    setProcessando(true);
    
    try {
      // Prepara o objeto de agendamento
      const novoAgendamento = {
        dataHora: dataHora, // Formato: "2024-12-20T14:30"
        pagamentoParcial: pagamentoParcial,
        cliente: { 
          idUsuario: user.idUsuario 
        },
        profissional: { 
          idUsuario: parseInt(profissionalId, 10) 
        },
        servico: { 
          id: servicoSelecionado.id 
        }
      };

      console.log('Enviando agendamento:', novoAgendamento);

      const response = await agendamentoAPI.criar(novoAgendamento);
      
      if (response.status === 201) {
        toast.success('Agendamento realizado com sucesso!');
        setShowModal(false);
        
        // Opcional: redirecionar para página de agendamentos
        // navigate('/cliente/agendamentos');
      }
    } catch (error) {
      console.error('Erro completo:', error);
      console.error('Response:', error.response);
      
      // Tratamento de erros específicos
      if (error.response) {
        const mensagem = error.response.data?.message || 
                        error.response.data || 
                        'Erro ao realizar agendamento';
        
        if (mensagem.includes('Horário indisponível')) {
          toast.error('Este horário já está ocupado. Escolha outro horário.');
        } else if (mensagem.includes('Horário fora do expediente')) {
          toast.error('Horário fora do expediente (8h-18h)');
        } else if (mensagem.includes('data passada')) {
          toast.error('Não é possível agendar em data passada');
        } else {
          toast.error(mensagem);
        }
      } else if (error.request) {
        toast.error('Erro de conexão. Verifique se o servidor está rodando.');
      } else {
        toast.error('Erro ao realizar agendamento');
      }
    } finally {
      setProcessando(false);
    }
  };

  // Gera o mínimo de data/hora permitido (agora + 1 hora)
  const getMinDateTime = () => {
    const agora = new Date();
    agora.setHours(agora.getHours() + 1);
    agora.setMinutes(0);
    
    // Formato: "2024-12-20T14:00"
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    const hora = String(agora.getHours()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}T${hora}:00`;
  };

  // Gera o máximo de data/hora (próximos 6 meses)
  const getMaxDateTime = () => {
    const futuro = new Date();
    futuro.setMonth(futuro.getMonth() + 6);
    
    const ano = futuro.getFullYear();
    const mes = String(futuro.getMonth() + 1).padStart(2, '0');
    const dia = String(futuro.getDate()).padStart(2, '0');
    
    return `${ano}-${mes}-${dia}T18:00`;
  };

  if (loading && !showModal) {
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
            Nossos Serviços ✨
          </h1>
          <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>
            Escolha o serviço que deseja agendar
          </p>

          {servicos.length > 0 ? (
            <div className="grid grid-3">
              {servicos.map(s => (
                <div key={s.id} className="card">
                  <div className="card-header">{s.nome}</div>
                  <div className="card-body">
                    <p style={{ marginBottom: '15px' }}>{s.descricao}</p>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '10px'
                    }}>
                      <div>
                        <strong style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}>
                          {formatarMoeda(s.preco)}
                        </strong>
                      </div>
                      <div style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                        ⏱️ {s.duracao_em_minutos} min
                      </div>
                    </div>
                  </div>
                  <div className="card-footer" style={{ justifyContent: 'flex-start' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => abrirModalAgendar(s)}
                      style={{ width: '100%' }}
                    >
                      Agendar Agora
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">✨</div>
              <h2 className="empty-state-title">Nenhum serviço disponível</h2>
              <p>Novos serviços em breve!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Agendamento */}
      {showModal && servicoSelecionado && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Agendar: {servicoSelecionado.nome}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div style={{ 
              padding: '15px', 
              backgroundColor: 'var(--background)', 
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <p><strong>Valor:</strong> {formatarMoeda(servicoSelecionado.preco)}</p>
              <p><strong>Duração:</strong> {servicoSelecionado.duracao_em_minutos} minutos</p>
            </div>

            <form onSubmit={handleAgendar}>
              <div className="form-group">
                <label className="form-label">Profissional *</label>
                <select
                  className="form-control"
                  value={profissionalId}
                  onChange={(e) => setProfissionalId(e.target.value)}
                  required
                  disabled={profissionais.length === 0}
                >
                  <option value="">
                    {profissionais.length === 0 
                      ? 'Nenhum profissional disponível' 
                      : 'Selecione um profissional'}
                  </option>
                  {profissionais.map(p => (
                    <option key={p.idUsuario} value={p.idUsuario}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                {profissionais.length === 0 && (
                  <small style={{ color: 'var(--error)', fontSize: '0.85rem' }}>
                    Não há profissionais disponíveis para este serviço no momento
                  </small>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Data e Hora *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={dataHora}
                  onChange={(e) => setDataHora(e.target.value)}
                  required
                  min={getMinDateTime()}
                  max={getMaxDateTime()}
                />
                <small style={{ color: 'var(--text-light)', fontSize: '0.85rem', display: 'block', marginTop: '5px' }}>
                  ⏰ Horário de funcionamento: Segunda a Sábado, das 8h às 18h
                </small>
                <small style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                  📅 Agende com pelo menos 1 hora de antecedência
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Opção de Pagamento</label>
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: 'var(--background)', 
                  borderRadius: '5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="pagamentoParcial"
                      checked={pagamentoParcial} 
                      onChange={(e) => setPagamentoParcial(e.target.checked)}
                      style={{ marginRight: '10px' }}
                    />
                    <label htmlFor="pagamentoParcial" style={{ margin: 0, cursor: 'pointer' }}>
                      Pagar 50% agora (sinal)
                    </label>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                    {pagamentoParcial ? (
                      <>
                        <p style={{ margin: '5px 0' }}>
                          💰 Valor do sinal: <strong>{formatarMoeda(servicoSelecionado.preco / 2)}</strong>
                        </p>
                        <p style={{ margin: '5px 0' }}>
                          Restante a pagar no dia: <strong>{formatarMoeda(servicoSelecionado.preco / 2)}</strong>
                        </p>
                      </>
                    ) : (
                      <p style={{ margin: '5px 0' }}>
                        Valor total a pagar no dia: <strong>{formatarMoeda(servicoSelecionado.preco)}</strong>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ 
                padding: '15px', 
                backgroundColor: '#fff3cd', 
                borderRadius: '5px',
                marginBottom: '20px',
                border: '1px solid #ffc107'
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#856404' }}>
                  ⚠️ <strong>Atenção:</strong> Cancelamentos devem ser feitos com no mínimo 24 horas de antecedência
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                  disabled={processando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={processando || profissionais.length === 0}
                >
                  {processando ? 'Agendando...' : 'Confirmar Agendamento'}
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