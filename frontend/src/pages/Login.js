// src/pages/Login.js
import { useState } from "react";
import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });

      toast.success(res.data.message);

      // Backend'den dönen token ve user objesini doğrudan AuthContext'e gönder
      login({
        ...res.data.user, // Backend'den gelen tüm kullanıcı ve profil bilgileri (id, username, email, name, bio, gender)
        token: res.data.token, // Token
      });

      setEmail("");
      setPassword("");
      setTimeout(() => {
        navigate("/user"); // Kullanıcı paneline yönlendir
      }, 1500);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Sunucudan bağımsız bir hata oluştu"
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm  hover:scale-105 transition-transform duration-300 will-change-transform">
        <h2 className="text-2xl font-semibold mb-6 text-center bg-gray-100 rounded-xl py-2 hover:scale-105 transition-transform duration-300 will-change-transform">
          Giriş Yap
        </h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            required
            className="w-full px-4 py-2 border rounded-lg hover:ring-2 hover:ring-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500  hover:scale-105 transition-transform duration-300 will-change-transform"
          />
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            required
            autoComplete="current-password"
            className="w-full px-4 py-2 border rounded-lg hover:ring-2 hover:ring-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500  hover:scale-105 transition-transform duration-300 will-change-transform"
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold text-white transition-colors  hover:scale-105 transition-transform duration-300 will-change-transform ${
              loading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
          <div className="mt-4 text-center  hover:scale-105 transition-transform duration-300 will-change-transform">
            <Link
              to="/register"
              className="text-blue-600 font-semibold mt-2 hover:text-blue-800 transition"
            >
              Hesabın yok mu?
            </Link>
          </div>
          <div className="mt-2 text-center  hover:scale-105 transition-transform duration-300 will-change-transform">
            <Link
              to="/forgot-password"
              className="text-red-600 font-semibold hover:text-red-800 transition"
            >
              Şifreni mi unuttun?
            </Link>
          </div>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
};

export default Login;
