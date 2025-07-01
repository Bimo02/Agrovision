import BasicExample from "./progress";
import "./RightSidebar.css";
import { IoIosWarning } from "react-icons/io";
import CheckButton from "./check button/check";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import { RiDeleteBinLine } from "react-icons/ri";

// بيانات افتراضية

const DEFAULT_SENSOR_DATA = {
  sensor_id: "agro_default_001",
  status: "Inactive",
  last_seen: new Date().toLocaleString(),
};

const DEFAULT_TASKS_KEYS = [
  {
    id: 1,
    titleKey: "Watering",
    descriptionKey: "Plant with 1 inch of water in the morning",
  },
  {
    id: 2,
    titleKey: "Fertilizing",
    descriptionKey: "Apply fertilizer to the soil",
  },
];


const MessageContent = ({ message }) => {
  if (!message) return null;

  // تحقق إذا كانت الرسالة تحتوي على رابط صورة
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(message);

  if (isImage) {
    return (
      <div className="message-image-container">
        <img 
          src={message} 
          alt="Message content" 
          className="message-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "download.png";
          }}
        />
      </div>
    );
  }

  return <p className="describe">{message || t("No messages yet")}</p>;
};


function RightSidebar() {
  const { t, i18n } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [conversationsError, setConversationsError] = useState(null);

const [tasks, setTasks] = useState(() => {
  const savedTasks = JSON.parse(localStorage.getItem("tasks"));
  if (savedTasks) return savedTasks;

  return DEFAULT_TASKS_KEYS.map(task => ({
    ...task,
    title: t(task.titleKey),
    description: t(task.descriptionKey),
  }));
});


  const [taskStates, setTaskStates] = useState(() => {
    const savedStates = JSON.parse(localStorage.getItem("taskStates")) || [];
    return savedStates.length > 0
      ? savedStates
      : new Array(tasks.length).fill(false);
  });
  const [sensorData, setSensorData] = useState(DEFAULT_SENSOR_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allTasksCompleted, setAllTasksCompleted] = useState(false);

  // حالة لعرض/إخفاء modal إضافة مهمة
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");

  const newTask = {
  id: Date.now(),
  title: newTaskTitle,
  description: newTaskDescription,
};


  const checkAuth = () => {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) {
    // يمكنك توجيه المستخدم إلى صفحة تسجيل الدخول هنا
    window.location.href = '/login'; // تغيير المسار حسب تطبيقك
    return false;
  }
  return true;
};


useEffect(() => {
  const updatedTasks = tasks.map((task) => {
    return task.titleKey
      ? {
          ...task,
          title: t(task.titleKey),
          description: t(task.descriptionKey),
        }
      : task;
  });

  setTasks(updatedTasks);
}, [i18n.language]);




  // useEffect(() => {
  //   localStorage.setItem("taskStates", JSON.stringify(taskStates));

  //   // التحقق إذا تم إكمال جميع المهام
  //   const allCompleted = taskStates.every(state => state);
  //   if (allCompleted && tasks.length > 0) {
  //     setAllTasksCompleted(true);
  //     // مسح المهام بعد ثانيتين
  //     const timer = setTimeout(() => {
  //       setTasks([]);
  //       setTaskStates([]);
  //       localStorage.removeItem("tasks");
  //       localStorage.removeItem("taskStates");
  //     }, 2000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [taskStates, tasks.length]);

  useEffect(() => {
const fetchConversations = async () => {
  try {
    // التحقق من وجود التوكن أولاً
    if (!checkAuth()) return;

    setLoadingConversations(true);
    setConversationsError(null);

    const authToken = localStorage.getItem("authToken");
    const response = await fetch(
      "https://final.agrovision.ltd/api/latest-conversations",
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // إذا كان هناك خطأ غير مصرح به (401)، قم بإزالة التوكن
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        window.location.href = '/login'; // تغيير المسار حسب تطبيقك
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    setConversations(data.latest_conversations || []);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    setConversationsError(t("Failed to load conversations"));
  } finally {
    setLoadingConversations(false);
  }
};
    fetchConversations();
  }, [t]);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }, [tasks]);

  // useEffect(() => {
  //   // تحديث الترجمات عند تغيير اللغة
  //   if (tasks.length > 0 && tasks[0].title !== t(DEFAULT_TASKS[0].title)) {
  //     setTasks(DEFAULT_TASKS.map(task => ({
  //       ...task,
  //       title: t(task.title),
  //       description: t(task.description)
  //     })));
  //   }
  // }, [t]);

  useEffect(() => {
    let isMounted = true;

    const fetchSensorData = async () => {
      try {
        if (!isMounted) return;

        setLoading(true);
        setError(null);

        const apiUrl =
          "https://immortal-basically-lemur.ngrok-free.app/latest-sensor-status";

        const response = await fetch(apiUrl, {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          // إضافة timeout للطلب
          signal: AbortSignal.timeout(5000), // 5 ثواني كحد أقصى للانتظار
        });

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log('Raw sensor data:', data); // Debug log


        if (!isMounted) return;

        if (data && data.sensor_id) {
          setSensorData(data);
        } else {
          throw new Error("Invalid data format from server");
        }
      } catch (err) {
        if (!isMounted) return;

        console.error("Fetch error:", err);
        setError(
          t("Sensor data is currently unavailable. Using default data.")
        );

        // استخدام البيانات الافتراضية مباشرة
        setSensorData(DEFAULT_SENSOR_DATA);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSensorData();

    return () => {
      isMounted = false;
    };
  }, [t]);

useEffect(() => {
  const savedTasks = JSON.parse(localStorage.getItem("tasks"));
  const savedStates = JSON.parse(localStorage.getItem("taskStates"));

  if (savedTasks && savedStates) {
    // أضف ترجمة للمهمات المخزنة
    const translatedTasks = savedTasks.map(task =>
      task.titleKey
        ? {
            ...task,
            title: t(task.titleKey),
            description: t(task.descriptionKey),
          }
        : task
    );
    setTasks(translatedTasks);
    setTaskStates(savedStates);
  }
}, [i18n.language]); // <-- مهم جدًا تضيف اللغة هنا


  const handleTaskChange = (index) => {
    const updatedStates = [...taskStates];
    updatedStates[index] = !updatedStates[index];
    setTaskStates(updatedStates);
  };

  const resetTasks = () => {
    setTasks(
      DEFAULT_TASKS.map((task) => ({
        ...task,
        title: t(task.title),
        description: t(task.description),
      }))
    );
    setTaskStates(tasks.map(() => false));
    setAllTasksCompleted(false);
  };

  useEffect(() => {
    const allCompleted = tasks.length > 0 && taskStates.every((state) => state);
    if (allCompleted) {
      setAllTasksCompleted(true);
      setTimeout(() => {
        setTasks([]);
        setTaskStates([]);
        localStorage.removeItem("tasks");
        localStorage.removeItem("taskStates");
      }, 1500);
    }
  }, [taskStates, tasks.length]);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("taskStates", JSON.stringify(taskStates));
  }, [tasks, taskStates]);

  const handleAddTask = () => {
    if (newTaskTitle.trim() === "") return;

    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      description: newTaskDescription,
    };

    const updatedTasks = [...tasks, newTask];
    const updatedStates = [...taskStates, false];

    setTasks(updatedTasks);
    setTaskStates(updatedStates);

    // حفظ مباشرة في localStorage
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    localStorage.setItem("taskStates", JSON.stringify(updatedStates));

    setNewTaskTitle("");
    setNewTaskDescription("");
    setShowAddTaskModal(false);
  };

  const handleDeleteTask = (taskId) => {
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) return;

    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    const updatedStates = [...taskStates];
    updatedStates.splice(taskIndex, 1);

    setTasks(updatedTasks);
    setTaskStates(updatedStates);

    // حفظ مباشرة في localStorage
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
    localStorage.setItem("taskStates", JSON.stringify(updatedStates));
  };

  const completedTasks = taskStates.filter(Boolean).length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <aside className="right-sidebar" dir={i18n.dir()}>
      <div className="device-info">
        <h3 className="text-direction">{t("Devices")}</h3>
        <div className="tasks">
          {loading ? (
            <p className="text-direction">{t("Loading...")}</p>
          ) : error ? (
            <div className="warning text-direction">
              <IoIosWarning className="warn-icon" />
              {t("Error loading sensor data")}
            </div>
          ) : (
            <>
              <div className="task">
                <p className="text-direction">{t("Sensor")}</p>
                <div className="info">
                  <p>#{sensorData.sensor_id}</p>
                  <p
                    className={`task-${sensorData.status.toLowerCase()} text-direction`}
                  >
                    {t(sensorData.status)}
                  </p>
                </div>
              </div>
              {sensorData.status === "Inactive" && (
                <div className="warning text-direction">
                  <IoIosWarning className="warn-icon" />
                  {t("Last seen:")} {sensorData.last_seen}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="task-list">
        <div className="d-flex justify-content-between align-items-center">
          <h3 className="text-direction">{t("Tasks")}</h3>
          <Button variant="success" onClick={() => setShowAddTaskModal(true)}>
            {t("Add Task")}
          </Button>
        </div>

        <BasicExample progress={progress} />
        <div className="context d-flex justify-content-between">
          <div className="percent">{`${progress.toFixed(0)}%`}</div>
          <div className="task_complete text-direction">
            {tasks.length > 0
              ? t("tasksComplete", { completed: completedTasks, total: tasks.length })
              : t("All tasks completed!")}
          </div>
        </div>

        {allTasksCompleted && (
          <div className="completion-message text-direction">
            {t("Great job! All tasks completed!")}
          </div>
        )}

        {tasks.length > 0 ? (
          tasks.map((task, index) => (
            <div
              key={task.id}
              className={`taskat d-flex ${
                i18n.language === "ar"
                  ? "justify-content-end"
                  : "justify-content-between"
              }`}
            >
              <div className="leftSide">
                <h4 className="text-direction">{task.title}</h4>
                <p className="text-direction">{task.description}</p>
              </div>
              <div className="rightSide d-flex align-items-center">
                <CheckButton
                  checked={taskStates[index]}
                  onChange={() => handleTaskChange(index)}
                />
                <Button
                  variant="transparent"
                  size="sm"
                  onClick={() => handleDeleteTask(task.id)}
                >
                  <RiDeleteBinLine className="delete-icon" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-tasks text-direction">
            <p>{t("No tasks remaining. Add new tasks to get started.")}</p>
          </div>
        )}
      </div>

      {/* نافذة إضافة مهمة جديدة */}
      <Modal show={showAddTaskModal} onHide={() => setShowAddTaskModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-direction">
            {t("Add New Task")}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="text-direction">
                {t("Task Title")} *
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={t("Enter task title")}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="text-direction">
                {t("Description")}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder={t("Enter task description")}
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowAddTaskModal(false)}
          >
            {t("Cancel")}
          </Button>
          <Button variant="success" onClick={handleAddTask}>
            {t("Add Task")}
          </Button>
        </Modal.Footer>
      </Modal>

    <div className="messages">
        <h3 className="text-direction">{t("LastMessages")}</h3>

        {loadingConversations ? (
          <p className="text-direction">{t("Loading conversations...")}</p>
        ) : conversationsError ? (
          <p className="text-direction error">{conversationsError}</p>
        ) : conversations.length > 0 ? (
          conversations.map((conversation, index) => (
            <div className="message" key={index}>
              <img
                src={conversation.sender_image || "download.png"}
                alt={conversation.sender_name}
                onError={(e) => {
                  e.target.onerror = null;
                }}
              />
              <div className="information">
                <p className="text-direction">{conversation.sender_name}</p>
                <MessageContent message={conversation.last_message} />
                <div className="buttons">
                  <div className="bttn order text-direction">
                    {t(conversation.status || "Order")}
                  </div>
                  <div className="bttn priority text-direction">
                    {t(conversation.priority || "High")}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-direction">{t("No conversations found")}</p>
        )}
      </div>
    </aside>
  );
}

export default RightSidebar;
