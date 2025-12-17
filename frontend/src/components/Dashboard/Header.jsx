/* eslint-disable no-unused-vars */
import React from "react";
import { motion } from "framer-motion";
import { FiSettings, FiShield, FiHome } from "react-icons/fi";

const Header = ({ activeTab, user }) => {
  const getHeaderInfo = () => {
    switch (activeTab) {
      case "dashboard":
        return {
          title: "Dashboard",
          subtitle: "Welcome to your dashboard",
          icon: <FiHome className="h-6 w-6 text-gray-100" />,
          color: "from-blue-600 to-blue-800",
        };
      case "settings":
        return {
          title: "Settings",
          subtitle: "Manage your account preferences",
          icon: <FiSettings className="h-6 w-6 text-gray-100" />,
          color: "from-gray-600 to-gray-800",
        };
      case "admin":
        return {
          title: "Admin Panel",
          subtitle: "User management",
          icon: <FiShield className="h-6 w-6 text-gray-100" />,
          color: "from-purple-600 to-purple-800",
        };
      default:
        return {
          title: "Dashboard",
          subtitle: "Welcome to your dashboard",
          icon: <FiHome className="h-6 w-6 text-gray-100" />,
          color: "from-blue-600 to-blue-800",
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className={`bg-linear-to-r ${headerInfo.color} p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            {headerInfo.icon}
          </div>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-white"
            >
              {headerInfo.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-200 text-sm"
            >
              {headerInfo.subtitle}
            </motion.p>
          </div>
        </div>

        {/* User Status Badge */}
        <div className="flex flex-col items-end">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              user?.userType === "admin"
                ? "bg-purple-100 text-purple-800"
                : user?.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {user?.userType === "admin" ? "ADMIN" : "USER"}
          </div>
          <p className="text-xs text-gray-200 mt-1">{user?.email}</p>
        </div>
      </div>
    </div>
  );
};

export default Header;
