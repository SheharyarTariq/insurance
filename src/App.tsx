import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './modules/Signup/signup';
import LoginPage from './modules/Login/login';
import Dashboard from './modules/Dashboard/dashboard';
import MainLayout from './layout/layout';
import Claims from './modules/Claims/ClaimsList';
import ProfileSetting from './modules/Setting/ProfileSetting/ProfileSetting';
import SystemConfigurations from './modules/Setting/SystemConfig/SystemConfig';
import NewClaims from './modules/Claims/NewClaims';
import { ToastContainer } from 'react-toastify';
import Questionnaire from './modules/Questionnaire/Questionnaire';
import CarDamageOverlay from './components/NewClaims/AIDamageDetection';

const App: React.FC = () => {

  return (
    <>
    <ToastContainer />
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<Signup />} />

          {/* Redirect to login if no route matches */}

          {/* Protected Routes with Layout */}
          <Route element={<MainLayout />}>
            {/* Dashboard Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />     

            {/* Claims Routes */}
            <Route path="/claims" element={<Claims />} />
            
            <Route path="/new-claim" element={<NewClaims />} />
            <Route path="/claim/:id" element={<NewClaims />} />
            <Route path='/questionnaire' element={<Questionnaire />} />
            <Route path='/ai-damage' element={<CarDamageOverlay />} />
            {/* Settings */}

            <Route path="/settings/profile" element={<ProfileSetting />} />
            <Route path="/settings/system" element={< SystemConfigurations/>} />
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default App;
