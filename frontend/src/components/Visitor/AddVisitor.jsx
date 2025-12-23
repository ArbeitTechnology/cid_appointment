/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiEye,
  FiClock,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import Webcam from "react-webcam";
import { format, parseISO } from "date-fns";

const AddVisitor = () => {
  const BASE_URL = import.meta.env.VITE_API_URL;
  // Add Visitor States
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [photo, setPhoto] = useState("");
  const [officerSelectionSearch, setOfficerSelectionSearch] = useState(""); // CHANGED
  const [officerResults, setOfficerResults] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [showOfficerDropdown, setShowOfficerDropdown] = useState(false);
  const [phoneSuggestions, setPhoneSuggestions] = useState([]);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const webcamRef = useRef(null);

  // Visitor List States
  const [visitors, setVisitors] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [officerNameFilter, setOfficerNameFilter] = useState("");
  const [officerDepartmentFilter, setOfficerDepartmentFilter] = useState("");
  const [officerDesignationFilter, setOfficerDesignationFilter] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Add these new states
  const [designationSearch, setDesignationSearch] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [designationFilter, setDesignationFilter] = useState("");
  const [officersByDesignation, setOfficersByDesignation] = useState([]);
  const [uniqueDesignations, setUniqueDesignations] = useState([]);
  const [filteredDesignations, setFilteredDesignations] = useState([]);
  const [filteredOfficers, setFilteredOfficers] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalVisitors, setTotalVisitors] = useState(0);

  const officerInputRef = useRef(null);
  const designationInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    clearErrors,
    trigger,
  } = useForm();

  const phoneValue = watch("phone");

  // Parse comma-separated search terms for visitor list
  const parseSearchTerms = (searchString) => {
    if (!searchString) return [];

    return searchString
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0);
  };

  // Debounce search term for visitor list
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchTerm,
    phoneFilter,
    nameFilter,
    officerNameFilter,
    officerDepartmentFilter,
    officerDesignationFilter,
    purposeFilter,
    statusFilter,
    startTime,
    endTime,
  ]);

  const formatDateTimeForAPI = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    const localTime = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );
    return localTime.toISOString().slice(0, 19);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        officerInputRef.current &&
        !officerInputRef.current.contains(event.target)
      ) {
        setShowOfficerDropdown(false);
      }
      if (
        designationInputRef.current &&
        !designationInputRef.current.contains(event.target)
      ) {
        setShowDesignationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fixed fetchVisitors function
  const fetchVisitors = useCallback(async () => {
    try {
      setListLoading(true);
      const token = localStorage.getItem("token");

      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Always send individual filters
      if (phoneFilter) params.phone = phoneFilter;
      if (nameFilter) params.name = nameFilter;
      if (officerNameFilter) params.officerName = officerNameFilter;
      if (officerDepartmentFilter)
        params.officerDepartment = officerDepartmentFilter;
      if (officerDesignationFilter)
        params.officerDesignation = officerDesignationFilter;
      if (purposeFilter !== "all") params.purpose = purposeFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      if (debouncedSearchTerm) {
        if (debouncedSearchTerm.includes(",")) {
          params.multiSearch = debouncedSearchTerm;
        } else {
          params.search = debouncedSearchTerm;
        }
      }

      if (startTime) params.startTime = formatDateTimeForAPI(startTime);
      if (endTime) params.endTime = formatDateTimeForAPI(endTime);

      const response = await axios.get(`${BASE_URL}/visitors/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setVisitors(response.data.visitors || []);
      setTotalVisitors(response.data.total || 0);

      const totalPages = Math.ceil((response.data.total || 0) / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching visitors:", error);
      toast.error("Failed to fetch visitors");
    } finally {
      setListLoading(false);
    }
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearchTerm,
    phoneFilter,
    nameFilter,
    officerNameFilter,
    officerDepartmentFilter,
    officerDesignationFilter,
    purposeFilter,
    statusFilter,
    startTime,
    endTime,
  ]);

  // Initialize webcam when component mounts
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(true);
      toast.error("Your browser doesn't support camera access");
      return;
    }

    const initializeCamera = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
      } catch (error) {
        console.error("Error accessing camera:", error);
        setCameraError(true);
        toast.error("Camera access denied. Please allow camera permissions.");
      }
    };

    initializeCamera();

    return () => {
      if (webcamRef.current && webcamRef.current.stream) {
        const stream = webcamRef.current.stream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Fetch visitors on mount and when dependencies change
  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Search officers - UPDATED to use officerSelectionSearch
  useEffect(() => {
    if (selectedDesignation && officerSelectionSearch) {
      const filtered = officersByDesignation.filter(
        (officer) =>
          officer.name
            .toLowerCase()
            .includes(officerSelectionSearch.toLowerCase()) ||
          officer.department
            .toLowerCase()
            .includes(officerSelectionSearch.toLowerCase())
      );
      setFilteredOfficers(filtered);
    } else {
      setFilteredOfficers(officersByDesignation);
    }
  }, [officerSelectionSearch, officersByDesignation, selectedDesignation]);

  // Normalize phone number
  const normalizePhoneNumber = (phone) => {
    if (!phone) return "";
    let digits = phone.replace(/\D/g, "");

    if (digits.startsWith("88") && digits.length > 10) {
      digits = digits.substring(2);
    } else if (digits.startsWith("1") && digits.length === 11) {
      // digits = digits.substring(1);
    }

    return digits;
  };

  // Check phone number
  useEffect(() => {
    const checkPhoneNumber = async () => {
      if (phoneValue && phoneValue.length >= 10) {
        const normalizedPhone = normalizePhoneNumber(phoneValue);

        if (normalizedPhone.length < 10) {
          setPhoneSuggestions([]);
          setShowPhoneSuggestions(false);
          return;
        }

        setPhoneChecking(true);
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get(
            `${BASE_URL}/visitors/check-phone/${normalizedPhone}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (
            response.data.exists &&
            response.data.visitors &&
            response.data.visitors.length > 0
          ) {
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
      if (imageSrc) {
        setPhoto(imageSrc);
        toast.success("Photo captured successfully!");
      } else {
        toast.error("Failed to capture photo. Please try again.");
      }
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setPhoto("");
    toast.success("Ready to take new photo!");
  };

  // Select officer from search results
  const selectOfficer = (officer) => {
    setSelectedOfficer(officer);
    setOfficerSelectionSearch(`${officer.name} - ${officer.designation}`); // CHANGED
    setShowOfficerDropdown(false);
    setOfficerResults([]);
  };

  // Fetch all unique designations
  const fetchUniqueDesignations = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/officers/designations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUniqueDesignations(response.data.designations || []);
      setFilteredDesignations(response.data.designations || []);
    } catch (error) {
      console.error("Error fetching designations:", error);
    }
  }, []);

  // Fetch officers by designation
  const fetchOfficersByDesignation = useCallback(async (designation) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/officers/by-designation`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { designation },
      });
      setOfficersByDesignation(response.data.officers || []);
      setFilteredOfficers(response.data.officers || []);
    } catch (error) {
      console.error("Error fetching officers by designation:", error);
    }
  }, []);

  // Filter designations based on search
  useEffect(() => {
    if (designationFilter) {
      const filtered = uniqueDesignations.filter((designation) =>
        designation.toLowerCase().includes(designationFilter.toLowerCase())
      );
      setFilteredDesignations(filtered);
    } else {
      setFilteredDesignations(uniqueDesignations);
    }
  }, [designationFilter, uniqueDesignations]);

  // Add this useEffect to fetch designations on component mount
  useEffect(() => {
    fetchUniqueDesignations();
  }, [fetchUniqueDesignations]);

  // Select phone suggestion
  const selectPhoneSuggestion = async (visitor) => {
    setValue("name", visitor.name);
    setValue("address", visitor.address || "");
    setShowPhoneSuggestions(false);
    clearErrors("name");
    clearErrors("address");
    await trigger(["name", "address"]);
    toast.success("Visitor details auto-filled from previous visit!");
  };

  // Add Visitor Form Submit
  const onSubmit = async (data) => {
    if (!selectedOfficer) {
      toast.error("Please select an officer");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(data.phone);
    if (normalizedPhone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!photo) {
      toast.error("Please capture a photo of the visitor");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BASE_URL}/visitors/add`,
        {
          ...data,
          phone: normalizedPhone,
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

      // Reset form but keep camera open
      reset();
      setPhoto("");
      setSelectedOfficer(null);
      setOfficerSelectionSearch(""); // CHANGED
      setPhoneSuggestions([]);
      setShowPhoneSuggestions(false);
      setSelectedDesignation("");
      setDesignationSearch("");

      // Refresh visitor list
      fetchVisitors();

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

  // Visitor List Functions
  const highlightMatchedText = (text, searchTerms) => {
    if (!searchTerms || searchTerms.length === 0 || !text) {
      return <span>{text}</span>;
    }

    let highlightedText = text.toString();

    searchTerms.forEach((term) => {
      if (term.trim()) {
        const regex = new RegExp(`(${term.trim()})`, "gi");
        highlightedText = highlightedText.replace(
          regex,
          '<mark class="bg-yellow-200 text-gray-900 px-1 rounded">$1</mark>'
        );
      }
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  // Get search terms for highlighting
  const searchTerms = useMemo(() => {
    const terms = [];

    if (searchTerm.includes(",")) {
      terms.push(...parseSearchTerms(searchTerm));
    } else if (searchTerm) {
      terms.push(searchTerm);
    }

    if (phoneFilter && !searchTerm.includes(",")) terms.push(phoneFilter);
    if (nameFilter && !searchTerm.includes(",")) terms.push(nameFilter);
    if (officerNameFilter && !searchTerm.includes(","))
      terms.push(officerNameFilter);
    if (officerDesignationFilter && !searchTerm.includes(","))
      terms.push(officerDesignationFilter);
    if (officerDepartmentFilter && !searchTerm.includes(","))
      terms.push(officerDepartmentFilter);
    if (purposeFilter !== "all" && !searchTerm.includes(","))
      terms.push(purposeFilter);

    return terms.filter((term) => term && term.trim().length > 0);
  }, [
    searchTerm,
    phoneFilter,
    nameFilter,
    officerNameFilter,
    officerDesignationFilter,
    officerDepartmentFilter,
    purposeFilter,
  ]);

  // Toggle row expansion
  const toggleRowExpansion = (visitorId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [visitorId]: !prev[visitorId],
    }));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setPhoneFilter("");
    setNameFilter("");
    setOfficerNameFilter("");
    setOfficerDepartmentFilter("");
    setOfficerDesignationFilter("");
    setStartTime("");
    setEndTime("");
    setPurposeFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalVisitors / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalVisitors);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber === "..." || pageNumber < 1 || pageNumber > totalPages) {
      return;
    }
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get unique purposes for filters
  const purposes = useMemo(() => {
    const purposeSet = new Set();
    visitors.forEach((visitor) => purposeSet.add(visitor.purpose));
    return Array.from(purposeSet);
  }, [visitors]);

  // Get statistics
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVisitors = visitors.filter((v) => {
      const visitDate = new Date(v.visitTime);
      return visitDate >= today;
    }).length;

    return {
      total: totalVisitors,
      today: todayVisitors,
      case: visitors.filter((v) => v.purpose === "case").length,
      personal: visitors.filter((v) => v.purpose === "personal").length,
    };
  }, [visitors, totalVisitors]);

  return (
    <div className="space-y-6">
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
        {/* Left Column - Add Visitor Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Add New Visitor
            </h2>

            <div className="space-y-4">
              {/* Main Photo Display Area */}
              <div className="space-y-3">
                {photo ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100">
                      <img
                        src={photo}
                        alt="Captured Visitor"
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={retakePhoto}
                          className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                          title="Remove photo"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                        Photo Captured ✓
                      </div>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={retakePhoto}
                        className="px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center font-medium mx-auto"
                      >
                        <FiRefreshCw className="h-4 w-4 mr-2" />
                        Retake Photo
                      </button>
                    </div>
                  </motion.div>
                ) : cameraError ? (
                  <div className="space-y-3">
                    <div className="h-64 flex flex-col items-center justify-center bg-gray-100 rounded-lg border-2 border-gray-300">
                      <FiCamera className="h-16 w-16 text-gray-400 mb-3" />
                      <p className="text-gray-500 font-medium">Camera Error</p>
                      <p className="text-gray-400 text-sm text-center px-4 mt-1">
                        Please allow camera permissions or check your camera
                      </p>
                    </div>
                    <p className="text-xs text-red-500 text-center">
                      Camera access is required to capture visitor photos
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100">
                      <Webcam
                        ref={webcamRef}
                        audio={false}
                        screenshotFormat="image/jpeg"
                        className="w-full h-64 object-cover"
                        videoConstraints={{
                          facingMode: "user",
                          width: { ideal: 640 },
                          height: { ideal: 480 },
                        }}
                        onUserMediaError={() => {
                          setCameraError(true);
                          toast.error("Failed to access camera");
                        }}
                      />
                    </div>

                    <div className="text-center mb-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-medium mx-auto"
                      >
                        <FiCamera className="h-4 w-4 mr-2" />
                        Capture Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
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
                        value: /^[0-9+\-\s()]+$/,
                        message: "Invalid phone number format",
                      },
                      minLength: {
                        value: 10,
                        message: "Phone number must be at least 10 digits",
                      },
                      validate: (value) => {
                        const normalized = normalizePhoneNumber(value);
                        return (
                          normalized.length >= 10 ||
                          "Please enter a valid phone number"
                        );
                      },
                    })}
                    className={`w-full px-4 py-2 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                      errors.phone
                        ? "border-red-500 focus:border-red-600"
                        : "border-gray-300 focus:border-green-600"
                    }`}
                    placeholder="Enter phone number"
                    onBlur={() => setShowPhoneSuggestions(false)}
                  />
                  {phoneChecking && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="w-4 h-4 mr-1" />
                    {errors.phone.message}
                  </p>
                )}

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

                {phoneValue &&
                  phoneValue.length >= 10 &&
                  !phoneChecking &&
                  phoneSuggestions.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="mt-1 text-sm text-gray-500 flex items-center"
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
                  className={`w-full px-4 py-2 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                    errors.name
                      ? "border-red-500 focus:border-red-600"
                      : "border-gray-300 focus:border-green-600"
                  }`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
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
                  rows={2}
                  className={`w-full px-4 py-2 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
                    errors.address
                      ? "border-red-500 focus:border-red-600"
                      : "border-gray-300 focus:border-green-600"
                  }`}
                  placeholder="123 Main St, City, Country"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="w-4 h-4 mr-1" />
                    {errors.address.message}
                  </p>
                )}
              </div>
              {/* Officer Search with Designation and Name Dropdowns */}
              <div className="space-y-4">
                {/* Designation Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <span className="flex items-center">
                      <FiBriefcase className="w-4 h-4 mr-2 text-gray-600" />
                      Filter by Designation *
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={designationSearch}
                      onChange={(e) => {
                        setDesignationSearch(e.target.value);
                        setShowDesignationDropdown(true);
                      }}
                      onFocus={() => setShowDesignationDropdown(true)}
                      className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-green-600 transition-all duration-300"
                      placeholder="Search designation..."
                    />

                    {/* Designation Dropdown */}
                    <AnimatePresence>
                      {showDesignationDropdown &&
                        uniqueDesignations.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-30 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-50 overflow-y-auto"
                          >
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2">
                              <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                  type="text"
                                  value={designationFilter}
                                  onChange={(e) =>
                                    setDesignationFilter(e.target.value)
                                  }
                                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  placeholder="Filter designations..."
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>

                            {filteredDesignations.map((designation) => (
                              <button
                                key={designation}
                                type="button"
                                onClick={() => {
                                  setSelectedDesignation(designation);
                                  setDesignationSearch(designation);
                                  setShowDesignationDropdown(false);
                                  setDesignationFilter("");
                                  fetchOfficersByDesignation(designation);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-green-50 border-b border-gray-100 last:border-b-0 transition-colors group"
                              >
                                <div className="font-medium text-gray-900 group-hover:text-green-700">
                                  {designation}
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Officer Selection - Only show if designation is selected */}
                {selectedDesignation && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      <span className="flex items-center">
                        <FiUser className="w-4 h-4 mr-2 text-gray-600" />
                        Select Officer *
                      </span>
                    </label>
                    <div
                      ref={selectedDesignation ? officerInputRef : null}
                      className="relative"
                    >
                      <input
                        type="text"
                        value={officerSelectionSearch} // CHANGED
                        onChange={(e) => {
                          setOfficerSelectionSearch(e.target.value); // CHANGED
                          setShowOfficerDropdown(true);
                        }}
                        onFocus={() => setShowOfficerDropdown(true)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-green-600 transition-all duration-300"
                        placeholder={`Search officers in ${selectedDesignation}...`}
                        disabled={!selectedDesignation}
                      />

                      {/* Selected Officer Display */}
                      {selectedOfficer && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-green-900">
                                {selectedOfficer.name}
                              </div>
                              <div className="text-sm text-green-700">
                                {selectedOfficer.designation} -{" "}
                                {selectedOfficer.department}
                              </div>
                              {selectedOfficer.bpNumber && (
                                <div className="text-xs text-green-600 mt-1">
                                  BP: {selectedOfficer.bpNumber}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOfficer(null);
                                setOfficerSelectionSearch(""); // CHANGED
                              }}
                              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                            >
                              <FiX className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Officer Dropdown */}
                      <AnimatePresence>
                        {showOfficerDropdown && filteredOfficers.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                          >
                            <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                              <p className="text-xs font-medium text-blue-700">
                                Found {filteredOfficers.length} officer(s)
                              </p>
                            </div>
                            {filteredOfficers.map((officer) => (
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
                                  {officer.designation} - {officer.department}{" "}
                                  {officer.bpNumber &&
                                    `| BP: ${officer.bpNumber}`}
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
                  className={`w-full px-4 py-2 bg-gray-50 border-2 rounded-lg focus:outline-none focus:ring-0 transition-all duration-300 ${
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
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FiAlertCircle className="w-4 h-4 mr-1" />
                    {errors.purpose.message}
                  </p>
                )}
              </div>

              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || !selectedOfficer || !photo}
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

        {/* Right Column - Visitor List */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <div className="space-y-6">
            {/* Visitor List Header */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Visitor List
                    </h2>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                  <p className="text-sm text-gray-600">Total Visitors</p>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
                        placeholder="Search visitors..."
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <FiX className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center px-3 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <FiFilter className="h-4 w-4 mr-2" />
                      {showFilters ? "Hide" : "Filters"}
                    </button>
                    <button
                      onClick={fetchVisitors}
                      className="flex items-center px-3 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <FiRefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Filter Options */}
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-gray-300 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={phoneFilter}
                          onChange={(e) => setPhoneFilter(e.target.value)}
                          className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 text-sm"
                          placeholder="Filter by phone..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Visitor Name
                        </label>
                        <input
                          type="text"
                          value={nameFilter}
                          onChange={(e) => setNameFilter(e.target.value)}
                          className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 text-sm"
                          placeholder="Filter by name..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Officer Name
                        </label>
                        <input
                          type="text"
                          value={officerNameFilter}
                          onChange={(e) => setOfficerNameFilter(e.target.value)}
                          className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 text-sm"
                          placeholder="Filter by officer..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Purpose
                        </label>
                        <select
                          value={purposeFilter}
                          onChange={(e) => setPurposeFilter(e.target.value)}
                          className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 text-sm"
                        >
                          <option value="all">All Purposes</option>
                          {purposes.map((purpose) => (
                            <option key={purpose} value={purpose}>
                              {purpose.charAt(0).toUpperCase() +
                                purpose.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Officer Status
                        </label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 text-sm"
                        >
                          <option value="all">All Status</option>
                          <option value="active">Active Only</option>
                          <option value="inactive">Inactive Only</option>
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Range Filter
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Start Time
                            </label>
                            <input
                              type="datetime-local"
                              value={startTime}
                              onChange={(e) => setStartTime(e.target.value)}
                              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              End Time
                            </label>
                            <input
                              type="datetime-local"
                              value={endTime}
                              onChange={(e) => setEndTime(e.target.value)}
                              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Filter visitors who visited between the selected time
                          range
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <button
                        onClick={clearFilters}
                        className="px-3 py-1.5 text-sm text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Pagination Controls */}
            {visitors.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 text-sm"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span className="text-sm text-gray-600">per page</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Previous page"
                    >
                      <FiChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {getPageNumbers().map((pageNumber, index) => (
                        <button
                          key={index}
                          onClick={() => handlePageChange(pageNumber)}
                          disabled={pageNumber === "..."}
                          className={`min-w-8 h-8 flex items-center justify-center rounded-lg border-2 transition-all duration-300 text-sm ${
                            pageNumber === currentPage
                              ? "bg-green-600 text-white border-green-600 font-medium"
                              : pageNumber === "..."
                              ? "border-transparent text-gray-500 cursor-default"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Next page"
                    >
                      <FiChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Visitors Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-300 overflow-hidden">
              {listLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : visitors.length === 0 ? (
                <div className="text-center py-8">
                  <FiSearch className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-gray-900">
                    No visitors found
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {searchTerm ||
                    phoneFilter ||
                    nameFilter ||
                    officerNameFilter ||
                    purposeFilter !== "all"
                      ? "Try changing your filters or search term"
                      : "No visitors have been registered yet"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-300">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Visitor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Officer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Visit Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {visitors.map((visitor) => (
                        <React.Fragment key={visitor._id}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50 cursor-pointer text-sm"
                            onClick={() => toggleRowExpansion(visitor._id)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="h-8 w-8 shrink-0">
                                  {visitor.photo ? (
                                    <img
                                      src={visitor.photo}
                                      alt={visitor.name}
                                      className="h-8 w-8 rounded-full object-cover border border-gray-300"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                      <span className="text-green-600 font-bold text-xs">
                                        {visitor.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <div className="font-medium text-gray-900">
                                    {highlightMatchedText(
                                      visitor.name,
                                      searchTerms
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 capitalize">
                                    {highlightMatchedText(
                                      visitor.purpose,
                                      searchTerms
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-900">
                                {highlightMatchedText(
                                  visitor.phone,
                                  searchTerms
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate max-w-37.5">
                                {highlightMatchedText(
                                  visitor.address,
                                  searchTerms
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-900">
                                {highlightMatchedText(
                                  visitor.officer?.name,
                                  searchTerms
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {highlightMatchedText(
                                  visitor.officer?.designation,
                                  searchTerms
                                )}
                              </div>
                              <div className={`py-1 text-xs `}>
                                Status:{" "}
                                <span
                                  className={`text-xs ${
                                    visitor.officer?.status === "active"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {visitor.officer?.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-gray-900">
                                {format(
                                  parseISO(visitor.visitTime),
                                  "MMM dd yyyy"
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(
                                  parseISO(visitor.visitTime),
                                  "hh:mm:ss a"
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRowExpansion(visitor._id);
                                }}
                                className="px-2 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                              >
                                {expandedRows[visitor._id] ? "Hide" : "View"}
                              </button>
                            </td>
                          </motion.tr>

                          {/* Expanded Row Details */}
                          {expandedRows[visitor._id] && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="bg-gray-50"
                            >
                              <td colSpan="5" className="px-4 py-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-900 mb-2">
                                      Visitor Details
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex items-center">
                                        <FiUser className="h-3 w-3 text-gray-400 mr-2" />
                                        <span className="text-gray-600">
                                          Name:{" "}
                                        </span>
                                        <span className="ml-2 font-medium">
                                          {highlightMatchedText(
                                            visitor.name,
                                            searchTerms
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex items-center">
                                        <FiPhone className="h-3 w-3 text-gray-400 mr-2" />
                                        <span className="text-gray-600">
                                          Phone:{" "}
                                        </span>
                                        <span className="ml-2 font-medium">
                                          {highlightMatchedText(
                                            visitor.phone,
                                            searchTerms
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex items-start">
                                        <FiMapPin className="h-3 w-3 text-gray-400 mr-2 mt-0.5" />
                                        <div>
                                          <span className="text-gray-600">
                                            Address:{" "}
                                          </span>
                                          <span className="ml-2 font-medium">
                                            {highlightMatchedText(
                                              visitor.address,
                                              searchTerms
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-semibold text-gray-900 mb-2">
                                      Officer Details
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex items-center">
                                        <FiUser className="h-3 w-3 text-gray-400 mr-2" />
                                        <span className="text-gray-600">
                                          Officer:{" "}
                                        </span>
                                        <span className="ml-2 font-medium">
                                          {highlightMatchedText(
                                            visitor.officer?.name,
                                            searchTerms
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex items-center">
                                        <FiBriefcase className="h-3 w-3 text-gray-400 mr-2" />
                                        <span className="text-gray-600">
                                          Designation:{" "}
                                        </span>
                                        <span className="ml-2 font-medium">
                                          {highlightMatchedText(
                                            visitor.officer?.designation,
                                            searchTerms
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex items-center">
                                        <FiBriefcase className="h-3 w-3 text-gray-400 mr-2" />
                                        <span className="text-gray-600">
                                          Department:{" "}
                                        </span>
                                        <span className="ml-2 font-medium">
                                          {highlightMatchedText(
                                            visitor.officer?.department,
                                            searchTerms
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex items-center">
                                        <span className="text-gray-600 mr-2">
                                          Status:
                                        </span>
                                        <span
                                          className={`ml-2 font-medium ${
                                            visitor.officer?.status === "active"
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }`}
                                        >
                                          {visitor.officer?.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {visitor.photo && (
                                    <div className="md:col-span-2">
                                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                        Visitor Photo
                                      </h4>
                                      <div className="flex justify-center">
                                        <img
                                          src={visitor.photo}
                                          alt={visitor.name}
                                          className="h-full w-64 object-contain"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="text-center text-sm text-gray-600">
              Showing {visitors.length} visitors on page {currentPage} of{" "}
              {totalPages}
              {searchTerms.length > 0 && (
                <span className="ml-2 text-yellow-600 font-medium">
                  • {searchTerms.length} search term
                  {searchTerms.length > 1 ? "s" : ""} active
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddVisitor;
