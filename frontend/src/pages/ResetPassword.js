import { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isStrongPassword = (password) => {
    return (
      password.length >= 6 && /\d/.test(password) && /[a-zA-Z]/.test(password)
    );
  };

  const handleReset = async (e) => {
    e.preventDefault();

    if (!isStrongPassword(newPassword)) {
      toast.error(
        "şifre en az 6 karakter olmalı, içinde sayı ve harf bulunmalı."
      );
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor.");
      setLoading(false);
      return;
    }

    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/reset-password/${token}`,
        { newPassword }
      );

      toast.success(res.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm hover:scale-105 transition-transform duration-300 will-change-transform">
        <h2 className="text-2xl font-semibold mb-6 text-center bg-gray-100 rounded-xl py-2 hover:scale-105 transition-transform duration-300 will-change-transform">
          Yeni Şifre Belirle
        </h2>
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="password"
            placeholder="Yeni Şifre"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg hover:ring-2 hover:ring-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105 transition-transform transition-colors duration-300 will-change-transform"
          />
          <input
            type="password"
            placeholder="Yeni Şifre (Tekrar)"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg hover:ring-2 hover:ring-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105 transition-transform transition-colors duration-300 will-change-transform"
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold text-white transition-colors duration-300 will-change-transform ${
              loading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 hover:scale-105 transition-transform"
            }`}
          >
            {loading ? "Yükleniyor..." : "Şifreyi Güncelle"}
          </button>
          <div className="mt-4 text-center hover:scale-105 transition-transform duration-300 will-change-transform">
            <a
              href="/login"
              className="text-blue-600 font-semibold mt-2 hover:text-blue-800 transition transition-colors duration-300"
            >
              Giriş sayfasına dön
            </a>
          </div>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
};

export default ResetPassword;
