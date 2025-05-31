// src/components/ProtectedRoute.js
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // <-- Bu satırı tekrar ekleyin

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <p className="text-center mt-10 text-blue-600 animate-pulse">
        Yükleniyor...
      </p>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
