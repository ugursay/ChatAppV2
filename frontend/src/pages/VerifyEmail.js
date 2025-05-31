// src/pages/VerifyEmail.js
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/verify/${token}`
        );
        toast.success(res.data.message);
        setTimeout(() => navigate("/login"), 3000); // Başarılı olursa login'e yönlendir
      } catch (err) {
        console.error(err);
        toast.error(
          err.response?.data?.message || "Email doğrulaması başarısız."
        );
        setTimeout(() => navigate("/register"), 3000); // Hata olursa register'a yönlendir
      }
    };
    if (token) {
      verify();
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-xl font-semibold text-gray-700">
        Emailiniz doğrulanıyor...
      </p>
      <ToastContainer />
    </div>
  );
};

export default VerifyEmail;
