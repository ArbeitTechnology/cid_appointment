/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiCheck,
  FiX,
  FiClock,
  FiCalendar,
  FiUser,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { format, parseISO } from "date-fns";

const VisitorList = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalVisitors, setTotalVisitors] = useState(0);

  // Parse comma-separated search terms
  const parseSearchTerms = (searchString) => {
    if (!searchString) return [];

    // Split by commas, trim whitespace, and filter out empty strings
    return searchString
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0);
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

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
    startTime,
    endTime,
  ]);

  // Fetch visitors with debounced search
  const fetchVisitors = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Build query params
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Check if we have comma-separated search terms
      if (debouncedSearchTerm) {
        if (debouncedSearchTerm.includes(",")) {
          // Send comma-separated terms to backend
          params.multiSearch = debouncedSearchTerm;
        } else {
          // Single term search (backward compatible)
          params.search = debouncedSearchTerm;
        }
      }

      // Only use individual filters if we don't have comma-separated search
      if (!debouncedSearchTerm.includes(",")) {
        if (phoneFilter) params.phone = phoneFilter;
        if (nameFilter) params.name = nameFilter;
        if (officerNameFilter) params.officerName = officerNameFilter;
        if (officerDepartmentFilter)
          params.officerDepartment = officerDepartmentFilter;
        if (officerDesignationFilter)
          params.officerDesignation = officerDesignationFilter;
        if (purposeFilter && purposeFilter !== "all")
          params.purpose = purposeFilter;
      }

      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;

      const response = await axios.get(
        "http://localhost:5000/api/visitors/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        }
      );

      setVisitors(response.data.visitors || []);
      setTotalVisitors(response.data.total || 0);

      // If current page is beyond available pages, reset to page 1
      const totalPages = Math.ceil((response.data.total || 0) / itemsPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching visitors:", error);
      toast.error("Failed to fetch visitors");
    } finally {
      setLoading(false);
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
    startTime,
    endTime,
  ]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Highlight matched text
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

    // Add comma-separated search terms
    if (searchTerm.includes(",")) {
      terms.push(...parseSearchTerms(searchTerm));
    } else if (searchTerm) {
      terms.push(searchTerm);
    }

    // Add individual filter terms
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
    setCurrentPage(1);
  };

  // Apply time range filter
  const applyTimeFilter = () => {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start > end) {
        toast.error("Start time must be before end time");
        return;
      }
    }
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
      <div className="bg-linear-to-r from-green-600 to-green-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <FiEye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Visitor List</h2>
              <p className="text-gray-200">
                View and manage all visitor appointments
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-sm text-gray-200">Total Visitors</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Today</p>
              <p className="text-xl font-bold text-gray-900">{stats.today}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiCalendar className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Case</p>
              <p className="text-xl font-bold text-purple-600">{stats.case}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiBriefcase className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Personal</p>
              <p className="text-xl font-bold text-pink-600">
                {stats.personal}
              </p>
            </div>
            <div className="p-2 bg-pink-100 rounded-lg">
              <FiUser className="h-5 w-5 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-300 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <FiEye className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
                placeholder="Search by name, phone, officer, department, designation... (use commas for multiple)"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiFilter className="h-5 w-5 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              onClick={fetchVisitors}
              className="flex items-center px-4 py-3 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiRefreshCw className="h-5 w-5 mr-2" />
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
            className="mt-4 pt-4 border-t border-gray-300 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
                  placeholder="Filter by phone..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visitor Name
                </label>
                <input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
                  placeholder="Filter by name..."
                />
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Officer Name
                  </label>
                  <input
                    type="text"
                    value={officerNameFilter}
                    onChange={(e) => setOfficerNameFilter(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
                    placeholder="Filter by officer name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Officer Designation
                  </label>
                  <input
                    type="text"
                    value={officerDesignationFilter}
                    onChange={(e) =>
                      setOfficerDesignationFilter(e.target.value)
                    }
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
                    placeholder="Filter by designation..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Officer Department
                  </label>
                  <input
                    type="text"
                    value={officerDepartmentFilter}
                    onChange={(e) => setOfficerDepartmentFilter(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
                    placeholder="Filter by department..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose
                </label>
                <select
                  value={purposeFilter}
                  onChange={(e) => setPurposeFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
                >
                  <option value="all">All Purposes</option>
                  {purposes.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose.charAt(0).toUpperCase() + purpose.slice(1)}
                    </option>
                  ))}
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
                  Filter visitors who visited between the selected time range
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
              </button>
              <button
                onClick={applyTimeFilter}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Apply Time Filter
              </button>
            </div>
          </motion.div>
        )}
      </div>
      {/* Pagination Controls */}
      {visitors.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Items per page selector */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <FiChevronLeft className="h-5 w-5" />
              </button>

              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {getPageNumbers().map((pageNumber, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(pageNumber)}
                    disabled={pageNumber === "..."}
                    className={`min-w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all duration-300 ${
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
                className="p-2 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <FiChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-sm text-gray-600">
          Showing {visitors.length} visitors on page {currentPage} of{" "}
          {totalPages}
          {searchTerms.length > 0 && (
            <span className="ml-2 text-yellow-600 font-medium">
              • {searchTerms.length} search term
              {searchTerms.length > 1 ? "s" : ""} active
            </span>
          )}
          {startTime && endTime && (
            <span className="ml-2 text-green-600 font-medium">
              • Filtered by time range
            </span>
          )}
        </div>
      </div>
      {/* Visitors Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-300 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : visitors.length === 0 ? (
          <div className="text-center py-12">
            <FiSearch className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No visitors found
            </h3>
            <p className="text-gray-600 mt-1">
              {searchTerm ||
              phoneFilter ||
              nameFilter ||
              officerNameFilter ||
              officerDesignationFilter ||
              officerDepartmentFilter ||
              startTime ||
              endTime ||
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
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Officer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Visit Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
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
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleRowExpansion(visitor._id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 shrink-0">
                            {visitor.photo ? (
                              <img
                                src={visitor.photo}
                                alt={visitor.name}
                                className="h-10 w-10 rounded-full object-cover border-2 border-gray-300"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-green-600 font-bold">
                                  {visitor.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {highlightMatchedText(visitor.name, searchTerms)}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                              {highlightMatchedText(
                                visitor.purpose,
                                searchTerms
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {highlightMatchedText(visitor.phone, searchTerms)}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {highlightMatchedText(visitor.address, searchTerms)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {highlightMatchedText(
                            visitor.officer?.name,
                            searchTerms
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {highlightMatchedText(
                            visitor.officer?.designation,
                            searchTerms
                          )}{" "}
                          -{" "}
                          {highlightMatchedText(
                            visitor.officer?.department,
                            searchTerms
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {format(parseISO(visitor.visitTime), "MMM dd, yyyy")}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(parseISO(visitor.visitTime), "hh:mm:ss a")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRowExpansion(visitor._id);
                          }}
                          className="px-3 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          {expandedRows[visitor._id]
                            ? "Hide Details"
                            : "View Details"}
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
                        <td colSpan="6" className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                Visitor Details
                              </h4>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600">
                                    Name:{" "}
                                  </span>
                                  <span className="ml-2 text-sm font-medium">
                                    {highlightMatchedText(
                                      visitor.name,
                                      searchTerms
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600">
                                    Phone:{" "}
                                  </span>
                                  <span className="ml-2 text-sm font-medium">
                                    {highlightMatchedText(
                                      visitor.phone,
                                      searchTerms
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-start">
                                  <FiMapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                                  <div>
                                    <span className="text-sm text-gray-600">
                                      Address:{" "}
                                    </span>
                                    <span className="ml-2 text-sm font-medium">
                                      {highlightMatchedText(
                                        visitor.address,
                                        searchTerms
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <FiBriefcase className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600">
                                    Purpose:{" "}
                                  </span>
                                  <span className="ml-2 text-sm font-medium capitalize">
                                    {highlightMatchedText(
                                      visitor.purpose,
                                      searchTerms
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                Officer Details
                              </h4>
                              <div className="space-y-2">
                                <div className="flex items-center">
                                  <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600">
                                    Officer:{" "}
                                  </span>
                                  <span className="ml-2 text-sm font-medium">
                                    {highlightMatchedText(
                                      visitor.officer?.name,
                                      searchTerms
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <FiBriefcase className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600">
                                    Designation:{" "}
                                  </span>
                                  <span className="ml-2 text-sm font-medium">
                                    {highlightMatchedText(
                                      visitor.officer?.designation,
                                      searchTerms
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <FiBriefcase className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-600">
                                    Department:{" "}
                                  </span>
                                  <span className="ml-2 text-sm font-medium">
                                    {highlightMatchedText(
                                      visitor.officer?.department,
                                      searchTerms
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                Visit Information
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <p className="text-xs text-gray-500">
                                    Visit Time
                                  </p>
                                  <p className="text-sm font-medium">
                                    {format(
                                      parseISO(visitor.visitTime),
                                      "MMM dd, yyyy hh:mm a"
                                    )}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <p className="text-xs text-gray-500">
                                    Registered On
                                  </p>
                                  <p className="text-sm font-medium">
                                    {format(
                                      parseISO(visitor.createdAt),
                                      "MMM dd, yyyy"
                                    )}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <p className="text-xs text-gray-500">
                                    Last Updated
                                  </p>
                                  <p className="text-sm font-medium">
                                    {format(
                                      parseISO(visitor.updatedAt),
                                      "MMM dd, yyyy"
                                    )}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                  <p className="text-xs text-gray-500">
                                    Visitor ID
                                  </p>
                                  <p className="text-sm font-mono text-gray-700 truncate">
                                    {visitor._id}
                                  </p>
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
    </div>
  );
};

export default VisitorList;
