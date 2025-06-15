// src/pages/User.js
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const User = () => {
  const { user, logout } = useContext(AuthContext);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md hover:scale-105 transition-transform duration-300 will-change-transform">
        <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Profilim
        </h1>

        <div className="flex flex-col items-center mb-6 space-y-3">
          {/* Profil Resmi Placeholder'ı */}
          <div className="w-28 h-28 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 text-5xl font-bold border-4 border-blue-400 shadow-lg">
            {user?.name
              ? user.name.charAt(0).toUpperCase()
              : user?.username?.charAt(0).toUpperCase() ||
                user?.email?.charAt(0).toUpperCase()}
          </div>
          {/* Kullanıcı Adı ve İsim */}
          <h2 className="text-xl font-bold text-gray-800">
            {user?.name || user?.username}
          </h2>
          <p className="text-gray-600 text-sm">@{user?.username}</p>{" "}
          {/* Kullanıcı adını küçük göster */}
          <p className="text-gray-500 text-sm break-all">{user?.email}</p>{" "}
          {/* E-postayı da göster */}
        </div>

        {/* Biyografi ve Cinsiyet */}
        <div className="mb-6 space-y-2 text-center">
          {user?.bio && (
            <p className="text-gray-700 italic text-md p-2 bg-gray-100 rounded-md shadow-sm">
              "{user.bio}"
            </p>
          )}
          {user?.gender && user.gender !== "" && (
            <p className="text-gray-600 text-sm">
              Cinsiyet:{" "}
              {user.gender === "male"
                ? "Erkek"
                : user.gender === "female"
                ? "Kadın"
                : "Diğer"}
            </p>
          )}
        </div>

        {/* Navigasyon Butonları */}
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
