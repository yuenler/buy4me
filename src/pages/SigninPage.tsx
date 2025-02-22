import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // Redirect after signing in
    } catch (error) {
      console.error("Error signing in:", error);
      alert(`Sign in failed: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2E8CF] flex flex-col items-center justify-center p-4 pb-20">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold text-[#386641] drop-shadow-lg">
          buy4me?
        </h1>
        <p className="mt-2 text-lg text-[#6A994E]">
          Welcome back! Sign in to continue.
        </p>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-4 border-[#A7C957]">
        <h2 className="text-3xl font-bold mb-6 text-center text-[#386641]">
          Sign In
        </h2>

        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-[#6A994E] p-3 mb-4 rounded focus:outline-none focus:ring-2 focus:ring-[#A7C957]"
        />
        <input
          type="password"
          placeholder="Your Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-[#6A994E] p-3 mb-6 rounded focus:outline-none focus:ring-2 focus:ring-[#A7C957]"
        />

        <button
          onClick={handleSignIn}
          className="w-full bg-[#6A994E] hover:bg-[#386641] transition-colors text-white py-3 rounded shadow-lg font-semibold"
        >
          Sign In
        </button>
      </div>
    </div>
  );
};

export default SignInPage;
