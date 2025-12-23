/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  UserPlusIcon,
  KeyIcon,
  EnvelopeIcon,
  UserIcon,
  CheckIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../hooks/useAuth";

const Register = () => {
  const BASE_URL = import.meta.env.VITE_API_URL;
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  // Watch password and confirmPassword for real-time validation
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const onSubmit = async (data) => {
    setIsLoading(true);
    const loadingToast = toast.loading("Creating your account...");

    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      toast.dismiss(loadingToast);

      // Check if user is admin (first user)
      const isAdmin = response.data.userType === "admin";

      if (isAdmin) {
        // Admin user created
        toast.success(
          <div className="flex items-center space-x-2">
            <span>Welcome Admin! Account created successfully.</span>
          </div>,
          { duration: 4000, position: "top-center" }
        );
      } else {
        // Regular user created
        toast.success(
          <div className="flex items-center space-x-2">
            <span>Account created successfully!</span>
          </div>,
          {
            duration: 3000,
            position: "top-center",
          }
        );
      }

      // Always redirect to login page
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      toast.dismiss(loadingToast);

      const errorMessage =
        error.response?.data?.error || "Failed to register. Please try again.";

      toast.error(
        <div className="flex items-center space-x-2">
          <span>{errorMessage}</span>
        </div>,
        {
          duration: 4000,
        }
      );

      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigate("/login");
    toast(
      <div className="flex items-center space-x-2">
        <ArrowRightIcon className="h-5 w-5 text-blue-500" />
        <span>Welcome back! Please sign in.</span>
      </div>,
      {
        duration: 3000,
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-linear-to-br from-gray-50 to-white rounded-full mix-blend-multiply opacity-70 blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-linear-to-tr from-gray-50 to-white rounded-full mix-blend-multiply opacity-70 blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-linear-to-r from-gray-50 to-white rounded-full mix-blend-multiply opacity-50 blur-xl animate-pulse delay-500"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-black mb-3 tracking-tight">
              Create Account
            </h1>
          </motion.div>
          <p className="text-gray-600 text-sm tracking-wide">
            Join our platform today
          </p>
        </motion.div>

        <motion.div
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-8 backdrop-blur-sm bg-opacity-95"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <motion.div
              key="name-field"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <UserIcon className="h-5 w-5 text-gray-400 transition-colors duration-200" />
                </div>
                <input
                  id="name"
                  type="text"
                  {...register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 3,
                      message: "Name must be at least 3 characters",
                    },
                  })}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50/50 border-2 ${
                    errors.name
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-black"
                  } rounded-xl focus:outline-none focus:ring-0 transition-all duration-300 placeholder-gray-400 text-black`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-500 font-medium"
                >
                  {errors.name.message}
                </motion.p>
              )}
            </motion.div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 transition-colors duration-200" />
                </div>
                <input
                  id="email"
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50/50 border-2 ${
                    errors.email
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-black"
                  } rounded-xl focus:outline-none focus:ring-0 transition-all duration-300 placeholder-gray-400 text-black`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-500 font-medium"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <KeyIcon className="h-5 w-5 text-gray-400 transition-colors duration-200" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters",
                    },
                  })}
                  className={`w-full pl-12 pr-12 py-3 bg-gray-50/50 border-2 ${
                    errors.password
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-black"
                  } rounded-xl focus:outline-none focus:ring-0 transition-all duration-300 placeholder-gray-400 text-black`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-500 font-medium"
                >
                  {errors.password.message}
                </motion.p>
              )}

              {/* Enhanced Password Strength Indicator */}
              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">
                      Password Strength
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        password.length < 4
                          ? "text-red-500"
                          : password.length < 8
                          ? "text-amber-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {password.length < 4
                        ? "WEAK"
                        : password.length < 8
                        ? "GOOD"
                        : "STRONG"}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          password.length >= level * 2
                            ? level <= 1
                              ? "bg-red-400"
                              : level <= 2
                              ? "bg-amber-400"
                              : level <= 3
                              ? "bg-emerald-400"
                              : "bg-emerald-500"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            <motion.div
              key="confirm-password"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: (value) => {
                      if (!password) {
                        return "Please fill in the password first";
                      }
                      return value === password || "Passwords don't match";
                    },
                  })}
                  className={`w-full pl-4 pr-12 py-3 bg-gray-50/50 border-2 ${
                    errors.confirmPassword
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-black"
                  } rounded-xl focus:outline-none focus:ring-0 transition-all duration-300 placeholder-gray-400 text-black`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-500 font-medium"
                >
                  {errors.confirmPassword.message}
                </motion.p>
              )}

              {/* Animated password match indicator */}
              {password && confirmPassword && !errors.confirmPassword && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mt-2 flex items-center space-x-2"
                >
                  <div className="h-5 w-5 bg-emerald-100 rounded-full flex items-center justify-center">
                    <CheckIcon className="h-3 w-3 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-emerald-600">
                    Passwords match
                  </span>
                </motion.div>
              )}
            </motion.div>

            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 border-2 border-black rounded-xl shadow-lg text-sm font-semibold text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
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
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <UserPlusIcon className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                    </>
                  )}
                </span>
              </button>
            </motion.div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Already have an account?
                </span>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6"
            >
              <button
                onClick={goToLogin}
                type="button"
                className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl text-sm font-semibold text-black bg-white hover:bg-gray-50 hover:border-black focus:outline-none transition-all duration-300 group"
              >
                <span className="flex items-center justify-center">
                  Sign In Instead
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;
