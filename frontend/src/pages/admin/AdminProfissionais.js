import React, { useState, useEffect } from 'react';
import { administradorAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const AdminProfissionais = () => {
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // A LÓGICA DE MODAL E FORM DE CRIAÇÃO FOI REMOVIDA DAQUI

  useEffect(() => {
    carregarProfissionais();
  }, []);

  const carregarProfissionais = async () => {
    try {
      setLoading(true);
      const response = await administradorAPI.listarProfissionais();
      setProfissionais(response.data);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar profissionais');
    } finally {
      setLoading(false);
    }
  };

  const deletar = async (id) => {
    // Mensagem de confirmação atualizada
    if (window.confirm('Confirma exclusão? Este profissional será removido de especialidades e agendamentos futuros serão CANCELADOS.')) {
      try {
        await administradorAPI.deletarProfissional(id);
        toast.success('Profissional excluído');
        carregarProfissionais();
      } catch (error) {
        const msg = error.response?.data?.message || error.response?.data || 'Erro ao excluir';
        toast.error(msg);
        console.error(error);
      }
    }
  };

  const handleEditar = (profissional) => {
    // Lógica de edição (abrir modal de edição)
    // Por enquanto, apenas um placeholder:
    toast.info(`Funcionalidade "Editar Profissional ${profissional.nome}" ainda não implementada.`);
  };

  if (loading) {
     // ... (código de loading) ...
  }

  return (
    <>
      <Navbar />
      <div className="container fade-in">
        
        {/* --- CABEÇALHO SIMPLIFICADO --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>
            Gerenciar Profissionais
          </h1>
        </div>
        
        <p style={{ color: 'var(--text-light)', marginBottom: '30px' }}>
          Use esta tela para editar ou excluir profissionais existentes. Para cadastrar, vá à tela de <strong>Especialidades</strong>.
        </p>

        {profissionais.length > 0 ? (
          <div className="card">
            <div className="card-body">
                <div className="table-container">
                <table className="table">
                    <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Registro</th>
                        <th style={{ width: '150px' }}>Ações</th>
                    </tr>
                    </thead>
                    <tbody>
                    {profissionais.map(p => (
                        <tr key={p.idUsuario}>
                        <td>{p.nome}</td>
                        <td>{p.email}</td>
                        <td>{p.telefone}</td>
                        <td>{p.registroProfissional || 'N/A'}</td>
                        <td>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button className="btn btn-outline" onClick={() => handleEditar(p)}>Editar</button>
                              <button className="btn btn-danger" onClick={() => deletar(p.idUsuario)}>Excluir</button>
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
            <p>Nenhum profissional cadastrado</p>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminProfissionais;