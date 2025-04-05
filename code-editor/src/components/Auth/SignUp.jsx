import { useState } from "react";
import { signInWithGoogle, signUpWithEmail } from "../../firebase";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useUser } from "../../context/UserContext";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const {setUser} = useUser();

  const handleGoogleSignUp = async () => {
    const user = await signInWithGoogle();
    if (user) {
      await saveUserToBackend(user, "default");
      navigate("/");
    }
  };

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    const user = await signUpWithEmail(email, password);
    if (user) {
      await saveUserToBackend(user, password);
      navigate("/");
    }
  };

  const saveUserToBackend = async (user, password) => {
    try {
      const response = await fetch("https://online-code-editor-dmo6.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUserId: user.uid,
          email: user.email,
          name: user.displayName,
          password: password || "default",
          imageUrl: user.photoURL,
        }),
      });
  
      const userData = await response.json(); // Get user object from backend
  
        console.log(userData);
      setUser(userData);
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <div className="bg-gray-800/90 shadow-lg rounded-xl p-8 w-96 text-white backdrop-blur-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Create an Account</h2>

        <button
          onClick={handleGoogleSignUp}
          className="flex items-center justify-center gap-3 w-full bg-gray-700 hover:bg-gray-600 p-3 rounded-lg shadow-md transition"
        >
          <FcGoogle className="text-2xl" />
          <span className="text-sm font-semibold">Sign up with Google</span>
        </button>

        <div className="mt-4 text-center text-gray-400 text-sm">OR</div>

        <form onSubmit={handleEmailSignUp} className="flex flex-col gap-4 mt-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-700 border-none p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-700 border-none p-3 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 p-3 rounded-lg font-semibold transition"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-gray-400 mt-4 text-sm">
          Already have an account?{" "}
          <Link to="/sign-in" className="text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
