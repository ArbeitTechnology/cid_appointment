/* eslint-disable no-unused-vars */
// client/src/pages/ForgotPassword.jsx
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await axios.post(
        "https://api.appoinment.arbeitonline.top/api/auth/forgot-password",
        data
      );
      setEmailSent(true);
      toast.success("Password reset link sent to your email!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gradient-to-br from-gray-50 to-white rounded-full mix-blend-multiply opacity-70 blur-xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-gradient-to-tl from-gray-50 to-white rounded-full mix-blend-multiply opacity-70 blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-gray-50 to-white rounded-full mix-blend-multiply opacity-50 blur-xl animate-pulse delay-500"></div>
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
            className="flex justify-center mb-4"
          >
            {emailSent ? (
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-100">
                <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center border-2 border-gray-100">
                <KeyIcon className="h-10 w-10 text-gray-600" />
              </div>
            )}
          </motion.div>
          <h1 className="text-4xl font-bold text-black mb-3 tracking-tight">
            {emailSent ? "Check Your Email" : "Reset Your Password"}
          </h1>
          <p className="text-gray-600 text-sm tracking-wide max-w-xs mx-auto">
            {emailSent
              ? "We've sent a password reset link to your email address. Please check your inbox."
              : "Enter your email address and we'll send you a link to reset your password."}
          </p>
        </motion.div>

        {!emailSent ? (
          <motion.div
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-8 backdrop-blur-sm bg-opacity-95"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                        Processing...
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <PaperAirplaneIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200" />
                      </>
                    )}
                  </span>
                </button>
              </motion.div>
            </form>

            <div className="mt-4 pt-2 border-t border-gray-100 flex justify-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-black transition-colors duration-200 group"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to login
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 p-8 backdrop-blur-sm bg-opacity-95"
          >
            <div className="text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 border-2 border-emerald-100"
              >
                <PaperAirplaneIcon className="h-10 w-10 text-emerald-600" />
              </motion.div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-black">
                  Email Sent Successfully!
                </h3>
                <p className="text-sm text-gray-600">
                  If you don't see the email in your inbox, please check your
                  spam folder.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="pt-4"
              >
                <Link
                  to="/login"
                  className="inline-flex items-center px-6 py-3 border-2 border-black rounded-xl text-sm font-semibold text-black bg-white hover:bg-gray-50 focus:outline-none transition-all duration-300 group"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                  Return to Login
                </Link>
              </motion.div>

              <div className="pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Didn't receive the email?{" "}
                  <button
                    onClick={() => setEmailSent(false)}
                    className="font-medium text-black hover:underline cursor-pointer"
                  >
                    Try again
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Custom Key Icon component since it's not imported from heroicons
const KeyIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
    />
  </svg>
);

export default ForgotPassword;
