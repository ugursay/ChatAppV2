// src/App.js
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import User from "./pages/User";
import Friends from "./pages/Friends";
import VerifyEmail from "./pages/VerifyEmail"; // Yeni ekledik
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatPage from "./pages/ChatPage";
import ProfileEdit from "./pages/ProfileEdit";

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />{" "}
          {/* Yeni rota */}
          {/* Korumalı Rotalar */}
          <Route
            path="/user"
            element={
              <ProtectedRoute>
                <User />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-edit"
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <footer className="text-center text-sm py-4 text-gray-500 mt-auto">
        © {new Date().getFullYear()} BookNook
      </footer>
    </div>
  );
}

export default App;
