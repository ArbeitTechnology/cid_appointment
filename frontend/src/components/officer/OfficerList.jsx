/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEdit,
  FiEye,
  FiCheck,
  FiX,
  FiTrash2,
  FiSave,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";

const OfficerList = () => {
  const BASE_URL = import.meta.env.VITE_API_URL;
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editingOfficerId, setEditingOfficerId] = useState(null);
  const [expandedOfficerId, setExpandedOfficerId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    designation: "",
    department: "",
    unit: "",
    bpNumber: "",
    status: "active",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalOfficers, setTotalOfficers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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

  // Fetch officers with debounced search and pagination
  const fetchOfficers = useCallback(async () => {
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
        if (statusFilter && statusFilter !== "all")
          params.status = statusFilter;
        if (departmentFilter) params.department = departmentFilter;
        if (designationFilter) params.designation = designationFilter;
      }

      const response = await axios.get(`${BASE_URL}/officers/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      setOfficers(response.data.officers || []);
      setTotalOfficers(response.data.total || 0);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error("Error fetching officers:", error);
      toast.error("Failed to fetch officers");
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearchTerm,
    statusFilter,
    departmentFilter,
    designationFilter,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, departmentFilter, designationFilter]);

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
    if (statusFilter !== "all" && !searchTerm.includes(","))
      terms.push(statusFilter);
    if (departmentFilter && !searchTerm.includes(","))
      terms.push(departmentFilter);
    if (designationFilter && !searchTerm.includes(","))
      terms.push(designationFilter);

    return terms.filter((term) => term && term.trim().length > 0);
  }, [searchTerm, statusFilter, departmentFilter, designationFilter]);

  // Update officer status
  const updateOfficerStatus = async (officerId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${BASE_URL}/officers/${officerId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(`Officer status updated to ${newStatus}`);
      fetchOfficers(); // Refresh list
    } catch (error) {
      console.error("Error updating officer status:", error);
      toast.error("Failed to update officer status");
    }
  };

  // Delete officer
  const deleteOfficer = async (officerId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this officer? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BASE_URL}/officers/${officerId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Officer deleted successfully");
      fetchOfficers(); // Refresh list
    } catch (error) {
      console.error("Error deleting officer:", error);
      toast.error("Failed to delete officer");
    }
  };

  // Start editing officer
  const startEditing = (officer) => {
    setEditingOfficerId(officer._id);
    setEditFormData({
      name: officer.name,
      phone: officer.phone,
      designation: officer.designation,
      department: officer.department,
      unit: officer.unit || "",
      bpNumber: officer.bpNumber,
      status: officer.status,
    });
    setExpandedOfficerId(officer._id);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingOfficerId(null);
    setExpandedOfficerId(null);
    setEditFormData({
      name: "",
      phone: "",
      designation: "",
      department: "",
      unit: "",
      bpNumber: "",
      status: "active",
    });
  };

  // Handle edit form change
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  // Update officer
  const updateOfficer = async (officerId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${BASE_URL}/officers/${officerId}`, editFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Officer updated successfully");
      setEditingOfficerId(null);
      setExpandedOfficerId(null);
      fetchOfficers(); // Refresh list
    } catch (error) {
      console.error("Error updating officer:", error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to update officer");
      }
    }
  };

  // Toggle officer details expansion
  const toggleOfficerExpansion = (officerId) => {
    if (expandedOfficerId === officerId) {
      setExpandedOfficerId(null);
      setEditingOfficerId(null);
    } else {
      setExpandedOfficerId(officerId);
    }
  };

  // Get unique departments and designations for filters
  const departments = useMemo(() => {
    const deptSet = new Set();
    officers.forEach((officer) => deptSet.add(officer.department));
    return Array.from(deptSet);
  }, [officers]);

  const designations = useMemo(() => {
    const desgSet = new Set();
    officers.forEach((officer) => desgSet.add(officer.designation));
    return Array.from(desgSet);
  }, [officers]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDepartmentFilter("");
    setDesignationFilter("");
    setCurrentPage(1);
  };

  // Pagination functions
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Calculate pagination range
  const getPaginationRange = () => {
    const range = [];
    const maxVisiblePages = 5;

    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  };

  // Calculate showing range
  const getShowingRange = () => {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalOfficers);
    return { start, end };
  };

  const showingRange = getShowingRange();

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-blue-600 to-blue-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <FiEye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Officer List</h2>
              <p className="text-gray-200">
                View and manage all officers in the system
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">{totalOfficers}</p>
            <p className="text-sm text-gray-200">Total Officers</p>
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
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-0 transition-all duration-300"
                placeholder="Search by name, phone, designation, department, unit, or BP number... (use commas for multiple)"
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
              onClick={fetchOfficers}
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
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-0 transition-all duration-300"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-0 transition-all duration-300"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designation
                </label>
                <select
                  value={designationFilter}
                  onChange={(e) => setDesignationFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none focus:ring-0 transition-all duration-300"
                >
                  <option value="">All Designations</option>
                  {designations.map((desg) => (
                    <option key={desg} value={desg}>
                      {desg}
                    </option>
                  ))}
                </select>
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
                onClick={fetchOfficers}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow border border-gray-300 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Officers</p>
              <p className="text-2xl font-bold text-gray-900">
                {officers.filter((o) => o.status === "active").length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-300 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Officers</p>
              <p className="text-2xl font-bold text-gray-900">
                {officers.filter((o) => o.status === "inactive").length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <FiX className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-300 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Departments</p>
              <p className="text-2xl font-bold text-gray-900">
                {departments.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiFilter className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
      {/* Pagination Controls */}
      {officers.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-300 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
                  Rows per page:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

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
                {getPaginationRange().map((pageNumber, index) => (
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
      {/* Summary (replaced by pagination info) */}
      {officers.length > 0 && (
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold">{totalOfficers}</span> officer
          {totalOfficers !== 1 ? "s" : ""}
        </div>
      )}
      {/* Officers Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-300 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : officers.length === 0 ? (
          <div className="text-center py-12">
            <FiSearch className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No officers found
            </h3>
            <p className="text-gray-600 mt-1">
              {searchTerm ||
              statusFilter !== "all" ||
              departmentFilter ||
              designationFilter
                ? "Try changing your filters or search term"
                : "No officers have been added yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Officer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {officers.map((officer) => (
                  <React.Fragment key={officer._id}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 shrink-0">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-bold">
                                {officer.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {highlightMatchedText(officer.name, searchTerms)}
                            </div>
                            <div className="text-sm text-gray-500">
                              BP:{" "}
                              {highlightMatchedText(
                                officer.bpNumber,
                                searchTerms
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {highlightMatchedText(officer.phone, searchTerms)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {highlightMatchedText(
                            officer.department,
                            searchTerms
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {highlightMatchedText(
                            officer.designation,
                            searchTerms
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {highlightMatchedText(
                            officer.department,
                            searchTerms
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {highlightMatchedText(
                            officer.unit || "N/A",
                            searchTerms
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            officer.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {officer.status === "active" ? (
                            <>
                              <FiCheck className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <FiX className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleOfficerExpansion(officer._id)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            {expandedOfficerId === officer._id ? (
                              <FiChevronUp className="h-4 w-4" />
                            ) : (
                              <FiChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => startEditing(officer)}
                            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Officer"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteOfficer(officer._id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Officer"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                          {officer.status === "active" ? (
                            <button
                              onClick={() =>
                                updateOfficerStatus(officer._id, "inactive")
                              }
                              className="px-3 py-1 text-xs text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                updateOfficerStatus(officer._id, "active")
                              }
                              className="px-3 py-1 text-xs text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>

                    {/* Expanded Edit Form */}
                    {expandedOfficerId === officer._id && (
                      <tr className="bg-blue-50">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="bg-white rounded-lg border border-gray-300 p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {editingOfficerId === officer._id
                                  ? "Edit Officer"
                                  : "Officer Details"}
                              </h4>
                              <button
                                onClick={() =>
                                  toggleOfficerExpansion(officer._id)
                                }
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <FiX className="h-5 w-5" />
                              </button>
                            </div>

                            {editingOfficerId === officer._id ? (
                              // Edit Form
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                  </label>
                                  <input
                                    type="text"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number *
                                  </label>
                                  <input
                                    type="text"
                                    name="phone"
                                    value={editFormData.phone}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    BP Number *
                                  </label>
                                  <input
                                    type="text"
                                    name="bpNumber"
                                    value={editFormData.bpNumber}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Designation *
                                  </label>
                                  <input
                                    type="text"
                                    name="designation"
                                    value={editFormData.designation}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department *
                                  </label>
                                  <input
                                    type="text"
                                    name="department"
                                    value={editFormData.department}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit
                                  </label>
                                  <input
                                    type="text"
                                    name="unit"
                                    value={editFormData.unit}
                                    onChange={handleEditFormChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
                                  />
                                </div>

                                <div className="md:col-span-2 flex justify-end items-center space-x-2 mt-2">
                                  <button
                                    onClick={cancelEditing}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => updateOfficer(officer._id)}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                  >
                                    <FiSave className="h-4 w-4 mr-2" />
                                    Update Officer
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View Details
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-sm font-medium text-gray-500">
                                      Name:
                                    </span>
                                    <p className="text-gray-900">
                                      {officer.name}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-500">
                                      Phone:
                                    </span>
                                    <p className="text-gray-900">
                                      {officer.phone}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-500">
                                      BP Number:
                                    </span>
                                    <p className="text-gray-900">
                                      {officer.bpNumber}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <span className="text-sm font-medium text-gray-500">
                                      Designation:
                                    </span>
                                    <p className="text-gray-900">
                                      {officer.designation}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-500">
                                      Department:
                                    </span>
                                    <p className="text-gray-900">
                                      {officer.department}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-500">
                                      Unit:
                                    </span>
                                    <p className="text-gray-900">
                                      {officer.unit || "N/A"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
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

export default OfficerList;
