import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../context/AuthContext"; // AuthContext'i kullanıyoruz çünkü API'ye token ile istek atacağız

const ProfileViewPage = () => {
  const { userId } = useParams(); // URL'den kullanıcı ID'sini al
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Mevcut kullanıcının token'ını almak için AuthContext

  const [viewedUser, setViewedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.token) {
        // Eğer kullanıcı giriş yapmamışsa veya token yoksa, uyarı ver ve login'e yönlendir
        toast.error("Profil görüntülemek için giriş yapmalısınız.");
        navigate("/login");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/users/${userId}/profile`, // Backend'deki yeni endpoint
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setViewedUser(res.data.user);
      } catch (err) {
        console.error("Profil alınırken hata:", err);
        setError("Profil yüklenirken bir hata oluştu.");
        toast.error(err.response?.data?.message || "Profil yüklenemedi.");
        // Eğer kullanıcı bulunamazsa veya yetkisizse arkadaşlık paneline dön
        if (err.response?.status === 404 || err.response?.status === 401) {
          setTimeout(() => navigate("/friends"), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      // userId parametresi mevcutsa veriyi çek
      fetchUserProfile();
    }
  }, [userId, user, navigate]); // userId veya user (token için) değiştiğinde tekrar çek

  const handleGoBack = () => {
    navigate(-1); // Bir önceki sayfaya geri dön (genellikle /friends olur)
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl font-semibold text-gray-700">
          Profil yükleniyor...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-xl font-semibold text-red-600 mb-4">{error}</p>
        <button
          onClick={handleGoBack}
          className="bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors duration-300 will-change-transform"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-xl font-semibold text-gray-700 mb-4">
          Profil bulunamadı.
        </p>
        <button
          onClick={handleGoBack}
          className="bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors duration-300 will-change-transform"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Profil
        </h1>

        <div className="flex flex-col items-center mb-6 space-y-3">
          {/* Profil Resmi Placeholder'ı */}
          <div className="w-28 h-28 rounded-full bg-blue-200 flex items-center justify-center text-blue-800 text-5xl font-bold border-4 border-blue-400 shadow-lg">
            {viewedUser?.name
              ? viewedUser.name.charAt(0).toUpperCase()
              : viewedUser?.username?.charAt(0).toUpperCase() ||
                viewedUser?.email?.charAt(0).toUpperCase()}
          </div>

          {/* Kullanıcı Adı ve İsim */}
          <h2 className="text-xl font-bold text-gray-800">
            {viewedUser?.name || viewedUser?.username}
          </h2>
          <p className="text-gray-600 text-sm">@{viewedUser?.username}</p>
          <p className="text-gray-500 text-sm break-all">{viewedUser?.email}</p>
        </div>

        {/* Biyografi ve Cinsiyet */}
        <div className="mb-6 space-y-2 text-center">
          {viewedUser?.bio && (
            <p className="text-gray-700 italic text-md p-2 bg-gray-100 rounded-md shadow-sm">
              "{viewedUser.bio}"
            </p>
          )}
          {viewedUser?.gender && viewedUser.gender !== "" && (
            <p className="text-gray-600 text-sm">
              Cinsiyet:{" "}
              {viewedUser.gender === "male"
                ? "Erkek"
                : viewedUser.gender === "female"
                ? "Kadın"
                : "Diğer"}
            </p>
          )}
        </div>

        {/* Geri Dön Butonu */}
        <div className="text-center mt-6">
          <button
            onClick={handleGoBack}
            className="bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-colors hover:scale-105 transition-transform duration-300 will-change-transform"
          >
            Geri Dön
          </button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default ProfileViewPage;
