// src/pages/User.js
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext"; // Bu satırı kaldırdık
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const User = () => {
  const { user, logout } = useContext(AuthContext); // AuthContext doğrudan erişilebilir
  const navigate = useNavigate();

  const handleFriends = () => {
    navigate("/friends");
  };
  const handleChat = () => {
    navigate("/chat");
  };

  const handleEditProfile = () => {
    navigate("/profile-edit");
  };

  const handleLogout = () => {
    logout();
    toast.info("Başarıyla çıkış yaptınız.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-14  rounded-xl shadow-md w-full max-w-sm hover:scale-105 transition-transform duration-300 will-change-transform">
        <h1 className="text-xl font-semibold text-center mb-10 hover:scale-105 transition-transform duration-300 will-change-transform">
          Hoş geldin<br></br>
          <span className="text-blue-600 break-all">
            {user?.name || user?.username || user?.email}
          </span>
        </h1>

        <div className="space-y-4">
          <button
            onClick={handleFriends}
            className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition-colors hover:scale-105 transition-transform duration-300 will-change-transform"
          >
            Arkadaşlık Panelim
          </button>
          <button
            onClick={handleChat}
            className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition-colors hover:scale-105 transition-transform duration-300 will-change-transform"
          >
            Mesaj Panelim
          </button>
          <button
            onClick={handleEditProfile}
            className="w-full bg-blue-500 text-white font-semibold py-2 rounded-lg hover:bg-blue-600 transition-colors hover:scale-105 transition-transform duration-300 will-change-transform"
          >
            Profilimi Düzenle
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white font-semibold py-2 rounded-lg hover:bg-red-600 transition-colors hover:scale-105 transition-transform duration-300 will-change-transform"
          >
            Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  );
};

export default User;
