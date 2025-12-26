/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../hooks/useAuth";

const Login = () => {
  const BASE_URL = import.meta.env.VITE_API_URL;
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  // Load saved credentials if "Remember Me" was checked
  useEffect(() => {
    const savedIdentifier = localStorage.getItem("rememberedIdentifier");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";

    if (savedRememberMe && savedIdentifier) {
      setRememberMe(true);
      setValue("identifier", savedIdentifier);
    }
  }, [setValue]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    const loadingToast = toast.loading("Signing you in...");

    try {
      // Send identifier (email or phone) instead of just email
      const response = await axios.post(
        `http://localhost:5000/api/auth/login`,
        {
          identifier: data.identifier,
          password: data.password,
        }
      );

      // Save identifier if "Remember Me" is checked
      if (rememberMe) {
        localStorage.setItem("rememberedIdentifier", data.identifier);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberedIdentifier");
        localStorage.removeItem("rememberMe");
      }

      // Use the login function
      login(response.data.user, response.data.token);

      toast.dismiss(loadingToast);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      toast.dismiss(loadingToast);

      // Check for specific error messages
      let errorMessage =
        error.response?.data?.error || "Failed to login. Please try again.";

      // You can customize the toast based on error type
      if (errorMessage.includes("deactivated")) {
        toast.error(
          <div className="flex flex-col space-y-2">
            <span className="font-medium">Account Deactivated</span>
            <span className="text-sm">{errorMessage}</span>
          </div>,
          {
            duration: 5000, // Longer duration for important messages
          }
        );
      } else {
        toast.error(
          <div className="flex items-center space-x-2">
            <span>{errorMessage}</span>
          </div>,
          {
            duration: 4000,
          }
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    navigate("/register");
    toast(
      <div className="flex items-center space-x-2">
        <ArrowRightIcon className="h-5 w-5 text-blue-500" />
        <span>Let's create your account!</span>
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
              Welcome Back
            </h1>
          </motion.div>
          <p className="text-gray-600 text-sm tracking-wide">
            Sign in to continue your journey
          </p>
        </motion.div>

        <motion.div
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-8 backdrop-blur-sm bg-opacity-95"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="identifier"
                className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider"
              >
                Email or Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 transition-colors duration-200" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  {...register("identifier", {
                    required: "Email or phone number is required",
                  })}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50/50 border-2 ${
                    errors.identifier
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 focus:border-black"
                  } rounded-xl focus:outline-none focus:ring-0 transition-all duration-300 placeholder-gray-400 text-black`}
                  placeholder="you@example.com or +1234567890"
                />
              </div>
              {errors.identifier && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-sm text-red-500 font-medium"
                >
                  {errors.identifier.message}
                </motion.p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                For officers: Use your phone number. For users: Use your email.
              </p>
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
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="relative inline-flex items-center focus:outline-none"
                >
                  <div className="w-12 h-6 rounded-full transition-colors duration-300 relative">
                    <div
                      className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                        rememberMe
                          ? "bg-black"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                    <motion.div
                      animate={{
                        x: rememberMe ? 24 : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full shadow-sm ${
                        rememberMe ? "bg-white" : "bg-white"
                      }`}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    Remember me
                  </span>
                </button>
              </div>

              <div>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-gray-600 hover:text-black transition-colors duration-200 border-b border-transparent hover:border-black"
                  onClick={() =>
                    toast.loading("Redirecting to password reset...", {
                      duration: 1000,
                    })
                  }
                >
                  Forgot password?
                </Link>
              </div>
            </div>

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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
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
                  New to us?
                </span>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6"
            >
              <button
                onClick={goToRegister}
                type="button"
                className="w-full py-3 px-4 border-2 border-gray-300 rounded-xl text-sm font-semibold text-black bg-white hover:bg-gray-50 hover:border-black focus:outline-none transition-all duration-300 group"
              >
                <span className="flex items-center justify-center">
                  Create New Account
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

export default Login;
