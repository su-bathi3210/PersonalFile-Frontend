import React from 'react';

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet
} from 'react-router-dom';

// Logins
import LoginRegister from './Component/Logins/LoginRegister';

// Dashboards
import EmployeeDashboard from './Component/Dashboard/EmployeeDashboard';
import AdminVehicleDashboard from './Component/Dashboard/AdminVehicleDashboard';
import ApprovalVehicleDashboard from './Component/Dashboard/ApprovalVehicleDashboard';
import AdminPFDashboard from './Component/Dashboard/AdminPFDashboard';
import ApprovalPFDashboard from './Component/Dashboard/ApprovalPFDashboard';
import DriverDashboard from './Component/Dashboard/DriverDashboard';

// NavBars
import EmployeeNavBar from './Component/NavBars/EmployeeNavBar';
import AdminPersonalFileNavBar from './Component/NavBars/AdminPersonalFileNavBar';
import AdminVehicleNavBar from './Component/NavBars/AdminVehicleNavBar';
import ApproveOfficerVehicleNavBar from './Component/NavBars/ApproveOfficerVehicleNavBar';
import DriverNavBar from './Component/NavBars/DriverNavBar';


// PersonalFile
import EmployeePersonalFile from './Component/PersonalFile/Employee/EmployeePersonalFile';
import AdminPersonalFile from './Component/PersonalFile/Admin/AdminPersonalFile';
import IncrementDateHandling from './Component/PersonalFile/Admin/IncrementDateHandling';
import IncrementFormsHandling from './Component/PersonalFile/Admin/IncrementFormsHandling';
import AdminPFHistory from './Component/PersonalFile/Admin/AdminPFHistory';


// Vehicle
import EmployeeVehicle from './Component/Vehicle/Employee/EmployeeVehicle';
import AdminVehicleRequest from './Component/Vehicle/Admin/AdminVehicleRequest';
import AdminDriversVehicles from './Component/Vehicle/Admin/AdminDriversVehicles';
import AdminVehicleHistory from './Component/Vehicle/Admin/AdminVehicleHistory';
import ApproveOfficerVehicle from './Component/Vehicle/ApprovalOfficer/ApproveOfficerVehicle';
import ApproveOfficerVehicleHistory from './Component/Vehicle/ApprovalOfficer/ApproveOfficerVehicleHistory';

const Unauthorized = () => <div><h2>Access Denied: You do not have permission.</h2></div>;

const DashboardLayout = ({ children, NavbarComponent }) => {
  return (
    <>
      <NavbarComponent />
      <div className="dashboard-content">
        {children}
      </div>
    </>
  );
};

const ProtectedRoute = ({ children, allowedRoles, Navbar }) => {
  const userRolesString = localStorage.getItem('roles');
  const userRoles = userRolesString ? JSON.parse(userRolesString) : [];
  const isAuthenticated = localStorage.getItem('token');

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const hasAccess = allowedRoles.some(role => userRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to="/Unauthorized" />;
  }

  const content = children ? children : <Outlet />;

  if (Navbar) {
    return <DashboardLayout NavbarComponent={Navbar}>{children}</DashboardLayout>;
  }

  return content;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginRegister />} />
        <Route path="/Unauthorized" element={<Unauthorized />} />

        <Route element={
          <ProtectedRoute allowedRoles={['ROLE_EMPLOYEE']} Navbar={EmployeeNavBar}>
            <div className="employee-layout-wrapper"><Outlet /></div> </ProtectedRoute>}>

          <Route path="/EmployeeDashboard" element={<EmployeeDashboard />} />
          <Route path="/EmployeePersonalFile" element={<EmployeePersonalFile />} />
          <Route path="/EmployeeVehicle" element={<EmployeeVehicle />} />
        </Route>


        <Route element={
          <ProtectedRoute allowedRoles={['ROLE_VEHICLE_ADMIN']} Navbar={AdminVehicleNavBar}>
            <div className="employee-layout-wrapper"><Outlet /></div> </ProtectedRoute>}>

          <Route path="/AdminVehicleDashboard" element={<AdminVehicleDashboard />} />
          <Route path="/AdminVehicleRequest" element={<AdminVehicleRequest />} />
          <Route path="/AdminDriversVehicles" element={<AdminDriversVehicles />} />
          <Route path="/AdminVehicleHistory" element={<AdminVehicleHistory />} />
        </Route>

        <Route element={
          <ProtectedRoute allowedRoles={['ROLE_VEHICLE_APPROVAL']} Navbar={ApproveOfficerVehicleNavBar}>
            <div className="employee-layout-wrapper"><Outlet /></div> </ProtectedRoute>}>

          <Route path="/ApprovalVehicleDashboard" element={<ApprovalVehicleDashboard />} />
          <Route path="/ApproveOfficerVehicle" element={<ApproveOfficerVehicle />} />
          <Route path="/ApproveOfficerVehicleHistory" element={<ApproveOfficerVehicleHistory />} />
        </Route>


        <Route element={
          <ProtectedRoute allowedRoles={['ROLE_DRIVER']} Navbar={DriverNavBar}>
            <div className="employee-layout-wrapper"><Outlet /></div> </ProtectedRoute>}>

          <Route path="/DriverDashboard" element={<DriverDashboard />} />
        </Route>

        <Route element={
          <ProtectedRoute allowedRoles={['ROLE_PERSONALFILE_ADMIN']} Navbar={AdminPersonalFileNavBar}>
            <div className="employee-layout-wrapper"><Outlet /></div> </ProtectedRoute>}>

          <Route path="/AdminPFDashboard" element={<AdminPFDashboard />} />
          <Route path="/AdminPersonalFile" element={<AdminPersonalFile />} />
          <Route path="/IncrementDateHandling" element={<IncrementDateHandling />} />
          <Route path="/IncrementFormsHandling" element={<IncrementFormsHandling />} />
          <Route path="/AdminPFHistory" element={<AdminPFHistory />} />
        </Route>

        <Route path="/ApprovalPFDashboard" element={
          <ProtectedRoute allowedRoles={['ROLE_PERSONALFILE_APPROVAL']}>
            <ApprovalPFDashboard />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;