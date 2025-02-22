// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SignUpPage from './pages/SignUpPage';
import ProfilePage from './pages/ProfilePage';
import AddFriendsPage from './pages/AddFriendsPage';
import NotificationsPage from './pages/NotificationsPage';

const App: React.FC = () => {
  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/add-friends" element={<AddFriendsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
        <nav style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          padding: '10px',
          borderTop: '1px solid #ccc',
          backgroundColor: '#fff',
        }}>
          <Link to="/notifications" style={{ textDecoration: 'none' }}><button>Notifications</button></Link>
          <Link to="/" style={{ textDecoration: 'none' }}><button>Home</button></Link>
          <Link to="/profile" style={{ textDecoration: 'none' }}><button>Profile</button></Link>
        </nav>
      </div>
    </Router>
  );
};

export default App;
