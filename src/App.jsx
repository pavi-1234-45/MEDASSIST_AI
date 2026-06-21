import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import AppInitializer from './components/AppInitializer';
import Splash from './pages/Splash';
import LanguageSelection from './pages/LanguageSelection';
import Auth from './pages/Auth';

import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import CaregiverDashboard from './pages/CaregiverDashboard';
import AdminDashboard from './pages/AdminDashboard';

import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorNotes from './pages/doctor/DoctorNotes';
import DoctorAdherence from './pages/doctor/DoctorAdherence';

import AdminPatients from './pages/admin/AdminPatients';
import AdminReports from './pages/admin/AdminReports';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminAlerts from './pages/admin/AdminAlerts';
import AdminDoctors from './pages/admin/AdminDoctors';
import AdminSettings from './pages/admin/Settings';

import DoctorAppointments from './pages/DoctorAppointments';
import DoctorEmergencies from './pages/DoctorEmergencies';
import DoctorSettings from './pages/doctor/Settings';

import CaregiverAlerts from './pages/CaregiverAlerts';
import CaregiverPatient from './pages/caregiver/CaregiverPatient';
import CaregiverMedicineStatus from './pages/caregiver/CaregiverMedicineStatus';
import CaregiverAppointments from './pages/caregiver/CaregiverAppointments';
import CaregiverEmergencies from './pages/caregiver/CaregiverEmergencies';
import CaregiverReports from './pages/caregiver/CaregiverReports';
import CaregiverSettings from './pages/caregiver/Settings';

// Patient Features
import Chat from './pages/Chat';
import VoiceAssistant from './pages/VoiceAssistant';
import AIHealthAssistantPage from './pages/patient/AIHealthAssistantPage';
import PatientMedicinesPage from './pages/patient/PatientMedicinesPage';
import MedicineSearch from './pages/patient/MedicineSearch';
import HospitalSearch from './pages/patient/HospitalSearch';
import Appointments from './pages/Appointments';
import Emergency from './pages/Emergency';
import Caregiver from './pages/Caregiver';
import WhatsAppIVR from './pages/WhatsAppIVR';
import Profile from './pages/Profile';
import Settings from './pages/patient/Settings';
import Reports from './pages/Reports';

import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ allowedRole }) => {
  const { currentUser } = useAuth();
  const ma_lang = localStorage.getItem('ma_lang');
  const ma_role = localStorage.getItem('ma_role');

  if (!ma_lang) {
    return <Navigate to="/language" replace />;
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  const roleToUse = ma_role || currentUser.role || 'patient';

  if (allowedRole && roleToUse !== allowedRole) {
    return <Navigate to={`/${roleToUse}/dashboard`} replace />;
  }

  return <Outlet />;
};

const RouteManager = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const isValidAppRoute =
      path.startsWith("/patient") ||
      path.startsWith("/doctor") ||
      path.startsWith("/caregiver") ||
      path.startsWith("/admin");

    if (isValidAppRoute) {
      localStorage.setItem("ma_lastRoute", path);
    }
  }, [location.pathname]);

  return null;
};

const ThemeManager = () => {
  useEffect(() => {
    const fontSize = localStorage.getItem('ma_fontsize');
    if (fontSize) document.documentElement.style.fontSize = fontSize;
    const contrast = localStorage.getItem('ma_contrast');
    if (contrast === 'true') document.body.classList.add('high-contrast');
  }, []);
  return null;
};

export default function App() {
  return (
    <BrowserRouter>
      <AppInitializer>
        <RouteManager />
        <ThemeManager />
        <Toaster position="top-center" />
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/splash" replace />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="/language" element={<LanguageSelection />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            
            {/* Fully Protected Routes */}
            {/* Patient Flow */}
            <Route path="/patient" element={<ProtectedRoute allowedRole="patient" />}>
              <Route path="dashboard" element={<PatientDashboard />} />
              <Route path="chat" element={<Navigate to="/patient/assistant" replace />} />
              <Route path="voice" element={<Navigate to="/patient/assistant" replace />} />
              <Route path="assistant" element={<AIHealthAssistantPage />} />
              <Route path="medicines" element={<PatientMedicinesPage />} />
              <Route path="reminders" element={<Navigate to="/patient/medicines" replace />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="emergency" element={<Emergency />} />
              <Route path="caregiver" element={<Caregiver />} />
              <Route path="support" element={<WhatsAppIVR />} />
              <Route path="profile" element={<Profile />} />
              <Route path="reports" element={<Reports />} />
              <Route path="medicines-search" element={<MedicineSearch />} />
              <Route path="hospitals" element={<HospitalSearch />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Doctor Flow */}
            <Route path="/doctor" element={<ProtectedRoute allowedRole="doctor" />}>
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="appointments" element={<DoctorAppointments />} />
              <Route path="emergencies" element={<DoctorEmergencies />} />
              <Route path="patients" element={<DoctorPatients />} />
              <Route path="notes" element={<DoctorNotes />} />
              <Route path="adherence" element={<DoctorAdherence />} />
              <Route path="settings" element={<DoctorSettings />} />
            </Route>

            {/* Caregiver Flow */}
            <Route path="/caregiver" element={<ProtectedRoute allowedRole="caregiver" />}>
              <Route path="dashboard" element={<CaregiverDashboard />} />
              <Route path="alerts" element={<CaregiverAlerts />} />
              <Route path="patient" element={<CaregiverPatient />} />
              <Route path="medicine-status" element={<CaregiverMedicineStatus />} />
              <Route path="appointments" element={<CaregiverAppointments />} />
              <Route path="emergencies" element={<CaregiverEmergencies />} />
              <Route path="reports" element={<CaregiverReports />} />
              <Route path="settings" element={<CaregiverSettings />} />
            </Route>

            {/* Admin Flow */}
            <Route path="/admin" element={<ProtectedRoute allowedRole="admin" />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="patients" element={<AdminPatients />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="alerts" element={<AdminAlerts />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="doctors" element={<AdminDoctors />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Catch-all and Legacy Route Handlers */}
            <Route path="/role" element={<Navigate to="/auth" replace />} />
            <Route path="*" element={<Navigate to="/splash" replace />} />
          </Routes>
        </ErrorBoundary>
      </AppInitializer>
    </BrowserRouter>
  );
}
