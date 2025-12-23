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
} from "react-icons/fi";

const AddOfficer = () => {
  const BASE_URL = import.meta.env.VITE_API_URL;
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      status: "active",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${BASE_URL}/officers/add`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Officer added successfully!");
      setShowSuccess(true);
      reset();

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to add officer";
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
              Add a new officer to the appointment system
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
                Fill in the officer details below
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
                  pattern: {
                    value: /^[0-9+\-\s]+$/,
                    message: "Invalid phone number format",
                  },
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-300">
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
              className="ml-4 px-6 py-3 text-gray-700 font-semibold border-2 border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-all duration-300"
            >
              Clear Form
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddOfficer;
