import React from "react";
import { useNavigate } from "react-router-dom";
import "./MetaShortcut.css";

function MetaShortcut() {
  const navigate = useNavigate();

  const activateMetaChat = () => {
    navigate("/new_chat", {
      state: { 
        autoStartNewSession: true // نستخدم علامة واحدة فقط
      }
    });
  };

  return (
    <div className="meta-shortcut" onClick={activateMetaChat}>
      <div className="meta-icon">
        <img src="/Copy.png" alt="Meta AI" />
      </div>
    </div>
  );
}

export default MetaShortcut;