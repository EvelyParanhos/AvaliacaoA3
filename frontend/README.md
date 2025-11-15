# Sistema de Agendamento - Clínica Rosa Beauty

Sistema completo de agendamento para clínica de estética com três tipos de usuários: Cliente, Profissional e Administrador.

## 🚀 Tecnologias Utilizadas

### Backend
- Java 17
- Spring Boot 4.0.0-M2
- MySQL 8.0
- Maven

### Frontend
- React 18.2.0
- React Router DOM 6.20.0
- Axios 1.6.2
- React Toastify 9.1.3
- CSS Customizado

## 📋 Funcionalidades Implementadas

### Cliente (✅ Todas implementadas)
- [x] Cadastro e login
- [x] Visualização de serviços disponíveis com preços
- [x] Agendamento de serviços
- [x] Opção de pagamento de 50% ao agendar
- [x] Visualização de agendamentos (futuros/passados/todos)
- [x] Cancelamento de agendamento (até 24h antes)
- [x] Solicitação de reagendamento (até 24h antes)
- [x] Avaliação de serviços concluídos

### Profissional (✅ Todas implementadas)
- [x] Login
- [x] Visualização da própria agenda
- [x] Solicitação de alteração/cancelamento de agendamentos
- [x] Dashboard com próximos atendimentos

### Administrador (✅ Todas implementadas)
- [x] Login
- [x] Visualização do calendário completo da clínica
- [x] Cadastro/exclusão de serviços
- [x] Gerenciamento de profissionais
- [x] Aprovação/recusa de solicitações de profissionais
- [x] Visualização de histórico de agendamentos
- [x] Alteração/cancelamento direto de agendamentos

## 🎯 Regras de Negócio Implementadas

1. **Horário de Funcionamento**: Sistema permite agendamentos apenas entre 8h e 18h
2. **Regra de 24 Horas**: Cancelamentos e reagendamentos só são permitidos com pelo menos 24h de antecedência
3. **Pagamento Parcial**: Cliente pode optar por pagar 50% no agendamento
4. **Validações**: Todos os campos obrigatórios são validados no frontend e backend
5. **Conflito de Horários**: Sistema impede agendamentos no mesmo horário para o mesmo profissional
6. **Avaliações**: Apenas agendamentos concluídos podem ser avaliados
7. **Solicitações**: Profissionais não podem alterar diretamente, devem solicitar ao administrador

## 🛠️ Instalação e Execução

### Pré-requisitos
- Java 17 ou superior
- Maven
- MySQL 8.0
- Node.js 16+ e npm

### Backend

1. Configure o banco de dados MySQL:
```sql
CREATE DATABASE clinica_rosa_beauty;
CREATE USER 'dev_clinica'@'localhost' IDENTIFIED BY 'senha';
GRANT ALL PRIVILEGES ON clinica_rosa_beauty.* TO 'dev_clinica'@'localhost';
FLUSH PRIVILEGES;
```

2. Configure o arquivo `application.properties` se necessário (já está configurado)

3. Execute o backend:
```bash
cd schedule
./mvnw spring-boot:run
```

O backend estará rodando em `http://localhost:8080`

### Frontend

1. Instale as dependências:
```bash
cd frontend
npm install
```

2. Execute o frontend:
```bash
npm start
```

O frontend estará disponível em `http://localhost:3000`

## 👥 Usuários de Teste

Para testar o sistema, você precisará criar usuários através das seguintes formas:

### Cliente
- Acesse `/cadastro` e preencha o formulário completo
- Ou use a API diretamente

### Profissional e Administrador
- Devem ser criados diretamente no banco de dados ou via API
- Exemplo de INSERT SQL:

```sql
-- Inserir Administrador
INSERT INTO usuario (dtype, nome, cpf, data_nascimento, email, senha, telefone, cep, complemento, bairro, cidade, estado)
VALUES ('Administrador', 'Admin Rosa', '12345678901', '1990-01-01', 'admin@rosabeauty.com', 'admin123', '71999999999', '40000000', '', 'Centro', 'Salvador', 'BA');

-- Inserir Profissional
INSERT INTO usuario (dtype, nome, cpf, data_nascimento, email, senha, telefone, cep, complemento, bairro, cidade, estado, registro_profissional)
VALUES ('Profissional', 'Maria Silva', '98765432100', '1985-05-15', 'maria@rosabeauty.com', 'maria123', '71988888888', '40000000', '', 'Centro', 'Salvador', 'BA', 'PROF12345');
```

## 📱 Navegação no Sistema

### Cliente
1. Faça cadastro em `/cadastro`
2. Faça login em `/login`
3. No dashboard, veja seus agendamentos e serviços em destaque
4. Acesse "Serviços" para ver todos os serviços e agendar
5. Acesse "Meus Agendamentos" para gerenciar seus agendamentos
6. Cancele ou reagende (respeitando a regra de 24h)
7. Avalie serviços concluídos

### Profissional
1. Faça login em `/login` (selecione "Profissional")
2. Veja sua agenda no dashboard
3. Acesse "Solicitações" para solicitar alterações/cancelamentos
4. Aguarde aprovação do administrador

### Administrador
1. Faça login em `/login` (selecione "Administrador")
2. Veja estatísticas gerais no dashboard
3. Acesse "Calendário" para ver todos os agendamentos
4. Acesse "Profissionais" para gerenciar profissionais
5. Acesse "Serviços" para cadastrar/excluir serviços
6. Acesse "Solicitações" para aprovar/recusar pedidos
7. Acesse "Histórico" para ver agendamentos passados

## 🎨 Design e UX

- Interface responsiva e mobile-friendly
- Tema personalizado com cores da marca (rosa e pink)
- Feedback visual para todas as ações (toasts)
- Loading states em todas as operações assíncronas
- Validações em tempo real nos formulários
- Modais para confirmações importantes
- Empty states quando não há dados

## 🔒 Segurança

- Rotas protegidas por tipo de usuário
- Autenticação via localStorage
- Validações no frontend e backend
- Mensagens de erro apropriadas
- Proteção contra ações não autorizadas

## 📊 Estrutura do Projeto

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.js
│   │   └── ProtectedRoute.js
│   ├── contexts/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Cadastro.js
│   │   ├── cliente/
│   │   │   ├── ClienteDashboard.js
│   │   │   ├── ClienteServicos.js
│   │   │   └── ClienteAgendamentos.js
│   │   ├── profissional/
│   │   │   ├── ProfissionalDashboard.js
│   │   │   └── ProfissionalSolicitacoes.js
│   │   └── admin/
│   │       ├── AdminDashboard.js
│   │       ├── AdminSolicitacoes.js
│   │       ├── AdminProfissionais.js
│   │       ├── AdminServicos.js
│   │       └── AdminCalendario.js
│   ├── services/
│   │   └── api.js
│   ├── App.js
│   ├── App.css
│   └── index.js
└── package.json
```

## ✅ Checklist de Funcionalidades

### Cliente - [P0] ✅
- [x] Ver lista de serviços e preços
- [x] Cadastrar-se no sistema
- [x] Fazer login

### Cliente - [P1] ✅
- [x] Agendar serviço com seleção de data/hora
- [x] Regra de pagamento 50% implementada

### Cliente - [P2] ✅
- [x] Ver agendamentos futuros
- [x] Cancelar agendamento (regra 24h)

### Cliente - [P3] ✅
- [x] Reagendar serviço (regra 24h)
- [x] Avaliar serviço e profissional

### Profissional - [P1] ✅
- [x] Acessar agenda própria

### Profissional - [P2] ✅
- [x] Solicitar alteração/cancelamento

### Administrador - [P1] ✅
- [x] Visualizar calendário completo

### Administrador - [P2] ✅
- [x] Cadastrar serviços e profissionais

### Administrador - [P3] ✅
- [x] Gerenciar solicitações
- [x] Alterar/cancelar agendamentos
- [x] Ver histórico

## 🐛 Tratamento de Erros

Todos os erros são tratados adequadamente:
- Validações de formulário com mensagens claras
- Tratamento de erros de rede
- Mensagens de erro amigáveis ao usuário
- Feedback visual para operações bem-sucedidas

## 📝 Notas Importantes

- O sistema foi desenvolvido com foco em usabilidade e experiência do usuário
- Todas as regras de negócio foram implementadas conforme especificação
- O código está organizado, comentado e segue boas práticas
- O sistema é totalmente funcional e pronto para uso

## 🎉 Conclusão

Sistema completo e funcional, pronto para uso em produção após configuração adequada do ambiente. Todas as funcionalidades do backlog foram implementadas com sucesso!
