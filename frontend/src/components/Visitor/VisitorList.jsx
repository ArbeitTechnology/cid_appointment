/* eslint-disable react-hooks/exhaustive-deps */
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
  FiLayers,
  FiActivity,
  FiChevronUp,
  FiUserCheck,
  FiEdit,
  FiTrash2,
  FiPrinter,
} from "react-icons/fi";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiDownload } from "react-icons/fi";
const VisitorList = () => {
  const BASE_URL = import.meta.env.VITE_API_URL;
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [officerUnitFilter, setOfficerUnitFilter] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalVisitors, setTotalVisitors] = useState(0);

  // Parse comma-separated search terms
  const parseSearchTerms = (searchString) => {
    if (!searchString) return [];
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
    officerUnitFilter,
    purposeFilter,
    statusFilter,
    startTime,
    endTime,
  ]);
  // Add this function to format date for API
  const formatDateTimeForAPI = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };
  // Fetch visitors with debounced search
  const fetchVisitors = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      // Always handle search term (multiSearch or regular search)
      if (debouncedSearchTerm) {
        if (debouncedSearchTerm.includes(",")) {
          params.multiSearch = debouncedSearchTerm;
        } else {
          params.search = debouncedSearchTerm;
        }
      }

      // ALWAYS apply individual filters (they work independently of search)
      if (phoneFilter) params.phone = phoneFilter;
      if (nameFilter) params.name = nameFilter;
      if (officerNameFilter) params.officerName = officerNameFilter;
      if (officerDepartmentFilter)
        params.officerDepartment = officerDepartmentFilter;
      if (officerDesignationFilter)
        params.officerDesignation = officerDesignationFilter;
      if (officerUnitFilter) params.officerUnit = officerUnitFilter;
      if (purposeFilter && purposeFilter !== "all")
        params.purpose = purposeFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      if (startTime) params.startTime = formatDateTimeForAPI(startTime);
      if (endTime) params.endTime = formatDateTimeForAPI(endTime);

      const response = await axios.get(`${BASE_URL}/visitors/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    officerUnitFilter,
    purposeFilter,
    statusFilter,
    startTime,
    endTime,
  ]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors, statusFilter]);

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
          '<mark class="bg-yellow-200 text-gray-900 rounded">$1</mark>'
        );
      }
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  // Get search terms for highlighting
  const searchTerms = useMemo(() => {
    const terms = [];

    // ONLY include comma-separated search terms from the main search box
    if (searchTerm.includes(",")) {
      parseSearchTerms(searchTerm).forEach((term) => terms.push(term));
    } else if (searchTerm) {
      terms.push(searchTerm);
    }

    return terms.filter((term) => term && term.trim().length > 0);
  }, [
    searchTerm, // ONLY keep searchTerm as dependency
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
    setOfficerUnitFilter(""); // NEW
    setStartTime("");
    setEndTime("");
    setPurposeFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };
  // PDF Export Function
  const exportToPDF = async () => {
    try {
      toast.loading("Generating PDF with photos...", { id: "pdf-export" });

      const token = localStorage.getItem("token");
      const params = {
        page: 1,
        limit: 50,
      };

      // Apply current filters
      if (phoneFilter) params.phone = phoneFilter;
      if (nameFilter) params.name = nameFilter;
      if (officerNameFilter) params.officerName = officerNameFilter;
      if (officerDepartmentFilter)
        params.officerDepartment = officerDepartmentFilter;
      if (officerDesignationFilter)
        params.officerDesignation = officerDesignationFilter;
      if (officerUnitFilter) params.officerUnit = officerUnitFilter;
      if (purposeFilter !== "all") params.purpose = purposeFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (debouncedSearchTerm) {
        if (debouncedSearchTerm.includes(","))
          params.multiSearch = debouncedSearchTerm;
        else params.search = debouncedSearchTerm;
      }
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;

      const response = await axios.get(`${BASE_URL}/visitors/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const exportVisitors = response.data.visitors || [];

      // Create PDF in portrait mode
      const doc = new jsPDF("p", "mm", "a4");
      let yPosition = 20;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // Title
      doc.setFontSize(20);
      doc.setTextColor(46, 125, 50);
      doc.setFont("helvetica", "bold");
      doc.text("VISITOR REGISTER REPORT", pageWidth / 2, yPosition, {
        align: "center",
      });

      // Report details
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      yPosition += 8;

      const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Add filter information
      const filterInfo = [];
      if (phoneFilter) filterInfo.push(`Phone: ${phoneFilter}`);
      if (nameFilter) filterInfo.push(`Name: ${nameFilter}`);
      if (officerNameFilter) filterInfo.push(`Officer: ${officerNameFilter}`);
      if (officerDesignationFilter)
        filterInfo.push(`Designation: ${officerDesignationFilter}`);
      if (officerDepartmentFilter)
        filterInfo.push(`Department: ${officerDepartmentFilter}`);
      if (officerUnitFilter) filterInfo.push(`Unit: ${officerUnitFilter}`);
      if (purposeFilter !== "all") filterInfo.push(`Purpose: ${purposeFilter}`);
      if (statusFilter !== "all") filterInfo.push(`Status: ${statusFilter}`);
      if (startTime || endTime) filterInfo.push("Time Range Filtered");

      doc.text(`Generated on: ${today}`, margin, yPosition);
      doc.text(
        `Total Visitors: ${exportVisitors.length}`,
        pageWidth - margin,
        yPosition,
        { align: "right" }
      );
      yPosition += 6;

      if (exportVisitors.length > 0) {
        const firstVisit = new Date(exportVisitors[0].visitTime);
        const lastVisit = new Date(
          exportVisitors[exportVisitors.length - 1].visitTime
        );
        doc.text(
          `Period: ${format(firstVisit, "dd/MM/yyyy")} - ${format(
            lastVisit,
            "dd/MM/yyyy"
          )}`,
          margin,
          yPosition
        );
        yPosition += 6;
      }

      // Show applied filters
      if (filterInfo.length > 0) {
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.text(
          `Applied Filters: ${filterInfo.join(", ")}`,
          margin,
          yPosition
        );
        doc.setTextColor(0, 0, 0);
        yPosition += 6;
      }

      // Add a horizontal line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Process visitors for PDF
      for (let index = 0; index < exportVisitors.length; index++) {
        const visitor = exportVisitors[index];

        // Check if we need a new page (each visitor card is 55mm height)
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 20;

          // Add header for new page
          doc.setFontSize(12);
          doc.setTextColor(46, 125, 50);
          doc.setFont("helvetica", "bold");
          doc.text(
            "VISITOR REGISTER REPORT (Continued)",
            pageWidth / 2,
            yPosition,
            { align: "center" }
          );

          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "normal");
          yPosition += 8;
          doc.text(
            `Page ${doc.internal.getNumberOfPages()} | Visitors ${
              index + 1
            }-${Math.min(
              index + 1 + Math.floor((pageHeight - 60 - yPosition) / 55),
              exportVisitors.length
            )}`,
            pageWidth / 2,
            yPosition,
            { align: "center" }
          );
          yPosition += 10;

          // Add line
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
        }

        // Visitor card background
        doc.setDrawColor(230, 230, 230);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(margin, yPosition, contentWidth, 50, 3, 3, "FD");
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, yPosition, contentWidth, 50, 3, 3, "S");

        // Visitor photo (left side - 40x40mm)
        const photoX = margin + 5;
        const photoY = yPosition + 5;
        const photoSize = 40;

        if (visitor.photo && visitor.photo.startsWith("data:image")) {
          try {
            // Create an image element
            const img = new Image();
            img.src = visitor.photo;

            await new Promise((resolve) => {
              img.onload = () => {
                // Calculate aspect ratio
                const width = img.width;
                const height = img.height;
                const aspectRatio = width / height;

                let displayWidth = photoSize;
                let displayHeight = photoSize;

                if (aspectRatio > 1) {
                  // Landscape image
                  displayHeight = photoSize / aspectRatio;
                  const verticalOffset = (photoSize - displayHeight) / 2;
                  doc.addImage(
                    visitor.photo,
                    "JPEG",
                    photoX,
                    photoY + verticalOffset,
                    photoSize,
                    displayHeight
                  );
                } else {
                  // Portrait or square image
                  displayWidth = photoSize * aspectRatio;
                  const horizontalOffset = (photoSize - displayWidth) / 2;
                  doc.addImage(
                    visitor.photo,
                    "JPEG",
                    photoX + horizontalOffset,
                    photoY,
                    displayWidth,
                    photoSize
                  );
                }

                // Add photo border
                doc.setDrawColor(180, 180, 180);
                doc.setLineWidth(0.5);
                doc.rect(photoX, photoY, photoSize, photoSize);

                resolve();
              };

              img.onerror = () => {
                // Placeholder if image fails
                doc.setFillColor(245, 245, 245);
                doc.roundedRect(
                  photoX,
                  photoY,
                  photoSize,
                  photoSize,
                  2,
                  2,
                  "F"
                );
                doc.setTextColor(180, 180, 180);
                doc.setFontSize(8);
                doc.text(
                  "Photo",
                  photoX + photoSize / 2,
                  photoY + photoSize / 2,
                  { align: "center" }
                );
                resolve();
              };
            });
          } catch (error) {
            console.warn("Could not add photo:", error);
            // Fallback placeholder
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(photoX, photoY, photoSize, photoSize, 2, 2, "F");
            doc.setTextColor(180, 180, 180);
            doc.setFontSize(8);
            doc.text("Photo", photoX + photoSize / 2, photoY + photoSize / 2, {
              align: "center",
            });
          }
        } else {
          // No photo
          doc.setFillColor(245, 245, 245);
          doc.roundedRect(photoX, photoY, photoSize, photoSize, 2, 2, "F");
          doc.setTextColor(180, 180, 180);
          doc.setFontSize(8);
          doc.text("No Photo", photoX + photoSize / 2, photoY + photoSize / 2, {
            align: "center",
          });
        }

        // Visitor details section (right of photo)
        const detailsX = margin + 55; // Photo width + margin
        const col1X = detailsX;
        const col2X = detailsX + 70; // Second column for officer details

        // Reset text color
        doc.setTextColor(0, 0, 0);

        // Visitor Number and Name
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${visitor.name}`, col1X, yPosition + 10);

        // Visitor Details Column
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");

        // Row 1: Phone
        doc.text(`Phone: ${visitor.phone}`, col1X, yPosition + 18);

        // Row 2: Purpose
        const purposeText = `Purpose: ${
          visitor.purpose?.toUpperCase() || "N/A"
        }`;
        doc.text(purposeText, col1X, yPosition + 24);

        // Row 3: Address (truncated if too long)
        const addressText = `Address: ${visitor.address || "N/A"}`;
        const maxAddressWidth = 65;
        const truncatedAddress = doc.splitTextToSize(
          addressText,
          maxAddressWidth
        );
        doc.text(truncatedAddress[0], col1X, yPosition + 30);

        // Row 4: Visit Time
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Visited: ${format(parseISO(visitor.visitTime), "dd/MM/yyyy HH:mm")}`,
          col1X,
          yPosition + 36
        );

        // Officer Details Column
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        // Officer header
        doc.setFont("helvetica", "bold");
        doc.text("Officer Details:", col2X, yPosition + 10);
        doc.setFont("helvetica", "normal");

        // Row 1: Officer Name
        doc.text(
          `Name: ${visitor.officer?.name || "N/A"}`,
          col2X,
          yPosition + 16
        );

        // Row 2: Designation
        doc.text(
          `Designation: ${visitor.officer?.designation || "N/A"}`,
          col2X,
          yPosition + 22
        );

        // Row 3: Department
        doc.text(
          `Department: ${visitor.officer?.department || "N/A"}`,
          col2X,
          yPosition + 28
        );

        // Row 4: Unit
        doc.text(
          `Unit: ${visitor.officer?.unit || "N/A"}`,
          col2X,
          yPosition + 34
        );

        // Row 5: Status
        const status = visitor.officer?.status || "unknown";
        const statusColor = status === "active" ? [46, 125, 50] : [239, 68, 68];
        doc.setTextColor(...statusColor);
        doc.text(`Status: ${status.toUpperCase()}`, col2X, yPosition + 40);

        // Reset text color for next visitor
        doc.setTextColor(0, 0, 0);

        // Add a subtle separator line between visitors
        yPosition += 55;

        if (index < exportVisitors.length - 1) {
          doc.setDrawColor(240, 240, 240);
          doc.setLineWidth(0.3);
          doc.line(
            margin + 10,
            yPosition - 2,
            pageWidth - margin - 10,
            yPosition - 2
          );
        }
      }

      // Add page numbers and footer
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(9);
      doc.setTextColor(150);

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // Page number
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
          align: "center",
        });

        // Footer text
        doc.setFontSize(7);
        doc.text(
          `Visitor Management System | ${
            exportVisitors.length
          } visitors | Generated: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: "center" }
        );

        // Footer line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      }

      // Save PDF
      const timestamp = format(new Date(), "yyyyMMdd-HHmmss");
      doc.save(`visitor-report-${timestamp}.pdf`);

      toast.success("PDF exported successfully!", { id: "pdf-export" });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Failed to export PDF. Please try again.", {
        id: "pdf-export",
      });
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
            {/* PDF Export Button */}
            <button
              onClick={exportToPDF}
              className="cursor-pointer flex items-center px-4 py-3 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Export filtered data to PDF"
            >
              <FiDownload className="h-5 w-5 mr-2" />
              Export PDF
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFilters(!showFilters);
              }}
              className="cursor-pointer flex items-center px-4 py-3 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiFilter className="h-5 w-5 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
            <button
              onClick={fetchVisitors}
              className="cursor-pointer flex items-center px-4 py-3 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Officer Unit
                  </label>
                  <input
                    type="text"
                    value={officerUnitFilter}
                    onChange={(e) => setOfficerUnitFilter(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
                    placeholder="Filter by unit..."
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Officer Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300"
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
                  Filter visitors who visited between the selected time range
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear All Filters
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : visitors.length === 0 ? (
          <div className="text-center py-16">
            <FiSearch className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No visitors found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm ||
              phoneFilter ||
              nameFilter ||
              officerNameFilter ||
              officerDesignationFilter ||
              officerDepartmentFilter ||
              officerUnitFilter ||
              startTime ||
              endTime ||
              purposeFilter !== "all"
                ? "Try adjusting your filters or search terms"
                : "No visitors have been registered yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[380px]">
                    Visitor Details
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[280px]">
                    Officer Details
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[280px]">
                    Visit Information
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visitors.map((visitor) => (
                  <React.Fragment key={visitor._id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer group"
                    >
                      {/* Visitor Details Column */}
                      <td className="px-8 py-6 align-top">
                        <div className="flex gap-6 items-start">
                          {/* Visitor Image (UNCHANGED SIZE) */}
                          <div className="flex-shrink-0">
                            {visitor.photo ? (
                              <div className="relative w-full max-w-sm">
                                <img
                                  src={visitor.photo}
                                  alt={visitor.name}
                                  className="w-full h-80 object-cover rounded-lg overflow-hidden"
                                />
                              </div>
                            ) : (
                              <div className="w-full h-80 rounded-lg bg-gradient-to-br from-blue-50 to-green-50 border border-gray-200 flex items-center justify-center">
                                <span className="text-3xl font-bold text-gray-600">
                                  {visitor.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Visitor Information */}
                          <div className="flex-1 min-w-0 flex flex-col pt-1">
                            {/* Name */}
                            <h4 className="text-base font-semibold text-gray-900 leading-tight mb-4">
                              {nameFilter ? (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html:
                                      visitor.name
                                        ?.toString()
                                        ?.replace(
                                          new RegExp(`(${nameFilter})`, "gi"),
                                          '<mark class="bg-yellow-100 px-1 rounded">$1</mark>'
                                        ) || "",
                                  }}
                                />
                              ) : (
                                highlightMatchedText(visitor.name, searchTerms)
                              )}
                            </h4>

                            {/* Info Blocks */}
                            <div className="space-y-4">
                              {/* Contact */}
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                  Contact
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-900">
                                  <FiPhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">
                                    {phoneFilter ? (
                                      <span
                                        dangerouslySetInnerHTML={{
                                          __html:
                                            visitor.phone
                                              ?.toString()
                                              ?.replace(
                                                new RegExp(
                                                  `(${phoneFilter})`,
                                                  "gi"
                                                ),
                                                '<mark class="bg-yellow-100 px-1 rounded">$1</mark>'
                                              ) || "",
                                        }}
                                      />
                                    ) : (
                                      highlightMatchedText(
                                        visitor.phone,
                                        searchTerms
                                      )
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Address */}
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                  Address
                                </p>
                                <div className="flex items-start gap-2 text-sm text-gray-600 max-w-xs">
                                  <FiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <span className="truncate">
                                    {highlightMatchedText(
                                      visitor.address,
                                      searchTerms
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Purpose */}
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                  Purpose
                                </p>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 capitalize">
                                  {purposeFilter !== "all" ? (
                                    <span
                                      dangerouslySetInnerHTML={{
                                        __html:
                                          visitor.purpose
                                            ?.toString()
                                            ?.replace(
                                              new RegExp(
                                                `(${purposeFilter})`,
                                                "gi"
                                              ),
                                              '<mark class="bg-yellow-100 px-1 rounded">$1</mark>'
                                            ) || "",
                                      }}
                                    />
                                  ) : (
                                    highlightMatchedText(
                                      visitor.purpose,
                                      searchTerms
                                    )
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Officer Details Column */}
                      <td className="px-8 py-6 align-top">
                        <div className="space-y-5">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                              Officer
                            </p>
                            <h5 className="text-lg font-semibold text-gray-900 mb-1">
                              {officerNameFilter ? (
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html:
                                      visitor.officer?.name
                                        ?.toString()
                                        ?.replace(
                                          new RegExp(
                                            `(${officerNameFilter})`,
                                            "gi"
                                          ),
                                          '<mark class="bg-yellow-100 text-gray-900 px-1 rounded">$1</mark>'
                                        ) || "N/A",
                                  }}
                                />
                              ) : (
                                highlightMatchedText(
                                  visitor.officer?.name,
                                  searchTerms
                                )
                              )}
                            </h5>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                Designation
                              </p>
                              <p className="text-sm text-gray-900">
                                {officerDesignationFilter ? (
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html:
                                        visitor.officer?.designation
                                          ?.toString()
                                          ?.replace(
                                            new RegExp(
                                              `(${officerDesignationFilter})`,
                                              "gi"
                                            ),
                                            '<mark class="bg-yellow-100 text-gray-900 px-1 rounded">$1</mark>'
                                          ) || "N/A",
                                    }}
                                  />
                                ) : (
                                  highlightMatchedText(
                                    visitor.officer?.designation,
                                    searchTerms
                                  )
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                Department
                              </p>
                              <p className="text-sm text-gray-900">
                                {officerDepartmentFilter ? (
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html:
                                        visitor.officer?.department
                                          ?.toString()
                                          ?.replace(
                                            new RegExp(
                                              `(${officerDepartmentFilter})`,
                                              "gi"
                                            ),
                                            '<mark class="bg-yellow-100 text-gray-900 px-1 rounded">$1</mark>'
                                          ) || "N/A",
                                    }}
                                  />
                                ) : (
                                  highlightMatchedText(
                                    visitor.officer?.department,
                                    searchTerms
                                  )
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                Unit
                              </p>
                              <p className="text-sm text-gray-900">
                                {officerUnitFilter ? (
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html:
                                        visitor.officer?.unit
                                          ?.toString()
                                          ?.replace(
                                            new RegExp(
                                              `(${officerUnitFilter})`,
                                              "gi"
                                            ),
                                            '<mark class="bg-yellow-100 text-gray-900 px-1 rounded">$1</mark>'
                                          ) || "N/A",
                                    }}
                                  />
                                ) : (
                                  visitor.officer?.unit || "N/A"
                                )}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                Status
                              </p>
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${
                                  visitor.officer?.status === "active"
                                    ? "bg-green-100 text-green-800 border border-green-200"
                                    : "bg-red-100 text-red-800 border border-red-200"
                                }`}
                              >
                                <FiActivity className="w-3 h-3 mr-1.5" />
                                {visitor.officer?.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Visit Information Column */}
                      <td className="px-8 py-6 align-top">
                        <div className="space-y-5">
                          <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-lg border border-blue-100">
                            <div className="flex items-center mb-3">
                              <FiCalendar className="w-4 h-4 text-blue-600 mr-2" />
                              <p className="text-sm font-medium text-gray-700">
                                Visit Date
                              </p>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              {format(
                                parseISO(visitor.visitTime),
                                "MMM dd, yyyy"
                              )}
                            </p>
                            <div className="flex items-center text-sm text-gray-600 mt-2">
                              <FiClock className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                              {format(
                                parseISO(visitor.visitTime),
                                "hh:mm:ss a"
                              )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                Registered On
                              </p>
                              <p className="text-sm text-gray-900">
                                {format(
                                  parseISO(visitor.createdAt),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(parseISO(visitor.createdAt), "hh:mm a")}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                Last Updated
                              </p>
                              <p className="text-sm text-gray-900">
                                {format(
                                  parseISO(visitor.updatedAt),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(parseISO(visitor.updatedAt), "hh:mm a")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
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
