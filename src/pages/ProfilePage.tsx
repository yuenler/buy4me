// src/pages/ProfilePage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

const ProfilePage: React.FC = () => {
  // In a real app, fetch user info from Firebase Auth / Firestore.
  const profile = {
    picture: 'https://via.placeholder.com/150',
    friendsCount: 5,
    setupSteps: {
      addFriends: true,
      linkBank: false,
      linkPaypal: false,
    },
  };

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/signup');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
        <img
          src={profile.picture}
          alt="Profile"
          className="rounded-full w-24 h-24 mx-auto"
        />
        <h2 className="text-center text-2xl mt-4">Your Profile</h2>
        <p className="text-center mt-2">Friends: {profile.friendsCount}</p>
        <div className="mt-4">
          <h3 className="font-bold">Profile Setup Status:</h3>
          <ul className="list-disc ml-6">
            <li className={profile.setupSteps.addFriends ? 'text-green-500' : 'text-red-500'}>
              Add Friends
            </li>
            <li className={profile.setupSteps.linkBank ? 'text-green-500' : 'text-red-500'}>
              Link Bank Account
            </li>
            <li className={profile.setupSteps.linkPaypal ? 'text-green-500' : 'text-red-500'}>
              Link PayPal
            </li>
          </ul>
        </div>
        <button
          onClick={() => navigate('/add-friends')} // ✅ Replaces history.push('/add-friends')
          className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Add Friends
        </button>
        <button
          onClick={handleLogout}
          className="mt-4 w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
