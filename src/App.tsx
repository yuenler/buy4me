// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignUpPage from './pages/SignUpPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import AddFriendsPage from './pages/AddFriendsPage';
import NotificationsPage from './pages/NotificationsPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/add-friends" element={<AddFriendsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;
