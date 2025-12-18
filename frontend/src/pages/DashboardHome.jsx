/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";

import {
  UserGroupIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

const DashboardHome = ({ user }) => {
  const { isAdmin, getAllUsers, user: currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalAdmins: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      (currentUser?.userType === "admin" ||
        currentUser?.userType === "super_admin") &&
      user
    ) {
      fetchAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.userType, user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const result = await getAllUsers();
      if (result.success) {
        const users = result.data;

        // For super admin: show all non-super_admin users
        // For regular admin: show only regular users
        let filteredUsers = users;
        if (currentUser?.userType === "admin") {
          filteredUsers = users.filter(
            (u) => u.userType !== "admin" && u.userType !== "super_admin"
          );
        } else if (currentUser?.userType === "super_admin") {
          filteredUsers = users.filter((u) => u.userType !== "super_admin");
        }

        const admins = users.filter((u) => u.userType === "admin");

        setStats({
          totalUsers: filteredUsers.length,
          activeUsers: filteredUsers.filter((u) => u.status === "active")
            .length,
          inactiveUsers: filteredUsers.filter((u) => u.status === "inactive")
            .length,
          totalAdmins: admins.length,
        });
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeDisplay = () => {
    if (user?.userType === "super_admin") return "Super Admin";
    if (user?.userType === "admin") return "Admin";
    return "User";
  };

  if (user?.userType === "super_admin" || user?.userType === "admin") {
    return (
      <div className="space-y-6">
        <div className="bg-linear-to-r from-purple-900 to-black rounded-xl p-6 md:p-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Welcome, {getUserTypeDisplay()} {user?.name}
              </h2>
              <p className="text-gray-300">
                {user?.userType === "super_admin"
                  ? "Manage the entire system and all users"
                  : "Manage user accounts and monitor activities"}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalUsers}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Active Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.activeUsers}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    Inactive Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.inactiveUsers}
                  </p>
                </div>
              </div>
            </motion.div>

            {user?.userType === "super_admin" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      Total Admins
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalAdmins}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Regular user dashboard
  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-blue-900 to-black rounded-xl p-6 md:p-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <CheckCircleIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Welcome, {user?.name}
            </h2>
            <p className="text-gray-300">Your account dashboard</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Account Type</p>
              <p className="text-3xl font-bold text-gray-900">User</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              You have a regular user account
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Account Status
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {user?.status === "active" ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              {user?.status === "active"
                ? "Your account is active and ready to use"
                : "Your account is currently inactive"}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardHome;
