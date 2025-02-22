import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "../firebase";
import paypalIcon from "../images/paypal-logo.png";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [paypal, setPaypal] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPaypalModalOpen, setPaypalModalOpen] = useState(false);

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
        paypal,
        email,
        friends: [],
      });

      console.log("User signed up with:", { username, paypal, email });
      navigate("/profile");
    } catch (error) {
      console.error("Error signing up:", error);
      alert(`Sign up failed: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2E8CF] flex flex-col items-center justify-center p-4 pb-20">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold text-[#386641] drop-shadow-lg">
          Buy4Me
        </h1>
        <p className="mt-2 text-lg text-[#6A994E]">
          Your one-stop shop for all your needs
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
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#386641]"
          >
            {showPassword ? "👁" : "👁‍🗨"}
          </button>
        </div>

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-[#6A994E] p-3 pr-10 mb-6 rounded focus:outline-none focus:ring-2 focus:ring-[#A7C957]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#386641]"
          >
            {showPassword ? "👁" : "👁‍🗨"}
          </button>
        </div>

        <div className="mb-4">
          <p className="text-[#6A994E] mb-2 text-left">Link your PayPal</p>
          <div className="flex justify-start">
            <button type="button" onClick={() => setPaypalModalOpen(true)}>
              <img src={paypalIcon} alt="Link your PayPal" className="h-12 w-40" />
            </button>
          </div>
          
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