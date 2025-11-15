import React, { useState, useEffect } from 'react';
import { administradorAPI, servicoAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const AdminProfissionais = () => {
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);

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
    if (window.confirm('Confirma exclusão?')) {
      try {
        await administradorAPI.deletarProfissional(id);
        toast.success('Profissional excluído');
        carregarProfissionais();
      } catch (error) {
        toast.error('Erro ao excluir');
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
        <h1 style={{ color: 'var(--primary-color)', marginBottom: '30px' }}>
          Profissionais
        </h1>

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
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profissionais.map(p => (
                      <tr key={p.idUsuario}>
                        <td>{p.nome}</td>
                        <td>{p.email}</td>
                        <td>{p.telefone}</td>
                        <td>
                          <button
                            className="btn btn-danger"
                            onClick={() => deletar(p.idUsuario)}
                          >
                            Excluir
                          </button>
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
