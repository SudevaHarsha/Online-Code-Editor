import { useState, useEffect, useRef } from "react";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { User } from "lucide-react";
import LoginButton from "./LoginButton";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";

function HeaderProfileBtn() {
  const auth = getAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { user, setUser } = useUser();
  console.log(user);

  const handleSignOut = () => {
    signOut(auth);
    setUser(null);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <div className="relative" ref={dropdownRef}>
      {user ? (
        <>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg shadow-lg"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <img
              src={user?.imageUrl || "./default.jpeg"}
              alt="User"
              className="w-8 h-8 rounded-full"
            />
            {user?.name || "Profile"}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-lg z-50">
              <Link
                to="/profile"
                className="flex items-center px-4 py-2 hover:bg-gray-200"
              >
                <User className="size-4 mr-2" />
                Profile
              </Link>
              <button
                onClick={() => { handleSignOut() }}
                className="w-full text-left px-4 py-2 hover:bg-gray-200"
              >
                Logout
              </button>
            </div>
          )}
        </>
      ) : (
        <LoginButton />
      )}
    </div>
  );
}

export default HeaderProfileBtn;
