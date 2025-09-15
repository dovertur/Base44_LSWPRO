
import React, { useState, useEffect, useCallback } from "react";
import { Routine } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfDay, isBefore } from "date-fns";
import {
  Search,
  Filter,
  Plus,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  Building2,
  Heart,
  Wrench,
  Sparkles,
  ClipboardList,
  Building,
  HardHat,
  Truck } from
"lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";

import RoutineCard from "../components/routines/RoutineCard";
import FilterBar from "../components/routines/FilterBar";
import RoutinesList from "../components/routines/RoutinesList";
import AiRoutineGenerator from "../components/routines/AiRoutineGenerator";
import { User } from "@/api/entities"; // Import User
import { TierLimit } from "@/api/entities"; // Import TierLimit
import UpgradeModal from "../components/shared/UpgradeModal"; // Import UpgradeModal
import { industryConfig } from "@/components/shared/industryConfig"; // Import shared config

export default function Routines() {
  const [routines, setRoutines] = useState([]);
  const [filteredRoutines, setFilteredRoutines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("updated_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [tierLimits, setTierLimits] = useState(null);

  const [filters, setFilters] = useState({
    industry: "all",
    routine_type: "all",
    status: "all",
    priority: "all",
    frequency: "all"
  });

  // Get URL params for initial filters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    if (statusParam) {
      setFilters((prev) => ({ ...prev, status: statusParam }));
    }
    const queryParam = urlParams.get('query');
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        if (user?.tier) {
          const limits = await TierLimit.filter({ tier: user.tier });
          if (limits.length > 0) {
            setTierLimits(limits[0]);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
      
      setIsLoading(true);
      try {
        const data = await Routine.list('-updated_date');
        // Add defensive check for array
        setRoutines(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading routines:', error);
        setRoutines([]); // Ensure routines is an array even on error
      }
      setIsLoading(false);
    };

    loadInitialData();
  }, []); // This useEffect runs only once on mount

  const loadRoutines = async () => {
    setIsLoading(true);
    try {
      const data = await Routine.list('-updated_date');
      setRoutines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading routines:', error);
      setRoutines([]); // Ensure routines is an array even on error
    }
    setIsLoading(false);
  };

  const handleRoutineCreation = async () => {
    if (!currentUser || !tierLimits) {
      // If user or tier limits aren't loaded yet, just proceed for now or show loading
      // Alternatively, disable button until loaded
      window.location.href = createPageUrl("Templates");
      return;
    }

    if (currentUser.tier === 'free') {
      const activeRoutines = (Array.isArray(routines) ? routines : []).filter((r) => r.status === 'active' && r.created_by === currentUser.email);
      if (activeRoutines.length >= tierLimits.max_active_routines) {
        setUpgradeFeature("Active Routines");
        setShowUpgradeModal(true);
        return;
      }
    }
    // If not blocked, proceed to open the template page
    window.location.href = createPageUrl("Templates");
  };

  const handleAiCreation = () => {
    if (!currentUser) {
      // If user isn't loaded yet, just proceed for now or show loading
      // Alternatively, disable button until loaded
      setShowAiGenerator(true);
      return;
    }

    if (currentUser.tier === 'free') {
      setUpgradeFeature("AI Routine Generation");
      setShowUpgradeModal(true);
      return;
    }
    setShowAiGenerator(true);
  };

  const applyFilters = useCallback(() => {
    // Add defensive check for routines array
    const safeRoutines = Array.isArray(routines) ? routines : [];
    let filtered = [...safeRoutines];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((routine) =>
      routine.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      routine.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Industry filter
    if (filters.industry !== "all") {
      filtered = filtered.filter((routine) => routine.industry === filters.industry);
    }

    // Routine type filter
    if (filters.routine_type !== "all") {
      filtered = filtered.filter((routine) => (routine.routine_type || 'routine') === filters.routine_type);
    }

    // Status filter
    if (filters.status !== "all") {
      if (filters.status === "overdue") {
        filtered = filtered.filter((routine) =>
          routine.status === 'active' &&
          routine.next_due_date &&
          isBefore(new Date(routine.next_due_date), startOfDay(new Date())) // Fixed overdue calculation
        );
      } else {
        filtered = filtered.filter((routine) => routine.status === filters.status);
      }
    }

    // Priority filter
    if (filters.priority !== "all") {
      filtered = filtered.filter((routine) => routine.priority === filters.priority);
    }

    // Frequency filter
    if (filters.frequency !== "all") {
      filtered = filtered.filter((routine) => routine.frequency === filters.frequency);
    }

    // Sorting
    filtered.sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];

      if (sortBy === "next_due_date") {
        valueA = valueA ? new Date(valueA) : new Date('9999-12-31'); // Push null/undefined dates to end
        valueB = valueB ? new Date(valueB) : new Date('9999-12-31');
      } else if (sortBy === "completion_rate") {
        valueA = valueA || 0;
        valueB = valueB || 0;
      }

      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredRoutines(filtered);
  }, [routines, searchQuery, filters, sortBy, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleRoutineUpdate = async () => {
    await loadRoutines();
  };

  const getStatusCounts = () => {
    // Modified to use filteredRoutines as base for counts as per outline,
    // and ensured all original count categories (total, active, draft, paused, overdue) are present.
    const safeFilteredRoutines = Array.isArray(filteredRoutines) ? filteredRoutines : [];
    const total = safeFilteredRoutines.length;
    const active = safeFilteredRoutines.filter(r => r.status === 'active').length;
    const overdue = safeFilteredRoutines.filter(r =>
      r.status === 'active' &&
      r.next_due_date &&
      isBefore(new Date(r.next_due_date), startOfDay(new Date()))
    ).length;
    const draft = safeFilteredRoutines.filter(r => r.status === 'draft').length;
    const paused = safeFilteredRoutines.filter(r => r.status === 'paused').length;

    return { total, active, overdue, draft, paused };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header - Responsive */}
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start lg:gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 flex items-center gap-3">
              <ClipboardList className="w-8 h-8 md:w-10 md:h-10 text-slate-700" />
              Routine Management
            </h1>
            <p className="text-base md:text-lg text-slate-600">Monitor, assign, and track your operational routines.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              onClick={handleAiCreation}
              className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white relative justify-center">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Create with AI</span>
              <span className="sm:hidden">AI Create</span>
              <Badge className="bg-white/20 text-white border-white/30 text-xs font-medium">
                AI
              </Badge>
            </Button>
            <Button onClick={handleRoutineCreation} variant="outline" className="gap-2 bg-slate-900 hover:bg-slate-800 text-white border-slate-900 justify-center">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Routine</span>
                <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Stats Bar - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm">
            {/* Updated 'all' to 'total' as per the modified getStatusCounts */}
            <div className="text-xl md:text-2xl font-bold text-slate-900">{statusCounts.total}</div>
            <div className="text-xs md:text-sm text-slate-500">Total</div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm">
            <div className="text-xl md:text-2xl font-bold text-emerald-600">{statusCounts.active}</div>
            <div className="text-xs md:text-sm text-slate-500">Active</div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm">
            <div className="text-xl md:text-2xl font-bold text-yellow-600">{statusCounts.draft}</div>
            <div className="text-xs md:text-sm text-slate-500">Draft</div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm">
            <div className="text-xl md:text-2xl font-bold text-slate-600">{statusCounts.paused}</div>
            <div className="text-xs md:text-sm text-slate-500">Paused</div>
          </div>
          <div className="bg-white rounded-xl p-3 md:p-4 border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
            <div className="text-xl md:text-2xl font-bold text-red-600">{statusCounts.overdue}</div>
            <div className="text-xs md:text-sm text-slate-500">Overdue</div>
          </div>
        </div>

        {/* Search and Controls - Responsive */}
        {/* Updated the parent div classes and content as per the outline */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="search"
              inputMode="search"
              placeholder="Search routines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-slate-200"
              autoComplete="off" />

          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 justify-center">
                  {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  <span className="hidden sm:inline">Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy("updated_date")}>
                  Last Updated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("next_due_date")}>
                  Due Date
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("title")}>
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("completion_rate")}>
                  Completion Rate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                  {sortOrder === "asc" ? "Descending" : "Ascending"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Mode */}
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList>
                <TabsTrigger value="grid" className="gap-1 md:gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Grid</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-1 md:gap-2">
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          industryConfig={industryConfig} />

        {/* Results Count - Responsive */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm md:text-base text-slate-600">
            Showing {(Array.isArray(filteredRoutines) ? filteredRoutines : []).length} of {(Array.isArray(routines) ? routines : []).length} routines
          </p>
          {(searchQuery || Object.values(filters).some((f) => f !== "all")) &&
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setFilters({
                industry: "all",
                routine_type: "all",
                status: "all",
                priority: "all",
                frequency: "all"
              });
            }}
            className="text-slate-500 hover:text-slate-700 self-start sm:self-auto">
              Clear Filters
            </Button>
          }
        </div>

        {/* Routines Display */}
        {viewMode === "grid" ?
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {isLoading ?
          Array(6).fill(0).map((_, i) =>
          <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 rounded-xl h-64"></div>
                </div>
          ) :
          (Array.isArray(filteredRoutines) ? filteredRoutines : []).length === 0 ?
          <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">No routines found</h3>
                  <p className="text-slate-500 mb-6">
                    {searchQuery || Object.values(filters).some((f) => f !== "all") ?
              "Try adjusting your search or filters" :
              "Create your first routine to get started"}
                  </p>
                  <Button onClick={handleRoutineCreation}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Routine
                  </Button>
                </div> :

          (Array.isArray(filteredRoutines) ? filteredRoutines : []).map((routine) =>
          <RoutineCard
            key={routine.id}
            routine={routine}
            industryConfig={industryConfig}
            onUpdate={handleRoutineUpdate} />
          )
          }
          </div> :

        <RoutinesList
          routines={Array.isArray(filteredRoutines) ? filteredRoutines : []}
          isLoading={isLoading}
          industryConfig={industryConfig}
          onUpdate={handleRoutineUpdate} />

        }
      </div>

      {/* AI Generator Modal */}
      {showAiGenerator &&
      <AiRoutineGenerator onClose={() => setShowAiGenerator(false)} />
      }

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeFeature} />

    </div>);
}
