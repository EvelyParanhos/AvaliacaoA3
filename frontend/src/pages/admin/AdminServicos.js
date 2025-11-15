import React, { useState, useEffect } from 'react';
import { servicoAPI } from '../../services/api';
import Navbar from '../../components/Navbar';
import { toast } from 'react-toastify';

const AdminServicos = () => {
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    preco: '',
    duracao_em_minutos: ''
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
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await servicoAPI.criar(form);
      toast.success('Serviço cadastrado!');
      setShowModal(false);
      setForm({ nome: '', descricao: '', preco: '', duracao_em_minutos: '' });
      carregarServicos();
    } catch (error) {
      toast.error('Erro ao cadastrar');
    }
  };

  const deletar = async (id) => {
    if (window.confirm('Confirma exclusão?')) {
      try {
        await servicoAPI.deletar(id);
        toast.success('Serviço excluído');
        carregarServicos();
      } catch (error) {
        toast.error('Erro ao excluir');
      }
    }
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>Serviços</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Novo Serviço
          </button>
        </div>

        {servicos.length > 0 ? (
          <div className="grid grid-3">
            {servicos.map(s => (
              <div key={s.id} className="card">
                <div className="card-header">{s.nome}</div>
                <div className="card-body">
                  <p>{s.descricao}</p>
                  <p><strong>Preço:</strong> {formatarMoeda(s.preco)}</p>
                  <p><strong>Duração:</strong> {s.duracao_em_minutos} min</p>
                </div>
                <div className="card-footer">
                  <button className="btn btn-danger" onClick={() => deletar(s.id)}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Nenhum serviço cadastrado</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Novo Serviço</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                  minLength="3"
                  maxLength="100"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição *</label>
                <textarea
                  className="form-control"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  required
                  maxLength="500"
                  rows="3"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Preço (R$) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })}
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duração (min) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.duracao_em_minutos}
                    onChange={(e) => setForm({ ...form, duracao_em_minutos: e.target.value })}
                    required
                    min="1"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
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
    </>
  );
};

export default AdminServicos;
