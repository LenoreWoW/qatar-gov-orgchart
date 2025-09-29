import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Plus, Trash2, User, Eye, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";
import { Button } from "./button";
import { useAuth } from "../../context/AuthContext";
import { getUserPermissions } from "../../utils/permissions";

interface OrgPosition {
  id: string;
  titleEn: string;
  titleAr: string;
  holder?: string;
  department?: string;
  level: number;
  children?: OrgPosition[];
}

interface OrgCardProps {
  position: OrgPosition;
  isRTL?: boolean;
  expanded?: boolean;
  onEdit?: (position: OrgPosition) => void;
  onDelete?: (position: OrgPosition) => void;
  onAddChild?: (position: OrgPosition) => void;
  onCardClick?: (position: OrgPosition) => void;
  onViewDetails?: (position: OrgPosition) => void;
}

export const OrgCard: React.FC<OrgCardProps> = ({
  position,
  isRTL = false,
  expanded = false,
  onEdit,
  onDelete,
  onAddChild,
  onCardClick,
  onViewDetails,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Try to get auth context, but fallback to default permissions if not available
  let user = null;
  let permissions = null;

  try {
    const authContext = useAuth();
    user = authContext.user;
    permissions = getUserPermissions(user);
  } catch (error) {
    // If AuthProvider is not available, use default admin permissions
    permissions = {
      canCreatePosition: true,
      canEditPosition: true,
      canDeletePosition: true,
      canViewPosition: true,
      canManageEmployees: true,
      canAssignEmployees: true,
      canEditEmployeeInfo: true,
      canManageKeyResponsibilities: true,
      canManageContactInfo: true,
      canManageUsers: true,
      canAccessCompliance: true,
      canExportData: true,
      canAccessDashboard: true,
    };
  }

  // Helper functions to determine organization type and position level
  const getOrganizationType = (pos: OrgPosition) => {
    if (pos.level === 0) return "ministry"; // Prime Minister Office
    if (pos.level === 1) return "ministry"; // Ministers
    if (pos.level === 2) return "department"; // Deputy Ministers/Director Generals
    if (pos.level === 3) return "department"; // Directors/Assistant Director
    if (pos.level === 4) return "subdepartment"; // Assistant Directors/Managers
    if (pos.level === 5) return "unit"; // Heads/Managers
    if (pos.level === 6) return "unit"; // Coordinators/Supervisors
    if (pos.level === 7) return "section"; // Team Leaders
    if (pos.level === 8) return "section"; // Supervisors
    if (pos.level >= 9) return "team"; // Officers and Specialists
    return "position";
  };

  const getPositionLevel = (pos: OrgPosition) => {
    if (pos.level === 0) return "prime_minister";
    if (pos.level === 1) return "minister";
    if (pos.level === 2) return "deputy_minister";
    if (pos.level === 3) return "undersecretary";
    if (pos.level === 4) return "assistant_undersecretary";
    if (pos.level === 5) return "director";
    if (pos.level === 6) return "deputy_director";
    if (pos.level >= 7) return "manager";
    return "officer";
  };

  // Dynamic styling based on organization type
  const getOrganizationTypeStyle = () => {
    const orgType = getOrganizationType(position);

    switch (orgType) {
      case "ministry":
        return "bg-gradient-to-br from-qatar-maroon to-qatar-maroon/90 text-white border-qatar-maroon shadow-2xl";
      case "department":
        return "bg-gradient-to-br from-blue-600 to-blue-500 text-white border-blue-600 shadow-xl";
      case "subdepartment":
        return "bg-gradient-to-br from-green-600 to-green-500 text-white border-green-600 shadow-lg";
      case "unit":
        return "bg-gradient-to-br from-purple-600 to-purple-500 text-white border-purple-600 shadow-lg";
      case "section":
        return "bg-gradient-to-br from-orange-500 to-orange-400 text-white border-orange-500 shadow-md";
      case "team":
        return "bg-gradient-to-br from-teal-500 to-teal-400 text-white border-teal-500 shadow-md";
      default:
        return "bg-white text-qatar-maroon border border-qatar-maroon/20 shadow-md";
    }
  };

  // Color for person's name based on position level
  const getPositionLevelColor = () => {
    const posLevel = getPositionLevel(position);

    switch (posLevel) {
      case "prime_minister": return "text-amber-300 font-extrabold";
      case "minister": return "text-yellow-200 font-bold";
      case "deputy_minister": return "text-blue-200 font-bold";
      case "undersecretary": return "text-green-200 font-bold";
      case "assistant_undersecretary": return "text-purple-200 font-semibold";
      case "director": return "text-orange-200 font-semibold";
      case "deputy_director": return "text-teal-200 font-semibold";
      case "manager": return "text-gray-200 font-medium";
      case "specialist": return "text-gray-300 font-medium";
      default: return "text-white font-normal";
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };


  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative"
    >
      <Card
        className={cn(
          "w-[300px] min-h-[160px] flex-shrink-0 transition-all duration-300 cursor-pointer",
          getOrganizationTypeStyle(),
          isHovered && "ring-2 ring-qatar-gold ring-offset-2"
        )}
        onClick={() => {
          onCardClick?.(position);
        }}
      >
        <CardHeader className="pb-3">
          <div className={cn("flex items-start justify-between", isRTL && "flex-row-reverse")}>
            <div className={cn("flex-1", isRTL && "text-right")}>
              <CardTitle className={cn(
                "text-lg font-bold",
                isRTL && "font-arabic",
                position.level === 0 ? "text-white" : "",
                position.level === 1 ? "text-white" : ""
              )}>
                {isRTL ? position.titleAr : position.titleEn}
              </CardTitle>
              <CardDescription className={cn(
                "mt-1 text-sm opacity-90",
                !isRTL && "font-english",
                position.level === 0 ? "text-white/90" : "",
                position.level === 1 ? "text-white/90" : ""
              )}>
                {isRTL ? position.titleEn : position.titleAr}
              </CardDescription>
            </div>

            {/* Action buttons with animations */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: isRTL ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isRTL ? -10 : 10 }}
                  className={cn("flex gap-1", isRTL && "flex-row-reverse")}
                >
                  {/* Edit button - only for admin and planner */}
                  {onEdit && (permissions.canEditPosition || (permissions.canManageEmployees && position.holder)) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(position);
                      }}
                      title={permissions.canEditPosition ? "Edit Position" : "Edit Employee Info"}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {/* View details - always available */}
                  {onViewDetails && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 hover:bg-blue-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(position);
                      }}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Add child - only for admin and planner */}
                  {onAddChild && permissions.canCreatePosition && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 hover:bg-white/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddChild(position);
                      }}
                      title="Add Sub-Position"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Delete button - only for admin and planner, not for PM */}
                  {onDelete && position.level > 0 && permissions.canDeletePosition && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 hover:bg-red-500/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(position);
                      }}
                      title="Delete Position"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Position holder with animation */}
          {position.holder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn("flex items-center gap-2 mb-2", isRTL && "flex-row-reverse")}
            >
              <User className="h-4 w-4 opacity-70" />
              <span className={cn("text-sm", getPositionLevelColor())}>
                {position.holder}
              </span>
            </motion.div>
          )}

          {/* Department info */}
          {position.department && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xs opacity-80"
            >
              {position.department}
            </motion.div>
          )}

          {/* Expand/Collapse indicator */}
          {position.children && position.children.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-3 flex items-center justify-center"
            >
              <div className="flex items-center gap-1 text-xs opacity-70">
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span>Click to collapse</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span>Click to expand ({position.children.length})</span>
                  </>
                )}
              </div>
            </motion.div>
          )}

        </CardContent>

      </Card>

      {/* Animated connection line */}
      {position.level > 0 && (
        <motion.div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-qatar-maroon/30"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{ originY: 0 }}
        />
      )}
    </motion.div>
  );
};