import React, {
    useState,
    useEffect
} from 'react';

import { useNavigate } from 'react-router-dom';

import API from '../../API/Axios';

import '../../CSS/AdminOngoingVehicleRequest.css';

const AdminOngoingVehicleRequest = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchTodayRequests = async () => {
        try {
            setLoading(true);
            const response = await API.get('/vehicle-requests/today');
            setRequests(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching today's vehicle requests:", err);
            setError("Unable to receive vehicle requests today.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTodayRequests();
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'TRIP_PROCESS_CONFIRMED':
                return <span className="admin-ongoing-vehicle-request-badge admin-ongoing-vehicle-request-badge-confirmed">Trip Process Confirmed</span>;
            case 'PENDING':
                return <span className="admin-ongoing-vehicle-request-badge admin-ongoing-vehicle-request-badge-pending">Pending</span>;
            case 'APPROVED_BY_VEHICLE_ADMIN':
                return <span className="admin-ongoing-vehicle-request-badge admin-ongoing-vehicle-request-badge-admin-approved">Admin Approved</span>;
            case 'APPROVED_BY_VEHICLE_APPROVAL_OFFICER':
                return <span className="admin-ongoing-vehicle-request-badge admin-ongoing-vehicle-request-badge-officer-approved">Officer Approved</span>;
            case 'COMPLETED':
                return <span className="admin-ongoing-vehicle-request-badge admin-ongoing-vehicle-request-badge-completed">Completed</span>;
            default:
                return <span className="admin-ongoing-vehicle-request-badge admin-ongoing-vehicle-request-badge-default">{status}</span>;
        }
    };

    return (
        <div className="admin-ongoing-vehicle-request-container">
            <div className="admin-ongoing-vehicle-request-header-area">
                <div className="admin-ongoing-vehicle-request-header-text">
                    <h1 className="admin-ongoing-vehicle-request-title">Monitoring of today's vehicle running plans and reservations</h1>
                    <p className="admin-ongoing-vehicle-request-subtitle">
                        Here you can check all the vehicle requests submitted by the department officials for today, their current status, assigned drivers and complete details of the vehicles. Use the Refresh button to update the data in the system.
                    </p>
                </div>

                <div className="admin-ongoing-vehicle-request-header-actions">
                    <button
                        onClick={() => navigate('/AdminVehicleDashboard')}
                        className="admin-ongoing-vehicle-request-back-btn"
                    >
                        ← <span className="admin-ongoing-vehicle-request-back-text">Back</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="admin-ongoing-vehicle-request-loading-container">
                    <span className="admin-ongoing-vehicle-request-loading-text">Loading data...</span>
                </div>
            ) : error ? (
                <div className="admin-ongoing-vehicle-request-error-container">
                    {error}
                </div>
            ) : requests.length === 0 ? (
                <div className="admin-ongoing-vehicle-request-empty-container">
                    <p className="admin-ongoing-vehicle-request-empty-text">No vehicle requests have been registered for today.</p>
                </div>
            ) : (
                <div className="admin-ongoing-vehicle-request-table-card">
                    <div className="admin-ongoing-vehicle-request-table-responsive">
                        <table className="admin-ongoing-vehicle-request-table">
                            <thead>
                                <tr className="admin-ongoing-vehicle-request-th-row">
                                    <th className="admin-ongoing-vehicle-request-th text-center">REQUESTER NAME</th>
                                    <th className="admin-ongoing-vehicle-request-th text-center">EMAIL</th>
                                    <th className="admin-ongoing-vehicle-request-th text-center">Department</th>
                                    <th className="admin-ongoing-vehicle-request-th text-center">JOURNEY (FROM - TO)</th>
                                    <th className="admin-ongoing-vehicle-request-th text-center">Duty Nature</th>
                                    <th className="admin-ongoing-vehicle-request-th text-center">ASSIGNED VEHICLE AND DRIVERS</th>
                                    <th className="admin-ongoing-vehicle-request-th text-center">STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="admin-ongoing-vehicle-request-tbody">
                                {requests.map((req) => (
                                    <tr key={req.id} className="admin-ongoing-vehicle-request-tr">
                                        <td className="admin-ongoing-vehicle-request-td text-center">{req.requesterName}</td>
                                        <td className="admin-ongoing-vehicle-request-td text-center">{req.requesterEmail}</td>
                                        <td className="admin-ongoing-vehicle-request-td text-center">{req.department}</td>
                                        <td className="admin-ongoing-vehicle-request-td text-center">
                                            <div>{req.fromLocation} ➡️ {req.toLocation}</div>
                                            <div className="admin-ongoing-vehicle-request-distance">DISTANCE: {req.distanceKm || req.distance || 'N/A'}</div>
                                        </td>
                                        <td className="admin-ongoing-vehicle-request-td text-center">{req.dutyNature}</td>
                                        <td className="admin-ongoing-vehicle-request-td text-center">
                                            {req.assignedVehicle || req.assignedDriver ? (
                                                <div className="admin-ongoing-vehicle-request-assigned-info">
                                                    {req.assignedVehicle && (
                                                        <div className="admin-ongoing-vehicle-request-vehicle-info">
                                                            {req.assignedVehicle.vehicleNumber} ({req.assignedVehicle.manufacturer} {req.assignedVehicle.model})
                                                        </div>
                                                    )}
                                                    {req.assignedDriver && (
                                                        <div className="admin-ongoing-vehicle-request-driver-info">
                                                            {req.assignedDriver.name} - {req.assignedDriver.phoneNumber}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="admin-ongoing-vehicle-request-not-assigned-text">NOT ASSIGNED</span>
                                            )}
                                        </td>
                                        <td className="admin-ongoing-vehicle-request-td text-center">
                                            {getStatusBadge(req.status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOngoingVehicleRequest;