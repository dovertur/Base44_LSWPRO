import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Templates from "./Templates";

import Routines from "./Routines";

import Analytics from "./Analytics";

import Team from "./Team";

import Calendar from "./Calendar";

import Billing from "./Billing";

import Settings from "./Settings";

import AuditTrail from "./AuditTrail";

import MyTasks from "./MyTasks";

import ExecuteRoutine from "./ExecuteRoutine";

import MyProfile from "./MyProfile";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Templates: Templates,
    
    Routines: Routines,
    
    Analytics: Analytics,
    
    Team: Team,
    
    Calendar: Calendar,
    
    Billing: Billing,
    
    Settings: Settings,
    
    AuditTrail: AuditTrail,
    
    MyTasks: MyTasks,
    
    ExecuteRoutine: ExecuteRoutine,
    
    MyProfile: MyProfile,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Templates" element={<Templates />} />
                
                <Route path="/Routines" element={<Routines />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Team" element={<Team />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/Billing" element={<Billing />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/AuditTrail" element={<AuditTrail />} />
                
                <Route path="/MyTasks" element={<MyTasks />} />
                
                <Route path="/ExecuteRoutine" element={<ExecuteRoutine />} />
                
                <Route path="/MyProfile" element={<MyProfile />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}