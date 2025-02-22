// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SignUpPage from './pages/SignUpPage';
import SignInPage from './pages/SigninPage';
import ProfilePage from './pages/ProfilePage';
import AddFriendsPage from './pages/AddFriendsPage';
import NotificationsPage from './pages/NotificationsPage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faBell, faHandHoldingHeart, faHome, faShoppingCart, faUser } from '@fortawesome/free-solid-svg-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for changes in authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signin" element={<SignInPage />} />
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
          <Link to="/notifications" style={{ textDecoration: 'none' }}>
            <button style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
              <FontAwesomeIcon icon={faHandHoldingHeart} size="lg" />
              <span style={{ fontSize: '12px' }}>Help</span>
            </button>
          </Link>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <button style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
              <FontAwesomeIcon icon={faBagShopping} size="lg" />
              <span style={{ fontSize: '12px' }}>Shop</span>
            </button>
          </Link>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <button style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px' }}>
              <FontAwesomeIcon icon={faUser} size="lg" />
              <span style={{ fontSize: '12px' }}>Profile</span>
            </button>
          </Link>
        </nav>
      </div>
    </Router>
  );
};

export default App;
