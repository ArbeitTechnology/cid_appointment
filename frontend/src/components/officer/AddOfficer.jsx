/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FiUser,
  FiPhone,
  FiBriefcase,
  FiHash,
  FiCheck,
  FiX,
  FiHome,
  FiGrid,
  FiLock,
  FiShield,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiUsers,
  FiAlertTriangle,
  FiInfo,
} from "react-icons/fi";

const AddOfficer = () => {
  const BASE_URL = import.meta.env.VITE_API_URL;
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      status: "inactive",
      isAlsoAdmin: false,
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Prepare the officer data - ensure field names match backend
      const officerData = {
        name: data.name,
        phone: data.phone,
        password: data.password,
        designation: data.designation,
        department: data.department,
        unit: data.unit || "", // Optional field
        bpNumber: data.bpNumber,
        status: data.status,
        isAdmin: data.isAlsoAdmin, // Note: backend expects "isAdmin" not "isAlsoAdmin"
      };

      console.log("Submitting officer data:", officerData);

      const response = await axios.post(
        `${BASE_URL}/officers/add`,
        officerData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Officer added successfully!");
      setShowSuccess(true);
      reset();

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error(
        "Error adding officer:",
        error.response?.data || error.message
      );

      // Handle different error responses
      let errorMessage = "Failed to add officer";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message.includes("Network Error")) {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.response?.status === 401) {
        errorMessage = "Unauthorized. Please login again.";
        // Optionally redirect to login
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else if (error.response?.status === 403) {
        errorMessage = "Permission denied. Admin access required.";
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-blue-600 to-blue-800 rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <FiUser className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Add New Officer</h2>
            <p className="text-gray-200">
              Add a new officer to the appointment system. Officers login with
              phone number and password.
            </p>
          </div>
        </div>
      </div>

      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4"
        >
          <div className="flex items-center">
            <div className="shrink-0">
              <FiCheck className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Officer added successfully!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                The officer has been added to the system. You can add another
                officer or view the officer list.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setShowSuccess(false)}
                  className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-300"
      >
        <div className="px-8 py-6 border-b border-gray-300 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-600">
              <FiUser className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Officer Information
              </h3>
              <p className="text-sm text-gray-600">
                Fill in the officer details below. Officers login with phone
                number and password.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <span className="flex items-center">
                  <FiUser className="w-4 h-4 mr-2 text-gray-600" />
                  Full Name *
                </span>
              </label>
              <input
                type="text"
                {...register("name", {
                  required: "Name is required",
                  minLength: {
                    value: 3,
                    message: "Name must be at least 3 characters",
                  },
                })}
                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                  errors.name
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-300 focus:border-blue-600"
                }`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <span className="flex items-center">
                  <FiPhone className="w-4 h-4 mr-2 text-gray-600" />
                  Phone Number *
                </span>
              </label>
              <input
                type="tel"
                {...register("phone", {
                  required: "Phone number is required",
                })}
                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                  errors.phone
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-300 focus:border-blue-600"
                }`}
                placeholder="+1234567890"
              />
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.phone.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                This will be used for login. Include country code (e.g., +1 for
                US)
              </p>
            </div>

            {/* Password with visibility toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <span className="flex items-center">
                  <FiLock className="w-4 h-4 mr-2 text-gray-600" />
                  Password *
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                    pattern: {
                      value: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
                      message:
                        "Password must contain at least one letter and one number",
                    },
                  })}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                    errors.password
                      ? "border-red-500 focus:border-red-600"
                      : "border-gray-300 focus:border-blue-600"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <FiEyeOff className="w-5 h-5" />
                  ) : (
                    <FiEye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Minimum 8 characters with letters and numbers
              </p>
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <span className="flex items-center">
                  <FiBriefcase className="w-4 h-4 mr-2 text-gray-600" />
                  Designation *
                </span>
              </label>
              <input
                type="text"
                {...register("designation", {
                  required: "Designation is required",
                })}
                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                  errors.designation
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-300 focus:border-blue-600"
                }`}
                placeholder="Senior Officer"
              />
              {errors.designation && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.designation.message}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <span className="flex items-center">
                  <FiHome className="w-4 h-4 mr-2 text-gray-600" />
                  Department *
                </span>
              </label>
              <input
                type="text"
                {...register("department", {
                  required: "Department is required",
                })}
                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                  errors.department
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-300 focus:border-blue-600"
                }`}
                placeholder="IT Department"
              />
              {errors.department && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.department.message}
                </p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <span className="flex items-center">
                  <FiGrid className="w-4 h-4 mr-2 text-gray-600" />
                  Unit (Optional)
                </span>
              </label>
              <input
                type="text"
                {...register("unit")}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-blue-600 transition-all duration-300"
                placeholder="Development Unit"
              />
            </div>

            {/* BP Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                <span className="flex items-center">
                  <FiHash className="w-4 h-4 mr-2 text-gray-600" />
                  BP Number *
                </span>
              </label>
              <input
                type="text"
                {...register("bpNumber", {
                  required: "BP Number is required",
                })}
                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                  errors.bpNumber
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-300 focus:border-blue-600"
                }`}
                placeholder="BP-12345"
              />
              {errors.bpNumber && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.bpNumber.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Status *
              </label>
              <select
                {...register("status", {
                  required: "Status is required",
                })}
                className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                  errors.status
                    ? "border-red-500 focus:border-red-600"
                    : "border-gray-300 focus:border-blue-600"
                }`}
              >
                <option value="inactive">Inactive (Cannot login)</option>
                <option value="active">Active</option>
              </select>
              {errors.status && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.status.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Officer must be activated by admin before they can login
              </p>
            </div>

            {/* Admin Role Checkbox - FIXED */}
            <div className="col-span-2">
              <div className="relative overflow-hidden rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200">
                <div className="absolute -right-6 -top-6 opacity-10">
                  <svg
                    className="h-24 w-24 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18L20 6v5.74c0 4.32-2.91 8.53-8 9.8-5.09-1.27-8-5.48-8-9.8V6l8-3.82zM12 7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                  </svg>
                </div>

                <div className="relative">
                  <label className="flex cursor-pointer items-start space-x-4">
                    <div className="flex-1">
                      <div className="mb-3 flex items-center">
                        <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl ">
                          <div className="flex-shrink-0 pt-1">
                            <div className="relative">
                              <input
                                type="checkbox"
                                {...register("isAlsoAdmin")}
                                className="peer sr-only"
                              />
                              <div className="h-6 w-11 rounded-full border-2 border-blue-300 bg-blue-200 shadow-inner transition-colors peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2"></div>
                              <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform peer-checked:translate-x-5"></div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            Grant Admin Access
                          </h3>
                          <p className="text-sm font-medium text-blue-700">
                            Elevate officer to administrator privileges
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-300">
            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Adding Officer...
                  </>
                ) : (
                  <>
                    <FiUser className="w-5 h-5 mr-2" />
                    Add Officer
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center px-6 py-3 text-gray-700 font-semibold border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-300"
              >
                Clear Form
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddOfficer;
