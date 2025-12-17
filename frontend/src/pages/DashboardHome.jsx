/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";

import {
  UserGroupIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const DashboardHome = ({ user }) => {
  const { isAdmin, getAllUsers } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin && user) {
      fetchAdminData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const result = await getAllUsers();
      if (result.success) {
        const users = result.data;
        const nonAdminUsers = users.filter((u) => u.userType !== "admin");

        setStats({
          totalUsers: nonAdminUsers.length,
          activeUsers: nonAdminUsers.filter((u) => u.status === "active")
            .length,
          inactiveUsers: nonAdminUsers.filter((u) => u.status === "inactive")
            .length,
        });
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-linear-to-r from-purple-900 to-black rounded-xl p-6 md:p-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Welcome, Admin</h2>
              <p className="text-gray-300">
                Manage the system and monitor user activities
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
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
