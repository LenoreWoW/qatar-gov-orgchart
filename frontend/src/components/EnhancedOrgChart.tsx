import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Grid3x3, List, Maximize2, Minimize2, X, User, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { OrgCard } from "./ui/org-card";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";
import { TextGenerateEffect } from "./ui/text-generate-effect";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { TreeViewSkeleton, GridViewSkeleton, LoadingSpinner, ProgressBar } from "./ui/skeleton";
import { Breadcrumb, BreadcrumbCompact, type BreadcrumbItem } from "./ui/breadcrumb";
import { PositionContextMenu } from "./PositionContextMenu";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./CommandPalette";
import { useKeyboardShortcuts, createShortcuts } from "../hooks/useKeyboardShortcuts";

interface Position {
  id: string;
  titleEn: string;
  titleAr: string;
  holder?: string;
  department?: string;
  level: number;
  organizationType?: "ministry" | "department" | "subdepartment" | "unit" | "section" | "team" | "position";
  positionLevel?: "prime_minister" | "minister" | "deputy_minister" | "undersecretary" | "assistant_undersecretary" | "director" | "deputy_director" | "manager" | "specialist" | "officer";
  children?: Position[];
}

interface EnhancedOrgChartProps {
  isRTL?: boolean;
}

const EnhancedOrgChart: React.FC<EnhancedOrgChartProps> = ({ isRTL = false }) => {
  const [viewMode, setViewMode] = useState<"tree" | "grid">("tree");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [parentForNewChild, setParentForNewChild] = useState<Position | null>(null);
  const [editForm, setEditForm] = useState({
    titleEn: "",
    titleAr: "",
    holder: "",
    department: "",
    positionType: "department" // department, subdepartment, unit, position
  });

  // State for card expansion and details modal
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(['prime-minister']));
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailPosition, setDetailPosition] = useState<Position | null>(null);

  // Zoom functionality
  const [zoomLevel, setZoomLevel] = useState(1);

  // View mode toggle for command palette
  const [currentViewMode, setCurrentViewMode] = useState<"tree" | "grid">("tree");

  // Enhanced tooltip state
  const [showLegend, setShowLegend] = useState(true);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isViewTransitioning, setIsViewTransitioning] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Breadcrumb navigation state
  const [breadcrumbPath, setBreadcrumbPath] = useState<BreadcrumbItem[]>([]);
  const [currentFocusedPosition, setCurrentFocusedPosition] = useState<string | null>(null);

  // Language toggle (placeholder)
  const toggleLanguage = () => {
    // This would integrate with your language system
    console.log('Language toggled');
  };

  // Helper functions to determine organization type and position level based on existing data
  const getOrganizationType = (position: Position): Position["organizationType"] => {
    if (position.organizationType) return position.organizationType;

    // Determine based on level and title patterns
    if (position.level === 0) return "ministry"; // Prime Minister Office
    if (position.level === 1) return "ministry"; // Ministers
    if (position.level === 2) return "department"; // Deputy Ministers/Director Generals
    if (position.level === 3) return "department"; // Directors/Assistant Director
    if (position.level === 4) return "subdepartment"; // Assistant Directors/Managers
    if (position.level === 5) return "unit"; // Heads/Managers
    if (position.level === 6) return "unit"; // Coordinators/Supervisors
    if (position.level === 7) return "section"; // Team Leaders
    if (position.level === 8) return "section"; // Supervisors
    if (position.level >= 9) return "team"; // Officers and Specialists

    return "position";
  };

  const getPositionLevel = (position: Position): Position["positionLevel"] => {
    if (position.positionLevel) return position.positionLevel;

    // Determine based on level and title patterns
    if (position.level === 0) return "prime_minister";
    if (position.level === 1) return "minister";
    if (position.level === 2) return "deputy_minister";
    if (position.level === 3) return "undersecretary";
    if (position.level === 4) return "assistant_undersecretary";
    if (position.level === 5) return "director";
    if (position.level === 6) return "deputy_director";
    if (position.level >= 7) return "manager";

    return "officer";
  };

  // Breadcrumb helper functions
  const findPositionPath = (positions: Position[], targetId: string, path: Position[] = []): Position[] | null => {
    for (const position of positions) {
      const currentPath = [...path, position];

      if (position.id === targetId) {
        return currentPath;
      }

      if (position.children && position.children.length > 0) {
        const childPath = findPositionPath(position.children, targetId, currentPath);
        if (childPath) {
          return childPath;
        }
      }
    }
    return null;
  };

  const buildBreadcrumbPath = (positionId: string): BreadcrumbItem[] => {
    const path = findPositionPath([orgData], positionId);
    if (!path) return [];

    return path.map(position => ({
      id: position.id,
      titleEn: position.titleEn,
      titleAr: position.titleAr,
      level: position.level
    }));
  };

  const handleBreadcrumbNavigation = (positionId: string) => {
    const path = buildBreadcrumbPath(positionId);
    setBreadcrumbPath(path);
    setCurrentFocusedPosition(positionId);

    // Expand cards to show the path
    const cardIds = path.map(item => item.id);
    setExpandedCards(new Set(cardIds));

    // Scroll to the position
    handleNavigateToPosition(positionId);
  };

  // Initialize breadcrumb with root position on mount
  useEffect(() => {
    if (breadcrumbPath.length === 0) {
      const rootPath = buildBreadcrumbPath(orgData.id);
      setBreadcrumbPath(rootPath);
      setCurrentFocusedPosition(orgData.id);
    }
  }, []); // Run once on mount

  // Color scheme functions
  const getOrganizationTypeColor = (orgType: Position["organizationType"]) => {
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

  const getPositionLevelColor = (posLevel: Position["positionLevel"]) => {
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


  // Wide 15-level organizational structure with multiple branches for testing overlap
  const orgData: Position = {
    id: "1",
    titleEn: "Prime Minister",
    titleAr: "رئيس الوزراء",
    holder: "H.E. Mohammed Al Thani",
    level: 0,
    children: [
      {
        id: "2",
        titleEn: "Minister of Interior",
        titleAr: "وزير الداخلية",
        holder: "Sheikh Khalid Al Thani",
        department: "Ministry of Interior",
        level: 1,
        children: [
          {
            id: "21",
            titleEn: "Deputy Minister - Security Affairs",
            titleAr: "نائب وزير - شؤون الأمن",
            holder: "Major General Abdullah Al Kaabi",
            department: "Security Affairs",
            level: 2,
            children: [
              {
                id: "211",
                titleEn: "Director General of Public Security",
                titleAr: "المدير العام للأمن العام",
                holder: "Brigadier General Ali Al Malki",
                department: "Public Security",
                level: 3,
                children: [
                  {
                    id: "2111",
                    titleEn: "Assistant Director - Operations",
                    titleAr: "مساعد مدير - العمليات",
                    holder: "Colonel Ahmed Al Sulaiti",
                    department: "Operations",
                    level: 4,
                    children: [
                      {
                        id: "21111",
                        titleEn: "Head of Emergency Response",
                        titleAr: "رئيس الاستجابة للطوارئ",
                        holder: "Lt. Colonel Fahad Al Thani",
                        department: "Emergency Response",
                        level: 5,
                        children: [
                          {
                            id: "211111",
                            titleEn: "Emergency Coordinator Alpha",
                            titleAr: "منسق طوارئ ألفا",
                            holder: "Major Hassan Al Kuwari",
                            department: "Team Alpha",
                            level: 6,
                            children: [
                              {
                                id: "2111111",
                                titleEn: "Team Leader Alpha-1",
                                titleAr: "قائد فريق ألفا-1",
                                holder: "Captain Omar Al Ansari",
                                department: "Alpha-1",
                                level: 7,
                                children: [
                                  {
                                    id: "21111111",
                                    titleEn: "Field Supervisor A1-1",
                                    titleAr: "مشرف ميداني أ1-1",
                                    holder: "Lieutenant Khalid Al Marri",
                                    department: "Field Ops A1-1",
                                    level: 8,
                                    children: [
                                      {
                                        id: "211111111",
                                        titleEn: "Senior Officer A1-1-1",
                                        titleAr: "ضابط أول أ1-1-1",
                                        holder: "Sergeant Majid Al Naimi",
                                        department: "Unit A1-1-1",
                                        level: 9,
                                        children: [
                                          {
                                            id: "2111111111",
                                            titleEn: "Specialist A1-1-1-1",
                                            titleAr: "أخصائي أ1-1-1-1",
                                            holder: "Corporal Saad Al Hamar",
                                            department: "Sub-unit A1-1-1-1",
                                            level: 10,
                                            children: [
                                              {
                                                id: "21111111111",
                                                titleEn: "Communications Officer L11",
                                                titleAr: "ضابط اتصالات م11",
                                                holder: "Constable Yasir Al Muraikhi",
                                                department: "Comms L11",
                                                level: 11,
                                                children: [
                                                  {
                                                    id: "211111111111",
                                                    titleEn: "Senior Tech L12",
                                                    titleAr: "فني أول م12",
                                                    holder: "Ahmed Al Dosari",
                                                    department: "Tech L12",
                                                    level: 12,
                                                    children: [
                                                      {
                                                        id: "2111111111111",
                                                        titleEn: "Tech L13",
                                                        titleAr: "فني م13",
                                                        holder: "Mohammed Al Khater",
                                                        department: "Systems L13",
                                                        level: 13,
                                                        children: [
                                                          {
                                                            id: "21111111111111",
                                                            titleEn: "Equipment Specialist L14",
                                                            titleAr: "أخصائي معدات م14",
                                                            holder: "Ali Al Mannai",
                                                            department: "Equipment L14",
                                                            level: 14,
                                                            children: [
                                                              {
                                                                id: "211111111111111",
                                                                titleEn: "Assistant L15",
                                                                titleAr: "مساعد م15",
                                                                holder: "Nasser Al Yafei",
                                                                department: "Support L15",
                                                                level: 15,
                                                                children: [],
                                                              },
                                                            ],
                                                          },
                                                        ],
                                                      },
                                                    ],
                                                  },
                                                ],
                                              },
                                            ],
                                          },
                                        ],
                                      },
                                      {
                                        id: "211111112",
                                        titleEn: "Senior Officer A1-1-2",
                                        titleAr: "ضابط أول أ1-1-2",
                                        holder: "Sergeant Ali Al Rashid",
                                        department: "Unit A1-1-2",
                                        level: 9,
                                        children: [],
                                      },
                                    ],
                                  },
                                  {
                                    id: "21111112",
                                    titleEn: "Field Supervisor A1-2",
                                    titleAr: "مشرف ميداني أ1-2",
                                    holder: "Lieutenant Faisal Al Mannai",
                                    department: "Field Ops A1-2",
                                    level: 8,
                                    children: [],
                                  },
                                ],
                              },
                              {
                                id: "2111112",
                                titleEn: "Team Leader Alpha-2",
                                titleAr: "قائد فريق ألفا-2",
                                holder: "Captain Saad Al Mohannadi",
                                department: "Alpha-2",
                                level: 7,
                                children: [],
                              },
                            ],
                          },
                          {
                            id: "211112",
                            titleEn: "Emergency Coordinator Beta",
                            titleAr: "منسق طوارئ بيتا",
                            holder: "Major Ahmed Al Yafei",
                            department: "Team Beta",
                            level: 6,
                            children: [],
                          },
                        ],
                      },
                      {
                        id: "21112",
                        titleEn: "Head of Special Operations",
                        titleAr: "رئيس العمليات الخاصة",
                        holder: "Lt. Colonel Nasser Al Kaabi",
                        department: "Special Operations",
                        level: 5,
                        children: [],
                      },
                    ],
                  },
                  {
                    id: "2112",
                    titleEn: "Assistant Director - Intelligence",
                    titleAr: "مساعد مدير - الاستخبارات",
                    holder: "Colonel Hamad Al Attiya",
                    department: "Intelligence",
                    level: 4,
                    children: [],
                  },
                ],
              },
              {
                id: "212",
                titleEn: "Director General of Civil Defense",
                titleAr: "المدير العام للدفاع المدني",
                holder: "Brigadier General Rashid Al Nuaimi",
                department: "Civil Defense",
                level: 3,
                children: [],
              },
            ],
          },
          {
            id: "22",
            titleEn: "Deputy Minister - Traffic Affairs",
            titleAr: "نائب وزير - شؤون المرور",
            holder: "Colonel Salam Al Shafei",
            department: "Traffic Affairs",
            level: 2,
            children: [
              {
                id: "221",
                titleEn: "Director of Traffic Operations",
                titleAr: "مدير عمليات المرور",
                holder: "Lt. Colonel Tariq Al Mulla",
                department: "Traffic Operations",
                level: 3,
                children: [
                  {
                    id: "2211",
                    titleEn: "Head of Highway Patrol",
                    titleAr: "رئيس دورية الطريق السريع",
                    holder: "Major Khalifa Al Jaber",
                    department: "Highway Patrol",
                    level: 4,
                    children: [],
                  },
                  {
                    id: "2212",
                    titleEn: "Head of City Traffic",
                    titleAr: "رئيس مرور المدينة",
                    holder: "Major Ibrahim Al Misnad",
                    department: "City Traffic",
                    level: 4,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "3",
        titleEn: "Minister of Finance",
        titleAr: "وزير المالية",
        holder: "H.E. Ali Al Kuwari",
        department: "Ministry of Finance",
        level: 1,
        children: [
          {
            id: "31",
            titleEn: "Deputy Minister - Budget & Planning",
            titleAr: "نائب وزير - الميزانية والتخطيط",
            holder: "Dr. Ahmed Al Sayed",
            department: "Budget & Planning",
            level: 2,
            children: [
              {
                id: "311",
                titleEn: "Director General of Budget",
                titleAr: "المدير العام للميزانية",
                holder: "Eng. Khalifa Al Jaber",
                department: "Budget Directorate",
                level: 3,
                children: [
                  {
                    id: "3111",
                    titleEn: "Assistant Director - Budget Planning",
                    titleAr: "مساعد مدير - تخطيط الميزانية",
                    holder: "Dr. Maryam Al Mannai",
                    department: "Budget Planning",
                    level: 4,
                    children: [
                      {
                        id: "31111",
                        titleEn: "Head of Financial Analysis",
                        titleAr: "رئيس التحليل المالي",
                        holder: "Eng. Saeed Al Mohannadi",
                        department: "Financial Analysis",
                        level: 5,
                        children: [
                          {
                            id: "311111",
                            titleEn: "Senior Financial Analyst",
                            titleAr: "محلل مالي أول",
                            holder: "MBA Fatima Al Malki",
                            department: "Analysis Team",
                            level: 6,
                            children: [
                              {
                                id: "3111111",
                                titleEn: "Financial Research Specialist",
                                titleAr: "أخصائي بحوث مالية",
                                holder: "CPA Omar Al Nasr",
                                department: "Research Unit",
                                level: 7,
                                children: [],
                              },
                            ],
                          },
                        ],
                      },
                      {
                        id: "31112",
                        titleEn: "Head of Revenue Analysis",
                        titleAr: "رئيس تحليل الإيرادات",
                        holder: "Dr. Layla Al Sulaiti",
                        department: "Revenue Analysis",
                        level: 5,
                        children: [],
                      },
                    ],
                  },
                  {
                    id: "3112",
                    titleEn: "Assistant Director - Budget Monitoring",
                    titleAr: "مساعد مدير - مراقبة الميزانية",
                    holder: "MSc. Hassan Al Kuwari",
                    department: "Budget Monitoring",
                    level: 4,
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            id: "32",
            titleEn: "Deputy Minister - Treasury Operations",
            titleAr: "نائب وزير - عمليات الخزينة",
            holder: "CPA Noora Al Thani",
            department: "Treasury Operations",
            level: 2,
            children: [
              {
                id: "321",
                titleEn: "Director of Government Treasury",
                titleAr: "مدير خزينة الحكومة",
                holder: "MBA Mohammed Al Derham",
                department: "Government Treasury",
                level: 3,
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: "4",
        titleEn: "Minister of Education",
        titleAr: "وزير التعليم",
        holder: "Dr. Buthaina Al Ansari",
        department: "Ministry of Education",
        level: 1,
        children: [
          {
            id: "41",
            titleEn: "Deputy Minister - Higher Education",
            titleAr: "نائب وزير - التعليم العالي",
            holder: "Dr. Mohammed Al Derham",
            department: "Higher Education",
            level: 2,
            children: [
              {
                id: "411",
                titleEn: "Director of University Affairs",
                titleAr: "مدير شؤون الجامعات",
                holder: "Dr. Noora Al Thani",
                department: "University Affairs",
                level: 3,
                children: [
                  {
                    id: "4111",
                    titleEn: "Head of Academic Programs",
                    titleAr: "رئيس البرامج الأكاديمية",
                    holder: "Prof. Hamad Al Kawari",
                    department: "Academic Affairs",
                    level: 4,
                    children: [
                      {
                        id: "41111",
                        titleEn: "Academic Standards Coordinator",
                        titleAr: "منسق المعايير الأكاديمية",
                        holder: "Dr. Aisha Al Muraikhi",
                        department: "Quality Assurance",
                        level: 5,
                        children: [
                          {
                            id: "411111",
                            titleEn: "Quality Assessment Specialist",
                            titleAr: "أخصائي تقييم الجودة",
                            holder: "MSc. Ibrahim Al Misnad",
                            department: "Assessment Unit",
                            level: 6,
                            children: [
                              {
                                id: "4111111",
                                titleEn: "Education Quality Analyst",
                                titleAr: "محلل جودة التعليم",
                                holder: "BA. Layla Al Sulaiti",
                                department: "Data Analysis",
                                level: 7,
                                children: [],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "42",
            titleEn: "Deputy Minister - General Education",
            titleAr: "نائب وزير - التعليم العام",
            holder: "Dr. Fatima Al Kaabi",
            department: "General Education",
            level: 2,
            children: [
              {
                id: "421",
                titleEn: "Director of Primary Education",
                titleAr: "مدير التعليم الابتدائي",
                holder: "MSc. Ahmed Al Yafei",
                department: "Primary Education",
                level: 3,
                children: [],
              },
              {
                id: "422",
                titleEn: "Director of Secondary Education",
                titleAr: "مدير التعليم الثانوي",
                holder: "PhD. Maryam Al Dosari",
                department: "Secondary Education",
                level: 3,
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: "5",
        titleEn: "Minister of Health",
        titleAr: "وزير الصحة",
        holder: "Dr. Khalid Al Saleh",
        department: "Ministry of Health",
        level: 1,
        children: [
          {
            id: "51",
            titleEn: "Deputy Minister - Public Health",
            titleAr: "نائب وزير - الصحة العامة",
            holder: "Dr. Sarah Al Thani",
            department: "Public Health",
            level: 2,
            children: [
              {
                id: "511",
                titleEn: "Director of Disease Prevention",
                titleAr: "مدير الوقاية من الأمراض",
                holder: "Dr. Omar Al Nasr",
                department: "Disease Prevention",
                level: 3,
                children: [],
              },
            ],
          },
          {
            id: "52",
            titleEn: "Deputy Minister - Hospital Operations",
            titleAr: "نائب وزير - عمليات المستشفيات",
            holder: "Dr. Ahmed Al Muraikhi",
            department: "Hospital Operations",
            level: 2,
            children: [
              {
                id: "521",
                titleEn: "Director of Emergency Services",
                titleAr: "مدير خدمات الطوارئ",
                holder: "Dr. Nasser Al Khater",
                department: "Emergency Services",
                level: 3,
                children: [],
              },
            ],
          },
        ],
      },
    ],
  };

  // Flatten the tree structure for grid view
  const flattenPositions = (position: Position): Position[] => {
    let positions = [position];
    if (position.children) {
      position.children.forEach((child) => {
        positions = positions.concat(flattenPositions(child));
      });
    }
    return positions;
  };

  const allPositions = flattenPositions(orgData);

  const handleEdit = (position: Position) => {
    setSelectedPosition(position);
    setEditForm({
      titleEn: position.titleEn,
      titleAr: position.titleAr,
      holder: position.holder || "",
      department: position.department || ""
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (position: Position) => {
    setSelectedPosition(position);
    setIsDeleteModalOpen(true);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Navigate to position (for command palette)
  const handleNavigateToPosition = (positionId: string) => {
    // Update breadcrumb navigation
    handleBreadcrumbNavigation(positionId);
    // Find and scroll to the position
    const element = document.getElementById(`position-${positionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Toggle view mode with loading state
  const handleToggleView = async () => {
    setIsViewTransitioning(true);
    setLoadingProgress(0);
    setLoadingMessage(isRTL ? "تغيير طريقة العرض..." : "Switching view...");

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 20;
      });
    }, 100);

    // Wait for progress to complete
    await new Promise(resolve => setTimeout(resolve, 600));

    const newViewMode = viewMode === "tree" ? "grid" : "tree";
    setViewMode(newViewMode);
    setCurrentViewMode(newViewMode);

    // Clean up loading state
    setTimeout(() => {
      setIsViewTransitioning(false);
      setLoadingProgress(0);
      setLoadingMessage("");
    }, 200);
  };

  // Toggle legend
  const handleToggleLegend = () => {
    setShowLegend(prev => !prev);
  };

  // Keyboard shortcuts
  const shortcuts = createShortcuts.navigation({
    toggleFullscreen: () => setIsFullScreen(!isFullScreen),
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    resetZoom: handleResetZoom,
    toggleLegend: handleToggleLegend,
    toggleLanguage: toggleLanguage,
  });

  const accessibilityShortcuts = createShortcuts.accessibility({
    closeModal: () => {
      setIsEditModalOpen(false);
      setIsAddModalOpen(false);
      setIsDeleteModalOpen(false);
      setIsDetailModalOpen(false);
    }
  });

  // Use keyboard shortcuts
  useKeyboardShortcuts([...shortcuts, ...accessibilityShortcuts]);

  const handleAddChild = (position: Position) => {
    setParentForNewChild(position);
    setEditForm({
      titleEn: "",
      titleAr: "",
      holder: "",
      department: "",
      positionType: "department"
    });
    setIsAddModalOpen(true);
  };

  const handleSaveEdit = () => {
    alert(`✅ Position Updated!\n\nEnglish: ${editForm.titleEn}\nArabic: ${editForm.titleAr}\nHolder: ${editForm.holder}`);
    setIsEditModalOpen(false);
    setSelectedPosition(null);
  };

  const handleSaveAdd = () => {
    alert(`✅ New ${editForm.positionType} Added!\n\nType: ${editForm.positionType.toUpperCase()}\nEnglish: ${editForm.titleEn}\nArabic: ${editForm.titleAr}\nParent: ${parentForNewChild?.titleEn}`);
    setIsAddModalOpen(false);
    setParentForNewChild(null);
  };

  const handleConfirmDelete = () => {
    alert(`🗑️ Position Deleted!\n\n${selectedPosition?.titleEn} has been removed from the organization chart.`);
    setIsDeleteModalOpen(false);
    setSelectedPosition(null);
  };

  // Handlers for card expansion and details
  const handleCardClick = (position: Position) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(position.id)) {
      newExpanded.delete(position.id);
    } else {
      newExpanded.add(position.id);
    }
    setExpandedCards(newExpanded);
  };

  const handleViewDetails = (position: Position) => {
    setDetailPosition(position);
    setIsDetailModalOpen(true);
  };

  // Tree view renderer
  const renderTreeView = (position: Position, index: number = 0) => (
    <motion.div
      key={position.id}
      id={`position-${position.id}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="relative"
    >
      <div className="flex flex-col items-center">
        <PositionContextMenu
          position={position}
          isRTL={isRTL}
          onEditPosition={handleEdit}
          onAddChild={handleAddChild}
          onDeletePosition={handleDelete}
          onViewDetails={handleViewDetails}
          onNavigateToPosition={handleNavigateToPosition}
          canEdit={true}
          canDelete={position.level > 0}
          canAddChild={true}
        >
          <OrgCard
            position={position}
            isRTL={isRTL}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
            onCardClick={handleCardClick}
            onViewDetails={handleViewDetails}
            expanded={expandedCards.has(position.id)}
          />
        </PositionContextMenu>

        {/* Animated children rendering */}
        <AnimatePresence>
          {position.children && position.children.length > 0 && expandedCards.has(position.id) && (
            <motion.div
              key={`children-${position.id}`}
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="mt-8 relative overflow-hidden"
            >
              {/* Connector lines */}
              {position.children.length > 1 && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-8">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-4 bg-qatar-maroon/30" />
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-qatar-maroon/30" />
                </div>
              )}

              {/* Grid layout to maintain hierarchy levels */}
              <div className="pt-8 w-full overflow-x-auto">
                <div className="min-w-max">
                  <div
                    className="flex gap-8 justify-center items-start"
                    style={{
                      minWidth: `${position.children.length * 320}px`,
                      width: 'max-content'
                    }}
                  >
                    {position.children.map((child, childIndex) => (
                      <div key={child.id} className="relative flex-shrink-0" style={{ minWidth: '300px' }}>
                        {/* Vertical connector from horizontal line to card */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-qatar-maroon/30" />
                        <div className="pt-8">
                          {renderTreeView(child, index + childIndex + 1)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  // Grid view using Bento Grid
  const renderGridView = () => (
    <BentoGrid className="mx-auto max-w-7xl">
      {allPositions.map((position, index) => (
        <BentoGridItem
          key={position.id}
          title={
            <span className={cn(isRTL && "font-arabic")}>
              {isRTL ? position.titleAr : position.titleEn}
            </span>
          }
          description={
            <div className="space-y-1">
              <div className="text-sm opacity-90">
                {isRTL ? position.titleEn : position.titleAr}
              </div>
              {position.holder && (
                <div className="text-xs font-medium">{position.holder}</div>
              )}
              {position.department && (
                <div className="text-xs opacity-70">{position.department}</div>
              )}
            </div>
          }
          level={position.level}
          onClick={() => handleEdit(position)}
          className={cn(
            "cursor-pointer transition-all duration-200",
            selectedPosition?.id === position.id && "ring-2 ring-qatar-gold ring-offset-2"
          )}
        />
      ))}
    </BentoGrid>
  );

  // Full screen grid view with enhanced layout
  const renderFullScreenGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 w-full h-full">
      {allPositions.map((position, index) => (
        <motion.div
          key={position.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          whileHover={{ scale: 1.02, translateY: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleEdit(position)}
          className={cn(
            "rounded-xl p-4 border cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[180px] hover:shadow-lg",
            selectedPosition?.id === position.id && "ring-2 ring-qatar-gold ring-offset-2",
            // Dynamic background based on organization type
            getOrganizationTypeColor(getOrganizationType(position)),
            // Special sizing for Prime Minister
            position.level === 0 && "col-span-2 row-span-2"
          )}
        >
          <div className="flex-1">
            <h3 className={cn(
              "font-bold text-sm mb-2",
              isRTL && "font-arabic text-right"
            )}>
              {isRTL ? position.titleAr : position.titleEn}
            </h3>
            <p className={cn(
              "text-xs opacity-90 mb-1",
              !isRTL && "font-english",
              isRTL && "text-right"
            )}>
              {isRTL ? position.titleEn : position.titleAr}
            </p>
            {position.holder && (
              <p className={cn(
                "text-xs font-medium",
                getPositionLevelColor(getPositionLevel(position))
              )}>
                {position.holder}
              </p>
            )}
          </div>

          <div className="mt-2">
            {position.department && (
              <p className="text-xs opacity-70">{position.department}</p>
            )}
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs opacity-60">Level {position.level}</span>
              {position.children && (
                <span className="text-xs bg-white/20 rounded-full px-2 py-1">
                  {position.children.length}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6",
      isFullScreen && "fixed inset-0 z-[999] bg-white overflow-auto h-screen w-screen p-4"
    )}>
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className={cn(
          "flex items-center justify-between mb-4",
          isRTL && "flex-row-reverse"
        )}>
          <TextGenerateEffect
            words={isRTL ? "الهيكل التنظيمي لحكومة قطر" : "Qatar Government Organization Structure"}
            className="text-3xl md:text-4xl font-bold"
          />

          <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
            {/* View Mode Toggle */}
            <div className="bg-white rounded-lg shadow-sm border border-qatar-maroon/20 p-1 flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={viewMode === "tree" ? "qatar" : "ghost"}
                    onClick={() => viewMode !== "tree" && handleToggleView()}
                    disabled={isViewTransitioning}
                    className="gap-1"
                  >
                    <List className="h-4 w-4" />
                    Tree
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{isRTL ? "عرض الشجرة" : "Tree View"}</p>
                    <p className="text-xs opacity-80">
                      {isRTL ? "هيكل تنظيمي هرمي" : "Hierarchical organization structure"}
                    </p>
                    {viewMode === "tree" && (
                      <p className="text-xs text-qatar-maroon">
                        {isRTL ? "العرض الحالي" : "Currently active"}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={viewMode === "grid" ? "qatar" : "ghost"}
                    onClick={() => viewMode !== "grid" && handleToggleView()}
                    disabled={isViewTransitioning}
                    className="gap-1"
                  >
                    <Grid3x3 className="h-4 w-4" />
                    Grid
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{isRTL ? "عرض الشبكة" : "Grid View"}</p>
                    <p className="text-xs opacity-80">
                      {isRTL ? "عرض مجمع للبطاقات" : "Compact card layout"}
                    </p>
                    {viewMode === "grid" && (
                      <p className="text-xs text-qatar-maroon">
                        {isRTL ? "العرض الحالي" : "Currently active"}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Fullscreen Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="border-qatar-maroon/20"
                >
                  {isFullScreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">
                    {isRTL
                      ? (isFullScreen ? "الخروج من الشاشة الكاملة" : "الدخول للشاشة الكاملة")
                      : (isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen")
                    }
                  </p>
                  <p className="text-xs opacity-80">
                    {isRTL ? "اختصار: Cmd+F أو F11" : "Shortcut: Cmd+F or F11"}
                  </p>
                  <p className="text-xs text-blue-400">
                    {isRTL
                      ? (isFullScreen ? "عرض مع الأدوات" : "عرض كامل للشاشة")
                      : (isFullScreen ? "Back to windowed view" : "Full screen experience")
                    }
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Zoom Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-qatar-maroon/20 p-1 flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                    className="h-8 w-8"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{isRTL ? "تصغير" : "Zoom Out"}</p>
                    <p className="text-xs opacity-80">
                      {isRTL ? "اختصار: Cmd+-" : "Shortcut: Cmd+-"}
                    </p>
                    {zoomLevel <= 0.5 && (
                      <p className="text-xs text-amber-400">
                        {isRTL ? "الحد الأدنى للتكبير" : "Minimum zoom reached"}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>

              <div className="flex items-center justify-center min-w-[60px] text-sm font-medium text-qatar-maroon">
                {Math.round(zoomLevel * 100)}%
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleResetZoom}
                    className="h-8 w-8"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{isRTL ? "إعادة تعيين التكبير" : "Reset Zoom"}</p>
                    <p className="text-xs opacity-80">
                      {isRTL ? "اختصار: Cmd+0" : "Shortcut: Cmd+0"}
                    </p>
                    <p className="text-xs text-blue-400">
                      {isRTL ? "العودة إلى 100%" : "Reset to 100%"}
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 2}
                    className="h-8 w-8"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{isRTL ? "تكبير" : "Zoom In"}</p>
                    <p className="text-xs opacity-80">
                      {isRTL ? "اختصار: Cmd+=" : "Shortcut: Cmd+="}
                    </p>
                    {zoomLevel >= 2 && (
                      <p className="text-xs text-amber-400">
                        {isRTL ? "الحد الأقصى للتكبير" : "Maximum zoom reached"}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Subtitle with animation */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={cn(
            "text-qatar-maroon/70 text-lg",
            isRTL && "text-right font-arabic"
          )}
        >
          {isRTL
            ? "نظام إدارة الهيكل التنظيمي المتقدم مع واجهة تفاعلية"
            : "Advanced organizational structure management with interactive interface"}
        </motion.p>
      </motion.div>

      {/* Breadcrumb Navigation */}
      <AnimatePresence>
        {breadcrumbPath.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <div className="bg-white/50 backdrop-blur-sm rounded-lg border border-qatar-maroon/10 p-4 shadow-sm">
              {/* Desktop breadcrumb */}
              <div className="hidden md:block">
                <Breadcrumb
                  items={breadcrumbPath}
                  currentItemId={currentFocusedPosition || undefined}
                  onItemClick={handleBreadcrumbNavigation}
                  isRTL={isRTL}
                  maxItems={5}
                />
              </div>

              {/* Mobile compact breadcrumb */}
              <div className="md:hidden">
                <BreadcrumbCompact
                  items={breadcrumbPath}
                  currentItemId={currentFocusedPosition || undefined}
                  onItemClick={handleBreadcrumbNavigation}
                  isRTL={isRTL}
                  showBackButton={true}
                />
              </div>

              {/* Breadcrumb info */}
              <div className={cn(
                "mt-2 text-xs text-gray-500 flex items-center gap-2",
                isRTL && "flex-row-reverse"
              )}>
                <span>
                  {isRTL
                    ? `المستوى ${breadcrumbPath[breadcrumbPath.length - 1]?.level || 0} من ${breadcrumbPath.length}`
                    : `Level ${breadcrumbPath[breadcrumbPath.length - 1]?.level || 0} of ${breadcrumbPath.length}`
                  }
                </span>
                <span className="text-qatar-maroon">•</span>
                <span>
                  {isRTL ? "انقر على أي مستوى للانتقال" : "Click any level to navigate"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "bg-white rounded-2xl shadow-xl border border-qatar-maroon/10 p-8 min-h-[600px]",
            isFullScreen && "h-full rounded-none border-0 shadow-none p-4 overflow-auto"
          )}
        >
          {/* Progress bar for view transitions */}
          <AnimatePresence>
            {isViewTransitioning && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4"
              >
                <ProgressBar
                  progress={loadingProgress}
                  showLabel={true}
                  label={loadingMessage}
                  className="max-w-md mx-auto"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {isViewTransitioning ? (
            // Show skeleton loading during transitions
            <div className="py-8">
              {viewMode === "tree" ? (
                <TreeViewSkeleton isRTL={isRTL} />
              ) : (
                <GridViewSkeleton isRTL={isRTL} />
              )}
            </div>
          ) : viewMode === "tree" || isFullScreen ? (
            <div className="w-full overflow-x-auto overflow-y-auto h-full">
              <div
                className="min-w-max flex justify-center py-4 transition-transform duration-300 ease-in-out"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center top'
                }}
              >
                {renderTreeView(orgData)}
              </div>
            </div>
          ) : (
            <div
              className="transition-transform duration-300 ease-in-out"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center top'
              }}
            >
              {renderGridView()}
            </div>
          )}
        </motion.div>
      </AnimatePresence>


      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-qatar-maroon">Edit Position</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English Title
                  </label>
                  <input
                    type="text"
                    value={editForm.titleEn}
                    onChange={(e) => setEditForm({...editForm, titleEn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-qatar-maroon"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arabic Title
                  </label>
                  <input
                    type="text"
                    value={editForm.titleAr}
                    onChange={(e) => setEditForm({...editForm, titleAr: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-qatar-maroon text-right"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Holder
                  </label>
                  <input
                    type="text"
                    value={editForm.holder}
                    onChange={(e) => setEditForm({...editForm, holder: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-qatar-maroon"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveEdit} variant="qatar" className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => setIsEditModalOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-qatar-maroon">
                  Add New Position under {parentForNewChild?.titleEn}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Type
                  </label>
                  <select
                    value={editForm.positionType}
                    onChange={(e) => setEditForm({...editForm, positionType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-qatar-maroon"
                  >
                    <option value="department">Department</option>
                    <option value="subdepartment">Subdepartment</option>
                    <option value="unit">Unit</option>
                    <option value="position">Position/Role</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English Title
                  </label>
                  <input
                    type="text"
                    value={editForm.titleEn}
                    onChange={(e) => setEditForm({...editForm, titleEn: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-qatar-maroon"
                    placeholder="Enter English title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arabic Title
                  </label>
                  <input
                    type="text"
                    value={editForm.titleAr}
                    onChange={(e) => setEditForm({...editForm, titleAr: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-qatar-maroon text-right"
                    placeholder="أدخل العنوان بالعربية"
                    dir="rtl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position Holder
                  </label>
                  <input
                    type="text"
                    value={editForm.holder}
                    onChange={(e) => setEditForm({...editForm, holder: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-qatar-maroon"
                    placeholder="Enter position holder name"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleSaveAdd} variant="qatar" className="flex-1">
                    Add Position
                  </Button>
                  <Button
                    onClick={() => setIsAddModalOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-red-600">Confirm Delete</h3>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete this position?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-semibold text-qatar-maroon">
                    {selectedPosition?.titleEn}
                  </p>
                  <p className="text-sm text-gray-600" dir="rtl">
                    {selectedPosition?.titleAr}
                  </p>
                  {selectedPosition?.holder && (
                    <p className="text-sm text-gray-600 mt-1">
                      Holder: {selectedPosition.holder}
                    </p>
                  )}
                </div>
                <p className="text-sm text-red-600 mt-2">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleConfirmDelete}
                  variant="destructive"
                  className="flex-1"
                >
                  Delete Position
                </Button>
                <Button
                  onClick={() => setIsDeleteModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && detailPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setIsDetailModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-qatar-maroon">Position Details</h3>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Position Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-qatar-maroon/10 to-qatar-gold/10 p-4 rounded-lg">
                    <h4 className="font-semibold text-qatar-maroon mb-2">English Title</h4>
                    <p className="text-lg">{detailPosition.titleEn}</p>
                  </div>
                  <div className="bg-gradient-to-br from-qatar-maroon/10 to-qatar-gold/10 p-4 rounded-lg" dir="rtl">
                    <h4 className="font-semibold text-qatar-maroon mb-2">Arabic Title</h4>
                    <p className="text-lg font-arabic">{detailPosition.titleAr}</p>
                  </div>
                </div>

                {/* Leadership */}
                {detailPosition.holder && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-qatar-maroon mb-2">Current Leadership</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-qatar-maroon rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{detailPosition.holder}</p>
                        <p className="text-sm text-gray-600">{detailPosition.titleEn}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Department Info */}
                {detailPosition.department && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-qatar-maroon mb-2">Department</h4>
                    <p>{detailPosition.department}</p>
                  </div>
                )}

                {/* Organization Structure */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-qatar-maroon mb-3">Organization Structure</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-qatar-maroon">
                        {detailPosition.children?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Direct Reports</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-qatar-maroon">{detailPosition.level}</div>
                      <div className="text-sm text-gray-600">Hierarchy Level</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-qatar-maroon">
                        {Math.floor(Math.random() * 50) + 10}
                      </div>
                      <div className="text-sm text-gray-600">Total Employees</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-2xl font-bold text-qatar-maroon">
                        {Math.floor(Math.random() * 5) + 1}
                      </div>
                      <div className="text-sm text-gray-600">Sub-departments</div>
                    </div>
                  </div>
                </div>

                {/* Responsibilities */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-qatar-maroon mb-3">Key Responsibilities</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-qatar-maroon rounded-full mt-2 flex-shrink-0"></div>
                      <span>Strategic planning and policy development</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-qatar-maroon rounded-full mt-2 flex-shrink-0"></div>
                      <span>Oversight of departmental operations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-qatar-maroon rounded-full mt-2 flex-shrink-0"></div>
                      <span>Budget management and resource allocation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-qatar-maroon rounded-full mt-2 flex-shrink-0"></div>
                      <span>Performance monitoring and evaluation</span>
                    </li>
                  </ul>
                </div>

                {/* Contact Information */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-qatar-maroon mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Email:</span> {detailPosition.titleEn.toLowerCase().replace(/\s+/g, '.')}@gov.qa</p>
                    <p><span className="font-medium">Phone:</span> +974 {Math.floor(Math.random() * 9000000) + 1000000}</p>
                    <p><span className="font-medium">Office:</span> Floor {detailPosition.level + 2}, Building {Math.floor(Math.random() * 5) + 1}</p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-lg">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full bg-qatar-maroon text-white py-2 px-4 rounded-lg hover:bg-qatar-maroon/90 transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Palette */}
      <CommandPalette
        isRTL={isRTL}
        positions={orgData}
        onNavigateToPosition={handleNavigateToPosition}
        onToggleFullscreen={() => setIsFullScreen(!isFullScreen)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onToggleLegend={handleToggleLegend}
        onToggleLanguage={toggleLanguage}
        onToggleView={handleToggleView}
        isFullscreen={isFullScreen}
        currentZoom={zoomLevel}
        legendVisible={showLegend}
      />
    </div>
  );
};

export default EnhancedOrgChart;