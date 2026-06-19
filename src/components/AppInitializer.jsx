import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Splash from '../pages/Splash';
import { seedMockData } from '../utils/dataService';

export default function AppInitializer({ children }) {
  const [showStartupSplash, setShowStartupSplash] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    seedMockData();
    
    // Always show splash on startup/refresh for exactly 4 seconds
    const timer = setTimeout(() => {
      setShowStartupSplash(false);
      
      const ma_lang = localStorage.getItem("ma_lang");
      const ma_role = localStorage.getItem("ma_role");
      const authUserStr = localStorage.getItem("medassist_user");
      const authUser = authUserStr ? JSON.parse(authUserStr) : null;
      const ma_lastRoute = localStorage.getItem("ma_lastRoute");

      if (!ma_lang) {
        navigate("/language", { replace: true });
      } else if (!authUser || !ma_role) {
        navigate("/auth", { replace: true });
      } else if (ma_lastRoute && ma_lastRoute.startsWith(`/${ma_role}`)) {
        navigate(ma_lastRoute, { replace: true });
      } else {
        navigate(`/${ma_role}/dashboard`, { replace: true });
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);

  if (showStartupSplash) {
    return <Splash isInitializing={true} />;
  }

  return children;
}
