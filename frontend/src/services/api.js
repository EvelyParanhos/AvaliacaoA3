import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080'
});

// Interceptor para adicionar token, se necessário (exemplo)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API de Serviços
export const servicoAPI = {
  listar: () => api.get('/servicos'),
  listarProfissionais: (idServico) => api.get(`/servicos/${idServico}/profissionais`),
  criar: (servicoData) => api.post('/servicos', servicoData),
  // --- FUNÇÃO DE ATUALIZAR (NOVA) ---
  atualizar: (id, servicoData) => api.put(`/servicos/${id}`, servicoData),
  deletar: (id) => api.delete(`/servicos/${id}`),
};

// API de Clientes
export const clienteAPI = {
  cadastrar: (clienteData) => api.post('/clientes/cadastro', clienteData),
  login: (credenciais) => api.post('/clientes/login', credenciais),
  buscarAgendamentos: (idCliente, filtro) => api.get(`/clientes/${idCliente}/agendamentos`, { params: { filtro } }),
};

// API de Agendamentos (geral)
export const agendamentoAPI = {
  criar: (agendamentoData) => api.post('/agendamentos', agendamentoData),
  cancelar: (idAgendamento) => api.post(`/agendamentos/${idAgendamento}/cancelar-cliente`),
  reagendar: (idAgendamento, novaDataHora) => api.post(`/agendamentos/${idAgendamento}/reagendar-cliente`, { novaDataHora }),
  listarHistorico: (status) => api.get('/agendamentos/historico', { params: { status } }),
};

// API de Avaliação
export const avaliacaoAPI = {
  criar: (idAgendamento, avaliacaoData) => api.post(`/avaliacoes/${idAgendamento}`, avaliacaoData),
};

// API de Profissionais
export const profissionalAPI = {
  login: (credenciais) => api.post('/profissionais/login', credenciais),
  buscarAgendamentos: (idProfissional) => api.get(`/profissionais/${idProfissional}/agendamentos`),
};

// API de Solicitações
export const solicitacaoAPI = {
  criar: (solicitacaoData) => api.post('/solicitacoes', solicitacaoData),
  criarReagendamento: (solicitacaoData) => api.post('/solicitacoes/reagendamento', solicitacaoData),
};

// API de Administrador
export const administradorAPI = {
  login: (credenciais) => api.post('/admin/login', credenciais),
  listarSolicitacoes: () => api.get('/admin/solicitacoes'),
  processarSolicitacao: (idSolicitacao, status) => api.post(`/admin/solicitacoes/${idSolicitacao}/processar`, null, { params: { status } }),
  listarProfissionais: () => api.get('/admin/profissionais'),
  criarProfissional: (profData) => api.post('/admin/profissionais', profData),
  // --- FUNÇÃO DE ATUALIZAR (JÁ EXISTIA) ---
  atualizarProfissional: (id, profData) => api.put(`/admin/profissionais/${id}`, profData),
  deletarProfissional: (id) => api.delete(`/admin/profissionais/${id}`),
  associarServico: (idEspecialidade, idServico) => api.post(`/admin/especialidades/${idEspecialidade}/servicos/${idServico}`),
  associarProfissional: (idEspecialidade, idProfissional) => api.post(`/admin/especialidades/${idEspecialidade}/profissionais/${idProfissional}`),
  getCalendario: (params) => api.get('/admin/calendario/completo', { params }),
  atualizarAgendamento: (id, agendamentoData) => api.put(`/admin/agendamentos/${id}`, agendamentoData),
};

// API de Especialidades
export const especialidadeAPI = {
  listar: () => api.get('/especialidades'),
  criar: (espData) => api.post('/especialidades', espData),
  deletar: (id) => api.delete(`/especialidades/${id}`), // Adicione se precisar
};

export default api;