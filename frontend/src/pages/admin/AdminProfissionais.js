import React, { useState, useEffect } from 'react';
import { administradorAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const AdminProfissionais = () => {
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- Estados para Edição (NOVOS) ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [profissionalEmEdicao, setProfissionalEmEdicao] = useState(null);
  const [processando, setProcessando] = useState(false);
  // --- Fim dos estados de edição ---

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
  
  const handleChangeEdit = (e) => {
    let { name, value } = e.target;
    
    // Máscaras (apenas para campos de edição)
    if (name === 'telefone') value = value.replace(/\D/g, '').slice(0, 11);
    else if (name === 'cep') value = value.replace(/\D/g, '').slice(0, 8);
    else if (name === 'estado') value = value.toUpperCase().slice(0, 2);
    
    setProfissionalEmEdicao(prev => ({ ...prev, [name]: value }));
  };

  const deletar = async (id) => {
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

  // --- Funções de Edição (NOVAS) ---
  const handleEditar = (profissional) => {
    // Carrega o profissional no estado de edição
    setProfissionalEmEdicao(profissional);
    setShowEditModal(true);
  };

  const handleUpdateProfissional = async (e) => {
    e.preventDefault();
    if (!profissionalEmEdicao) return;

    setProcessando(true);
    try {
      await administradorAPI.atualizarProfissional(profissionalEmEdicao.idUsuario, profissionalEmEdicao);
      toast.success('Profissional atualizado com sucesso!');
      setShowEditModal(false);
      setProfissionalEmEdicao(null);
      carregarProfissionais();
    } catch (error) {
      toast.error('Erro ao atualizar profissional');
      console.error(error);
    } finally {
      setProcessando(false);
    }
  };
  // --- Fim das funções de edição ---


  if (loading) {
     return (
        <>
          <Navbar />
          <div className="container">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Carregando profissionais...</p>
            </div>
          </div>
        </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container fade-in">
        
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

      {/* --- MODAL DE EDIÇÃO (NOVO) --- */}
      {showEditModal && profissionalEmEdicao && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Editar Profissional</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateProfissional}>
              
              {/* Campos não editáveis */}
              <div className="form-group">
                <label className="form-label">CPF (Não editável)</label>
                <input type="text" className="form-control" value={profissionalEmEdicao.cpf} readOnly disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Data de Nascimento (Não editável)</label>
                <input type="date" className="form-control" value={profissionalEmEdicao.data_nascimento} readOnly disabled />
              </div>
              
              <hr />

              {/* Campos editáveis */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input type="text" name="nome" className="form-control" value={profissionalEmEdicao.nome} onChange={handleChangeEdit} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone *</label>
                  <input type="text" name="telefone" className="form-control" value={profissionalEmEdicao.telefone} onChange={handleChangeEdit} required placeholder="00000000000" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" name="email" className="form-control" value={profissionalEmEdicao.email} onChange={handleChangeEdit} required />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">CEP *</label>
                  <input type="text" name="cep" className="form-control" value={profissionalEmEdicao.cep} onChange={handleChangeEdit} required placeholder="00000000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bairro *</label>
                  <input type="text" name="bairro" className="form-control" value={profissionalEmEdicao.bairro} onChange={handleChangeEdit} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cidade *</label>
                  <input type="text" name="cidade" className="form-control" value={profissionalEmEdicao.cidade} onChange={handleChangeEdit} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado (UF) *</label>
                  <input type="text" name="estado" className="form-control" value={profissionalEmEdicao.estado} onChange={handleChangeEdit} required placeholder="BA" />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Complemento</label>
                <input type="text" name="complemento" className="form-control" value={profissionalEmEdicao.complemento} onChange={handleChangeEdit} />
              </div>
              
              {/* Botões do formulário */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={processando}>
                      {processando ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
};

export default AdminProfissionais;