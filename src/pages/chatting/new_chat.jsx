import { useState, useEffect, useRef } from "react";
import Sidebar from "../../compontents/sidebar/sidebar";
import Navbar from "../../compontents/navBar/navbar";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { LiaSearchSolid } from "react-icons/lia";
import { IoPeople } from "react-icons/io5";
import { FaStar } from "react-icons/fa6";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { Paperclip } from "react-bootstrap-icons";
import EmojiPicker from "emoji-picker-react";
import { FaUnderline } from "react-icons/fa";
import { PiTextItalicBold } from "react-icons/pi";
import { FaBold } from "react-icons/fa6";
import { IoIosUndo } from "react-icons/io";
import { IoIosRedo } from "react-icons/io";
import { LuType } from "react-icons/lu";
import { BsEmojiSmileFill } from "react-icons/bs";
import { RiSendPlaneFill } from "react-icons/ri";
import { FaFile } from "react-icons/fa6";
import { FaMicrophone, FaPlay } from "react-icons/fa";
import { FaStop } from "react-icons/fa";
import { FaPause } from "react-icons/fa6";
import { FaCircle } from "react-icons/fa"; // لأيقونات الدوائر
import { useLocation } from "react-router-dom"; // أضف هذا الاستيراد
import { FaBars, FaTimes } from "react-icons/fa";
import MetaAIHeader from "./chatbot";
import { IoIosChatboxes } from "react-icons/io";
import { AiOutlineDelete } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { TbXboxXFilled } from "react-icons/tb";
import { Howl } from "howler";
import { useTranslation } from "react-i18next";

import "./new_chat.css";

const formatMessage = (message) => {
  if (!message) return "";
  return message
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*\s/g, "<br/>• ");
};

const TypingMessage = ({ text, isNewSession = false }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) return;

    // إذا كانت جلسة جديدة، نستخدم تأثير الكتابة
    if (isNewSession) {
      let currentIndex = 0;
      const typingSpeed = 10;

      const typeNextCharacter = () => {
        if (currentIndex < text.length) {
          setDisplayedText((prev) => prev + text[currentIndex]);
          currentIndex++;
          setTimeout(typeNextCharacter, typingSpeed);
        }
      };

      typeNextCharacter();
    } else {
      // إذا كانت جلسة قديمة، نعرض النص كاملاً
      setDisplayedText(text);
    }
  }, [text, isNewSession]);

  return (
    <span dangerouslySetInnerHTML={{ __html: formatMessage(displayedText) }} />
  );
};

function Chat() {
      const { t, i18n } = useTranslation();
  
  const [sessions, setSessions] = useState([]);
const [unreadMessages, setUnreadMessages] = useState({}); // { conversationId: count }
  const location = useLocation(); // أضف هذا السطر
  const [isRecording, setIsRecording] = useState(false); // حالة التسجيل
  const [audioURL, setAudioURL] = useState(null); // رابط ملف الصوت المسجل
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [fontIndex, setFontIndex] = useState(0);
  const fonts = [
    "Arial",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Verdana",
  ];
  const [isChatbotActive, setIsChatbotActive] = useState(false);
  const [setEmojiPickerPosition] = useState({ top: 0, left: 0 });
  const emojiButtonRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const editorRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [normalMessages, setNormalMessages] = useState([]); // للشات العادي
  const [metaMessages, setMetaMessages] = useState([]); // لشات الميتا
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // استبدل metaMessages و messages
  const [currentPlayingId, setCurrentPlayingId] = useState(null); // لتتبع أي رسالة يتم تشغيلها حالياً
  const [currentAudioPosition, setCurrentAudioPosition] = useState(0); // إضافة هذه السطر
  const [audioPositions, setAudioPositions] = useState({}); // تخزين موضع التشغيل لكل رسالة
  const [waitingForBot, setWaitingForBot] = useState(false);
  const messagesEndRef = useRef(null); // أضف هذا السطر
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
  const [filteredSidebarMessages, setFilteredSidebarMessages] = useState([]);
  const soundRef = useRef(null);
  const [imageBase64, setImageBase64] = useState("");
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [showSidebarDropdown, setShowSidebarDropdown] = useState(false);
  const [selectedChatType, setSelectedChatType] = useState("your"); // 'your' أو 'ai'
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

const filteredConversations = conversations.filter(conv => 
  conv.user2_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
);


  const loadConversationWithClient = async (clientId) => {
    try {
      setIsLoadingMessages(true);
      const authToken = localStorage.getItem("authToken");

      // جلب المحادثات مع هذا العميل فقط
      const response = await fetch(
        `https://final.agrovision.ltd/api/conversations?client_id=${clientId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to load conversations");

      const data = await response.json();

      // إذا كانت هناك محادثات، تحميل الرسائل
      if (data.conversations?.length > 0) {
        setMessages(data.conversations[0].messages || []);
      } else {
        // إذا لم تكن هناك محادثات، بدء محادثة جديدة
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading client conversations:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `https://final.agrovision.ltd/api/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete conversation: ${errorText}`);
      }

      // تحديث قائمة المحادثات بعد الحذف
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationId)
      );

      // إذا كانت المحادثة المحذوفة هي المحادثة المحددة حالياً، نعيد تعيين الحالة
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      return true;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      alert(`Failed to delete conversation: ${error.message}`);
      return false;
    }
  };

const markAsRead = async (conversationId) => {
  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("Authentication token not found");
    }

    // 1. جلب رسائل المحادثة


    // 2. تصفية الرسائل غير المقروءة
    const unreadMessages = messages.filter(
      (msg) => !msg.is_read && msg.sender_id !== userId
    );

    // 3. تحديث كل رسالة غير مقروءة
    for (const msg of unreadMessages) {
      const markReadResponse = await fetch(
        `https://final.agrovision.ltd/api/messages/read/${msg.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message_id: msg.id,
            status: "read",
          }),
        }
      );

      if (!markReadResponse.ok) {
        console.error(`Failed to mark message ${msg.id} as read`);
        const errorData = await markReadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to mark message as read");
      }
    }

    // 4. تحديث الحالة المحلية
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      )
    );

  } catch (error) {
    console.error("Error marking messages as read:", error);
    
    if (error.message.includes("401")) {
      localStorage.removeItem("authToken");
      navigate("/login");
    }
  }
};

  // e-commerce chatting
  useEffect(() => {
    fetchAllConversations();
  }, []);

const fetchAllConversations = async () => {
  setIsLoadingConversations(true);

  try {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("Authentication token not found. Please login again.");
    }

    const response = await fetch(
      "https://final.agrovision.ltd/api/conversations",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "include",
      }
    );

    if (response.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    const conversations = Array.isArray(data) ? data : data.conversations || [];

    // معالجة المحادثات وحساب الرسائل غير المقروءة
    const processedConversations = conversations.map((conversation) => {
      const unreadCount = conversation.messages?.filter(
        (msg) => !msg.is_read && msg.sender_id !== userId
      ).length || 0;

      const user2_img = conversation.user2_img
        ? `https://final.agrovision.ltd/storage/app/public/${conversation.user2_img}`
        : null;

      return {
        ...conversation,
        unreadCount,
        user2_img,
        last_message: conversation.messages?.[conversation.messages.length - 1]?.message || "",
      };
    });

    // فرز المحادثات: الرسائل غير المقروءة أولاً، ثم الأحدث
    const sortedConversations = processedConversations.sort((a, b) => {
      // إذا كانت إحدى المحادثات تحتوي على رسائل غير مقروءة والأخرى لا
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // إذا كانت كلاهما تحتوي أو لا تحتوي على رسائل غير مقروءة، نرتب حسب التاريخ
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      return dateB - dateA; // الأحدث أولاً
    });

    setConversations(sortedConversations);
    return sortedConversations;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    setError(error.message);
    setConversations([]);

    if (
      error.message.includes("Unauthorized") ||
      error.message.includes("Authentication")
    ) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
  } finally {
    setIsLoadingConversations(false);
  }
};

  useEffect(() => {
    // عند تحميل المكون، تحقق مما إذا كانت هناك بيانات عميل في حالة التوجيه
    if (location.state?.clientData) {
      setSelectedClient(location.state.clientData);
      checkExistingConversation(location.state.clientData.id);
    }
  }, [location.state]);

const loadConversationMessages = async (conversation) => {
  try {
    setIsLoadingMessages(true);
    setIsChatbotActive(false);
    setSelectedConversation(conversation);

    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("Please login first");
    }

    const processedConversation = {
      ...conversation,
      user1_img: conversation.user1_img
        ? `https://final.agrovision.ltd/storage/app/public/${conversation.user1_img}`
        : null,
      user2_img: conversation.user2_img
        ? `https://final.agrovision.ltd/storage/app/public/${conversation.user2_img}`
        : null,
    };

    setSelectedConversation(processedConversation);

    const response = await fetch(
      "https://final.agrovision.ltd/api/conversations",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to load conversations: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Conversations data:", data);

    const foundConversation = Array.isArray(data)
      ? data.find((conv) => conv.id === conversation.id)
      : data.conversations?.find((conv) => conv.id === conversation.id);

    if (!foundConversation) {
      throw new Error("Conversation not found in the list");
    }

    const messages = foundConversation.messages || [];
    console.log("Loaded messages:", messages);

    setMessages(messages);
    setSelectedConversation(foundConversation);
    setError(null);
    
    if (conversation.unreadCount > 0) {
      await markAsRead(conversation.id);
    }

    // التمرير إلى آخر رسالة بعد تحميل المحادثة
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);

  } catch (error) {
    console.error("Error loading messages:", error);
    setError(error.message);

    if (error.message.includes("401")) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
  } finally {
    setIsLoadingMessages(false);
  }
};

  useEffect(() => {
    const initializeChat = async () => {
      try {
        // حالة 1: إذا كان هناك محادثة محددة مسبقاً
        if (location.state?.conversationData) {
          await loadConversationMessages(location.state.conversationData);
          return;
        }

        // حالة 2: إذا كان هناك عميل محدد
        if (location.state?.clientData) {
          const clientId = location.state.clientData.id;
          setSelectedClient(location.state.clientData);

          // تحقق مما إذا كان هناك طلب لإنشاء محادثة جديدة
          if (location.state.activateChat) {
            const newConversation = await createNewConversation(clientId);
            if (newConversation) {
              await loadConversationMessages(newConversation);
            }
          } else {
            await checkExistingConversation(clientId);
          }
          return;
        }

        // حالة 3: إذا لم يكن هناك عميل أو محادثة محددة
        setIsChatbotActive(false);
        setMessages([]);
      } catch (error) {
        console.error("Error initializing chat:", error);
        setError(error.message);
      }
    };

    initializeChat();
  }, [location.state]);

  const checkExistingConversation = async (clientId) => {
    try {
      setIsLoadingMessages(true);
      const authToken = localStorage.getItem("authToken");

      const response = await fetch(
        `https://final.agrovision.ltd/api/conversations?client_id=${clientId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load conversations: ${response.status}`);
      }

      const data = await response.json();
      const conversations = Array.isArray(data)
        ? data
        : data.conversations || [];

      const existingConversation = conversations.find(
        (conv) => conv.user2_id == clientId
      );

      if (existingConversation) {
        await loadConversationMessages(existingConversation);
      } else {
        setMessages([]);
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error("Error checking conversations:", error);
      setError(error.message);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // دالة بديلة في حالة فشل المسار الأساسي
  const tryAlternativeEndpoint = async (conversationId) => {
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch(
        `https://final.agrovision.ltd/api/messages?conversation_id=${conversationId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) throw new Error("Alternative endpoint failed");

      const data = await response.json();
      setMessages(data);
    } catch (error) {
      throw new Error(`Both endpoints failed: ${error.message}`);
    }
  };

  const createNewConversation = async (clientId) => {
    try {
      setIsLoadingMessages(true);
      const authToken = localStorage.getItem("authToken");

      const response = await fetch(
        "https://final.agrovision.ltd/api/conversations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            Accept: "application/json", // تأكد من طلب JSON صراحة
          },
          body: JSON.stringify({
            user2_id: clientId,
            message: "New conversation started",
          }),
        }
      );

      // تحقق أولاً من حالة الاستجابة
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
      }

      // تحقق من نوع المحتوى
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(
          "Received non-JSON response:",
          textResponse.substring(0, 100)
        );
        throw new Error("Server returned non-JSON response");
      }

      const newConversation = await response.json();
      return newConversation;
    } catch (error) {
      console.error("Error creating conversation:", error);

      // تحسين رسالة الخطأ للمستخدم
      let userMessage = "Failed to create conversation";
      if (error.message.includes("401")) {
        userMessage = "Session expired. Please login again.";
        localStorage.removeItem("authToken");
        navigate("/login");
      } else if (error.message.includes("non-JSON")) {
        userMessage = "Server error. Please try again later.";
      }

      setError(userMessage);
      alert(userMessage);
      return null;
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendNewMessage = async (messageText) => {
    if (!selectedConversation || !messageText.trim()) return;

    const tempMessage = {
      id: Date.now(),
      name: "You",
      date: new Date().toLocaleTimeString(),
      message: messageText,
      sender_id: userId,
      isTemp: true,
    };

    try {
      setLoading(true);
      setMessages((prev) => [...prev, tempMessage]);
      if (editorRef.current) editorRef.current.innerHTML = "";

      let response;

      if (selectedConversation) {
        // إرسال إلى محادثة موجودة
        response = await fetch("https://final.agrovision.ltd/api/messages", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation_id: selectedConversation.id,
            message: messageText,
            sender_id: userId,
          }),
        });
      } else if (selectedClient) {
        // إنشاء محادثة جديدة
        response = await fetch("https://final.agrovision.ltd/api/messages", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user2_id: selectedClient.id, // إرسال إلى العميل المحدد
            message: messageText,
            sender_id: userId,
          }),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      
      const serverMessage = await response.json();

      await fetchAllConversations();

      // تحديث المحادثة المحددة
      const updatedConversations = await fetchAllConversations();

      if (!selectedConversation && serverMessage.conversation_id) {
        const conversations = await fetchAllConversations();

        const newConversation = conversations.find(
          (conv) => conv.id === serverMessage.conversation_id
        );
        if (newConversation) {
          setSelectedConversation(newConversation);
        }
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempMessage.id),
        serverMessage,
      ]);

      const updatedConv = updatedConversations.find(
        (c) => c.id === selectedConversation.id
      );
      if (updatedConv) {
        setSelectedConversation(updatedConv);
      }

      await fetchAllConversations();
      await loadConversationMessages(selectedConversation);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      selectedChatType === "ai" &&
      !loadingSessions &&
      sessions.length === 0
    ) {
      fetchSessions();
    }
  }, [selectedChatType]);

  const validateIds = () => {
    console.log("التحقق من أنواع البيانات:", {
      userId: typeof userId,
      sessionId: typeof sessionId,
      storedUserId: typeof localStorage.getItem("userId"),
    });
  };
  const handleChatTypeSelect = async (type) => {
    setSelectedChatType(type);
    setShowSidebarDropdown(false);

    if (type === "your") {
      setIsChatbotActive(false);
      setSelectedConversation(null);
      setMessages([]);
    } else {
      setIsChatbotActive(true);
      await fetchSessions();
    }
  };
  useEffect(() => {
    // عند تحميل المكون، تحقق مما إذا كانت هناك بيانات عميل في حالة التوجيه
    if (location.state?.clientData) {
      setSelectedClient(location.state.clientData);
      checkExistingConversation(location.state.clientData.id);
    }
  }, [location.state]);
  const [error, setError] = useState(null);

  const deleteSession = async (sessionId) => {
    try {
      const userId = localStorage.getItem("userId");
      const authToken = localStorage.getItem("authToken");

      if (!userId || !authToken) {
        throw new Error("Authentication data missing");
      }

      const response = await fetch(
        `https://immortal-basically-lemur.ngrok-free.app/delete_session/${userId}/${sessionId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${authToken}`,
            "ngrok-skip-browser-warning": "true",
            "Access-Control-Allow-Origin": "*",
          },
          mode: "cors",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Server responded with status ${response.status}: ${errorText}`
        );
      }

      // تحديث قائمة الجلسات بعد الحذف
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));

      // إذا كانت الجلسة المحذوفة هي الجلسة النشطة حالياً، نعيد تعيين الحالة
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setChatHistory([]);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      // إذا كان setError غير معرّف، يمكنك استخدام alert أو أي طريقة أخرى لإظهار الخطأ
      alert(`Error deleting session: ${error.message}`);
    }
  };

  let retryCount = 0;
  const MAX_RETRIES = 5;

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      setError(null);

      const userId = localStorage.getItem("userId");
      const authToken = localStorage.getItem("authToken");

      const response = await fetch(
        `https://immortal-basically-lemur.ngrok-free.app/sessions/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${authToken}`,
            "ngrok-skip-browser-warning": "true",
            "Access-Control-Allow-Origin": "*",
          },
          mode: "cors",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error in server: ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.sessions) {
        throw new Error("Error ");
      }

      // معالجة البيانات المستلمة
      const formattedSessions = data.sessions.map((session) => {
        const firstMessage = session.memory?.find(
          (msg) => msg.startsWith("User:") || msg.startsWith("Assistant:")
        );
        const lastMessage = session.memory?.[session.memory.length - 1] || null;

        return {
          id: session.session_id,
          name: firstMessage
            ? firstMessage
                .replace(/^(User|Assistant):\s*/, "")
                .substring(0, 30) + (firstMessage.length > 30 ? "..." : "")
            : "New Session ",
          description: lastMessage
            ? lastMessage
                .replace(/^(User|Assistant):\s*/, "")
                .substring(0, 50) + (lastMessage.length > 50 ? "..." : "")
            : "No Messages",
          memory: session.memory || [],
        };
      });

      setSessions(formattedSessions);
    } catch (error) {
      console.error("Error", error);
      setError(error.message);
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: "System",
          date: new Date().toLocaleTimeString(),
          description: `Error: ${error.message}`,
          isUser: false,
        },
      ]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const filterSessions = (sessions, query) => {
    if (!query.trim()) return sessions;

    return sessions.filter(
      (session) =>
        session.name.toLowerCase().includes(query.toLowerCase()) ||
        session.description.toLowerCase().includes(query.toLowerCase())
    );
  };

  useEffect(() => {
    // عند تغيير نوع الشات، نعيد تعيين الحالات
    if (selectedChatType === "your") {
      setIsChatbotActive(false);
      setChatHistory([]);
    } else {
      setIsChatbotActive(true);
    }
  }, [selectedChatType]);

  const loadSession = async (sessionId) => {
    try {
      setLoading(true);
      setIsChatbotActive(true);
      setSelectedSessionId(sessionId); // تحديث الجلسة المحددة

      const selectedSession = sessions.find((s) => s.id === sessionId);
      if (!selectedSession) return;

      // تحويل memory الجلسة إلى شكل يمكن عرضه في الشات
      const sessionMessages = selectedSession.memory.map((msg) => {
        const isUser = msg.startsWith("User:");
        return {
          id: Date.now() + Math.random(), // ID فريد
          name: isUser ? "You" : "Khedr",
          date: new Date().toLocaleTimeString(),
          description: msg.replace(isUser ? "User:" : "Assistant:", "").trim(),
          rawText: msg.replace(isUser ? "User:" : "Assistant:", "").trim(),
          isUser: isUser,
        };
      });

      // إعادة تعيين حالة المحادثة
      setChatHistory(sessionMessages);
      setIsChatbotActive(true);

      // إعادة تعيين حالة الجلسة الحالية
      setSessionId(sessionId);
    } catch (error) {
      console.error("Error loading session:", error);
      setError("Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleErrors = () => {
      if (error) {
        alert(`Error: ${error}`);
        setError(null); // مسح الخطأ بعد عرضه
      }
    };
    handleErrors();
  }, [error]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // إذا كان النقر خارج القائمة المنسدلة
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSidebarDropdown(false);
      }
    };

    // إضافة مستمع الحدث عند تحميل المكون
    document.addEventListener("mousedown", handleClickOutside);

    // تنظيف المستمع عند إلغاء تحميل المكون
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // استدعها عند الحاجة
  useEffect(() => {
    validateIds();
  }, [userId, sessionId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const createNewSession = async (userId) => {
    setIsSessionLoading(true);

    try {
      const response = await fetch(
        "https://immortal-basically-lemur.ngrok-free.app/new_session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "فشل في إنشاء الجلسة");
      }

      return await response.json();
    } catch (error) {
      console.error("خطأ في إنشاء الجلسة:", error);
      throw error;
    } finally {
      setIsSessionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const messageText = editorRef.current?.innerText.trim() || "";

    if (isChatbotActive) {
      await sendMessage(); // الدالة الخاصة بالـ AI
    } else {
      await sendNewMessage(messageText); // الدالة الخاصة بالمحادثات العادية
    }
  };

  const activateMetaWithSession = async () => {
    try {
      const loggedInUserId = localStorage.getItem("userId");
      const authToken = localStorage.getItem("authToken");

      if (!loggedInUserId || !authToken) {
        throw new Error("يجب تسجيل الدخول أولاً");
      }

      // فقط إذا لم يكن هناك جلسة نشطة بالفعل
      if (!sessionId) {
        setIsSessionLoading(true);
        setSelectedSessionId(null);

        const response = await fetch(
          "https://immortal-basically-lemur.ngrok-free.app/new_session",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              user_id: loggedInUserId,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "فشل في إنشاء الجلسة");
        }

        const newSessionId = data.session_id || data.sessionId;
        if (!newSessionId) {
          throw new Error("لم يتم استلام session_id");
        }

        setSessionId(newSessionId);
        setUserId(loggedInUserId);
        resetChatbot();

        // إضافة رسالة ترحيبية
      }
    } catch (error) {
      console.error("خطأ في تفعيل الميتا:", error);
      setChatHistory([
        {
          id: Date.now(),
          name: "System",
          date: new Date().toLocaleTimeString(),
          description: `Error: ${error.message}`,
          isUser: false,
        },
      ]);
    } finally {
      setIsSessionLoading(false);
    }
  };

  useEffect(() => {
    // تحميل user_id عند بدء التشغيل
    const loadedUserId = localStorage.getItem("userId");
    if (loadedUserId) {
      setUserId(loadedUserId);
      console.log("تم تحميل user_id:", loadedUserId);
    }
  }, []);

  const resetChatbot = () => {
    setChatHistory([]);
    setMetaMessages([]);
    setFiles([]);
    setAudioURL(null);
    setLoading(false);
    setWaitingForBot(false);
    Howler.stop();
    setCurrentPlayingId(null);
    setAudioPositions({});

    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }

    // عرض رسالة ترحيبية فقط إذا كانت هناك جلسة نشطة
  };

const handleSidebarSearch = (e) => {
  const query = e.target.value;
  setSidebarSearchQuery(query);

  if (!query.trim()) {
    setFilteredSidebarMessages([]);
    return;
  }

  // البحث في المحادثات العادية (your chats)
  if (selectedChatType === "your") {
    const results = conversations.filter(conv => 
      conv.user2_name.toLowerCase().includes(query.toLowerCase()) ||
      conv.last_message?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredSidebarMessages(results);
  } 
  // البحث في جلسات AI
  else if (selectedChatType === "ai") {
    const results = sessions.filter(session => 
      session.name.toLowerCase().includes(query.toLowerCase()) ||
      session.description.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredSidebarMessages(results);
  }
};

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const saveState = () => {
    if (editorRef.current) {
      setUndoStack((prev) => [...prev, editorRef.current.innerHTML]);
      setRedoStack([]);
    }
  };

  const convertToWav = async (blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({
        sampleRate: 16000,
      });

      const audioData = await audioContext.decodeAudioData(arrayBuffer);
      const wavBuffer = encodeWAV(audioData.getChannelData(0), 16000);
      return new Blob([wavBuffer], { type: "audio/wav" });
    } catch (error) {
      console.error("Error converting to WAV:", error);
      throw error;
    }
  };

  const TypingIndicator = () => {
    return (
      <div className="typing-indicator bot-message">
        <div className="message-content bot">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "8px 12px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#666",
                animation: "pulse 1.5s infinite ease-in-out",
              }}
            />
          </div>
        </div>
      </div>
    );
  };
  // دالة مساعدة لكتابة النصوص في الرأس
  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const options = {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 16000,
      };

      const mediaRecorder = new MediaRecorder(stream, options);

      // إعداد معالج البيانات المتاحة
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // إعداد معالج التوقف
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          const wavBlob = await convertToWav(audioBlob);
          const url = URL.createObjectURL(wavBlob);
          setAudioURL(url);

          // إيقاف جميع المسارات الصوتية
          stream.getTracks().forEach((track) => track.stop());
        } catch (error) {
          console.error("Error processing recording:", error);
        } finally {
          setIsRecording(false);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // جمع البيانات كل 100 مللي ثانية
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
    }
  };

  const verifyAudioQuality = async (blob) => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const audioData = await audioContext.decodeAudioData(arrayBuffer);

      const channelData = audioData.getChannelData(0);
      let isSilent = true;
      let maxAmplitude = 0;

      for (let i = 0; i < channelData.length; i++) {
        const amplitude = Math.abs(channelData[i]);
        if (amplitude > 0.01) {
          isSilent = false;
          maxAmplitude = Math.max(maxAmplitude, amplitude);
        }
      }

      if (isSilent) {
        throw new Error("No audio detected (silent recording)");
      }

      if (maxAmplitude < 0.1) {
        throw new Error("Audio volume is too low");
      }

      console.log("Audio quality check passed", {
        duration: audioData.duration.toFixed(2) + "s",
        sampleRate: audioData.sampleRate,
        maxAmplitude: (maxAmplitude * 100).toFixed(2) + "%",
      });

      return true;
    } catch (error) {
      console.error("Audio verification failed:", error);
      throw new Error("Audio quality issue: " + error.message);
    }
  };

  const encodeWAV = (audioData, sampleRate = 16000) => {
    const numChannels = 1;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;

    const buffer = new ArrayBuffer(44 + audioData.length * bytesPerSample);
    const view = new DataView(buffer);

    // كتابة رأس WAV
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + audioData.length * bytesPerSample, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true); // bits per sample
    writeString(view, 36, "data");
    view.setUint32(40, audioData.length * bytesPerSample, true);

    // كتابة بيانات الصوت
    let offset = 44;
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      view.setInt16(offset, sample * 0x7fff, true);
      offset += 2;
    }

    return buffer;
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  // play Audio
  const playAudio = () => {
    if (audioURL) {
      const audio = new Audio(audioURL);
      audio.play();
    }
  };

  // دالة مساعدة لإزالة الوسوم HTML
  const stripHtml = (html) => {
    return html.replace(/<[^>]*>/g, "");
  };
  const ChatMessage = ({ text }) => {
    return <p dangerouslySetInnerHTML={{ __html: formatMessage(text) }} />;
  };

  //  (Undo)
  const undo = () => {
    if (undoStack.length > 0) {
      const lastState = undoStack.pop();
      setRedoStack((prev) => [editorRef.current.innerHTML, ...prev]); // حفظ الحالة الحالية قبل الرجوع
      editorRef.current.innerHTML = lastState;
      setUndoStack([...undoStack]); // تحديث الـ Stack
    }
  };

  //  (Redo)
  const redo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack.shift();
      setUndoStack((prev) => [...prev, editorRef.current.innerHTML]); // حفظ الحالة الحالية قبل التعديل
      editorRef.current.innerHTML = nextState;
      setRedoStack([...redoStack]); // تحديث الـ Stack
    }
  };

  // change font
  const toggleFont = () => {
    const newIndex = (fontIndex + 1) % fonts.length;
    setFontIndex(newIndex);
    document.execCommand("fontName", false, fonts[newIndex]);
  };

  // sidebar & resize
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1120) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // format text
  const formatText = (command) => {
    document.execCommand(command, false, null);
  };

  // emoji
  const addEmoji = (emojiObject) => {
    const editor = editorRef.current;
    if (!editor) return;

    // إضافة الإيموجي في نهاية النص
    editor.innerHTML += emojiObject.emoji;

    // إخفاء الـ Emoji Picker بعد الاختيار
    setShowEmojiPicker(false);
  };
  const toggleEmojiPicker = () => {
    if (emojiButtonRef.current) {
      const rect = emojiButtonRef.current.getBoundingClientRect();
      setEmojiPickerPosition({
        top: rect.top - 250, // يطلع فوق الزر
        left: rect.left,
      });
    }
    setShowEmojiPicker(!showEmojiPicker);
  };

  //files
  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      // قراءة الصورة وتحويلها إلى Base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setImageBase64(reader.result); // حفظ Base64

        // تحديث قائمة الملفات المرفوعة
        setFiles((prevFiles) => [...prevFiles, file]);

        console.log("Selected file:", file.name);
      };
    }
  };

  useEffect(() => {
    if (chatContainerRef.current && !waitingForBot) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory]);

  const removeFile = (fileIndex) => {
    setFiles((prev) => prev.filter((_, index) => index !== fileIndex));
  };

  const isSupportedAudioType = (type) => {
    const audio = document.createElement("audio");
    return type.startsWith("audio/") && audio.canPlayType(type) !== "";
  };

  const [currentPlayingAudio, setCurrentPlayingAudio] = useState(null);
  async function playAudioSafe(audioUrl) {
    const audio = new Audio();

    // 1. إعداد CORS مهم جداً
    audio.crossOrigin = "anonymous";

    // 2. إضافة مصادر بديلة (fallback)
    const source = document.createElement("source");
    source.src = audioUrl;

    // 3. تحديد نوع الملف بشكل صريح
    const extension = audioUrl.split(".").pop().toLowerCase();
    source.type =
      extension === "mp3"
        ? "audio/mpeg"
        : extension === "wav"
        ? "audio/wav"
        : extension === "ogg"
        ? "audio/ogg"
        : "audio/*";

    audio.appendChild(source);

    try {
      await audio.play();
      return audio;
    } catch (error) {
      console.error("فشل التشغيل المباشر:", error);

      // 4. حل بديل إذا فشل التشغيل العادي
      const response = await fetch(audioUrl, {
        headers: { Accept: "audio/mpeg, audio/wav" },
      });

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      audio.src = blobUrl;

      await audio.play();
      return audio;
    }
  }

  const playWithHowler = (audioUrl) => {
    const sound = new Howl({
      src: [audioUrl],
      html5: true, // لتفادي مشاكل CORS
      format: ["mp3", "wav"],
      onplayerror: function () {
        sound.once("unlock", function () {
          sound.play();
        });
      },
    });
    sound.play();
  };

  // هذا التأثير سيتم تنفيذه مرة واحدة عند تحميل المكون
  useEffect(() => {
    if (location.state?.autoStartNewSession) {
      const initMetaChat = async () => {
        setIsChatbotActive(true);
        await activateMetaWithSession(); // ننتظر اكتمال إنشاء الجلسة
      };

      initMetaChat();
    }
  }, [location.state]);

  const initializeMetaChat = () => {
    // أي إعدادات إضافية تحتاجها لبدء الميتا شات
    console.log("Meta chat activated from shortcut");
  };

  useEffect(() => {
    return () => {
      Howler.stop();
    };
  }, []);

  const playBotAudio = (audioPath, messageId) => {
    console.log("Attempting to play audio:", audioPath);

    if (!audioPath) {
      console.error("No audio path provided");
      return;
    }

    // إنشاء مسار صوتي كامل إذا كان نسبيًا
    const fullAudioPath = audioPath.startsWith("http")
      ? audioPath
      : `https://immortal-basically-lemur.ngrok-free.app${audioPath}`;

    // إذا كان نفس الصوت مشغل بالفعل - إيقاف مؤقت
    if (currentPlayingId === messageId && isAudioPlaying) {
      const currentPosition = soundRef.current.seek(); // حفظ الموضع الحالي
      setAudioPositions((prev) => ({
        ...prev,
        [messageId]: currentPosition,
      }));
      soundRef.current.pause();
      setIsAudioPlaying(false);
      return;
    }

    // إذا كان نفس الصوت متوقف مؤقتًا - استئناف التشغيل
    if (currentPlayingId === messageId && !isAudioPlaying) {
      const lastPosition = audioPositions[messageId] || 0;
      soundRef.current.seek(lastPosition);
      soundRef.current.play();
      setIsAudioPlaying(true);
      return;
    }

    // إيقاف أي صوت آخر مشغل
    Howler.stop();

    soundRef.current = new Howl({
      src: [fullAudioPath],
      html5: true,
      format: ["mp3", "wav"],
      onplay: () => {
        console.log("Playback started");
        setIsAudioPlaying(true);
        setCurrentPlayingId(messageId);

        // البدء من الموضع المحفوظ إذا كان موجودًا
        const lastPosition = audioPositions[messageId] || 0;
        if (lastPosition > 0) {
          soundRef.current.seek(lastPosition);
        }
      },
      onpause: () => {
        console.log("Playback paused");
        const currentPosition = soundRef.current.seek();
        setAudioPositions((prev) => ({
          ...prev,
          [messageId]: currentPosition,
        }));
      },
      onend: () => {
        console.log("Playback ended");
        setIsAudioPlaying(false);
        setCurrentPlayingId(null);
        setAudioPositions((prev) => ({
          ...prev,
          [messageId]: 0, // إعادة التعيين إلى الصفر عند الانتهاء
        }));
      },
      onstop: () => {
        console.log("Playback stopped");
        setIsAudioPlaying(false);
        setCurrentPlayingId(null);
      },
    });

    // البدء من الموضع المحفوظ إذا كان موجودًا
    const lastPosition = audioPositions[messageId] || 0;
    soundRef.current.seek(lastPosition);
    soundRef.current.play();

    // تحديث الموضع كل ثانية لتتبع التقدم
    const updateInterval = setInterval(() => {
      if (soundRef.current && soundRef.current.playing()) {
        const currentPosition = soundRef.current.seek();
        setAudioPositions((prev) => ({
          ...prev,
          [messageId]: currentPosition,
        }));
      } else {
        clearInterval(updateInterval);
      }
    }, 1000);
  };
  // الحل البديل للـ streaming باستخدام Audio API العادي
  const fallbackAudioStreaming = (audioUrl) => {
    try {
      const audio = new Audio(audioUrl);
      audio.preload = "none"; // لا تحمل الصوت مسبقاً

      audio.oncanplaythrough = () => {
        console.log("Fallback audio ready for streaming");
      };

      audio.onerror = (e) => {
        console.error("Fallback audio error:", e);
      };

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setCurrentPlayingAudio(audio);
            return true;
          })
          .catch((error) => {
            console.error("Fallback play failed:", error);
            return false;
          });
      }

      return true;
    } catch (error) {
      console.error("All streaming methods failed:", error);
      return false;
    }
  };

  const isArabic = (text) => {
    // Regular expression to match Arabic characters
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text);
  };

  const copyToClipboard = (text, messageId) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Text copied to clipboard");
        setCopiedMessageId(messageId); // تعيين الرسالة التي تم نسخها

        // إعادة النص إلى "Copy" بعد 3 ثوانٍ
        setTimeout(() => {
          setCopiedMessageId(null);
        }, 1000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const sendMessage = async () => {
    if (!sessionId || !userId) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: "System",
          date: new Date().toLocaleTimeString(),
          description: "please click on meta icon to start new chat",
          isUser: false,
        },
      ]);
      return;
    }

    const messageText = editorRef.current?.innerText.trim() || "";
    if (!messageText && files.length === 0 && !audioURL) return;

    const newMessage = {
      id: Date.now(),
      name: "You",
      date: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      description: messageText,
      attachments: files,
      audio: audioURL || null,
      isUser: true,
    };

    setChatHistory((prev) => [...prev, newMessage]);
    if (editorRef.current) editorRef.current.innerHTML = "";
    setFiles([]);
    setAudioURL(null);

    setLoading(true);
    setWaitingForBot(true);

    try {
      const commonHeaders = {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Session-ID": sessionId,
        "User-ID": userId,
      };

      let response;
      let responseData;

      if (audioURL) {
        const audioBlob = await fetch(audioURL).then((r) => r.blob());
        if (audioBlob.size < 1024) {
          throw new Error("Audio recording is too short");
        }
        await verifyAudioQuality(audioBlob);

        const formData = new FormData();
        formData.append("audio_file", audioBlob, "recording.wav");
        formData.append("session_id", sessionId);
        formData.append("user_id", userId);
        formData.append("sample_rate", "16000");
        formData.append("language", "auto");
        formData.append("speak", "true");

        response = await fetch(
          "https://immortal-basically-lemur.ngrok-free.app/voice_convo",
          {
            method: "POST",
            body: formData,
            headers: commonHeaders,
          }
        );
      } else if (files.length > 0) {
        const formData = new FormData();
        formData.append("image_file", files[0]);
        formData.append("session_id", sessionId);
        formData.append("user_id", userId);
        formData.append("mode", "text");
        formData.append("question", messageText || "Describe this image.");
        formData.append("speak", "false");

        response = await fetch(
          "https://immortal-basically-lemur.ngrok-free.app/image_convo",
          {
            method: "POST",
            body: formData,
            headers: commonHeaders,
          }
        );
      } else {
        response = await fetch(
          "https://immortal-basically-lemur.ngrok-free.app/text_convo",
          {
            method: "POST",
            headers: {
              ...commonHeaders,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: messageText,
              session_id: sessionId,
              user_id: userId,
              speak_response: true,
            }),
          }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server Error:", errorText);
        throw new Error(`Request failed with status ${response.status}`);
      }

      responseData = await response.json();
      console.log("Full Response:", responseData); // تسجيل كامل الاستجابة

      // تحسين استخراج الرد
      const botResponse =
        responseData.Answer ||
        responseData.text ||
        responseData.response ||
        responseData.message ||
        "No response";

      const audioUrl =
        responseData.audio_url ||
        (responseData.audio_path
          ? `https://immortal-basically-lemur.ngrok-free.app${responseData.audio_path}`
          : null);

      const botMessage = {
        id: Date.now(),
        name: "Khedr",
        date: "Now",
        rawText: botResponse,
        description: formatMessage(botResponse),
        audioPath: audioUrl,
        isUser: false,
      };

      setChatHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: "System",
          date: new Date().toLocaleTimeString(),
          description: `Error: ${error.message}`,
          isUser: false,
        },
      ]);
    } finally {
      setLoading(false);
      setWaitingForBot(false);
    }
    fetchSessions();
  };

  useEffect(() => {
    // تحميل user_id عند بدء التشغيل
    const loadedUserId = localStorage.getItem("userId");
    if (loadedUserId) {
      setUserId(loadedUserId);
      console.log("تم تحميل user_id:", loadedUserId);
    }
  }, []);

useEffect(() => {
  const timer = setTimeout(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, 100);

  return () => clearTimeout(timer);
}, [messages]); // تغيير الاعتماد من chatHistory إلى messages

  const chatContainerRef = useRef(null);

  useEffect(() => {
    // تحقق مما إذا كان التوجيه جاء من الأيقونة المختصرة
    if (location.state?.activateMeta) {
      setIsChatbotActive(true);
      resetChatbot();
    }
  }, [location.state]);

  return (
    <div className={`app ${isChatbotActive ? "is-chatbot-active" : ""}`}  >
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="main-content">
        <div
          className={`sidebar-container ${isSidebarOpen ? "open" : "closed"}`}
        >
          <Sidebar />
        </div>
        <div
          className={`content flex-column ${isSidebarOpen ? "shifted" : ""}`}
        >
          <button
            className="mobile-toggle-btn"
            onClick={() => setShowLeftPanel(!showLeftPanel)}
          >
            {showLeftPanel ? (
              <FaTimes className="mobile-toggle-icon" />
            ) : (
              <IoIosChatboxes className="mobile-toggle-icon" />
            )}
          </button>
          <div className="s-order s-setting s-chatting">
            <div className="main-chatting">
              <div
                className={`all_messages ${
                  showLeftPanel ? "mobile-visible" : ""
                }`}
              >
                <div className="top-message">
                  <div className="top_top">
                    <p>{t("RECENT MESSAGE")}</p>

                    <div className="dropdown-container" ref={dropdownRef}>
                      <HiOutlineDotsHorizontal
                        className="dott"
                        onClick={() =>
                          setShowSidebarDropdown(!showSidebarDropdown)
                        }
                        style={{ cursor: "pointer" }}
                      />
                      {showSidebarDropdown && (
                        <div className="sidebar-dropdown">
                          <div
                            className="dropdown-item"
                            onClick={() => handleChatTypeSelect("ai")}
                          >
                            {t("AI chats")}
                          </div>
                          <div
                            className="dropdown-item"
                            onClick={() => handleChatTypeSelect("your")}
                          >
                            {t("Your chats")}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                 <div className="top_search">
  <div className="top-search-left">
    <input
      type="text"
      className="search-in"
      placeholder={t("Search contacts...")}
      value={sidebarSearchQuery}
      onChange={handleSidebarSearch}
    />
    <LiaSearchSolid className="icon-sear" />
  </div>
  <div
    className="meta"
    style={{ cursor: isSessionLoading ? "wait" : "pointer" }}
    onClick={activateMetaWithSession}
  >
    {isSessionLoading ? (
      <div className="loading-spinner"></div>
    ) : (
      <MetaAIHeader />
    )}
  </div>
</div>
                </div>
               <div className="my-messages">
  {loadingSessions || (selectedChatType === "your" && isLoadingConversations) ? (
    <div className="loading-sessions">{t("Loading chats...")}</div>
  ) : (
    <>
      {sidebarSearchQuery ? (
        // عرض نتائج البحث المصفاة
        filteredSidebarMessages.length > 0 ? (
          filteredSidebarMessages.map((item) => (
            <div
              key={item.id}
              className={`new-message ${
                (selectedChatType === "your" && selectedConversation?.id === item.id) ||
                (selectedChatType === "ai" && selectedSessionId === item.id)
                  ? "active-session"
                  : ""
              }`}
              onClick={() => {
                if (selectedChatType === "your") {
                  loadConversationMessages(item);
                  markAsRead(item.id);
                } else {
                  loadSession(item.id);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="leftMessage">
                {selectedChatType === "your" ? (
                  item.user2_img ? (
                    <img
                      src={item.user2_img}
                      alt="User"
                      style={{
                        width: "45.95px",
                        height: "45.95px",
                        borderRadius: "12.87px",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        background: getFixedColor(),
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                      }}
                    ></div>
                  )
                ) : (
                  <div
                    className="leftMessage"
                    style={{ background: getFixedColor() }}
                  ></div>
                )}
              </div>
              <div className="rightMessage">
                <p className="name">
                  {selectedChatType === "your"
                    ? item.user2_name || `User ${item.user2_id}`
                    : item.name}
                  {selectedChatType === "your" && item.unreadCount > 0 && (
                    <span className="unread-badge">{item.unreadCount}</span>
                  )}
                </p>
                <p className="describe">
                  {selectedChatType === "your"
                    ? item.last_message?.substring(0, 30) ||
                      (item.messages?.length > 0
                        ? item.messages[item.messages.length - 1]?.message?.substring(0, 30)
                        : "No messages yet")
                    : item.description}
                  {(selectedChatType === "your" &&
                    (item.last_message?.length > 30 ||
                      (item.messages?.length > 0 &&
                        item.messages[item.messages.length - 1]?.message?.length > 30))) &&
                    "..."}
                </p>
              </div>
              <button
                className="delete-session-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedChatType === "your") {
                    if (window.confirm("Are you sure you want to delete this conversation?")) {
                      deleteConversation(item.id);
                    }
                  } else {
                    deleteSession(item.id);
                  }
                }}
                title={selectedChatType === "your" ? "Delete conversation" : "Delete session"}
              >
                <AiOutlineDelete style={{ fontSize: "18px" }} />
              </button>
            </div>
          ))
        ) : (
          <div className="no-results">No matching chats found</div>
        )
      ) : (
        // عرض جميع المحادثات عند عدم وجود بحث
        selectedChatType === "ai" ? (
          sessions.map((session, index) => (
            <div
              key={index}
              className={`new-message ${
                selectedSessionId === session.id ? "active-session" : ""
              }`}
              onClick={() => loadSession(session.id)}
              style={{ cursor: "pointer" }}
            >
              <div
                className="leftMessage"
                style={{ background: getFixedColor() }}
              ></div>
              <div className="rightMessage">
                <p className="name">{session.name}</p>
                <p className="describe">{session.description}</p>
              </div>
              <button
                className="delete-session-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
                title="Delete session"
              >
                <AiOutlineDelete style={{ fontSize: "18px" }} />
              </button>
            </div>
          ))
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`new-message ${
                selectedConversation?.id === conversation.id ? "active-session" : ""
              }`}
              onClick={() => {
                loadConversationMessages(conversation);
                markAsRead(conversation.id);
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="leftMessage">
                {conversation.user2_img ? (
                  <img
                    src={conversation.user2_img}
                    alt="User"
                    style={{
                      width: "45.95px",
                      height: "45.95px",
                      borderRadius: "12.87px",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      background: getFixedColor(),
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                    }}
                  ></div>
                )}
              </div>
              <div className="rightMessage">
                <p className="name">
                  {conversation.user2_name || `User ${conversation.user2_id}`}
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge">{conversation.unreadCount}</span>
                  )}
                </p>
                <p className="describe">
                  {conversation.last_message?.substring(0, 30) ||
                    (conversation.messages?.length > 0
                      ? conversation.messages[conversation.messages.length - 1]?.message?.substring(0, 30)
                      : "No messages yet")}
                  {(conversation.last_message?.length > 30 ||
                    (conversation.messages?.length > 0 &&
                      conversation.messages[conversation.messages.length - 1]?.message?.length > 30)) &&
                    "..."}
                </p>
              </div>
              <button
                className="delete-session-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Are you sure you want to delete this conversation?")) {
                    deleteConversation(conversation.id);
                  }
                }}
                title="Delete conversation"
              >
                <AiOutlineDelete style={{ fontSize: "18px", color: "" }} />
              </button>
            </div>
          ))
        )
      )}
    </>
  )}
</div>
              </div>
              <div className="chat_content">
                <div className="group_name d-flex justify-content-between align-items-center">
                  <div className="group_left d-flex align-items-center">
                    <div className="group-icon" style={{ background: "#fff" }}>
                      {isChatbotActive ? (
                        <img
                          src="khedr.jpg"
                          alt="Khedr"
                          style={{ width: "30px" }}
                        />
                      ) : selectedConversation ? (
                            <img
  src={`https://final.agrovision.ltd/storage/app/public/${selectedConversation.user2_img}`}
                                  alt="User"
                                  style={{
                                    width: "45.95px",
                                    height: "45.95px",
                                    borderRadius: "12.87px",
                                  }}
                                />
                      ) : selectedClient ? ( // إضافة حالة لعرض صورة العميل إذا كان محدداً
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            backgroundColor: "#ccc",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {selectedClient.name.charAt(0).toUpperCase()}
                        </div>
                      ) : (
                        <IoPeople
                          style={{
                            color: "rgba(32, 32, 32, 1)",
                            fontSize: "22px",
                          }}
                        />
                      )}
                    </div>
                    <div className="des-group">
                      <h4>
                        {isChatbotActive
                          ? "Khedr"
                          : selectedConversation
                          ? selectedConversation.participant_name ||
                            selectedConversation.user2_name ||
                            `User ${selectedConversation.user2_id}`
                          : selectedClient // عرض اسم العميل إذا كان محدداً
                          ? selectedClient.name
                          : "Select a conversation"}
                      </h4>
                    </div>
                  </div>
                  <div className="group_right d-flex">
                    <FaStar className="star" />
                    <IoMdInformationCircleOutline className="info" />
                    <HiOutlineDotsHorizontal className="dott" />
                  </div>
                </div>
                <div className="bord"></div>
                <div className="new_border">
                  <p>
                    Today,{" "}
                    {new Date().toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="main-chat">
                  <div className="start-chat" ref={chatContainerRef}>
                    {isLoadingMessages ? (
                      <div className="loading-conversation">
                        <div className="loading-spinner"></div>
                        <p>Loading conversation...</p>
                      </div>
                    ) : isChatbotActive ? (
                      <>
                        {/* شات الميتا AI */}
                        {isChatbotActive && chatHistory.length === 0 && (
                          <div className="chatbot-welcome">
                            <img
                              src="khedr.jpg"
                              alt="Khedr Logo"
                              className="chatbot-logo"
                            />
                            <h3 style={{ marginInline: "0px" }}>
                              Hi, I'm Khedr
                            </h3>
                            <p>How can I help you today?</p>
                          </div>
                        )}

                        {chatHistory.map((msg, index) => (
                          <div
                            key={index}
                            className={`st-message ${
                              msg.isUser ? "user-message" : "bot-message"
                            }`}
                          >
                            {!msg.isUser && (
                              <div className="leftt leftsss">
                                <img
                                  src="khedr.png"
                                  alt=""
                                  style={{ width: "30px" }}
                                />
                              </div>
                            )}
                            <div
                              className={`message-content ${
                                msg.isUser ? "user" : "bot"
                              }`}
                            >
                              <div className="nameDate">
                                <p className="name">{msg.name}</p>
                                {msg.isUser ? (
                                  <p className="date">{msg.date}</p>
                                ) : (
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        msg.rawText ||
                                          stripHtml(msg.description),
                                        msg.id
                                      )
                                    }
                                    className="copy-btn"
                                    title="Copy message"
                                  >
                                    {copiedMessageId === msg.id
                                      ? "Copied!"
                                      : "Copy"}
                                  </button>
                                )}
                                {msg.audioPath && (
                                  <div className="audio-controls">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        playBotAudio(msg.audioPath, msg.id);
                                      }}
                                      className={`play-pause-btn ${
                                        currentPlayingId === msg.id
                                          ? "active"
                                          : ""
                                      }`}
                                    >
                                      {currentPlayingId === msg.id &&
                                      isAudioPlaying ? (
                                        <FaPause />
                                      ) : (
                                        <FaPlay />
                                      )}
                                    </button>
                                    {currentPlayingId === msg.id && (
                                      <span className="audio-time">
                                        {Math.floor(
                                          audioPositions[msg.id] || 0
                                        )}
                                        s
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div
                                className="description"
                                style={{
                                  direction: isArabic(msg.description)
                                    ? "rtl"
                                    : "ltr",
                                  textAlign: isArabic(msg.description)
                                    ? "right"
                                    : "left",
                                }}
                              >
                                {msg.isUser ? (
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: msg.description,
                                    }}
                                  />
                                ) : (
                                  <TypingMessage
                                    text={
                                      msg.rawText || stripHtml(msg.description)
                                    }
                                    isNewSession={chatHistory.length <= 0} // إذا كانت الرسائل قليلة نعتبرها جلسة جديدة
                                    onComplete={() => {
                                      // تشغيل الصوت تلقائياً بعد اكتمال الكتابة إذا كان موجوداً
                                      if (msg.audioPath) {
                                        playBotAudio(msg.audioPath, msg.id);
                                      }
                                    }}
                                  />
                                )}
                              </div>

                              {msg.attachments?.map((file, i) => (
                                <div key={i} className="uploaded-file">
                                  {file.type.startsWith("image/") ? (
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt="Uploaded"
                                    />
                                  ) : (
                                    <FaFile />
                                  )}
                                </div>
                              ))}

                              {msg.audio && (
                                <div className="audio-container">
                                  <audio controls>
                                    <source src={msg.audio} type="audio/wav" />
                                    Your browser does not support the audio
                                    element.
                                  </audio>
                                </div>
                              )}
                            </div>
                            {msg.isUser && (
                              <div className="rightt rightsss"></div>
                            )}
                          </div>
                        ))}
                        {isChatbotActive && waitingForBot && (
                          <TypingIndicator />
                        )}
                      </>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`st-message ${
                              message.sender_id == userId
                                ? "user-message"
                                : "bot-message"
                            }`}
                          >
                            <div className="message-content">
                              <div className="nameDate">
                                <p className="name">
                                  {message.sender_id == userId
                                    ? "You"
                                    : selectedConversation?.user2_name ||
                                      "Unknown"}
                                </p>
                                <p className="date">
                                  {new Date(
                                    message.created_at
                                  ).toLocaleTimeString()}
                                </p>
                              </div>
                              <div className="description">
                                {message.message}
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  <div className="bg-white text_message">
                    {files.length > 0 && (
                      <div className="upload-preview-container">
                        {files.map((file, index) => (
                          <div key={index} className="uploaded-file">
                            {file.type.startsWith("image/") ? (
                              <img
                                src={URL.createObjectURL(file)}
                                alt="Uploaded"
                                className="file-thumbnail"
                              />
                            ) : (
                              <FaFile className="file-icon" />
                            )}

                            <TbXboxXFilled
                              style={{ fontSize: "20px" }}
                              className="remove-icon"
                              onClick={() => removeFile(index)}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* منطقة الكتابة */}
                    <div
                      ref={editorRef}
                      contentEditable
                      className="inp-text form-control p-2 min-h-[40px] rounded"
                      style={{
                        minHeight: "40px",
                        outline: "none",
                        whiteSpace: "pre-wrap",
                        border: "none",
                      }}
                      placeholder="Type message here..."
                      onInput={saveState}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault(); // لمنع إضافة سطر جديد
                          sendMessage(); // استدعاء دالة الإرسال
                        }
                      }}
                    ></div>

                    <div className=" tool-bar p-2 mt-2 align-items-center gap-2 ">
                      {/* <div className="left">
                                                <div className="left-left">
                                                    <IoIosUndo className="font-18" onClick={undo} disabled={undoStack.length === 0} />
                                                    <IoIosRedo className="font-18" onClick={redo} disabled={redoStack.length === 0} />
                                                    <LuType className="font-18" onClick={toggleFont} />
                                                </div>
                                                <div className="left-right">
                                                    <FaBold style={{ fontSize: "12.8px" }} onClick={() => formatText("bold")} />
                                                    <PiTextItalicBold style={{ fontSize: "15.8px" }} onClick={() => formatText("italic")} />
                                                    <FaUnderline style={{ fontSize: "12.8px" }} onClick={() => formatText("underline")} />
                                                </div>
                                            </div> */}
                      <div className="right">
                        <BsEmojiSmileFill
                          ref={emojiButtonRef}
                          style={{ fontSize: "19px" }}
                          onClick={toggleEmojiPicker}
                        />

                        {isRecording ? (
                          <FaStop
                            style={{
                              fontSize: "19px",
                              cursor: "pointer",
                              color: "red",
                            }}
                            onClick={stopRecording}
                            title="stop Recording"
                          />
                        ) : (
                          <FaMicrophone
                            style={{ fontSize: "19px", cursor: "pointer" }}
                            onClick={startRecording}
                            title="start Recording"
                          />
                        )}

                        {isRecording && (
                          <span style={{ color: "red", fontSize: "14px" }}>
                            Recording...
                          </span>
                        )}

                        {audioURL && (
                          <FaPlay
                            style={{ fontSize: "19px", cursor: "pointer" }}
                            onClick={playAudio}
                            title="listen what you say"
                          />
                        )}
                        <Paperclip
                          style={{ fontSize: "19px", cursor: "pointer" }}
                          className="file"
                          onClick={() =>
                            document.getElementById("fileInput").click()
                          }
                        />
                        <input
                          type="file"
                          id="fileInput"
                          hidden
                          onChange={handleFileChange}
                        />

                        <button
                          className="btn ms-auto"
                          onClick={handleSendMessage}
                          disabled={loading}
                        >
                          <RiSendPlaneFill />
                          {loading ? "Sending..." : "SEND"}
                        </button>
                      </div>
                    </div>
                    {showEmojiPicker && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: "55px",
                          right: 0,
                        }}
                      >
                        <EmojiPicker onEmojiClick={addEmoji} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
const getFixedColor = () => {
  return "rgba(196, 196, 196, 1)"; // لون أزرق ثابت لجميع الجلسات
};

export default Chat;
