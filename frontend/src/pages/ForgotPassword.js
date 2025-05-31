import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/forgot-password",
        { email }
      );
      toast.success(res.data.message);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm hover:scale-105 transition-transform duration-300 will-change-transform">
        <h2 className="text-2xl font-semibold mb-6 text-center bg-gray-100 rounded-xl py-2 hover:scale-105 transition-transform duration-300 will-change-transform">
          Şifremi Unuttum
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="E-posta adresiniz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-lg hover:ring-2 hover:ring-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105 transition-transform duration-300 will-change-transform"
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
            {loading ? "Gönderiliyor..." : "Gönder"}
          </button>
        </form>

        <div className="mt-4 text-center hover:scale-105 transition-transform duration-300 will-change-transform">
          <Link
            to="/login"
            className="text-blue-600 font-semibold mt-2 hover:text-blue-800 transition-colors duration-300"
          >
            Giriş sayfasına dön
          </Link>
        </div>
        <ToastContainer />
      </div>
    </div>
  );
};

export default ForgotPassword;
