import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import ProfilePage from "./pages/ProfilePage";
import AddFriendsPage from "./pages/AddFriendsPage";
import NotificationsPage from "./pages/NotificationsPage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBagShopping, faHandHoldingHeart, faUser } from "@fortawesome/free-solid-svg-icons";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
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
      <div className="flex flex-col min-h-screen">
        <Routes>
          {currentUser ? (
            <>
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/signin" element={<Navigate to="/" />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/add-friends" element={<AddFriendsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/" element={<HomePage />} />
            </>
          ) : (
            <Route path="/*" element={<SignInPage />} />
          )}
        </Routes>

        {currentUser && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white flex justify-center gap-10 py-4 border-t border-[#D1D1D1]">
            <Link to="/notifications" className="text-[#386641] flex flex-col items-center hover:text-[#6A994E] transition">
              <FontAwesomeIcon icon={faHandHoldingHeart} size="lg" />
              <span className="text-sm mt-1">Help</span>
            </Link>
            <Link to="/" className="text-[#386641] flex flex-col items-center hover:text-[#6A994E] transition">
              <FontAwesomeIcon icon={faBagShopping} size="lg" />
              <span className="text-sm mt-1">Shop</span>
            </Link>
            <Link to="/profile" className="text-[#386641] flex flex-col items-center hover:text-[#6A994E] transition">
              <FontAwesomeIcon icon={faUser} size="lg" />
              <span className="text-sm mt-1">Profile</span>
            </Link>
          </nav>
        )}
      </div>
    </Router>
  );
};

export default App;
