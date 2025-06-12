// src/context/AuthContext.js
import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // `user` state'i artık id, username, email, name, bio, gender gibi tüm profil bilgilerini içerecek
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
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
            // Token geçerli ise, backend'den güncel ve tüm profil bilgilerini çek
            const res = await axios.get(
              "http://localhost:5000/api/users/profile", // backend'de GET rotası olan /api/users/profile
              { headers: { Authorization: `Bearer ${token}` } }
            );
            // Backend'den dönen tüm kullanıcı ve profil bilgilerini setUser ile kaydet
            setUser({
              ...decodedToken, // id, email, username gibi JWT'den gelen bilgiler
              ...res.data.user, // name, bio, gender gibi profilden gelen bilgiler
              token: token, // Token'ı da saklamaya devam et
            });
          }
        } catch (error) {
          console.error("Token çözme veya profil çekme hatası:", error);
          localStorage.removeItem("token");
          setUser(null);
          navigate("/login"); // Hata durumunda login sayfasına yönlendir
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [navigate]); // navigate bağımlılığını ekle

  const login = (userData) => {
    // userData artık backend'den gelen tüm profil bilgilerini içeriyor:
    // { id, email, username, name, bio, gender, token }
    setUser(userData);
    localStorage.setItem("token", userData.token); // Sadece token'ı saklamak hala daha güvenli
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    setLoading(false); // Logout olduğunda loading durumunu da resetle
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
