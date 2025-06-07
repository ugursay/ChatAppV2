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
import { useNavigate } from "react-router-dom"; // useNavigate'i ekleyin

const ChatPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate(); // useNavigate hook'unu kullanın

  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const token = user?.token;
  const currentUserId = user?.id;

  // Socket.IO bağlantısını tutmak için ref kullanıyoruz
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null); // Mesajların en altına kaydırmak için

  // Mesajları en alta otomatik kaydırma
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Arkadaş listesini çekme
  const fetchFriends = useCallback(async () => {
    if (!token || !currentUserId) {
      setLoadingFriends(false); // Token yoksa yüklemeyi durdur
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

  // Sohbet geçmişini çekme
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

  // İlk yüklemede ve token/userId değiştiğinde arkadaşları çek
  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  // Seçilen arkadaş değiştiğinde sohbet geçmişini çek
  useEffect(() => {
    if (selectedFriend) {
      fetchChatHistory(selectedFriend.id);
    } else {
      setMessages([]); // Arkadaş seçili değilse mesajları temizle
    }
  }, [selectedFriend, fetchChatHistory]);

  // Socket.IO bağlantısı ve olay dinleyicileri
  useEffect(() => {
    if (!currentUserId) return;

    // Eğer zaten bir socket bağlantısı varsa, temizle ve yeniden oluştur
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io("http://localhost:5000");
    socketRef.current = socket; // ref'e ata

    socket.on("connect", () => {
      console.log("Chat Socket.IO bağlı:", socket.id);
      socket.emit("register_user_id", currentUserId);
    });

    socket.on("receive_message", (message) => {
      console.log("Yeni mesaj alındı:", message);
      // Eğer gelen mesaj mevcut sohbet odası içinse mesajlara ekle
      if (
        selectedFriend && // Bir arkadaş seçili olmalı
        ((message.sender_id === selectedFriend.id &&
          message.receiver_id === currentUserId) || // Mesajı arkadaşım gönderdi ve ben aldım
          (message.sender_id === currentUserId &&
            message.receiver_id === selectedFriend.id)) // Mesajı ben gönderdim ve arkadaşım aldı (kendi mesajım)
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      } else if (message.receiver_id === currentUserId) {
        // Eğer mesaj mevcut sohbet odası için değil ama bana geldiyse bildirim göster
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

    // Temizleme fonksiyonu
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [currentUserId, selectedFriend]); // selectedFriend'i de bağımlılık olarak ekliyoruz ki, chat değişince dinleyici doğru çalışsın

  // Mesajlar her güncellendiğinde en alta kaydır
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mesaj gönderme işlemi
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return; // Boş mesaj veya arkadaş seçili değilse gönderme

    try {
      // API'ye mesajı kaydetmesi için gönder
      const res = await axios.post(
        "http://localhost:5000/api/messages/send",
        { receiverId: selectedFriend.id, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Başarılı olursa input'u temizle
      setNewMessage("");

      // Mesajı anında UI'ya ekle (backend'den gelen data kullanılarak, tutarlılık için)
      // Socket.IO zaten mesajı göndereceği için bu kısım opsiyoneldir
      // Eğer backend'den 'receive_message' olayı size kendi gönderdiğiniz mesajı da geri döndürüyorsa,
      // bu satıra gerek kalmayabilir. Ama network gecikmesini azaltmak için anında göstermek iyi bir pratik.
      // setMessages((prevMessages) => [...prevMessages, res.data.data]);
    } catch (err) {
      console.error("Mesaj gönderilirken hata:", err);
      toast.error(err.response?.data?.message || "Mesaj gönderilemedi.");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
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
    <div className="flex h-screen bg-gray-100">
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

      {/* Sol Panel: Arkadaş Listesi */}
      <div className="w-1/4 bg-white p-6 border-r border-gray-200 shadow-md flex flex-col">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          Arkadaşlarım
        </h2>
        {loadingFriends ? (
          <p className="text-center text-gray-500">Yükleniyor...</p>
        ) : friends.length === 0 ? (
          <p className="text-center text-gray-500">Henüz arkadaşın yok.</p>
        ) : (
          <ul className="flex-grow overflow-y-auto space-y-3">
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
              <div ref={messagesEndRef} />{" "}
              {/* Otomatik kaydırma için referans */}
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
  );
};

export default ChatPage;
