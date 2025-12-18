/* eslint-disable no-unused-vars */
import React from "react";
import { motion } from "framer-motion";
import { FiHeart } from "react-icons/fi";

const Footer = ({ activeTab }) => {
  const currentYear = new Date().getFullYear();

  const handleArbeitClick = () => {
    window.open("https://arbeittechnology.com", "_blank");
  };

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="py-1"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="text-center md:text-left">
          <p className="text-xs text-gray-500">
            &copy; {currentYear} All rights reserved.
          </p>
        </div>

        <div className="flex items-center gap-1">
          <p className="text-xs text-gray-500">
            Developed with{" "}
            <FiHeart className="inline-block h-2.5 w-2.5 text-red-500" /> by
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleArbeitClick}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
          >
            Arbeit Technology
          </motion.button>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
