import React, {
    useState,
    useEffect
} from 'react';

import { useNavigate } from 'react-router-dom';

import api from '../API/Axios';

import '../CSS/ApprovalVehicleDashboard.css';

const ApprovalVehicleDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalVehicles: 0,
        totalDrivers: 0,
        monthApproved: 0,
        monthRejected: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const requestsResponse = await api.get('/vehicle-requests/admin-approved-list');
            const vehiclesResponse = await api.get('/vehicles/all');
            const driversResponse = await api.get('/drivers/all');

            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth();

            let approvedCount = 0;
            let rejectedCount = 0;

            if (requestsResponse.data && Array.isArray(requestsResponse.data)) {
                requestsResponse.data.forEach(req => {
                    if (req.dateOfTravel) {
                        const travelDate = new Date(req.dateOfTravel);
                        if (travelDate.getFullYear() === currentYear && travelDate.getMonth() === currentMonth) {
                            if (req.status === 'APPROVED_BY_VEHICLE_APPROVAL_OFFICER') {
                                approvedCount++;
                            } else if (req.status === 'REJECTED_BY_VEHICLE_APPROVAL_OFFICER') {
                                rejectedCount++;
                            }
                        }
                    }
                });
            }
            setStats({
                totalVehicles: vehiclesResponse.data?.length || 0,
                totalDrivers: driversResponse.data?.length || 0,
                monthApproved: approvedCount,
                monthRejected: rejectedCount
            });

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError("Unable to retrieve dashboard statistics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const totalProcessed = stats.monthApproved + stats.monthRejected;
    const approvalRate = totalProcessed > 0 ? Math.round((stats.monthApproved / totalProcessed) * 100) : 0;

    return (
        <div className="approval-vehicle-dashboard-container">
            <div className="approval-vehicle-dashboard-header-zone">
                <h2 className="approval-vehicle-dashboard-title">Vehicle Request Approval Officer Board</h2>
                <p className="approval-vehicle-dashboard-subtitle">Assistant Commissioner / Approval Officer Division</p>
            </div>

            <div className="approval-vehicle-dashboard-stats-grid">
                <div className="approval-vehicle-dashboard-stat-card approval-vehicle-dashboard-stat-vehicles">
                    <div className="approval-vehicle-dashboard-stat-info">
                        <span className="approval-vehicle-dashboard-stat-label">Total number of vehicles</span>
                        <h3 className="approval-vehicle-dashboard-stat-value">{stats.totalVehicles}</h3>
                    </div>
                </div>
                <div className="approval-vehicle-dashboard-stat-card approval-vehicle-dashboard-stat-drivers">
                    <div className="approval-vehicle-dashboard-stat-info">
                        <span className="approval-vehicle-dashboard-stat-label">Total number of drivers</span>
                        <h3 className="approval-vehicle-dashboard-stat-value">{stats.totalDrivers}</h3>
                    </div>
                </div>
                <div className="approval-vehicle-dashboard-stat-card approval-vehicle-dashboard-stat-approved">
                    <div className="approval-vehicle-dashboard-stat-info">
                        <span className="approval-vehicle-dashboard-stat-label">Approved this month</span>
                        <h3 className="approval-vehicle-dashboard-stat-value">{stats.monthApproved}</h3>
                    </div>
                </div>
                <div className="approval-vehicle-dashboard-stat-card approval-vehicle-dashboard-stat-rejected">
                    <div className="approval-vehicle-dashboard-stat-info">
                        <span className="approval-vehicle-dashboard-stat-label">Rejected this month</span>
                        <h3 className="approval-vehicle-dashboard-stat-value">{stats.monthRejected}</h3>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="approval-vehicle-dashboard-loading">Loading data...</div>
            ) : error ? (
                <div className="approval-vehicle-dashboard-error">{error}</div>
            ) : (
                <div className="approval-vehicle-dashboard-navigation-card">
                    <h3 className="approval-vehicle-dashboard-view-title">Quick System Navigation</h3>
                    <p className="approval-vehicle-dashboard-navigation-desc">
                        Select an option below to manage ongoing vehicle requests or view past approval history logs.
                    </p>
                    <div className="approval-vehicle-dashboard-nav-buttons-container">

                        <button className="approval-vehicle-dashboard-nav-btn btn-requests" onClick={() => navigate('/ApproveOfficerVehicle')}>
                            <span className="nav-btn-icon">📋</span>
                            <div className="nav-btn-text-wrapper">
                                <span className="nav-btn-main-text">Pending Vehicle Requests</span>
                                <span className="nav-btn-sub-text">View & approve recommended requests</span>
                            </div>
                        </button>

                        <button className="approval-vehicle-dashboard-nav-btn btn-history" onClick={() => navigate('/ApproveOfficerVehicle')}>
                            <span className="nav-btn-icon">⏱️</span>
                            <div className="nav-btn-text-wrapper">
                                <span className="nav-btn-main-text">Approval Action History</span>
                                <span className="nav-btn-sub-text">Review past approved/rejected log sheets</span>
                            </div>
                        </button>

                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalVehicleDashboard;