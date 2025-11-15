// CORRIGIDO: Adicionado 'useCallback'
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clienteAPI, profissionalAPI, administradorAPI } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- CORREÇÃO 1: A função 'logout' é envolvida em useCallback ---
  // Isto garante que a função 'logout' não é recriada em cada renderização
  // e pode ser usada com segurança dentro do useEffect.
  const logout = useCallback(() => {
    setUser(null);
    setUserType(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('authToken'); // Se você usar token
    navigate('/login');
  }, [navigate]); // 'navigate' é a dependência do useCallback

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
      setLoading(false);
    }
  }, [logout]); // --- CORREÇÃO 2: 'logout' é adicionada como dependência ---

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
          // A correção do login de admin que fizemos antes
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
        
        // Redireciona para o dashboard correto
        navigate(`/${userTypeInput}/dashboard`);
        toast.success(`Login como ${userTypeInput} realizado com sucesso!`);
      }
    } catch (error) {
      console.error('Falha no login:', error);
      toast.error('Email ou senha inválidos');
      throw error; // Propaga o erro para o componente de Login
    }
  };

  const isCliente = () => userType === 'cliente';
  const isProfissional = () => userType === 'profissional';
  const isAdministrador = () => userType === 'administrador';

  // Não renderiza nada até que a sessão seja verificada
  if (loading) {
    return null; 
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        isAuthenticated: !!user,
        login,
        logout,
        isCliente,
        isProfissional,
        isAdministrador
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);