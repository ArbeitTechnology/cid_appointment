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
  FiDownload,
  FiActivity,
  FiLayers,
} from "react-icons/fi";
import Webcam from "react-webcam";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AddVisitor = () => {
  const BASE_URL = import.meta.env.VITE_API_URL;
  const parseSearchTerms = (searchString) => {
    if (!searchString) return [];
    return searchString
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0);
  };
  // Form states
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [photo, setPhoto] = useState("");

  // Officer selection states (NEW: 3-level hierarchy)
  const [designationSearch, setDesignationSearch] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [officerSearch, setOfficerSearch] = useState("");
  const [uniqueDesignations, setUniqueDesignations] = useState([]);
  const [uniqueUnits, setUniqueUnits] = useState([]);
  const [officersByUnit, setOfficersByUnit] = useState([]);
  const [filteredDesignations, setFilteredDesignations] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [filteredOfficers, setFilteredOfficers] = useState([]);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [showOfficerDropdown, setShowOfficerDropdown] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [officerUnitFilter, setOfficerUnitFilter] = useState("");

  // Phone suggestions
  const [phoneSuggestions, setPhoneSuggestions] = useState([]);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [phoneChecking, setPhoneChecking] = useState(false);

  // Visitor list states
  const [visitors, setVisitors] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [officerNameFilter, setOfficerNameFilter] = useState("");
  const [officerDepartmentFilter, setOfficerDepartmentFilter] = useState("");
  const [officerDesignationFilter, setOfficerDesignationFilter] = useState("");
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Refs
  const webcamRef = useRef(null);
  const officerInputRef = useRef(null);
  const designationInputRef = useRef(null);
  const unitInputRef = useRef(null);
  const [cameraError, setCameraError] = useState(false);

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
  const selectedPurpose = watch("purpose");
  // Normalize phone number
  const normalizePhoneNumber = (phone) => {
    if (!phone) return "";
    let digits = phone.toString().replace(/\D/g, "");
    if (digits.startsWith("88") && digits.length === 12) {
      digits = digits.substring(2);
    } else if (digits.startsWith("1") && digits.length === 11) {
      digits = digits.substring(1);
    }
    return digits;
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset pagination on filter change
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

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        designationInputRef.current &&
        !designationInputRef.current.contains(event.target)
      ) {
        setShowDesignationDropdown(false);
      }
      if (
        unitInputRef.current &&
        !unitInputRef.current.contains(event.target)
      ) {
        setShowUnitDropdown(false);
      }
      if (
        officerInputRef.current &&
        !officerInputRef.current.contains(event.target)
      ) {
        setShowOfficerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch visitors
  const fetchVisitors = useCallback(async () => {
    try {
      setListLoading(true);
      const token = localStorage.getItem("token");
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (phoneFilter) params.phone = phoneFilter;
      if (nameFilter) params.name = nameFilter;
      if (officerNameFilter) params.officerName = officerNameFilter;
      if (officerDepartmentFilter)
        params.officerDepartment = officerDepartmentFilter;
      if (officerDesignationFilter)
        params.officerDesignation = officerDesignationFilter;
      if (officerUnitFilter) params.officerUnit = officerUnitFilter; // NEW
      if (purposeFilter !== "all") params.purpose = purposeFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (debouncedSearchTerm) {
        if (debouncedSearchTerm.includes(",")) {
          params.multiSearch = debouncedSearchTerm;
        } else {
          params.search = debouncedSearchTerm;
        }
      }
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;

      const response = await axios.get(`${BASE_URL}/visitors/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setVisitors(response.data.visitors || []);
      setTotalVisitors(response.data.total || 0);
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
    officerUnitFilter, // NEW
    purposeFilter,
    statusFilter,
    startTime,
    endTime,
  ]);

  // Initialize camera
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
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
  }, []);

  // Phone number check
  useEffect(() => {
    const checkPhoneNumber = async () => {
      if (phoneValue?.length >= 10) {
        const normalizedPhone = normalizePhoneNumber(phoneValue);
        if (normalizedPhone.length >= 10) {
          setPhoneChecking(true);
          try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
              `${BASE_URL}/visitors/check-phone/${normalizedPhone}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            if (response.data.exists && response.data.visitors?.length > 0) {
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
        }
      } else {
        setPhoneSuggestions([]);
        setShowPhoneSuggestions(false);
        setPhoneChecking(false);
      }
    };

    const timer = setTimeout(checkPhoneNumber, 800);
    return () => clearTimeout(timer);
  }, [phoneValue]);

  // Fetch designations
  const fetchUniqueDesignations = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/officers/designations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUniqueDesignations(response.data.designations);
      setFilteredDesignations(response.data.designations);
    } catch (error) {
      console.error("Error fetching designations:", error);
    }
  }, []);

  // Fetch units by designation
  const fetchUnitsByDesignation = useCallback(async (designation) => {
    try {
      const token = localStorage.getItem("token");

      // URL encode the designation to handle special characters
      const encodedDesignation = encodeURIComponent(designation);

      const response = await axios.get(`${BASE_URL}/officers/units`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { designation: encodedDesignation },
      });
      setUniqueUnits(response.data.units || []);
      setFilteredUnits(response.data.units || []);
    } catch (error) {
      console.error("Error fetching units:", error);
      toast.error("Failed to fetch units");
    }
  }, []);

  // Fetch officers by unit
  const fetchOfficersByUnit = useCallback(async (designation, unit) => {
    try {
      const token = localStorage.getItem("token");

      // URL encode both designation and unit
      const encodedDesignation = encodeURIComponent(designation);
      const encodedUnit = encodeURIComponent(unit);

      const response = await axios.get(
        `${BASE_URL}/officers/by-designation-unit`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            designation: encodedDesignation,
            unit: encodedUnit,
          },
        }
      );
      setOfficersByUnit(response.data.officers || []);
      setFilteredOfficers(response.data.officers || []);
    } catch (error) {
      console.error("Error fetching officers by unit:", error);
      toast.error("Failed to fetch officers");
    }
  }, []);

  // Filter dropdowns
  useEffect(() => {
    if (designationSearch) {
      // Escape special regex characters for safe filtering
      const escapedSearch = designationSearch.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      const regex = new RegExp(escapedSearch, "i");
      setFilteredDesignations(uniqueDesignations.filter((d) => regex.test(d)));
    } else {
      setFilteredDesignations(uniqueDesignations);
    }
  }, [designationSearch, uniqueDesignations]);

  useEffect(() => {
    if (unitSearch) {
      // Escape special regex characters for safe filtering
      const escapedSearch = unitSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedSearch, "i");
      setFilteredUnits(uniqueUnits.filter((u) => regex.test(u)));
    } else {
      setFilteredUnits(uniqueUnits);
    }
  }, [unitSearch, uniqueUnits]);

  useEffect(() => {
    if (officerSearch) {
      // Escape special regex characters for safe filtering
      const escapedSearch = officerSearch.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      const regex = new RegExp(escapedSearch, "i");

      setFilteredOfficers(
        officersByUnit.filter(
          (officer) =>
            regex.test(officer.name) ||
            regex.test(officer.designation) ||
            regex.test(officer.department)
        )
      );
    } else {
      setFilteredOfficers(officersByUnit);
    }
  }, [officerSearch, officersByUnit]);
  // Event handlers
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

  const retakePhoto = () => {
    setPhoto("");
    toast.success("Ready to take new photo!");
  };

  const selectDesignation = (designation) => {
    setSelectedDesignation(designation);
    setDesignationSearch(designation);
    setShowDesignationDropdown(false);
    setSelectedUnit("");
    setUnitSearch("");
    setSelectedOfficer(null);
    setOfficersByUnit([]);
    fetchUnitsByDesignation(designation);
  };

  const selectUnit = (unit) => {
    setSelectedUnit(unit);
    setUnitSearch(unit);
    setShowUnitDropdown(false);
    setSelectedOfficer(null);
    setOfficersByUnit([]);
    if (selectedDesignation) {
      fetchOfficersByUnit(selectedDesignation, unit);
    }
  };

  const selectOfficer = (officer) => {
    setSelectedOfficer(officer);
    setOfficerSearch(`${officer.name} - ${officer.designation}`);
    setShowOfficerDropdown(false);
  };

  const selectPhoneSuggestion = async (visitor) => {
    setValue("name", visitor.name);
    setValue("address", visitor.address);
    setShowPhoneSuggestions(false);
    clearErrors("name");
    clearErrors("address");
    await trigger(["name", "address"]);
    toast.success("Visitor details auto-filled from previous visit!");
  };

  const onSubmit = async (data) => {
    if (!selectedOfficer) {
      toast.error("Please select an officer");
      return;
    }
    if (!photo) {
      toast.error("Please capture a photo of the visitor");
      return;
    }

    const normalizedPhone = normalizePhoneNumber(data.phone);
    if (normalizedPhone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      // IMPORTANT: Use _id if that's what comes from the API
      const officerId = selectedOfficer._id || selectedOfficer.id;

      if (!officerId) {
        toast.error("Officer ID is missing");
        setIsLoading(false);
        return;
      }

      await axios.post(
        `${BASE_URL}/visitors/add`,
        {
          ...data,
          phone: normalizedPhone,
          officerId: officerId, // This should match what backend expects
          photo,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Visitor added successfully!");
      setShowSuccess(true);

      // Reset form but keep camera
      reset();
      setPhoto("");
      setSelectedOfficer(null);
      setSelectedDesignation("");
      setSelectedUnit("");
      setDesignationSearch("");
      setUnitSearch("");
      setOfficerSearch("");
      setPhoneSuggestions([]);
      setShowPhoneSuggestions(false);

      // Refresh visitor list
      fetchVisitors();

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to add visitor";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // PDF Export Function (NEW)
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

  // Other utility functions (highlight text, pagination, etc.)
  // Helper function to escape regex special characters
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  };

  // Highlight matched text
  const highlightMatchedText = (text, searchTerms) => {
    if (!searchTerms || searchTerms.length === 0 || !text) {
      return <span>{text}</span>;
    }

    try {
      let highlightedText = text.toString();

      // Escape all search terms before joining
      const escapedTerms = searchTerms.map((term) => escapeRegExp(term.trim()));
      const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");

      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 text-gray-900 rounded">$1</mark>'
      );

      return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
    } catch (error) {
      console.error("Error highlighting text:", error);
      // Fallback: return text without highlighting
      return <span>{text}</span>;
    }
  };

  const searchTerms = useMemo(() => {
    const terms = [];

    // ONLY include comma-separated search terms from the main search box
    if (searchTerm.includes(",")) {
      parseSearchTerms(searchTerm).forEach((term) => terms.push(term));
    } else if (searchTerm) {
      terms.push(searchTerm);
    }

    // DO NOT add any individual filter terms here
    // They will be handled separately for each field

    return terms.filter((term) => term && term.trim().length > 0);
  }, [
    searchTerm, // ONLY keep searchTerm as dependency
  ]);

  // Helper function to highlight text based on specific filter
  const highlightSpecificField = (text, specificFilter) => {
    if (!text || !specificFilter) return text;

    const textStr = text.toString();
    const filterStr = specificFilter.toString().trim();

    if (!filterStr) return textStr;

    return (
      <span
        dangerouslySetInnerHTML={{
          __html: textStr.replace(
            new RegExp(`(${filterStr})`, "gi"),
            '<mark class="bg-yellow-200 text-gray-900 rounded">$1</mark>'
          ),
        }}
      />
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPhoneFilter("");
    setNameFilter("");
    setOfficerNameFilter("");
    setOfficerDepartmentFilter("");
    setOfficerDesignationFilter("");
    setOfficerUnitFilter("");
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

  // Load initial data
  useEffect(() => {
    fetchUniqueDesignations();
    fetchVisitors();
  }, [fetchUniqueDesignations, fetchVisitors]);

  const purposes = useMemo(() => {
    const purposeSet = new Set();
    visitors.forEach((visitor) => purposeSet.add(visitor.purpose));
    return Array.from(purposeSet);
  }, [visitors]);

  return (
    <div className="space-y-6">
      {/* Success Message */}
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
              <button
                onClick={() => setShowSuccess(false)}
                className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
              >
                <span className="sr-only">Dismiss</span>
                <FiX className="h-5 w-5" />
              </button>
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

            {/* Photo Display - LARGER 400px height */}
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
                      className="w-full h-100 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          retakePhoto();
                        }}
                        className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                        title="Remove photo"
                      >
                        <FiX className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      Photo Captured
                    </div>
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        retakePhoto();
                      }}
                      className="px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center font-medium mx-auto"
                    >
                      <FiRefreshCw className="h-4 w-4 mr-2" />
                      Retake Photo
                    </button>
                  </div>
                </motion.div>
              ) : cameraError ? (
                <div className="space-y-3">
                  <div className="h-100 flex flex-col items-center justify-center bg-gray-100 rounded-lg border-2 border-gray-300">
                    <FiCamera className="h-16 w-16 text-gray-400 mb-3" />
                    <p className="text-gray-500 font-medium">Camera Error</p>
                    <p className="text-gray-400 text-sm text-center px-4 mt-1">
                      Please allow camera permissions or check your camera
                    </p>
                    <p className="text-xs text-red-500 text-center">
                      Camera access is required to capture visitor photos
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full h-100 object-cover" // CHANGED: 400px height
                      videoConstraints={{
                        facingMode: "user",
                        width: { ideal: 680 },
                        height: { ideal: 580 },
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
                      onClick={(e) => {
                        e.stopPropagation();
                        capturePhoto();
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-medium mx-auto"
                    >
                      <FiCamera className="h-4 w-4 mr-2" />
                      Capture Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
              {/* Phone Input with Suggestions */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <span className="flex items-center">
                    <FiPhone className="w-4 h-4 mr-2 text-gray-600" />
                    Mobile Number
                  </span>
                  {phoneChecking && (
                    <span className="ml-2 text-xs text-blue-600">
                      Checking...
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    {...register("phone", {
                      required: "Mobile number is required",
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
                    } placeholder-gray-500`}
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
                          Found {phoneSuggestions.length} previous visits with
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

                {phoneValue?.length >= 10 &&
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
                    Full Name
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
                    Address
                  </span>
                </label>
                <textarea
                  {...register("address", { required: "Address is required" })}
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

              {/* 3-LEVEL OFFICER SELECTION - NEW */}

              {/* Designation */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  <span className="flex items-center">
                    <FiBriefcase className="w-4 h-4 mr-2 text-gray-600" />
                    Filter by Designation
                  </span>
                </label>
                <div ref={designationInputRef} className="relative">
                  <input
                    type="text"
                    value={designationSearch}
                    onChange={(e) => {
                      setDesignationSearch(e.target.value);
                      setShowDesignationDropdown(true);
                    }}
                    onFocus={() => setShowDesignationDropdown(true)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-green-600 transition-all duration-300 placeholder-gray-500"
                    placeholder="Search designation..."
                  />
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
                                value={designationSearch}
                                onChange={(e) =>
                                  setDesignationSearch(e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500"
                                placeholder="Filter designations..."
                              />
                            </div>
                          </div>
                          {filteredDesignations.map((designation) => (
                            <button
                              key={designation}
                              type="button"
                              onClick={() => selectDesignation(designation)}
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

              {/* Unit - Shows after designation */}
              {selectedDesignation && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <span className="flex items-center">
                      <FiBriefcase className="w-4 h-4 mr-2 text-gray-600" />
                      Select Unit
                    </span>
                  </label>
                  <div ref={unitInputRef} className="relative">
                    <input
                      type="text"
                      value={unitSearch}
                      onChange={(e) => {
                        setUnitSearch(e.target.value);
                        setShowUnitDropdown(true);
                      }}
                      onFocus={() => setShowUnitDropdown(true)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-green-600 transition-all duration-300 placeholder-gray-500"
                      placeholder="Search unit..."
                    />
                    <AnimatePresence>
                      {showUnitDropdown && uniqueUnits.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-50 overflow-y-auto"
                        >
                          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
                            <p className="text-xs font-medium text-blue-700">
                              Found {filteredUnits.length} units
                            </p>
                          </div>
                          {filteredUnits.map((unit, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => selectUnit(unit)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors group"
                            >
                              <div className="font-medium text-gray-900 group-hover:text-blue-700">
                                {unit}
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Officer - Shows after unit */}
              {selectedUnit && selectedDesignation && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <span className="flex items-center">
                      <FiUser className="w-4 h-4 mr-2 text-gray-600" />
                      Select Officer
                    </span>
                  </label>
                  <div ref={officerInputRef} className="relative">
                    <input
                      type="text"
                      value={officerSearch}
                      onChange={(e) => {
                        setOfficerSearch(e.target.value);
                        setShowOfficerDropdown(true);
                      }}
                      onFocus={() => setShowOfficerDropdown(true)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-0 focus:border-green-600 transition-all duration-300 placeholder-gray-500"
                      placeholder={`Search officers in ${selectedDesignation} - ${selectedUnit}...`}
                    />
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
                              Found {filteredOfficers.length} officers
                            </p>
                          </div>
                          {filteredOfficers.map((officer) => (
                            <button
                              key={officer.id}
                              type="button"
                              onClick={() => selectOfficer(officer)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors group"
                            >
                              <div className="font-medium text-gray-900 group-hover:text-blue-700">
                                {officer.name}
                              </div>
                              <div className="text-sm text-gray-500 group-hover:text-blue-600">
                                {officer.designation} - {officer.department} |
                                BP: {officer.bpNumber}
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

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
                      <div className="text-xs text-green-600 mt-1">
                        BP: {selectedOfficer.bpNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOfficer(null);
                        setOfficerSearch("");
                        setSelectedUnit("");
                        setUnitSearch("");
                      }}
                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Purpose */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Purpose
                </label>
                <select
                  {...register("purpose", { required: "Purpose is required" })}
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

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={
                  isLoading || !selectedOfficer || !photo || !selectedPurpose
                }
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Adding Visitor...
                  </>
                ) : (
                  "Add Visitor"
                )}
              </motion.button>
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
                  <h2 className="text-xl font-bold text-gray-900">
                    Visitor List
                  </h2>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {totalVisitors}
                  </p>
                  <p className="text-sm text-gray-600">Total Visitors</p>
                </div>
              </div>

              {/* Search and Filter Controls + NEW PDF Export */}
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
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 placeholder-gray-500"
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
                    {/* NEW: PDF Export Button */}
                    <button
                      onClick={exportToPDF}
                      className="cursor-pointer flex items-center px-3 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      title="Export filtered data to PDF"
                    >
                      <FiDownload className="h-4 w-4 mr-2" />
                      Export PDF
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFilters(!showFilters);
                      }}
                      className="cursor-pointer flex items-center px-3 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      <FiFilter className="h-4 w-4 mr-2" />
                      {showFilters ? "Hide Filters" : "Filters"}
                    </button>
                    <button
                      onClick={fetchVisitors}
                      className="cursor-pointer flex items-center px-3 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={phoneFilter}
                          onChange={(e) => setPhoneFilter(e.target.value)}
                          className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 text-sm placeholder-gray-500"
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
                          className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 text-sm placeholder-gray-500"
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
                          className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 text-sm placeholder-gray-500"
                          placeholder="Filter by officer..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Officer Designation
                        </label>
                        <input
                          type="text"
                          value={officerDesignationFilter}
                          onChange={(e) =>
                            setOfficerDesignationFilter(e.target.value)
                          }
                          className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 text-sm placeholder-gray-500"
                          placeholder="Filter by designation..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Officer Department
                        </label>
                        <input
                          type="text"
                          value={officerDepartmentFilter}
                          onChange={(e) =>
                            setOfficerDepartmentFilter(e.target.value)
                          }
                          className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 text-sm placeholder-gray-500"
                          placeholder="Filter by department..."
                        />
                      </div>
                      {/* NEW: Officer Unit Filter */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Officer Unit
                        </label>
                        <input
                          type="text"
                          value={officerUnitFilter}
                          onChange={(e) => setOfficerUnitFilter(e.target.value)}
                          className="w-full px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-green-600 focus:outline-none focus:ring-0 transition-all duration-300 text-sm placeholder-gray-500"
                          placeholder="Filter by unit..."
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
                    </div>
                    <div className="lg:col-span-3">
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
                    <div className="flex justify-end">
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
            {/* Visitors Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {listLoading ? (
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
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">
                          Visitor Details
                        </th>
                        <th className="px-2 py-4 text-left text-sm font-semibold text-gray-900">
                          Contact Information
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900">
                          Officer Information
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {visitors.map((visitor) => (
                        <React.Fragment key={visitor._id}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="hover:bg-gray-50 transition-colors duration-150"
                          >
                            {/* Column 1: Visitor Details */}
                            <td className="px-4 py-4 sm:px-4 md:px-4 align-top">
                              <div className="flex items-start space-x-4 sm:space-x-6">
                                <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-60 lg:h-70 xl:w-80 xl:h-70">
                                  {visitor.photo ? (
                                    <div className="relative w-full h-full">
                                      <img
                                        src={visitor.photo}
                                        alt={visitor.name}
                                        className="w-full h-full object-contain rounded-lg"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-full h-full rounded-lg bg-linear-to-br from-blue-50 to-green-50 border border-gray-200 flex items-center justify-center">
                                      <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-600">
                                        {visitor.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Column 2: Contact Information */}
                            <td className="px-2 py-4 sm:px-2 md:px-2 align-top">
                              <div className="space-y-4 sm:space-y-6">
                                <div className="mb-4 sm:mb-6">
                                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                                    {nameFilter ? (
                                      <span
                                        dangerouslySetInnerHTML={{
                                          __html:
                                            visitor.name
                                              ?.toString()
                                              ?.replace(
                                                new RegExp(
                                                  `(${nameFilter})`,
                                                  "gi"
                                                ),
                                                '<mark class="bg-yellow-100 rounded">$1</mark>'
                                              ) || "",
                                        }}
                                      />
                                    ) : (
                                      highlightMatchedText(
                                        visitor.name,
                                        searchTerms
                                      )
                                    )}
                                  </h3>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 flex items-center">
                                    <FiPhone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-1 sm:mr-2" />
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
                                                '<mark class="bg-yellow-100 rounded">$1</mark>'
                                              ) || "",
                                        }}
                                      />
                                    ) : (
                                      highlightMatchedText(
                                        visitor.phone,
                                        searchTerms
                                      )
                                    )}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3 flex items-center">
                                    <FiMapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 mr-1 sm:mr-2" />
                                    {highlightMatchedText(
                                      visitor.address,
                                      searchTerms
                                    )}
                                  </p>
                                </div>
                                <div className="mt-3 sm:mt-4">
                                  <span className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
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
                                                '<mark class="bg-yellow-100 rounded">$1</mark>'
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
                                <div className="mt-3 sm:mt-4">
                                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 sm:mb-2">
                                    Visited At
                                  </p>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {format(
                                        parseISO(visitor.createdAt),
                                        "MMM dd, yyyy"
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">
                                      {format(
                                        parseISO(visitor.visitTime),
                                        "hh:mm:ss a"
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Column 3: Officer Information */}
                            <td className="px-4 py-4 sm:px-4 md:px-4 align-top">
                              <div className="space-y-4 sm:space-y-6">
                                <div>
                                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
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
                                                '<mark class="bg-yellow-100 text-gray-900 rounded">$1</mark>'
                                              ) || "N/A",
                                        }}
                                      />
                                    ) : (
                                      highlightMatchedText(
                                        visitor.officer?.name,
                                        searchTerms
                                      )
                                    )}
                                  </h4>
                                </div>

                                <div className="grid grid-cols-1 gap-2 sm:gap-4">
                                  <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                      Designation
                                    </p>
                                    <p className="text-xs sm:text-sm font-medium text-gray-900">
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
                                                  '<mark class="bg-yellow-100 text-gray-900 rounded">$1</mark>'
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
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                      Department
                                    </p>
                                    <p className="text-xs sm:text-sm font-medium text-gray-900">
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
                                                  '<mark class="bg-yellow-100 text-gray-900 rounded">$1</mark>'
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
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                      Unit
                                    </p>
                                    <p className="text-xs sm:text-sm font-medium text-gray-900">
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
                                                  '<mark class="bg-yellow-100 text-gray-900 rounded">$1</mark>'
                                                ) || "N/A",
                                          }}
                                        />
                                      ) : (
                                        visitor.officer?.unit || "N/A"
                                      )}
                                    </p>
                                  </div>

                                  <div>
                                    <span
                                      className={`inline-flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium ${
                                        visitor.officer?.status === "active"
                                          ? "bg-green-100 text-green-800 border border-green-200"
                                          : "bg-red-100 text-red-800 border border-red-200"
                                      }`}
                                    >
                                      <FiActivity className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 sm:mr-1.5" />
                                      {visitor.officer?.status}
                                    </span>
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
        </motion.div>
      </div>
    </div>
  );
};

export default AddVisitor;
