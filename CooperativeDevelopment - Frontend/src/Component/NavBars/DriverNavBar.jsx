import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import '../CSS/EmployeeNavBar.css';
import logo from '../../Assets/DCDLogo.png';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="searchIconSvg">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
);

const DriverNavBar = () => {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const displayName = localStorage.getItem('username') || "User";

    const getInitials = (name) => {
        if (!name || name === "User") return "??";
        const parts = name.trim().split(/\s+/);

        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        } else {
            return (parts[0].charAt(0) + (parts[0].length > 1 ? parts[0].charAt(1) : "")).toUpperCase();
        }
    };

    const menuItems = [
        { name: 'Request', path: '/DriverVehicleRequest' },
        { name: 'Vehicle Update', path: '/DriverVehicleUpdate' },
    ];

    return (
        <nav className="navBar">
            <div className="leftSection">
                <div className="logoContainer">
                    <img src={logo} alt="DCD Logo" className="logoImage" />
                </div>
                <div className="titleContainer">
                    <span className="appName">Department of Cooperative Development</span>
                    <span className="subName">Central Province</span>
                </div>
            </div>

            <div className={`centerSection ${mobileMenuOpen ? 'active' : ''}`}>
                <ul className="menuList">
                    {menuItems.map(item => {
                        const isActiveLink = location.pathname === item.path ||
                            (item.relatedPaths && item.relatedPaths.includes(location.pathname));

                        return (
                            <li key={item.name} className="menuItem" onClick={() => setMobileMenuOpen(false)}>
                                <NavLink
                                    to={item.path}
                                    className={isActiveLink ? 'menuLink active' : 'menuLink'}
                                >
                                    {item.name}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div className="rightSection">
                <div className="searchContainer">
                    <input type="text" placeholder="Search" className="searchInput" />
                    <SearchIcon />
                </div>

                <Link to={`/`} style={{ textDecoration: 'none' }}>
                    <div className="profileContainer" title={displayName}>
                        <div className="profileIcon initialsCircle">
                            {getInitials(displayName)}
                        </div>
                    </div>
                </Link>

                <div className="mobileMenuBtn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    <MenuIcon />
                </div>
            </div>
        </nav>
    );
};

export default DriverNavBar;