import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home"); // Redirect after signing in
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

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#6A994E] p-3 pr-10 mb-4 rounded focus:outline-none focus:ring-2 focus:ring-[#A7C957]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#386641]"
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        </div>

        <button
          onClick={handleSignIn}
          className="w-full bg-[#6A994E] hover:bg-[#386641] transition-colors text-white py-3 rounded shadow-lg font-semibold"
        >
          Sign In
        </button>

        <div className="mt-4 text-center">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="text-[#BC4749] hover:underline font-bold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
