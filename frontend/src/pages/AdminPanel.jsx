/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  UserMinusIcon,
  LockClosedIcon,
  LockOpenIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

const AdminPanel = () => {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUser, setUpdatingUser] = useState(null);

  useEffect(() => {
    if (user?.userType === "super_admin" || user?.userType === "admin") {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const usersResponse = await axios.get(
        "https://api.appoinment.arbeitonline.top/api/auth/admin/all-users",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAllUsers(usersResponse.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      setUpdatingUser(userId);
      const token = localStorage.getItem("token");

      await axios.put(
        `https://api.appoinment.arbeitonline.top/api/auth/admin/update-role/${userId}`,
        { userType: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`User role updated to ${newRole}`);

      // Update local state
      setAllUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === userId ? { ...u, userType: newRole } : u
        )
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to update user role";
      toast.error(errorMessage);
    } finally {
      setUpdatingUser(null);
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    try {
      setUpdatingUser(userId);
      const token = localStorage.getItem("token");

      await axios.put(
        `https://api.appoinment.arbeitonline.top/api/auth/admin/update-status/${userId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`User status updated to ${newStatus}`);

      // Update local state
      setAllUsers((prevUsers) =>
        prevUsers.map((u) =>
          u._id === userId ? { ...u, status: newStatus } : u
        )
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to update user status";
      toast.error(errorMessage);
    } finally {
      setUpdatingUser(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        <p className="mt-4 text-gray-600">Loading admin panel...</p>
      </div>
    );
  }

  if (!user || (user.userType !== "super_admin" && user.userType !== "admin")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-100 p-4">
        <ShieldCheckIcon className="h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 text-center">
          Access Denied
        </h3>
        <p className="text-gray-600 mt-1 text-center">Admin access required</p>
      </div>
    );
  }

  // Filter users: Exclude current user (self) from display
  const filteredUsers = allUsers.filter((u) => u._id !== user._id);

  // For super admin: see all users except himself
  // For regular admin: only see non-admin, non-super_admin users
  const displayUsers = filteredUsers.filter((u) => {
    if (user.userType === "super_admin") {
      return true; // Super admin sees all users except himself
    }
    // Regular admin only sees non-admin users
    return u.userType !== "admin" && u.userType !== "super_admin";
  });

  // Calculate statistics (excluding current user)
  const totalUsers = displayUsers.length;
  const activeUsers = displayUsers.filter((u) => u.status === "active").length;
  const inactiveUsers = displayUsers.filter(
    (u) => u.status === "inactive"
  ).length;

  // Count admins (excluding current super admin)
  const adminUsers = allUsers.filter(
    (u) => u.userType === "admin" && u._id !== user._id
  ).length;

  // Count super admins (excluding current user)
  const superAdminUsers = allUsers.filter(
    (u) => u.userType === "super_admin" && u._id !== user._id
  ).length;

  const getRoleColor = (userType) => {
    switch (userType) {
      case "super_admin":
        return "bg-gradient-to-r from-red-100 to-orange-100 text-red-800 border-red-200";
      case "admin":
        return "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border-purple-200";
      default:
        return "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200";
    }
  };

  const getStatusColor = (status) => {
    return status === "active"
      ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200"
      : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200";
  };

  const getRoleIcon = (userType) => {
    switch (userType) {
      case "super_admin":
        return <AcademicCapIcon className="h-4 w-4 mr-1" />;
      case "admin":
        return <ShieldCheckIcon className="h-4 w-4 mr-1" />;
      default:
        return <UserGroupIcon className="h-4 w-4 mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-purple-900 via-purple-800 to-purple-900 rounded-xl p-6 md:p-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <ShieldCheckIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {user.userType === "super_admin" ? "Super Admin" : "Admin"} Panel
            </h2>
            <p className="text-gray-300">
              {user.userType === "super_admin"
                ? "Manage all users and administrators"
                : "Manage user accounts and monitor activities"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-linear-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalUsers}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-linear-to-brrom-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {activeUsers}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-linear-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Inactive Users
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {inactiveUsers}
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {user.userType === "super_admin" && (
          <div className="bg-linear-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Admins</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {adminUsers}
                </p>
                {superAdminUsers > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    +{superAdminUsers} super admin
                    {superAdminUsers !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              User Management
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-600">
                {user.userType === "super_admin"
                  ? "Manage all users including administrators"
                  : "Manage user accounts"}
              </p>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                {displayUsers.length} user{displayUsers.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAdminData}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Current User Info Card */}
        <div className="mb-6 p-4 bg-linear-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-linear-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <span className="font-bold text-white">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.userType === "super_admin"
                        ? "bg-red-100 text-red-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {getRoleIcon(user.userType)}
                    {user.userType === "super_admin" ? "Super Admin" : "Admin"}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">You are viewing</p>
              <p className="font-medium">
                {displayUsers.length} other user
                {displayUsers.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  User
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Joined
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Last Login
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayUsers.map((u) => {
                const isCurrentUser = u._id === user._id;
                const canModifyRole =
                  user.userType === "super_admin" &&
                  !isCurrentUser &&
                  u.userType !== "super_admin";
                const canModifyStatus =
                  user.userType === "super_admin" ||
                  (user.userType === "admin" &&
                    u.userType !== "admin" &&
                    u.userType !== "super_admin");

                return (
                  <tr
                    key={u._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            u.userType === "super_admin"
                              ? "bg-linear-to-r from-red-100 to-orange-100"
                              : u.userType === "admin"
                              ? "bg-linear-to-r from-purple-100 to-indigo-100"
                              : "bg-linear-to-r from-blue-100 to-cyan-100"
                          }`}
                        >
                          <span
                            className={`font-bold ${
                              u.userType === "super_admin"
                                ? "text-red-600"
                                : u.userType === "admin"
                                ? "text-purple-600"
                                : "text-blue-600"
                            }`}
                          >
                            {u.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getRoleColor(
                          u.userType
                        )}`}
                      >
                        {getRoleIcon(u.userType)}
                        {u.userType === "super_admin"
                          ? "Super Admin"
                          : u.userType === "admin"
                          ? "Admin"
                          : "User"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                          u.status
                        )}`}
                      >
                        {u.status === "active" ? (
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <ClockIcon className="h-3 w-3 mr-1" />
                        )}
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        {/* Role Actions - Super Admin Only */}
                        {canModifyRole && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              updateUserRole(
                                u._id,
                                u.userType === "admin" ? "user" : "admin"
                              )
                            }
                            disabled={updatingUser === u._id}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center ${
                              u.userType === "admin"
                                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                            }`}
                            title={
                              u.userType === "admin"
                                ? "Remove Admin Role"
                                : "Make Admin"
                            }
                          >
                            {updatingUser === u._id ? (
                              <div className="w-4 h-4 border-b-2 border-current rounded-full animate-spin" />
                            ) : u.userType === "admin" ? (
                              <>
                                <UserMinusIcon className="h-3 w-3 mr-1" />
                                Demote
                              </>
                            ) : (
                              <>
                                <UserPlusIcon className="h-3 w-3 mr-1" />
                                Promote
                              </>
                            )}
                          </motion.button>
                        )}

                        {/* Status Actions */}
                        {canModifyStatus && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              updateUserStatus(
                                u._id,
                                u.status === "active" ? "inactive" : "active"
                              )
                            }
                            disabled={updatingUser === u._id}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center ${
                              u.status === "active"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                                : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            }`}
                            title={
                              u.status === "active"
                                ? "Deactivate User"
                                : "Activate User"
                            }
                          >
                            {updatingUser === u._id ? (
                              <div className="w-4 h-4 border-b-2 border-current rounded-full animate-spin" />
                            ) : u.status === "active" ? (
                              <>
                                <LockClosedIcon className="h-3 w-3 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <LockOpenIcon className="h-3 w-3 mr-1" />
                                Activate
                              </>
                            )}
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {displayUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No other users found</p>
            </div>
          ) : (
            displayUsers.map((u) => {
              const isCurrentUser = u._id === user._id;
              const canModifyRole =
                user.userType === "super_admin" &&
                !isCurrentUser &&
                u.userType !== "super_admin";
              const canModifyStatus =
                user.userType === "super_admin" ||
                (user.userType === "admin" &&
                  u.userType !== "admin" &&
                  u.userType !== "super_admin");

              return (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-linear-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          u.userType === "super_admin"
                            ? "bg-linear-to-r from-red-100 to-orange-100"
                            : u.userType === "admin"
                            ? "bg-linear-to-r from-purple-100 to-indigo-100"
                            : "bg-linear-to-r from-blue-100 to-cyan-100"
                        }`}
                      >
                        <span
                          className={`font-bold ${
                            u.userType === "super_admin"
                              ? "text-red-600"
                              : u.userType === "admin"
                              ? "text-purple-600"
                              : "text-blue-600"
                          }`}
                        >
                          {u.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleColor(
                          u.userType
                        )}`}
                      >
                        {getRoleIcon(u.userType)}
                        {u.userType === "super_admin"
                          ? "Super Admin"
                          : u.userType === "admin"
                          ? "Admin"
                          : "User"}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          u.status
                        )}`}
                      >
                        {u.status === "active" ? (
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <ClockIcon className="h-3 w-3 mr-1" />
                        )}
                        {u.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-500 text-xs font-medium">
                        Joined
                      </p>
                      <p className="font-medium">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium">
                        Last Login
                      </p>
                      <p className="font-medium">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                  </div>

                  {(canModifyRole || canModifyStatus) && (
                    <div className="flex space-x-2 pt-3 border-t border-gray-200">
                      {/* Role Actions */}
                      {canModifyRole && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            updateUserRole(
                              u._id,
                              u.userType === "admin" ? "user" : "admin"
                            )
                          }
                          disabled={updatingUser === u._id}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center ${
                            u.userType === "admin"
                              ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                          }`}
                        >
                          {updatingUser === u._id
                            ? "Processing..."
                            : u.userType === "admin"
                            ? "Remove Admin"
                            : "Make Admin"}
                        </motion.button>
                      )}

                      {/* Status Actions */}
                      {canModifyStatus && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            updateUserStatus(
                              u._id,
                              u.status === "active" ? "inactive" : "active"
                            )
                          }
                          disabled={updatingUser === u._id}
                          className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center justify-center ${
                            u.status === "active"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                              : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                          }`}
                        >
                          {updatingUser === u._id
                            ? "Processing..."
                            : u.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </motion.button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Empty State */}
        {displayUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <UserGroupIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No other users
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {user.userType === "super_admin"
                ? "You are the only user in the system. Register new users to see them here."
                : "No users are currently registered in the system."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
