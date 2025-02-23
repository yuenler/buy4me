import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "../firebase";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { GeoPoint } from "firebase/firestore";


const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      if (!user) throw new Error("User creation failed");

      await setDoc(doc(firestore, "profiles", user.uid), {
        username,
        email,
        friends: [],
        location: new GeoPoint(0, 0),
      });

      console.log("User signed up with:", { username, email });
      navigate("/profile");
    } catch (error) {
      console.error("Error signing up:", error);
      alert(`Sign up failed: ${error}`);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen bg-[#F2E8CF] flex flex-col items-center justify-center p-4 pb-20">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold text-[#386641] drop-shadow-lg">
          Buy4Me
        </h1>
        <p className="mt-2 text-lg text-[#6A994E]">
          Get your friends to buy stuff for you.
        </p>
      </div>
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-4 border-[#A7C957]">
        <h2 className="text-3xl font-bold mb-6 text-center text-[#386641]">
          Sign Up
        </h2>

        <input
          type="text"
          placeholder="Your Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-[#6A994E] p-3 mb-4 rounded focus:outline-none focus:ring-2 focus:ring-[#A7C957]"
        />
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
            placeholder="Choose Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#6A994E] p-3 pr-10 mb-4 rounded focus:outline-none focus:ring-2 focus:ring-[#A7C957]"
          />
          <span onClick={toggleShowPassword} style={{ cursor: 'pointer', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </span>
        </div>

        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-[#6A994E] p-3 pr-10 mb-6 rounded focus:outline-none focus:ring-2 focus:ring-[#A7C957]"
          />
          <span onClick={toggleShowConfirmPassword} style={{ cursor: 'pointer', position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
          </span>
        </div>

        <button
          onClick={handleSignup}
          className="w-full bg-[#6A994E] hover:bg-[#386641] transition-colors text-white py-3 rounded shadow-lg font-semibold"
        >
          Sign Up
        </button>

        <div className="mt-4 text-center">
          <p>
            Already have an account?{" "}
            <Link to="/signin" className="text-[#BC4749] hover:underline font-bold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
