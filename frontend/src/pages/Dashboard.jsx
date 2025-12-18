/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import photo from "../../public/vite.png";
// Components
import Sidebar from "../components/Dashboard/Sidebar";
import MobileHeader from "../components/Dashboard/MobileHeader";
import Settings from "../components/Dashboard/Settings";
import DashboardHome from "./DashboardHome";
import OfficerList from "../components/officer/OfficerList";
import AddOfficer from "../components/officer/AddOfficer";
import AddVisitor from "../components/Visitor/AddVisitor";
import VisitorList from "../components/Visitor/VisitorList";
import AdminPanel from "./AdminPanel";
import Footer from "../components/Dashboard/Footer";

const TabContent = React.memo(({ activeTab, user }) => {
  // If user is admin/super admin and on dashboard tab, show AdminPanel instead of DashboardHome
  const shouldShowAdminPanel =
    (user?.userType === "admin" || user?.userType === "super_admin") &&
    (activeTab === "dashboard" || activeTab === "admin-panel");

  switch (activeTab) {
    case "add-visitor":
      return <AddVisitor />;
    case "visitor-list":
      return <VisitorList />;
    case "add-officer":
      return <AddOfficer />;
    case "officer-list":
      return <OfficerList />;
    case "admin-panel":
      return <AdminPanel />;
    case "settings":
      return <Settings user={user} />;
    default:
      // For admin users, show AdminPanel on dashboard, otherwise show DashboardHome
      if (shouldShowAdminPanel) {
        return <AdminPanel />;
      }
      return <DashboardHome user={user} />;
  }
});

TabContent.displayName = "TabContent";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Set default tab based on user type
  const getDefaultTab = () => {
    const savedTab = localStorage.getItem("dashboardActiveTab");
    if (savedTab) return savedTab;

    // For admin/super admin, default to dashboard (which will show AdminPanel)
    if (user?.userType === "admin" || user?.userType === "super_admin") {
      return "dashboard";
    }
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false);
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem("dashboardActiveTab", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    // Update active tab when user changes or on initial load
    const defaultTab = getDefaultTab();
    if (activeTab !== defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [user]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("dashboardActiveTab");
    logout();
    setShowLogoutConfirm(false);
  };

  return (
    <div className="bg-white min-h-screen flex items-center justify-center p-2 md:p-4 relative">
      {/* Mobile Header */}
      {isMobile && <MobileHeader toggleSidebar={toggleSidebar} />}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div
        className={`flex w-full bg-white rounded-xl shadow-lg overflow-hidden border border-gray-300 relative ${
          isMobile ? "mt-16 mb-2 h-[calc(100vh-5rem)]" : "h-[95vh]"
        }`}
      >
        {/* Sidebar */}
        <div className="relative z-10">
          <Sidebar
            isMobile={isMobile}
            isMobileOpen={isMobileOpen}
            sidebarOpen={sidebarOpen}
            activeTab={activeTab}
            user={user}
            handleTabChange={handleTabChange}
            toggleSidebar={toggleSidebar}
            setIsMobileOpen={setIsMobileOpen}
            handleLogout={handleLogout}
            isHovered={isHovered}
            setIsHovered={setIsHovered}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 h-full overflow-auto relative bg-gray-50 flex flex-col z-10">
          {/* Watermark */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
            <img
              src={photo}
              alt="Watermark"
              className="opacity-10 w-64 md:w-80 select-none"
            />
          </div>

          {/* Main content area */}
          <div className="flex-1 p-6 relative z-10 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (user?.userType || "")} // Add user type to key to force re-render
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TabContent activeTab={activeTab} user={user} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Fixed Footer */}
          <div className="relative z-10 bg-gray-50 border-t border-gray-200 px-6 py-4 mt-auto">
            <Footer activeTab={activeTab} />
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-xl shadow-2xl overflow-hidden w-full max-w-md border border-gray-300"
            >
              <div className="p-8 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-600 mb-4">
                  <FiLogOut className="h-5 w-5 text-white" />
                </div>

                <h3 className="text-lg font-medium text-black mb-2">
                  Ready to leave?
                </h3>
                <p className="text-gray-700 mb-6">
                  Are you sure you want to sign out of your account?
                </p>

                <div className="flex justify-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-5 py-2.5 text-sm font-medium rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmLogout}
                    className="px-5 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all"
                  >
                    Logout
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
