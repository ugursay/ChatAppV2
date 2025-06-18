import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import io from "socket.io-client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const ChatPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const token = user?.token;
  const currentUserId = user?.id;

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchFriends = useCallback(async () => {
    if (!token || !currentUserId) {
      setLoadingFriends(false);
      return;
    }
    setLoadingFriends(true);
    try {
      const res = await axios.get("http://localhost:5000/api/friends", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriends(res.data);
    } catch (err) {
      console.error("Arkadaş listesi alınırken hata:", err);
      toast.error("Arkadaş listesi yüklenemedi.");
    } finally {
      setLoadingFriends(false);
    }
  }, [token, currentUserId]);

  const fetchChatHistory = useCallback(
    async (friendId) => {
      if (!token || !currentUserId || !friendId) return;

      setLoadingMessages(true);
      try {
        const res = await axios.get(
          `http://localhost:5000/api/messages/history/${friendId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages(res.data);
      } catch (err) {
        console.error("Sohbet geçmişi alınırken hata:", err);
        toast.error("Sohbet geçmişi yüklenemedi.");
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, currentUserId]
  );

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  useEffect(() => {
    if (selectedFriend) {
      fetchChatHistory(selectedFriend.id);
    } else {
      setMessages([]);
    }
  }, [selectedFriend, fetchChatHistory]);

  useEffect(() => {
    if (!currentUserId) return;

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io("http://localhost:5000");
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Chat Socket.IO bağlı:", socket.id);
      socket.emit("register_user_id", currentUserId);
    });

    socket.on("receive_message", (message) => {
      console.log("Yeni mesaj alındı:", message);
      if (
        selectedFriend &&
        ((message.sender_id === selectedFriend.id &&
          message.receiver_id === currentUserId) ||
          (message.sender_id === currentUserId &&
            message.receiver_id === selectedFriend.id))
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      } else if (message.receiver_id === currentUserId) {
        toast.info(
          `Yeni mesaj: ${message.sender_username} - ${message.content.substring(
            0,
            20
          )}...`
        );
      }
    });

    socket.on("disconnect", () => {
      console.log("Chat Socket.IO bağlantısı kesildi.");
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUserId, selectedFriend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;

    try {
      await axios.post(
        "http://localhost:5000/api/messages/send",
        { receiverId: selectedFriend.id, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
    } catch (err) {
      console.error("Mesaj gönderilirken hata:", err);
      toast.error(err.response?.data?.message || "Mesaj gönderilemedi.");
    }
  };

  const handleGoBackToUserPanel = () => {
    navigate("/user");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <h2 className="text-xl text-gray-700">Giriş yapınız.</h2>
        <button
          onClick={() => navigate("/login")}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Giriş Yap
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {" "}
      {/* Friends.js ile tutarlı padding */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-5xl flex h-[80vh]">
        {" "}
        {/* Ana kart ve boyutlandırma */}
        {/* Sol Panel: Arkadaş Listesi */}
        <div className="w-1/3 bg-white p-4 border-r border-gray-200 flex flex-col">
          {" "}
          {/* Daha küçük genişlik, p-4 padding */}
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
            Arkadaşlarım
          </h2>
          {loadingFriends ? (
            <p className="text-center text-gray-500">Yükleniyor...</p>
          ) : friends.length === 0 ? (
            <p className="text-center text-gray-500">Henüz arkadaşın yok.</p>
          ) : (
            <ul className="flex-grow overflow-y-auto space-y-3 mb-4 pr-2">
              {" "}
              {/* pr-2 eklendi */}
              {friends.map((friend) => (
                <li
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition duration-200 ${
                    selectedFriend?.id === friend.id
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  <span className="font-medium text-lg">{friend.username}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={handleGoBackToUserPanel}
            className="w-full bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-semibold hover:bg-gray-400 hover:scale-105 transition-transform duration-300 will-change-transform mt-auto"
          >
            Panele Geri Dön
          </button>
        </div>
        {/* Sağ Panel: Sohbet Alanı */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {!selectedFriend ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-xl">
              Sohbet etmek için bir arkadaş seçin.
            </div>
          ) : (
            <>
              {/* Sohbet Başlığı */}
              <div className="bg-white p-4 border-b border-gray-200 shadow-sm flex items-center justify-center">
                <h2 className="text-xl font-semibold text-blue-700">
                  {selectedFriend.username} ile Sohbet
                </h2>
              </div>

              {/* Mesaj Alanı */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {loadingMessages ? (
                  <p className="text-center text-gray-500">
                    Mesajlar yükleniyor...
                  </p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-500">
                    Henüz sohbet geçmişi yok. İlk mesajı sen gönder!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_id === currentUserId
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs p-3 rounded-lg shadow-md ${
                          msg.sender_id === currentUserId
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <p className="font-semibold text-sm mb-1">
                          {msg.sender_id === currentUserId
                            ? "Sen"
                            : msg.sender_username}
                        </p>
                        <p>{msg.content}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {new Date(msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Mesaj Yazma Alanı */}
              <form
                onSubmit={handleSendMessage}
                className="bg-white p-4 border-t border-gray-200 shadow-sm flex"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="ml-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!newMessage.trim()}
                >
                  Gönder
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
