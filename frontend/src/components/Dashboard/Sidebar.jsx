/* eslint-disable no-unused-vars */
import React from "react";
import { motion } from "framer-motion";
import {
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiLogOut,
  FiUsers,
  FiUserPlus,
  FiUser,
  FiHome,
  FiList,
} from "react-icons/fi";

const Sidebar = ({
  isMobile,
  isMobileOpen,
  sidebarOpen,
  activeTab,
  user,
  handleTabChange,
  toggleSidebar,
  setIsMobileOpen,
  handleLogout,
  isHovered,
  setIsHovered,
}) => {
  const navItems = [
    {
      name: "Dashboard",
      icon: <FiHome />,
      tab: "dashboard",
      show: true,
    },
    {
      name: "Add New Visitor",
      icon: <FiUserPlus />,
      tab: "add-visitor",
      show: true,
    },
    {
      name: "Visitor List",
      icon: <FiList />,
      tab: "visitor-list",
      show: true,
    },
    {
      name: "Add New Officer",
      icon: <FiUser />,
      tab: "add-officer",
      show: true,
    },
    {
      name: "Officer List",
      icon: <FiUsers />,
      tab: "officer-list",
      show: true,
    },
    {
      name: "Settings",
      icon: <FiSettings />,
      tab: "settings",
      show: true,
    },
  ];

  const getUserInitials = () => {
    if (!user?.name) return "U";
    const names = user.name.split(" ");
    return names
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isMobile) {
    return (
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isMobileOpen ? 0 : -300 }}
        exit={{ x: -300 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-y-0 left-0 z-40 w-64 bg-white flex flex-col border-r border-gray-300 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 h-16">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <h1 className="text-xl font-bold text-black">Appointment System</h1>
          </motion.div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.tab;
              return (
                <li key={item.tab}>
                  <motion.button
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTabChange(item.tab)}
                    className={`flex items-center w-full p-4 rounded-lg transition-all justify-start space-x-3 px-4 ${
                      isActive
                        ? "bg-black text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100 hover:text-black"
                    }`}
                  >
                    <span className="w-5 h-5 flex items-center justify-center">
                      {item.icon}
                    </span>
                    <span className="font-medium text-sm md:text-base">
                      {item.name}
                    </span>
                  </motion.button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-300">
          <motion.div className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                user?.userType === "admin"
                  ? "bg-purple-600 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {getUserInitials()}
            </div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 min-w-0 ml-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-sm font-bold text-black truncate">
                    {user?.name || "User"}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <FiLogOut className="w-4 h-4 text-gray-600 hover:text-black" />
                </motion.button>
              </div>
              <p className="text-xs text-gray-600 font-medium truncate mt-0.5">
                {user?.email || "user@example.com"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {user?.userType === "admin" ? "Administrator" : "User"}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.aside>
    );
  }

  return (
    <motion.aside
      initial={false}
      animate={{
        width: sidebarOpen ? 240 : 80,
      }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="relative bg-white h-full flex flex-col border-r border-gray-300 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div
        className="cursor-pointer flex items-center justify-between p-4 border-b border-gray-300 h-16"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={toggleSidebar}
      >
        {sidebarOpen ? (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <h1 className="text-xl font-bold text-black">Appointment System</h1>
          </motion.div>
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              user?.userType === "admin"
                ? "bg-purple-600 text-white"
                : "bg-blue-600 text-white"
            }`}
          >
            AS
          </div>
        )}

        <motion.button
          animate={{
            x: isHovered ? (sidebarOpen ? -4 : 4) : 0,
            scale: isHovered ? 1.2 : 1,
          }}
          transition={{ type: "spring", stiffness: 300 }}
          className="rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <li key={item.tab}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTabChange(item.tab)}
                  className={`flex items-center w-full p-4 rounded-lg transition-all group ${
                    sidebarOpen
                      ? "justify-start space-x-3 px-4"
                      : "justify-center px-0"
                  } ${
                    isActive
                      ? "bg-black text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100 hover:text-black"
                  }`}
                >
                  <span className="w-5 h-5 flex items-center justify-center">
                    {item.icon}
                  </span>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="font-medium text-sm md:text-base"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </motion.button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-300">
        <motion.div className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              user?.userType === "admin"
                ? "bg-purple-600 text-white"
                : "bg-blue-600 text-white"
            }`}
          >
            {sidebarOpen ? getUserInitials() : getUserInitials().charAt(0)}
          </div>

          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 min-w-0 ml-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-sm font-bold text-black truncate">
                    {user?.name || "User"}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <FiLogOut className="w-4 h-4 text-gray-600 hover:text-black" />
                </motion.button>
              </div>
              <p className="text-xs text-gray-600 font-medium truncate mt-0.5">
                {user?.email || "user@example.com"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {user?.userType === "admin" ? "Administrator" : "User"}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
