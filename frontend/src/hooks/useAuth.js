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
            !error.config?.url?.includes("/auth/register")
          ) {
            logout();
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
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);
    setToken(token);
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
    localStorage.setItem("user", JSON.stringify(updatedUserData));
    setUser(updatedUserData);
  }, []);

  const getAllUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://api.appoinment.arbeitonline.top/api/auth/admin/all-users",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Failed to fetch users";

      if (error.response?.status === 403) {
        toast.error("Admin access required");
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }, []);

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    isLoading,
    getAllUsers,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.userType === "admin",
    isActive: user?.status === "active",
    isInactive: user?.status === "inactive",
    getUserStatus: () => {
      if (!user) return "unknown";
      return user.status || "unknown";
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
