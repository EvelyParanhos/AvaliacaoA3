import React, { useState, useEffect } from 'react';
import { servicoAPI } from '../../services/api'; 
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const AdminServicos = () => {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // A LÓGICA DE MODAL E FORM DE CRIAÇÃO FOI REMOVIDA DAQUI

  useEffect(() => {
    carregarServicos();
  }, []);

  const carregarServicos = async () => {
    try {
      setLoading(true);
      const response = await servicoAPI.listar();
      setServicos(response.data);
    } catch (error) {
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const deletar = async (id) => {
    // Mensagem de confirmação atualizada com a nova regra
    if (window.confirm('Confirma exclusão? Este serviço será removido de especialidades e agendamentos futuros serão CANCELADOS.')) {
      try {
        await servicoAPI.deletar(id);
        toast.success('Serviço excluído');
        carregarServicos();
      } catch (error) {
        const msg = error.response?.data?.message || 'Erro ao excluir';
        toast.error(msg);
      }
    }
  };
  
  const handleEditar = (servico) => {
    // Lógica de edição (abrir modal de edição)
    // Por enquanto, apenas um placeholder:
    toast.info(`Funcionalidade "Editar Serviço ${servico.nome}" ainda não implementada.`);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  // --- CÓDIGO DE LOADING CORRIGIDO ---
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
  // --- FIM DA CORREÇÃO ---

  return (
    <>
      <Navbar />
      <div className="container fade-in">
        
        {/* --- CABEÇALHO SIMPLIFICADO --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>
            Gerenciar Serviços
          </h1>
        </div>
        
        <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>
          Use esta tela para editar ou excluir serviços existentes. Para cadastrar, vá à tela de <strong>Especialidades</strong>.
        </p>

        {servicos.length > 0 ? (
          <div className="card">
            <div className="card-body">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Preço</th>
                      <th>Duração</th>
                      <th style={{ width: '150px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicos.map(s => (
                      <tr key={s.id}>
                        <td>{s.nome}</td>
                        <td>{formatarMoeda(s.preco)}</td>
                        <td>{s.duracaoEmMinutos} min</td>
                        <td>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-outline" onClick={() => handleEditar(s)}>Editar</button>
                            <button className="btn btn-danger" onClick={() => deletar(s.id)}>Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>Nenhum serviço cadastrado</p>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminServicos;