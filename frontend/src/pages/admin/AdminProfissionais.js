import React, { useState, useEffect } from 'react';
import { administradorAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const AdminProfissionais = () => {
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    email: '',
    senha: '',
    telefone: '',
    cep: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    registroProfissional: ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.cpf.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }
    if (form.cep.length !== 8) {
      toast.error('CEP deve ter 8 dígitos');
      return;
    }
    try {
      await administradorAPI.criarProfissional(form);
      toast.success('Profissional cadastrado!');
      setShowModal(false);
      setForm({
        nome: '', cpf: '', data_nascimento: '', email: '', senha: '',
        telefone: '', cep: '', complemento: '', bairro: '', cidade: '',
        estado: '', registroProfissional: ''
      });
      carregarProfissionais();
    } catch (error) {
      toast.error('Erro ao cadastrar profissional');
      console.error(error);
    }
  };
  
  // --- ADICIONADO ---
  const handleChange = (e) => {
    let { name, value } = e.target;
    // Máscaras simples
    if (name === 'cpf') value = value.replace(/\D/g, '').slice(0, 11);
    else if (name === 'telefone') value = value.replace(/\D/g, '').slice(0, 11);
    else if (name === 'cep') value = value.replace(/\D/g, '').slice(0, 8);
    else if (name === 'estado') value = value.toUpperCase().slice(0, 2);

    setForm({ ...form, [name]: value });
  };
  // --- FIM ADICIONADO ---

  const deletar = async (id) => {
    if (window.confirm('Confirma exclusão?')) {
      try {
        await administradorAPI.deletarProfissional(id);
        toast.success('Profissional excluído');
        carregarProfissionais();
      } catch (error) {
        // Agora vai mostrar a mensagem de erro do backend que criámos
        const msg = error.response?.data?.message || error.response?.data || 'Erro ao excluir';
        toast.error(msg);
        console.error(error);
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
      <Navbar />onta
      <div className="ciner fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>
            Profissionais
          </h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Novo Profissional
          </button>
        </div>

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
        {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Novo Profissional</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input type="text" name="nome" className="form-control" value={form.nome} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">CPF *</label>
                  <input type="text" name="cpf" className="form-control" value={form.cpf} onChange={handleChange} required placeholder="00000000000" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Data de Nascimento *</label>
                  <input type="date" name="data_nascimento" className="form-control" value={form.data_nascimento} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone *</label>
                  <input type="text" name="telefone" className="form-control" value={form.telefone} onChange={handleChange} required placeholder="00000000000" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Senha *</label>
                  <input type="password" name="senha" className="form-control" value={form.senha} onChange={handleChange} required minLength="6" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">CEP *</label>
                  <input type="text" name="cep" className="form-control" value={form.cep} onChange={handleChange} required placeholder="00000000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bairro *</label>
                  <input type="text" name="bairro" className="form-control" value={form.bairro} onChange={handleChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cidade *</label>
                  <input type="text" name="cidade" className="form-control" value={form.cidade} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Estado (UF) *</label>
                  <input type="text" name="estado" className="form-control" value={form.estado} onChange={handleChange} required placeholder="BA" />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Complemento</label>
                  <input type="text" name="complemento" className="form-control" value={form.complemento} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Registro Profissional</label>
                  <input type="text" name="registroProfissional" className="form-control" value={form.registroProfissional} onChange={handleChange} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- FIM DO MODAL --- */}
      </div>
    </>
  );
};

export default AdminProfissionais;