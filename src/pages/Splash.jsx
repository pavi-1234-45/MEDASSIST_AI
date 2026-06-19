import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash({ isInitializing = false }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitializing) return;

    const timer = setTimeout(() => {
      decideNextRoute();
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate, isInitializing]);

  const decideNextRoute = () => {
    const ma_lang = localStorage.getItem('ma_lang');
    if (!ma_lang) {
      return navigate('/language', { replace: true });
    }

    const ma_role = localStorage.getItem('ma_role');
    const userStr = localStorage.getItem('medassist_user');
    
    // In a real app with Firebase Auth, the App.jsx ProtectedRoute will handle auth loading.
    // For Splash, if there's no stored user/role, go to auth.
    if (!userStr || !ma_role) {
      return navigate('/auth', { replace: true });
    }

    const ma_lastRoute = localStorage.getItem('ma_lastRoute');
    if (ma_lastRoute && ma_lastRoute.startsWith(`/${ma_role}`)) {
      return navigate(ma_lastRoute, { replace: true });
    }

    return navigate(`/${ma_role}/dashboard`, { replace: true });
  };

  return (
    <div className="splash-screen">
      <div className="splash-logo-wrapper">
        <div className="splash-logo-glow"></div>
        <img 
          src="https://www.image2url.com/r2/default/images/1781779461062-c1bcda3a-8c82-472a-ba22-af59e7330b01.png" 
          alt="MedAssist AI" 
          className="splash-logo" 
        />
      </div>
    </div>
  );
}
