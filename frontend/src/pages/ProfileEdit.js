import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const ProfileEdit = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setName(user.name || "");
      setBio(user.bio || "");
      setGender(user.gender || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const updatedData = {};

      // Kullanıcı adı (username) her zaman gönderilmeli, değişmese bile.
      // Backend'deki kontrol, eğer aynıysa güncellemeyi atlayacaktır.
      updatedData.username = username;

      // Diğer alanlar sadece gerçekten değiştiyse gönderilir.
      if (name !== (user.name || "")) updatedData.name = name;
      if (bio !== (user.bio || "")) updatedData.bio = bio;
      if (gender !== (user.gender || "")) updatedData.gender = gender;

      // Eğer username dışında hiçbir alan değişmediyse ve username de değişmediyse uyarı ver.
      // username her zaman gönderildiği için, buradaki kontrolü biraz daha esnek yapıyoruz.
      // Sadece username'in kendisi değişmediyse ve diğer alanlar da değişmediyse.
      const isUsernameChanged = username !== (user.username || "");
      const isOtherDataChanged =
        name !== (user.name || "") ||
        bio !== (user.bio || "") ||
        gender !== (user.gender || "");

      if (!isUsernameChanged && !isOtherDataChanged) {
        toast.info("Güncellenecek bir değişiklik yok.");
        setLoading(false);
        return;
      }

      const res = await axios.put(
        "http://localhost:5000/api/users/profile",
        updatedData,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      toast.success(res.data.message);
      login({ ...user, ...res.data.user });
      navigate("/user");
    } catch (err) {
      console.error("Profil güncelleme hatası:", err);
      toast.error(err.response?.data?.message || "Profil güncellenemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-6 text-center text-gray-800 hover:scale-105 transition-transform duration-300 will-change-transform bg-gray-200 bg-opacity-60 px-10 py-5 rounded-xl w-fit mx-auto">
          Profili Düzenle
        </h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              İsim:
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105 transition-transform duration-300 will-change-transform"
              maxLength="50"
            />
          </div>
          <div>
            <label
              htmlFor="username"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Kullanıcı Adı:
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105 transition-transform duration-300 will-change-transform"
            />
          </div>
          <div>
            <label
              htmlFor="bio"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Biyografi:
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows="3"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105 transition-transform duration-300 will-change-transform"
            ></textarea>
          </div>
          <div>
            <label
              htmlFor="gender"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              Cinsiyet:
            </label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105 transition-transform duration-300 will-change-transform"
            >
              <option value="">Seçiniz...</option>
              <option value="male">Erkek</option>
              <option value="female">Kadın</option>
              <option value="other">Diğer</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold text-white transition-colors duration-300 will-change-transform ${
              loading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-500 hover:scale-105 transition-transform"
            }`}
          >
            {loading ? "Kaydediliyor..." : "Profili Güncelle"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/user")}
            className="w-full mt-4 py-2 rounded-lg font-semibold text-gray-800 bg-gray-300 hover:bg-gray-400 transition-colors duration-300 will-change-transform hover:scale-105 transition-transform"
          >
            Geri Dön
          </button>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
};

export default ProfileEdit;
