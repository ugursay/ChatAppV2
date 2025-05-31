// src/context/AuthContext.js
import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode"; // npm install jwt-decode
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, email, token, username }
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        // Token süresi doldu mu kontrolü
        if (decodedToken.exp * 1000 < Date.now()) {
          console.log("Token süresi dolmuş, çıkış yapılıyor.");
          localStorage.removeItem("token");
          setUser(null);
          navigate("/login");
        } else {
          // Token geçerli ise, kullanıcı bilgilerini set et
          setUser({
            id: decodedToken.id,
            email: decodedToken.email,
            username: decodedToken.username,
            token: token,
          });
        }
      } catch (error) {
        console.error("JWT token çözme hatası:", error);
        localStorage.removeItem("token");
        setUser(null);
      }
    }
    setLoading(false);
  }, [navigate]);

  const login = (userData) => {
    // userData bekleniyor: { id, email, username, token }
    setUser(userData);
    localStorage.setItem("token", userData.token); // Sadece token'ı saklamak daha güvenli
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
