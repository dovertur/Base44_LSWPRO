

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Settings,
  Users,
  ClipboardList,
  BookTemplate,
  BarChart3,
  Calendar,
  CreditCard,
  Shield,
  CheckSquare,
  User as UserIcon,
  LogOut,
  Menu, // For mobile
  X, // For mobile
  Search,
  Download,
  Plus,
  TrendingUp } from
"lucide-react";
import { Input } from "@/components/ui/input";


// Sidebar Navigation Item Component
const NavItem = ({ item, isMobile, onLinkClick }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.url);

  return (
    <Link
      to={item.url}
      onClick={onLinkClick}
      className={`
        flex items-center text-sm font-medium transition-colors duration-150
        ${isMobile ? 'px-4 py-3' : 'px-3 py-2 rounded-lg'}
        ${isActive ?
      'bg-slate-200 text-slate-900' :
      'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
      `
      }>

      <item.icon className="w-5 h-5 mr-3" />
      <span>{item.title}</span>
    </Link>);

};

// Main navigation items
const navigationItems = [
{ title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
{ title: "My Tasks", url: createPageUrl("MyTasks"), icon: CheckSquare },
{ title: "Routines", url: createPageUrl("Routines"), icon: ClipboardList },
{ title: "Templates", url: createPageUrl("Templates"), icon: BookTemplate },
{ title: "Team", url: createPageUrl("Team"), icon: Users },
{ title: "Analytics", url: createPageUrl("Analytics"), icon: BarChart3 },
{ title: "Calendar", url: createPageUrl("Calendar"), icon: Calendar }];


// Settings navigation items (for user dropdown)
const settingsNavigation = [
{ title: "My Profile", url: createPageUrl("MyProfile"), icon: UserIcon },
{ title: "Billing", url: createPageUrl("Billing"), icon: CreditCard },
{ title: "Settings", url: createPageUrl("Settings"), icon: Settings },
{ title: "Audit Trail", url: createPageUrl("AuditTrail"), icon: Shield, adminOnly: true }];


export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const loggedInUser = await User.me();
        setUser(loggedInUser);
      } catch (e) {
        // Not logged in or error fetching user
        console.log(e);
      }
    };
    fetchUser();
  }, [currentPageName]);

  // Reset search query when page changes
  useEffect(() => {
    if (currentPageName !== 'Dashboard') {
      setSearchQuery("");
    }
  }, [currentPageName]);

  // Close sidebar when user clicks outside or presses Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen]);

  const handleLogout = async () => {
    await User.logout();
    window.location.href = "/"; // Redirect to a public landing page or login
  };

  const handleMobileLinkClick = () => {
    setIsSidebarOpen(false);
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(createPageUrl(`Routines?query=${encodeURIComponent(searchQuery.trim())}`));
    }
  };

  const handleExport = () => {
    document.dispatchEvent(new CustomEvent('export-routines-csv'));
  };

  // User Dropdown Component with better keyboard navigation
  const UserDropdown = () =>
  <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-offset-2 focus-visible:ring-2 focus-visible:ring-slate-400">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.custom_picture_url || ''} alt={user.full_name || 'User'} loading="lazy" />
            <AvatarFallback className="text-xs">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.full_name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            {user.tier &&
          <div className="pt-1">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 capitalize">
                  {user.tier.replace('_', ' ')}
                </Badge>
              </div>
          }
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {settingsNavigation.map((item) =>
      (!item.adminOnly || user.role === 'admin') &&
      <DropdownMenuItem key={item.title} asChild>
              <Link to={item.url} className="flex items-center cursor-pointer">
                <item.icon className="w-4 h-4 mr-2" />
                <span>{item.title}</span>
              </Link>
            </DropdownMenuItem>

      )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>;


  if (!user) {
    // If user is null, show a loading spinner
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-center h-16 border-b border-slate-200 px-4">
          <Link to={createPageUrl("Dashboard")} className="text-slate-800 text-2xl font-bold hover:text-slate-600 transition-colors">LSWPro

          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => <NavItem key={item.title} item={item} />)}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">© 2024 LSW Pro</p>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen &&
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-300"
        onClick={() => setIsSidebarOpen(false)}
        aria-label="Close sidebar" />

      }

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-xl md:hidden transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
        }>

        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          <Link to={createPageUrl("Dashboard")} onClick={handleMobileLinkClick} className="text-xl font-bold text-slate-800">
            LSW Pro
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(false)}
            className="h-8 w-8"
            aria-label="Close sidebar">

            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => <NavItem key={item.title} item={item} isMobile onLinkClick={handleMobileLinkClick} />)}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-200 shadow-sm gap-4">
          {/* Left side: Hamburger + Page-specific controls */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar">

              <Menu className="w-5 h-5" />
            </Button>
            
            {/* Dashboard Specific Controls */}
            {currentPageName === 'Dashboard' &&
            <div className="hidden md:flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                  type="search"
                  placeholder="Search routines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearch}
                  className="pl-10 h-9 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  autoComplete="off"
                  inputMode="search" />

                </div>
              </div>
            }
          </div>

          {/* Right side: Actions + User Dropdown */}
          <div className="flex items-center gap-3">
             {currentPageName === 'Dashboard' &&
            <div className="hidden md:flex items-center gap-2">
                 <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-slate-300 hover:bg-slate-50"
                onClick={handleExport}>

                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Link to={createPageUrl("Templates")}>
                    <Button variant="outline" size="sm" className="gap-1.5 border-slate-300 hover:bg-slate-50">
                      <Plus className="w-4 h-4" />
                      New Routine
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Analytics")}>
                    <Button size="sm" className="gap-1.5 bg-slate-900 hover:bg-slate-800">
                      <TrendingUp className="w-4 h-4" />
                      View Analytics
                    </Button>
                  </Link>
               </div>
            }
            <UserDropdown />
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>);

}
