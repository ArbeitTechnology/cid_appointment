/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiCamera,
  FiCheck,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import Webcam from "react-webcam";

const AddVisitor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [photo, setPhoto] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [officerSearch, setOfficerSearch] = useState("");
  const [officerResults, setOfficerResults] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [showOfficerDropdown, setShowOfficerDropdown] = useState(false);
  const [phoneSuggestions, setPhoneSuggestions] = useState([]);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const webcamRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    clearErrors,
  } = useForm();

  const phoneValue = watch("phone");

  // Search officers
  useEffect(() => {
    const searchOfficers = async () => {
      if (officerSearch.length < 2) {
        setOfficerResults([]);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5000/api/officers/search",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: { query: officerSearch },
          }
        );

        setOfficerResults(response.data.officers || []);
      } catch (error) {
        console.error("Error searching officers:", error);
      }
    };

    const timer = setTimeout(() => {
      searchOfficers();
    }, 300);

    return () => clearTimeout(timer);
  }, [officerSearch]);

  // Check phone number
  useEffect(() => {
    const checkPhoneNumber = async () => {
      if (phoneValue && phoneValue.length >= 10) {
        setPhoneChecking(true);
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `http://localhost:5000/api/visitors/check-phone/${phoneValue}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          console.log("Phone check response:", response.data);

          if (
            response.data.exists &&
            response.data.visitors &&
            response.data.visitors.length > 0
          ) {
            // Now response.data.visitors is an array of objects with address
            setPhoneSuggestions(response.data.visitors);
            setShowPhoneSuggestions(true);
          } else {
            setPhoneSuggestions([]);
            setShowPhoneSuggestions(false);
          }
        } catch (error) {
          console.error("Error checking phone number:", error);
          setPhoneSuggestions([]);
          setShowPhoneSuggestions(false);
        } finally {
          setPhoneChecking(false);
        }
      } else {
        setPhoneSuggestions([]);
        setShowPhoneSuggestions(false);
        setPhoneChecking(false);
      }
    };

    const timer = setTimeout(() => {
      checkPhoneNumber();
    }, 800);

    return () => clearTimeout(timer);
  }, [phoneValue]);

  // Capture photo from webcam
  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setPhoto(imageSrc);
      setShowCamera(false);
      toast.success("Photo captured successfully!");
    }
  };

  // Select officer from search results
  const selectOfficer = (officer) => {
    setSelectedOfficer(officer);
    setOfficerSearch(`${officer.name} - ${officer.designation}`);
    setShowOfficerDropdown(false);
    setOfficerResults([]);
  };

  // Select phone suggestion
  const selectPhoneSuggestion = (visitor) => {
    setValue("name", visitor.name);
    setValue("address", visitor.address || "");
    setShowPhoneSuggestions(false);

    // Clear any existing name/address errors since we're auto-filling
    clearErrors("name");
    clearErrors("address");

    toast.success("Visitor details auto-filled from previous visit!");
  };

  const onSubmit = async (data) => {
    if (!selectedOfficer) {
      toast.error("Please select an officer");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/visitors/add",
        {
          ...data,
          officerId: selectedOfficer._id,
          photo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Visitor added successfully!");
      setShowSuccess(true);

      // Reset form
      reset();
      setPhoto("");
      setSelectedOfficer(null);
      setOfficerSearch("");
      setPhoneSuggestions([]);
      setShowPhoneSuggestions(false);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to add visitor";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-green-600 to-green-800 rounded-xl p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <FiUser className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Add New Visitor</h2>
            <p className="text-gray-200">Register a new visitor appointment</p>
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
                Visitor added successfully!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                The visitor has been registered in the system.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Photo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Visitor Photo
            </h3>

            {showCamera ? (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border-2 border-gray-300">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Capture
                  </button>
                  <button
                    onClick={() => setShowCamera(false)}
                    className="px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : photo ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={photo}
                    alt="Visitor"
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                  />
                  <button
                    onClick={() => setPhoto("")}
                    className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <button
                  onClick={() => setShowCamera(true)}
                  className="w-full px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Retake Photo
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center">
                    <FiCamera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No photo captured</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCamera(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FiCamera className="h-5 w-5 mr-2" />
                  Capture Photo
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column - Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Visitor Information
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Phone Number with Suggestions */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <span className="flex items-center">
                    <FiPhone className="w-4 h-4 mr-2 text-gray-600" />
                    Mobile Number *
                    {phoneChecking && (
                      <span className="ml-2 text-xs text-blue-600">
                        Checking...
                      </span>
                    )}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    {...register("phone", {
                      required: "Mobile number is required",
                      pattern: {
                        value: /^[0-9+\-\s]+$/,
                        message: "Invalid phone number format",
                      },
                      minLength: {
                        value: 10,
                        message: "Phone number must be at least 10 digits",
                      },
                    })}
                    className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                      errors.phone
                        ? "border-red-500 focus:border-red-600"
                        : "border-gray-300 focus:border-green-600"
                    }`}
                    placeholder="+1234567890"
                  />
                  {phoneChecking && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="w-4 h-4 mr-1" />
                    {errors.phone.message}
                  </p>
                )}

                {/* Phone Suggestions */}
                <AnimatePresence>
                  {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                    >
                      <div className="px-4 py-2 bg-green-50 border-b border-green-100">
                        <p className="text-xs font-medium text-green-700 flex items-center">
                          <FiCheck className="w-3 h-3 mr-1" />
                          Found {phoneSuggestions.length} previous visit(s) with
                          this number
                        </p>
                      </div>
                      {phoneSuggestions.map((visitor, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectPhoneSuggestion(visitor)}
                          className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-gray-100 last:border-b-0 transition-colors group"
                        >
                          <div className="font-medium text-gray-900 group-hover:text-green-700">
                            {visitor.name}
                          </div>
                          <div className="text-sm text-gray-500 group-hover:text-green-600 truncate">
                            {visitor.address}
                          </div>
                        </button>
                      ))}
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Click to auto-fill visitor details
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Phone Check Status */}
                {phoneValue &&
                  phoneValue.length >= 10 &&
                  !phoneChecking &&
                  phoneSuggestions.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="mt-2 text-sm text-gray-500 flex items-center"
                    >
                      <FiAlertCircle className="w-4 h-4 mr-1" />
                      No previous visits found with this number
                    </motion.div>
                  )}
              </div>

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
                      : "border-gray-300 focus:border-green-600"
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="w-4 h-4 mr-1" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <span className="flex items-center">
                    <FiMapPin className="w-4 h-4 mr-2 text-gray-600" />
                    Address *
                  </span>
                </label>
                <textarea
                  {...register("address", {
                    required: "Address is required",
                  })}
                  rows={3}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                    errors.address
                      ? "border-red-500 focus:border-red-600"
                      : "border-gray-300 focus:border-green-600"
                  }`}
                  placeholder="123 Main St, City, Country"
                />
                {errors.address && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="w-4 h-4 mr-1" />
                    {errors.address.message}
                  </p>
                )}
              </div>

              {/* Officer Search */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <span className="flex items-center">
                    <FiBriefcase className="w-4 h-4 mr-2 text-gray-600" />
                    Officer Reference *
                  </span>
                </label>
                <input
                  type="text"
                  value={officerSearch}
                  onChange={(e) => {
                    setOfficerSearch(e.target.value);
                    setShowOfficerDropdown(true);
                  }}
                  onFocus={() => setShowOfficerDropdown(true)}
                  onBlur={() =>
                    setTimeout(() => setShowOfficerDropdown(false), 200)
                  }
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-green-600 transition-all duration-300"
                  placeholder="Search officer by name, designation, or department..."
                />

                {selectedOfficer && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-900">
                          {selectedOfficer.name}
                        </div>
                        <div className="text-sm text-green-700">
                          {selectedOfficer.designation} •{" "}
                          {selectedOfficer.department}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          BP: {selectedOfficer.bpNumber} • Phone:{" "}
                          {selectedOfficer.phone}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOfficer(null);
                          setOfficerSearch("");
                        }}
                        className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Officer Search Results */}
                <AnimatePresence>
                  {showOfficerDropdown && officerResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                    >
                      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                        <p className="text-xs font-medium text-blue-700">
                          Found {officerResults.length} officer(s)
                        </p>
                      </div>
                      {officerResults.map((officer) => (
                        <button
                          key={officer._id}
                          type="button"
                          onClick={() => selectOfficer(officer)}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors group"
                        >
                          <div className="font-medium text-gray-900 group-hover:text-blue-700">
                            {officer.name}
                          </div>
                          <div className="text-sm text-gray-500 group-hover:text-blue-600">
                            {officer.designation} • {officer.department}
                          </div>
                          <div className="text-xs text-gray-400 group-hover:text-blue-500 mt-1">
                            BP: {officer.bpNumber} • Phone: {officer.phone}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {showOfficerDropdown &&
                  officerSearch.length >= 2 &&
                  officerResults.length === 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                      <p className="text-sm text-gray-500 text-center">
                        No officers found matching "{officerSearch}"
                      </p>
                    </div>
                  )}
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Purpose *
                </label>
                <select
                  {...register("purpose", {
                    required: "Purpose is required",
                  })}
                  className={`w-full px-4 py-3 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                    errors.purpose
                      ? "border-red-500 focus:border-red-600"
                      : "border-gray-300 focus:border-green-600"
                  }`}
                >
                  <option value="">Select purpose</option>
                  <option value="case">Case</option>
                  <option value="personal">Personal</option>
                </select>
                {errors.purpose && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="w-4 h-4 mr-1" />
                    {errors.purpose.message}
                  </p>
                )}
              </div>

              <div className="pt-6 border-t border-gray-300">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || !selectedOfficer}
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline"
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
                      Adding Visitor...
                    </>
                  ) : (
                    "Add Visitor"
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddVisitor;
