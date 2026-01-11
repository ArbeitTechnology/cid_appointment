/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
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
  FiBook,
} from "react-icons/fi";
import photo from "../../../public/vite.png";

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
  // Local state for user data to handle real-time updates
  const [localUser, setLocalUser] = useState(user);

  // Update localUser when the prop changes
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  // Listen for user update events from OfficerList
  useEffect(() => {
    const handleUserUpdated = (event) => {
      console.log("User updated event received:", event.detail);
      setLocalUser(event.detail);
    };

    // Add event listener
    window.addEventListener("userUpdated", handleUserUpdated);

    // Clean up event listener
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated);
    };
  }, []);

  // Also listen for storage changes (fallback)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        try {
          const updatedUser = JSON.parse(e.newValue || "{}");
          if (updatedUser._id === localUser?._id) {
            console.log("Storage change detected for user:", updatedUser);
            setLocalUser(updatedUser);
          }
        } catch (error) {
          console.error("Error parsing user data from storage:", error);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [localUser?._id]);

  // Function to manually refresh user data from localStorage
  const refreshUserData = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser._id === localUser?._id) {
          setLocalUser(parsedUser);
          console.log("User data refreshed from localStorage");
        }
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  const getUserInitials = () => {
    const currentUser = localUser || user;
    if (!currentUser?.name) return "U";
    const names = currentUser.name.split(" ");
    return names
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to determine user permissions
  const getUserPermissions = () => {
    const currentUser = localUser || user;
    if (!currentUser)
      return {
        canAddOfficer: false,
        canViewOfficerList: false,
        canAddVisitor: false,
        canViewOfficerVisitorList: false,
        canViewAllVisitorList: false,
      };

    const isSuperAdmin = currentUser.userType === "super_admin";
    const isAdmin = currentUser.userType === "admin";
    const isOfficer = currentUser.userType === "officer";
    const isRegularUser = currentUser.userType === "user";

    // Officer with admin privileges
    const isOfficerWithAdmin =
      isOfficer &&
      (currentUser.hasAdminRole ||
        currentUser.isAlsoAdmin ||
        (currentUser.additionalRoles &&
          currentUser.additionalRoles.includes("admin")));

    return {
      isSuperAdmin,
      isAdmin,
      isOfficer,
      isRegularUser,
      isOfficerWithAdmin,
      // Only regular users can add visitors
      canAddVisitor: isRegularUser,
      // Officer Visitor List: For officers and officers with admin
      canViewOfficerVisitorList: isOfficer || isOfficerWithAdmin,
      // All Visitors List: For admins, super admins, regular users, and officers with admin
      canViewAllVisitorList:
        isSuperAdmin || isAdmin || isRegularUser || isOfficerWithAdmin,
      // Dashboard access for everyone
      canViewDashboard: true,
      // Settings access for everyone
      canAccessSettings: true,
      // Officer management permissions
      canAddOfficer: isSuperAdmin || isAdmin || isOfficerWithAdmin,
      canViewOfficerList: isSuperAdmin || isAdmin || isOfficerWithAdmin,
    };
  };

  // Determine which nav items to show based on user type and permissions
  const getNavItems = () => {
    const permissions = getUserPermissions();

    const baseItems = [
      {
        name: "Dashboard",
        icon: <FiHome />,
        tab: "dashboard",
        show: permissions.canViewDashboard,
        description: "View your dashboard",
      },
    ];

    // Add visitor management - ONLY FOR REGULAR USERS
    if (permissions.canAddVisitor) {
      baseItems.push({
        name: "Add Visitor",
        icon: <FiUserPlus />,
        tab: "add-visitor",
        show: permissions.canAddVisitor,
        description: "Register new visitor",
        userOnly: true,
      });
    }

    // Officer Visitor List - FOR OFFICERS
    if (permissions.canViewOfficerVisitorList) {
      baseItems.push({
        name: "My Visitor List",
        icon: <FiBook />,
        tab: "officer-visitor-list",
        show: permissions.canViewOfficerVisitorList,
        description: "View your visitors",
        officerOnly: true,
      });
    }

    // All Visitors List - FOR ADMINS, SUPER ADMINS, REGULAR USERS, AND OFFICERS WITH ADMIN
    if (permissions.canViewAllVisitorList) {
      baseItems.push({
        name: "All Visitors",
        icon: <FiList />,
        tab: "visitor-list",
        show: permissions.canViewAllVisitorList,
        description: "View all visitors in system",
        adminOnly:
          permissions.isSuperAdmin ||
          permissions.isAdmin ||
          permissions.isOfficerWithAdmin,
      });
    }

    // Add officer management for admins and officers with admin privileges
    if (permissions.canAddOfficer || permissions.canViewOfficerList) {
      baseItems.push(
        {
          name: "Add Officer",
          icon: <FiUser />,
          tab: "add-officer",
          show: permissions.canAddOfficer,
          description: "Add new officer",
          adminOnly: true,
        },
        {
          name: "Officer List",
          icon: <FiUsers />,
          tab: "officer-list",
          show: permissions.canViewOfficerList,
          description: "View all officers",
          adminOnly: true,
        }
      );
    }

    // Settings for all users
    baseItems.push({
      name: "Settings",
      icon: <FiSettings />,
      tab: "settings",
      show: permissions.canAccessSettings,
      description: "Account settings",
    });

    return baseItems.filter((item) => item.show);
  };

  const navItems = getNavItems();

  const getUserTypeDisplay = () => {
    const currentUser = localUser || user;
    if (!currentUser) return "User";

    if (currentUser.userType === "super_admin") return "Super Admin";
    if (currentUser.userType === "admin") return "Admin";
    if (currentUser.userType === "officer") {
      if (
        currentUser.hasAdminRole ||
        currentUser.isAlsoAdmin ||
        (currentUser.additionalRoles &&
          currentUser.additionalRoles.includes("admin"))
      ) {
        return "Officer (Admin)";
      }
      return "Officer";
    }
    return "User";
  };

  // Get icon for different visitor list types
  const getVisitorListIcon = (item) => {
    if (item.tab === "officer-visitor-list") {
      return <FiBook className="w-5 h-5" />;
    } else if (item.tab === "visitor-list") {
      return <FiList className="w-5 h-5" />;
    }
    return item.icon;
  };

  // Determine button class based on item type
  const getButtonClass = (item, isActive) => {
    if (isActive) {
      if (item.officerOnly) return "bg-blue-600 text-white shadow-md";
      if (item.adminOnly) return "bg-indigo-600 text-white shadow-md";
      if (item.userOnly) return "bg-green-600 text-white shadow-md";
      return "bg-black text-white shadow-md";
    }
    return "text-gray-700 hover:bg-gray-100 hover:text-black";
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
            <h1 className="text-xl font-bold text-black">Appointment</h1>
          </motion.div>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-300 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                localUser?.userType === "super_admin"
                  ? "bg-red-100 text-red-700 border-2 border-red-300"
                  : localUser?.userType === "admin"
                  ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                  : localUser?.userType === "officer"
                  ? localUser?.hasAdminRole || localUser?.isAlsoAdmin
                    ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-300"
                    : "bg-blue-100 text-blue-700 border-2 border-blue-300"
                  : "bg-green-100 text-green-700 border-2 border-green-300"
              }`}
            >
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <p className="text-sm font-bold text-black truncate">
                  {localUser?.name || "User"}
                </p>
              </div>
              <p className="text-xs text-gray-600 font-medium truncate mt-0.5">
                {getUserTypeDisplay()}
              </p>
              {localUser?.userType === "officer" && (
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-xs text-gray-500">
                    {localUser?.department || "Department"}
                  </span>
                  {localUser?.designation && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        {localUser.designation}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
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
                    onClick={() => {
                      handleTabChange(item.tab);
                      setIsMobileOpen(false);
                    }}
                    className={`flex items-center w-full p-4 rounded-lg transition-all justify-start space-x-3 px-4 ${getButtonClass(
                      item,
                      isActive
                    )}`}
                    title={item.description}
                  >
                    <span className="w-5 h-5 flex items-center justify-center">
                      {getVisitorListIcon(item)}
                    </span>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm md:text-base">
                        {item.name}
                      </span>
                      {item.description && sidebarOpen && (
                        <span className="text-xs text-gray-500 mt-0.5">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </motion.button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-300">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center justify-center w-full p-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black transition-colors"
          >
            <FiLogOut className="w-5 h-5 mr-2" />
            <span className="font-medium">Logout</span>
          </motion.button>
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
            <h1 className="text-xl font-bold text-black">Appointment</h1>
          </motion.div>
        ) : (
          <img
            src={photo}
            className="h-10 w-10 rounded-full object-cover border-2 border-gray-300"
            alt="App Logo"
          />
        )}

        <motion.button
          animate={{
            x: isHovered ? (sidebarOpen ? -4 : 4) : 0,
            scale: isHovered ? 1.2 : 1,
          }}
          transition={{ type: "spring", stiffness: 300 }}
          className="p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 transition-colors"
          onClick={toggleSidebar}
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
                  } ${getButtonClass(item, isActive)}`}
                  title={!sidebarOpen ? item.description : ""}
                >
                  <span className="w-5 h-5 flex items-center justify-center relative">
                    {getVisitorListIcon(item)}
                  </span>
                  {sidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-start flex-1"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm md:text-base">
                          {item.name}
                        </span>
                      </div>
                      {item.description && (
                        <span className="text-xs text-gray-400 mt-0.5">
                          {item.description}
                        </span>
                      )}
                    </motion.div>
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
              localUser?.userType === "super_admin"
                ? "bg-red-600 text-white"
                : localUser?.userType === "admin"
                ? "bg-purple-600 text-white"
                : localUser?.userType === "officer"
                ? localUser?.hasAdminRole || localUser?.isAlsoAdmin
                  ? "bg-indigo-600 text-white"
                  : "bg-blue-600 text-white"
                : "bg-green-600 text-white"
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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center min-w-0">
                  <p className="text-sm font-bold text-black truncate max-w-30">
                    {localUser?.name || "User"}
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
                {getUserTypeDisplay()}
              </p>
              {localUser?.userType === "officer" && localUser?.department && (
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {localUser.department}
                  {localUser.designation && ` • ${localUser.designation}`}
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
