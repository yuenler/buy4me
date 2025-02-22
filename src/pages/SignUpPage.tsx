// src/pages/SignUpPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const navigate = useNavigate();

  const handleSignup = () => {
    console.log("User signed up with:", { name, phoneNumber });
    navigate('/profile');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl mb-4">Sign Up</h2>
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 mb-4 rounded"
        />
        <input
          type="tel"
          placeholder="Your Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full border p-2 mb-4 rounded"
        />
        {/* Invisible reCAPTCHA container (commented out) */}
        {/* <div id="recaptcha-container"></div> */}

        <button
          onClick={handleSignup}
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default SignUpPage;
