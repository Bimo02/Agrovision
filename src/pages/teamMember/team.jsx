import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../../compontents/sidebar/sidebar";
import Navbar from "../../compontents/navBar/navbar";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import axios from "axios";
import "./team.css";
import { useTranslation } from "react-i18next";


function Members() {
  const navigate = useNavigate();
  const location = useLocation();
      const { t, i18n } = useTranslation();

  const [isLoading, setIsLoading] = useState(true); 
  const [members, setMembers] = useState([]);
  const [searchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const filteredMembers = members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchMembers = async() => {
      try {
        const token = localStorage.getItem("authToken");
        const userId = localStorage.getItem("userId");
  

        if (!token) {
          alert("Authentication token is missing. Please log in again.");
          navigate("/login");
          return;
        }
  
        const response = await axios.get(
          `https://final.agrovision.ltd/api/users/${userId}/members`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        const apiMembers = Array.isArray(response.data.members)
          ? response.data.members
          : [];
  
        setMembers(apiMembers);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchMembers();
  }, []);
  

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

  
  useEffect(() => {
    if (location.state && location.state.updatedMember) {
      const updatedMember = location.state.updatedMember;
  
      setMembers((prevMembers) => {
        const updatedMembers = prevMembers.map((member) =>
          member.id === updatedMember.id ? updatedMember : member
        );
        return updatedMembers;
      });
    }
  }, [location.state]);
   
  
  const handleDelete = async (memberId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this member?");
    if (confirmDelete) {
      try {
        const token = localStorage.getItem("authToken");
        
        if (!token) {
          alert("No authentication token found. Please log in again.");
          return;
        }

        const response = await axios.delete(
          `https://final.agrovision.ltd/api/add-member/${memberId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          setMembers((prevMembers) =>
            prevMembers.filter((member) => member.id !== memberId)
          );
          alert("Member deleted successfully!");
        } else {
          alert("Failed to delete the member. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting member:", error);
        alert("An error occurred while trying to delete the member.");
      }
    }
  };
  
  const handleEdit = (memberId) => {
    const memberToEdit = members.find((member) => member.id === memberId);
    navigate("/add-new-memb", { state: { memberToEdit: memberToEdit } });
};

  

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="full-screen-loader">
        <div className="loader-icon"></div>
      </div>
    );
  }

  return (
    <div className="app"  dir={i18n.dir()}>
      <Navbar toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="main-content">
        <div className={`sidebar-container ${isSidebarOpen ? "open" : "closed"}`}>
          <Sidebar />
        </div>
        <div className={`content flex-column ${isSidebarOpen ? "shifted" : ""}`}>
          <div className="team inventory-container">
            <header className="inventory-header">
              <div className="farm-left">
                <h1>{t("Team Members")}</h1>
                <button
                  className="add-new-button"
                  onClick={() =>
                    navigate("/add-new-memb", { state: { action: "add" } })
                  }
                >
                  <p>{t("Add New")}</p>
                </button>
              </div>
            </header>
          </div>

          <div className="inventory-table">
            <table>
              <thead>
                <tr>
                   <th>{t("Image")}</th>
          <th>{t("Name")}</th>
          <th>{t("Gender")}</th>
          <th>{t("Email")}</th>
          <th>{t("Phone Number")}</th>
          <th>{t("Position")}</th>
          <th>{t("Action")}</th>
                </tr>
              </thead>
              <tbody>
  {filteredMembers.length > 0 ? (
    filteredMembers.map((member) => (
      <tr className="team-tr" key={member.id}>
        <td data-label="Image">
          <img
            src={`https://final.agrovision.ltd/storage/app/public/${member.image}`}
            alt="Member"
            className="members-image"
          />
        </td>
        <td data-label="Name">{member.name || "No Name"}</td>
        <td data-label="Gender">{member.gender || "No Gender"}</td>
        <td data-label="Email">{member.email || "No Email"}</td>
        <td data-label="Phone Number">{member.phone || "No Phone"}</td>
        <td data-label="Position">{member.role || "No Position"}</td>
        <td data-label="Action" className="action-icons">
          <div className="back-action d-flex g-4">
            <FiEdit
              className="edit-icon"
              title="Edit"
              onClick={() => handleEdit(member.id)}
            />
            <RiDeleteBinLine
              className="delete-icon"
              title="Delete"
              onClick={() => handleDelete(member.id)}
            />
          </div>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
        {t("No members found.")}
      </td>
    </tr>
  )}
</tbody>

            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Members;
