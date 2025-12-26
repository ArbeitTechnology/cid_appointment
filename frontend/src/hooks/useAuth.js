/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const BASE_URL = import.meta.env.VITE_API_URL;
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (
            !error.config?.url?.includes("/auth/login") &&
            !error.config?.url?.includes("/auth/register") &&
            !error.config?.url?.includes("/auth/forgot-password") &&
            !error.config?.url?.includes("/auth/reset-password")
          ) {
            logout();
            toast.error("Session expired. Please login again.", {
              duration: 3000,
              position: "top-center",
            });
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);

          // Optional: Validate token by making a profile request
          try {
            await axios.get(`${BASE_URL}/auth/profile`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
          } catch (error) {
            console.error("Token validation failed:", error);
            if (error.response?.status === 401) {
              logout();
              toast.error("Session expired. Please login again.", {
                duration: 3000,
                position: "top-center",
              });
            }
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback((userData, token) => {
    // Normalize user data structure
    const normalizedUser = {
      ...userData,
      // Ensure consistent userType
      userType: userData.userType || (userData.isOfficer ? "officer" : "user"),
      // Ensure hasAdminRole is boolean
      hasAdminRole:
        userData.hasAdminRole ||
        userData.userType === "admin" ||
        userData.userType === "super_admin" ||
        (userData.additionalRoles &&
          userData.additionalRoles.includes("admin")),
      // Ensure isOfficer is boolean
      isOfficer: userData.isOfficer || userData.userType === "officer" || false,
    };

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("token", token);
    setUser(normalizedUser);
    setToken(token);

    // Show login success message
    toast.success(`Welcome back, ${normalizedUser.name}!`, {
      duration: 2000,
      position: "top-center",
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("dashboardActiveTab");
    setUser(null);
    setToken(null);

    toast.success("Successfully logged out!", {
      duration: 2000,
      position: "top-center",
    });
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    const normalizedUser = {
      ...updatedUserData,
      userType:
        updatedUserData.userType ||
        (updatedUserData.isOfficer ? "officer" : "user"),
      hasAdminRole:
        updatedUserData.hasAdminRole ||
        updatedUserData.userType === "admin" ||
        updatedUserData.userType === "super_admin" ||
        (updatedUserData.additionalRoles &&
          updatedUserData.additionalRoles.includes("admin")),
      isOfficer:
        updatedUserData.isOfficer ||
        updatedUserData.userType === "officer" ||
        false,
    };

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    setUser(normalizedUser);

    toast.success("Profile updated successfully!", {
      duration: 2000,
      position: "top-center",
    });
  }, []);

  const getAllUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${BASE_URL}/auth/admin/all-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to fetch users";

      if (error.response?.status === 403) {
        toast.error("Admin access required");
      } else if (error.response?.status === 401) {
        toast.error("Please login again");
        logout();
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }, []);

  // Enhanced helper functions for user roles and permissions
  const checkPermission = useCallback(
    (requiredRoles, requiredAdmin = false) => {
      if (!user) return false;

      // Check user type
      const userRoles = [user.userType];

      // Include additional roles if they exist
      if (user.additionalRoles && Array.isArray(user.additionalRoles)) {
        userRoles.push(...user.additionalRoles);
      }

      // If user is officer with admin role, add admin to roles
      if (user.isOfficer && user.hasAdminRole) {
        userRoles.push("admin");
      }

      // Check if any required role matches user's roles
      const hasRole = requiredRoles.some((role) => userRoles.includes(role));

      // For admin-specific checks
      if (requiredAdmin) {
        const isAdmin =
          userRoles.includes("admin") ||
          userRoles.includes("super_admin") ||
          (user.isOfficer && user.hasAdminRole);
        return hasRole && isAdmin;
      }

      return hasRole;
    },
    [user]
  );

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    isLoading,
    getAllUsers,
    checkPermission,

    // Authentication status
    isAuthenticated: !!user && !!token,

    // User type checks
    isSuperAdmin: user?.userType === "super_admin",
    isAdmin:
      user?.userType === "admin" ||
      (user?.additionalRoles && user.additionalRoles.includes("admin")) ||
      (user?.isOfficer && user?.hasAdminRole),
    isOfficer: user?.userType === "officer" || user?.isOfficer,
    isRegularUser: user?.userType === "user" && !user?.isOfficer,

    // Status checks
    isActive: user?.status === "active",
    isInactive: user?.status === "inactive",

    // Helper functions
    getUserType: () => {
      if (!user) return "unknown";
      if (user.userType === "officer" || user.isOfficer) return "officer";
      return user.userType || "user";
    },

    getUserStatus: () => {
      if (!user) return "unknown";
      return user.status || "active";
    },

    // Quick access to common properties
    getUserName: () => user?.name || "User",
    getUserEmail: () => user?.email || user?.phone || "No contact info",
    getUserPhone: () => user?.phone || "No phone",

    // Check if user can access officer features
    canAccessOfficerFeatures: () => {
      if (!user) return false;
      return (
        user.userType === "officer" ||
        user.isOfficer ||
        user.officerId ||
        (user.additionalRoles && user.additionalRoles.includes("officer"))
      );
    },

    // Check if user can access admin features
    canAccessAdminFeatures: () => {
      if (!user) return false;
      return (
        user.userType === "super_admin" ||
        user.userType === "admin" ||
        (user.additionalRoles && user.additionalRoles.includes("admin")) ||
        (user.isOfficer && user.hasAdminRole)
      );
    },
  };

  return React.createElement(AuthContext.Provider, { value: value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
