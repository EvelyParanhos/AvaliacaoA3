import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteAPI, profissionalAPI, administradorAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true); // Começa como true
  const navigate = useNavigate();

  // Envolvemos o logout em useCallback para corrigir o aviso do eslint
  const logout = useCallback(() => {
    setUser(null);
    setUserType(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('authToken'); 
    navigate('/login');
  }, [navigate]); 

  useEffect(() => {
    // Tenta carregar dados da sessão ao iniciar
    try {
      const storedUser = localStorage.getItem('user');
      const storedUserType = localStorage.getItem('userType');
      if (storedUser && storedUserType) {
        setUser(JSON.parse(storedUser));
        setUserType(storedUserType);
      }
    } catch (error) {
      console.error("Falha ao carregar dados da sessão", error);
      logout(); // Limpa se os dados estiverem corrompidos
    } finally {
      setLoading(false); // Diz que o carregamento terminou
    }
  }, [logout]); // Adiciona logout como dependência (corrigindo o aviso)

  const login = async (email, senha, userTypeInput) => {
    let response;
    try {
      switch (userTypeInput) {
        case 'cliente':
          response = await clienteAPI.login({ email, senha });
          break;
        case 'profissional':
          response = await profissionalAPI.login({ email, senha });
          break;
        case 'administrador':
          // Esta era a correção do erro de "body missing"
          response = await administradorAPI.login({ email, senha });
          break;
        default:
          throw new Error('Tipo de usuário inválido');
      }

      if (response.data) {
        const userData = response.data;
        setUser(userData);
        setUserType(userTypeInput);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userType', userTypeInput);
        
        navigate(`/${userTypeInput}/dashboard`);
        toast.success(`Login como ${userTypeInput} realizado com sucesso!`);
      }
    } catch (error) {
      console.error('Falha no login:', error);
      toast.error('Email ou senha inválidos');
      throw error; 
    }
  };

  const isCliente = () => userType === 'cliente';
  const isProfissional = () => userType === 'profissional';
  const isAdministrador = () => userType === 'administrador';


  // O 'if (loading) return null' foi REMOVIDO daqui.

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        isAuthenticated: !!user,
        loading, // Passamos o loading para os componentes filhos
        login,
        logout,
        isCliente,
        isProfissional,
        isAdministrador
      }}
    >
      {/* A CORREÇÃO PRINCIPAL:
        Só renderiza a aplicação (children) QUANDO o loading for 'false'.
        Isso impede a tela vazia.
      */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);