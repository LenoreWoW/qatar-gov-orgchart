import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  level,
  onClick,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  level?: number;
  onClick?: () => void;
}) => {
  // Dynamic sizing based on hierarchy level
  const getSizeClass = () => {
    if (level === 0) return "md:col-span-2 md:row-span-2"; // Prime Minister
    if (level === 1) return "md:col-span-1 md:row-span-1"; // Ministers
    return "md:col-span-1 md:row-span-1"; // Others
  };

  // Dynamic background based on level
  const getBgClass = () => {
    if (level === 0) return "bg-gradient-to-br from-qatar-maroon to-qatar-maroon/80 text-white";
    if (level === 1) return "bg-gradient-to-br from-qatar-maroon/70 to-qatar-maroon/60 text-white";
    if (level === 2) return "bg-gradient-to-br from-white to-qatar-gold/10 border-2 border-qatar-maroon/30";
    return "bg-white border border-qatar-maroon/20";
  };

  return (
    <motion.div
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 border border-transparent justify-between flex flex-col space-y-4 cursor-pointer",
        getSizeClass(),
        getBgClass(),
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, translateY: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        <div className="font-sans font-bold mb-2 mt-2">
          {title}
        </div>
        <div className="font-sans font-normal text-xs opacity-80">
          {description}
        </div>
      </div>
    </motion.div>
  );
};