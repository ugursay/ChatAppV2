// src/pages/Friends.js
import { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

const Friends = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = user?.token;
  const currentUserId = user?.id;

  const fetchData = useCallback(async () => {
    if (!token || !currentUserId) return;

    setLoading(true);
    try {
      const usersRes = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllUsers(usersRes.data);

      const friendsRes = await axios.get("http://localhost:5000/api/friends", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriends(friendsRes.data);

      const pendingRes = await axios.get(
        "http://localhost:5000/api/friends/requests",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPendingRequests(pendingRes.data);

      const outgoingRes = await axios.get(
        "http://localhost:5000/api/friends/outgoing-requests",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOutgoingRequests(outgoingRes.data);
    } catch (err) {
      toast.error("Veriler alınırken bir hata oluştu.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    currentUserId,
    setAllUsers,
    setFriends,
    setPendingRequests,
    setOutgoingRequests,
    setLoading,
  ]);

  useEffect(() => {
    fetchData();

    const socket = io("http://localhost:5000");

    socket.on("connect", () => {
      console.log("socket.IO bağlı:", socket.id);
      if (currentUserId) {
        socket.emit("register_user_id", currentUserId);
      }
    });

    socket.on("friend_request_received", (data) => {
      console.log("Arkadaşlık isteği alındı:", data);
      if (data.receiverId === currentUserId) {
        toast.info(`${data.requesterUsername} size arkadaşlık isteği gönderdi`);
        fetchData();
      }
    });

    socket.on("friend_request_accepted", (data) => {
      console.log("Arkadaşlık isteği kabul edildi:", data);
      if (data.requesterId === currentUserId) {
        toast.info(`${data.accepterUsername} arkadaşlık isteğinizi kabul etti`);
      }
      fetchData();
    });

    socket.on("unfriend_successful", (data) => {
      console.log("Arkadaşlık ilişkisi kesildi", data);
      if (data.user1Id === currentUserId || data.user2Id === currentUserId) {
        toast.info("arkadaşlık ilişkiniz güncellendi");
      }
      fetchData();
    });

    socket.on("friend_request_cancelled", (data) => {
      console.log("Arkadaşlık isteği geri çekildi:", data);
      if (data.receiverId === currentUserId) {
        toast.info(
          `${data.requesterUsername} adlı kullanıcı arkadaşlık isteğini geri çekti.`
        );
        fetchData();
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO bağlantısı kesildi");
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchData, currentUserId]);

  const sendRequest = async (receiverId) => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/friends/request",
        { receiverId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(res.data.message);

      setAllUsers((prevUsers) => prevUsers.filter((u) => u.id !== receiverId));

      const userToSend = allUsers.find((u) => u.id === receiverId);

      if (userToSend) {
        setOutgoingRequests((prevOutgoing) => [...prevOutgoing, userToSend]);
      }

      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "İstek gönderilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requesterId) => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/friends/accept",
        { requesterId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success(res.data.message);

      setPendingRequests((prevPending) =>
        prevPending.filter((req) => req.id !== requesterId)
      );
      const newFriend = pendingRequests.find((req) => req.id === requesterId);

      if (newFriend) {
        setFriends((prevFriends) => [...prevFriends, newFriend]);
      }

      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "İstek kabul edilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfriend = async (friendId) => {
    setLoading(true);
    try {
      const res = await axios.delete(
        "http://localhost:5000/api/friends/unfriend",
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { friendId },
        }
      );
      toast.success(res.data.message);

      setFriends((prevFriends) => prevFriends.filter((f) => f.id !== friendId));

      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Arkadaş çıkarılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (receiverId) => {
    setLoading(true);
    try {
      const res = await axios.delete(
        "http://localhost:5000/api/friends/request/cancel",
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { receiverId },
        }
      );
      toast.success(res.data.message);
      setOutgoingRequests((prevOutgoing) =>
        prevOutgoing.filter((req) => req.id !== receiverId)
      );
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "istek geri çekilemedi");
    } finally {
      setLoading(false);
    }
  };

  const getConnectableUsers = () => {
    const friendIds = new Set(friends.map((f) => f.id));
    const pendingRequesterIds = new Set(pendingRequests.map((req) => req.id));
    const outgoingReceiverIds = new Set(outgoingRequests.map((req) => req.id)); // <-- outgoingRequests doğru kullanıldı

    return allUsers.filter(
      (u) =>
        u.id !== currentUserId &&
        !friendIds.has(u.id) &&
        !pendingRequesterIds.has(u.id) &&
        !outgoingReceiverIds.has(u.id)
    );
  };

  const handleViewFriendProfile = (friendId) => {
    navigate(`/profile/${friendId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800 hover:scale-105 transition-transform duration-300 will-change-transform bg-gray-200 bg-opacity-60 px-40 py-5 rounded-xl w-fit mx-auto">
          Arkadaşlık Yönetimi
        </h2>

        {/* Diğer Kullanıcılar */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 hover:scale-105 transition-transform duration-300 will-change-transform bg-gray-200 bg-opacity-60 px-20 py-5 rounded-xl w-fit mx-auto">
            Tüm Kullanıcılar
          </h3>
          {loading ? (
            <p className="text-center text-gray-500">Yükleniyor...</p>
          ) : getConnectableUsers().length === 0 ? (
            <p className="text-center text-gray-500 w-fit mx-auto hover:scale-95 transition-transform duration-300 will-change-transform">
              Gönderilebilecek başka kullanıcı bulunmuyor.
            </p>
          ) : (
            <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {getConnectableUsers().map((userItem) => (
                <li
                  key={userItem.id}
                  className="flex items-center justify-between bg-gray-200 px-5 py-2 hover:scale-95 transition-transform duration-300 will-change-transform bg-gray-200 bg-opacity-60 rounded-xl w-full max-w-md mx-auto"
                >
                  <span className="flex-grow min-w-0 truncate">
                    {userItem.username}
                  </span>{" "}
                  {/* İYİLEŞTİRME: Taşmayı önlemek için eklendi */}
                  <button
                    onClick={() => sendRequest(userItem.id)}
                    disabled={loading}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-blue-300 transition-colors duration-200 flex-shrink-0" /* İYİLEŞTİRME: Butonun küçülmemesi için eklendi */
                  >
                    İstek Gönder
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Gelen Arkadaşlık İstekleri */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 hover:scale-105 transition-transform duration-300 will-change-transform bg-gray-200 bg-opacity-60 px-5 py-5 rounded-xl w-fit mx-auto">
            Gelen Arkadaşlık İstekleri
          </h3>
          {loading ? (
            <p className="text-center text-gray-500">Yükleniyor...</p>
          ) : pendingRequests.length === 0 ? (
            <p className="text-center text-gray-500 hover:scale-95 transition-transform duration-300 will-change-transform w-fit mx-auto">
              Gelen istek yok.
            </p>
          ) : (
            <ul className="space-y-3 max-h-40 overflow-y-auto pr-2">
              {pendingRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between gap-4 bg-yellow-50 px-5 py-2 rounded-md shadow-sm border border-yellow-100 w-fit mx-auto"
                >
                  <span className="font-medium text-yellow-800 flex-grow min-w-0 truncate">
                    {" "}
                    {/* İYİLEŞTİRME: Taşmayı önlemek için eklendi */}
                    {req.username}
                  </span>
                  <button
                    onClick={() => acceptRequest(req.id)}
                    disabled={loading}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-green-300 transition-colors duration-200 flex-shrink-0" /* İYİLEŞTİRME: Butonun küçülmemesi için eklendi */
                  >
                    Kabul Et
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 hover:scale-105 transition-transform duration-300 will-change-transform bg-gray-200 bg-opacity-60 px-5 py-5 rounded-xl w-fit mx-auto">
            Giden Arkadaşlık İstekleri
          </h3>
          {loading ? (
            <p className="text-center text-gray-500">Yükleniyor...</p>
          ) : outgoingRequests.length === 0 ? (
            <p className="text-center text-gray-500 hover:scale-95 transition-transform duration-300 will-change-transform w-fit mx-auto">
              Gönderilmiş İstek Yok.
            </p>
          ) : (
            <ul className="space-y-3 max-h-40 overflow-y-auto pr-2">
              {outgoingRequests.map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between bg-gray-200 px-5 py-2 hover:scale-95 transition-transform duration-300 will-change-transform bg-gray-200 bg-opacity-60 rounded-xl w-full max-w-md mx-auto"
                >
                  <span className="flex-grow min-w-0 truncate">
                    {req.username}
                  </span>
                  <button
                    onClick={() => handleCancelRequest(req.id)}
                    disabled={loading}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 disable:bg-yellow-300 transition-colors duration-200 flex-shrink-0 ml-4"
                  >
                    Geri Çek
                  </button>
                  <span className="text-gray-500 text-sm italic flex-shrink-0 ml-4">
                    Beklemede...
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Arkadaş Listesi */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-700 hover:scale-105 transition-transform duration-300 will-change-transform bg-gray-200 bg-opacity-60 px-4 py-5 rounded-xl w-fit mx-auto">
            Arkadaşlarım
          </h3>
          {loading ? (
            <p className="text-center text-gray-500">Yükleniyor...</p>
          ) : friends.length === 0 ? (
            <p className="text-center text-gray-500 hover:scale-105 transition-transform duration-300 will-change-transform">
              Henüz arkadaşın yok.
            </p>
          ) : (
            <ul className="mb-6 space-y-3 max-h-40 overflow-y-auto pr-2">
              {friends.map((friend) => (
                <li
                  key={friend.id}
                  onClick={() => handleViewFriendProfile(friend.id)}
                  className="flex items-center justify-between bg-gray-100 p-3 rounded-md shadow-sm cursor-pointer hover:scale-95 transition-transform will-change-transform hover:bg-gray-100 transition-colors duration-300"
                >
                  <span className="flex-grow min-w-0 truncate">
                    {" "}
                    {/* İYİLEŞTİRME: Taşmayı önlemek için eklendi */}
                    {friend.username}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnfriend(friend.id);
                    }}
                    disabled={loading}
                    className="bg-red-400 ml-5 text-white px-3 py-1 rounded hover:bg-red-600 disabled:bg-red-200 transition-colors duration-300 will-change-transform flex-shrink-0" /* İYİLEŞTİRME: Butonun küçülmemesi için eklendi */
                  >
                    Çıkar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/user")}
            className="bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-400 hover:scale-105 transition-transform duration-300 will-change-transform"
          >
            Panele Geri Dön
          </button>
        </div>

        <ToastContainer />
      </div>
    </div>
  );
};

export default Friends;
