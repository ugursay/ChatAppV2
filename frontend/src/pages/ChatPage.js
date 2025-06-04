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
import { toast, ToastCantainer } from "react-toastify";
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
      toast.error("Arkadaş listesi yüklenemedi");
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
        console.error("Sohbet geçmişi alınırken hata: ", err);
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
      console.log("Chat socket.IO bağlı:", socket.id);
      socket.emit("register_user_id", currentUserId);
    });

    socket.on("receive_message", (messages) => {
      console.log("yeni mesaj alındı", messages);

      if (
        (selectedFriend &&
          ((message.sender_id === selectedFriend.id &&
            message.receiver_id === currentUserId) ||
            (message.sender_id === currentUserId &&
              message.receiver_id === selectedFriend.id))) ||
        (message.sender_id === currentUserId &&
          message.receiver_id === currentUserId) // Kendi kendine mesaj atıyorsa
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

      socket.on("disconnect", () => {
        console.log("Chat Socket.IO bağlantısı kesildi");
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    });
  }, [currentUserId, selectedFriend]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;

    try {
      const res = await axios.post(
        "http://localhost:5000/api/messages/send",
        { receiverId: selectedFriend.id, content: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage("");
    } catch (err) {
      console.error("mesaj gönderilirken hata:", err);
      toast.error(err.response?.data?.message || "mesaj gönderilemedi");
    }
  };

  return <div></div>;
};

export default ChatPage;
