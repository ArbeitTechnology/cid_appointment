/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";
import {
  UserGroupIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserIcon,
  LockClosedIcon,
  BuildingOfficeIcon, // Add this
  PhoneIcon, // Add this
  IdentificationIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";

const DashboardHome = ({ user }) => {
  const { isAdmin, getAllUsers, user: currentUser, token } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalAdmins: 0,
  });
  const [loading, setLoading] = useState(false);
  const [officerProfile, setOfficerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    // If user is officer, fetch full officer profile
    if (currentUser?.userType === "officer" || currentUser?.isOfficer) {
      fetchOfficerProfile();
    }

    // If admin/super_admin, fetch admin data
    if (
      (currentUser?.userType === "admin" ||
        currentUser?.userType === "super_admin") &&
      user
    ) {
      fetchAdminData();
    }
  }, [currentUser, user]);

  const fetchOfficerProfile = async () => {
    try {
      setProfileLoading(true);
      const BASE_URL = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${BASE_URL}/officers/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setOfficerProfile(response.data.officer);

        // Update the current user context with officer details
        if (response.data.officer) {
          const updatedUser = {
            ...currentUser,
            designation: response.data.officer.designation,
            department: response.data.officer.department,
            unit: response.data.officer.unit,
            bpNumber: response.data.officer.bpNumber,
          };
          // You might want to update your auth context here
        }
      }
    } catch (error) {
      console.error("Error fetching officer profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const result = await getAllUsers();
      if (result.success) {
        const users = result.data;

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
    if (user?.userType === "officer") return "Officer";
    return "User";
  };
  const displayUser = officerProfile ? { ...user, ...officerProfile } : user;
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
  if (user?.userType === "officer") {
    if (profileLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-linear-to-r from-blue-900 to-black rounded-xl p-6 md:p-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Welcome, Officer {displayUser?.name}
              </h2>
              <p className="text-gray-300">
                {displayUser?.designation} • {displayUser?.department}
                {displayUser?.unit && ` • ${displayUser.unit}`}
              </p>
              {displayUser?.hasAdminRole && (
                <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  <ShieldCheckIcon className="h-3 w-3 mr-1" />
                  Admin Access Enabled
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Designation Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <IdentificationIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Designation</p>
                <p className="text-xl font-bold text-gray-900 truncate">
                  {displayUser?.designation || "Not Assigned"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Department Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <BuildingOffice2Icon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Department</p>
                <p className="text-xl font-bold text-gray-900 truncate">
                  {displayUser?.department || "Not Assigned"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Unit Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <BuildingOffice2Icon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Unit</p>
                <p className="text-xl font-bold text-gray-900 truncate">
                  {displayUser?.unit || "Not Assigned"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Status</p>
                <p className="text-xl font-bold text-gray-900">
                  {displayUser?.status === "active" ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Officer Information */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Officer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-gray-900">{displayUser?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Phone</p>
                <p className="text-gray-900">{displayUser?.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">BP Number</p>
                <p className="text-gray-900">
                  {displayUser?.bpNumber || "N/A"}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Designation</p>
                <p className="text-gray-900">{displayUser?.designation}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Department</p>
                <p className="text-gray-900">{displayUser?.department}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Unit</p>
                <p className="text-gray-900">{displayUser?.unit || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
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
