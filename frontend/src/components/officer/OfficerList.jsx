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
} from "react-icons/fi";

const OfficerList = () => {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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

  // Fetch officers with debounced search
  const fetchOfficers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Build query params
      const params = {};

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
        if (statusFilter && statusFilter !== "all") params.status = statusFilter;
        if (departmentFilter) params.department = departmentFilter;
        if (designationFilter) params.designation = designationFilter;
      }

      const response = await axios.get(
        "http://localhost:5000/api/officers/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        }
      );

      setOfficers(response.data.officers || []);
    } catch (error) {
      console.error("Error fetching officers:", error);
      toast.error("Failed to fetch officers");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, departmentFilter, designationFilter]);

  useEffect(() => {
    fetchOfficers();
  }, [fetchOfficers]);

  // Highlight matched text
  const highlightMatchedText = (text, searchTerms) => {
    if (!searchTerms || searchTerms.length === 0 || !text) {
      return <span>{text}</span>;
    }

    let highlightedText = text.toString();
    
    searchTerms.forEach(term => {
      if (term.trim()) {
        const regex = new RegExp(`(${term.trim()})`, 'gi');
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
    if (statusFilter !== "all" && !searchTerm.includes(",")) terms.push(statusFilter);
    if (departmentFilter && !searchTerm.includes(",")) terms.push(departmentFilter);
    if (designationFilter && !searchTerm.includes(",")) terms.push(designationFilter);
    
    return terms.filter(term => term && term.trim().length > 0);
  }, [searchTerm, statusFilter, departmentFilter, designationFilter]);

  // Update officer status
  const updateOfficerStatus = async (officerId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/officers/${officerId}/status`,
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
  };

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
            <p className="text-3xl font-bold text-white">{officers.length}</p>
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
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {officers.map((officer) => (
                  <motion.tr
                    key={officer._id}
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
                            BP: {highlightMatchedText(officer.bpNumber, searchTerms)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {highlightMatchedText(officer.phone, searchTerms)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {highlightMatchedText(officer.department, searchTerms)}
                        {officer.unit && ` • ${highlightMatchedText(officer.unit, searchTerms)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {highlightMatchedText(officer.designation, searchTerms)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {highlightMatchedText(officer.department, searchTerms)}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-sm text-gray-600">
          Showing {officers.length} officer{officers.length !== 1 ? 's' : ''}
          {searchTerms.length > 0 && (
            <span className="ml-2 text-yellow-600 font-medium">
              • {searchTerms.length} search term{searchTerms.length > 1 ? 's' : ''} active
            </span>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={fetchOfficers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfficerList;