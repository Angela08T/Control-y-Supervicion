import React, { useState, useEffect, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout as logoutApi } from '../api/auth'
import { logout } from '../store/slices/authSlice'
import { clearToken } from '../api/config'

const TIMEOUT_MS = 60 * 1000;
const WARNING_MS = 30 * 1000;

const SessionTimeout = ({children}) => {
    const dispath = useDispatch();
    const navigate = useNavigate();
    const [showWarning, setShowWarning] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());


// Cerrar Sesion

const handleLogout = useCallback(async ()=> {
    try {
        await logoutApi();
    } catch (error) {
        console.error("Error closing session on backend:", error);
    } finally {
        clearToken(); 
        dispath(logout());
        navigate('/login', { replace: true });
    }
}, [dispath, navigate]);

// Reiniciar Temporizador

const resetTimer = useCallback(()=> {
    if(showWarning){
        setShowWarning(false); // Oculta la alerta si el usuario interactua
    }
    setLastActivity(Date.now());
},[showWarning])


useEffect(()=>{
    const e = ['click' , ' mousemove', 'keydown', 'scroll', 'touchstart']; // Eventos considerados como actividad del usuario

    const activityHandler = () => resetTimer();
    e.forEach(e=> window.addEventListener (e, activityHandler));


    const intervalId = setInterval(() =>{
    const now = Date.now();
    const timeElapsed = now - lastActivity; 

    // Si pasan 15 min -> Cerrar Sesion

    if(timeElapsed > TIMEOUT_MS){
        handleLogout();
    } 

    // Si pasan 14 min -> Muestra Aviso
    else if (timeElapsed >= WARNING_MS){
        if (!showWarning) setShowWarning(true);
    }
},1000);

// Limpieza de Eventos y Temporizador

return () => {
    e.forEach(e => window.removeEventListener(e, activityHandler));
    clearInterval(intervalId);
    };
},[lastActivity, showWarning, handleLogout, resetTimer]);

return (
    <>
      {children}
      
      {/* Modal de Alerta de Inactividad */}
      {showWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            textAlign: 'center',
            maxWidth: '400px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>⚠️ Inactividad Detectada</h3>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
              Tu sesión está a punto de caducar por falta de actividad.
              <br/>
              ¿Deseas mantenerte conectado?
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button 
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cerrar ahora
              </button>
              <button 
                onClick={resetTimer}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Mantener sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionTimeout;
