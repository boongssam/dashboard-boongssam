import { useState } from 'react';
import { useApp } from '../context/AppContext';

export function useAdminMode() {
  const { state, dispatch, showToast } = useApp();
  const { isAdmin } = state;
  const [showPinModal, setShowPinModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const login = async (password) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (data.ok) {
        localStorage.setItem('isAdmin', 'true');
        setShowPinModal(false);
        setPasswordInput('');
        showToast('교사 모드로 전환되었습니다.', 'success');
        dispatch({ type: 'TOGGLE_ADMIN', payload: true });
      } else {
        showToast(data.error || '비밀번호가 틀렸습니다.', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('로그인 중 오류가 발생했습니다.', 'error');
    }
  };

  const logout = () => {
    localStorage.removeItem('isAdmin');
    dispatch({ type: 'TOGGLE_ADMIN', payload: false });
    showToast('학생 모드로 전환되었습니다.', 'info');
  };

  const toggle = () => {
    if (isAdmin) {
      logout();
    } else {
      setShowPinModal(true);
    }
  };

  return {
    isAdmin,
    showPinModal,
    setShowPinModal,
    passwordInput,
    setPasswordInput,
    login,
    logout,
    toggle
  };
}
