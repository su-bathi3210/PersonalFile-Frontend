import React, {
    useState,
    useEffect,
    useCallback
} from 'react';

import API from '../../API/Axios';

import '../../CSS/AdminVehicleRequest.css';

const AdminVehicleRequest = () => {
    const [allRequests, setAllRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [selectedDriver, setSelectedDriver] = useState('');

    const [adminRejectRemark, setAdminRejectRemark] = useState('');
    const [customRejectReason, setCustomRejectReason] = useState('');

    const [allApprovedRequests, setAllApprovedRequests] = useState([]);
    const [allReqLoading, setAllReqLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchAllRequests = useCallback(async () => {
        setLoading(true);
        try {
            const response = await API.get('/vehicle-requests/pending');
            setAllRequests(response.data);

            if (selectedRequest) {
                const updatedSelected = response.data.find(r => (r.id || r._id) === (selectedRequest.id || selectedRequest._id));
                if (updatedSelected) setSelectedRequest(updatedSelected);
            }
        } catch (error) {
            console.error('❌ Error fetching admin vehicle requests:', error);
            setMessage({ type: 'danger', text: 'Failed to load vehicle requests.' });
        } finally {
            setLoading(false);
        }
    }, [selectedRequest]);

    const fetchOfficerApprovedRequests = async () => {
        try {
            setAllReqLoading(true);
            const response = await API.get('/vehicle-requests/officer-approved-list');
            console.log("Backend Data:", response.data);
            setAllApprovedRequests(response.data);
        } catch (error) {
            console.error("❌ Error fetching requests:", error);
        } finally {
            setAllReqLoading(false);
        }
    };

    useEffect(() => {
        fetchAllRequests();
        fetchVehiclesAndDrivers();
        fetchOfficerApprovedRequests();
    }, []);

    const fetchVehiclesAndDrivers = async () => {
        try {
            const vehicleRes = await API.get('/vehicles/all');
            const driverRes = await API.get('/drivers/all');

            setVehicles(vehicleRes.data);
            setDrivers(driverRes.data);
        } catch (error) {
            console.error('❌ Error fetching vehicles or drivers:', error);
        }
    };

    const handleSelectRequest = (req) => {
        setSelectedRequest(req);
        setSelectedVehicle('');
        setSelectedDriver('');
        setAdminRejectRemark('');
        setCustomRejectReason('');
    };

    const handleAdminReject = async (requestId) => {
        const finalRejectReason =
            adminRejectRemark === "Other"
                ? customRejectReason
                : adminRejectRemark;

        if (!finalRejectReason.trim()) {
            alert('⚠️ Please enter the reason for rejecting the request.');
            return;
        }

        if (!window.confirm('⚠️ Would you like to permanently deny this vehicle request?')) {
            return;
        }

        setActionLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await API.post(`/vehicle-requests/admin-reject/${requestId}`, null, {
                params: {
                    remarks: finalRejectReason
                }
            });

            if (response.status === 200 || response.status === 201) {
                setMessage({ type: 'success', text: '✅ Vehicle request has been successfully REJECTED by Admin.' });
                setSelectedRequest(null);
                setAdminRejectRemark('');
                setCustomRejectReason('');
                fetchAllRequests();
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            const errorMsg = error.response?.data?.message || '❌ Failed to reject vehicle request.';
            setMessage({ type: 'danger', text: errorMsg });
        } finally {
            setActionLoading(false);
        }
    };

    const handleVehicleApproval = async (requestId) => {
        if (!selectedVehicle || !selectedDriver) {
            setMessage({ type: 'danger', text: '⚠️ Please select both a vehicle and a driver before approving!' });
            return;
        }

        if (!window.confirm('⚠️ Would you like to reserve this vehicle and driver and forward it?')) {
            return;
        }

        setActionLoading(true);
        setMessage({ type: '', text: '' });

        const approvalDTO = {
            vehicleId: selectedVehicle,
            driverId: selectedDriver
        };

        try {
            const response = await API.put(`/vehicle-requests/${requestId}/approve`, approvalDTO);

            if (response.status === 200 || response.status === 201) {
                setMessage({ type: 'success', text: '✅ Vehicle request successfully approved and assigned!' });
                setSelectedRequest(null);
                setSelectedVehicle('');
                setSelectedDriver('');
                fetchAllRequests();
            }
        } catch (error) {
            console.error('Error approving vehicle request:', error);
            const errorMsg = error.response?.data?.message || '❌ Failed to approve and assign vehicle request.';
            setMessage({ type: 'danger', text: errorMsg });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteRequest = async (requestId) => {
        const isConfirmed = window.confirm("⚠️ Are you sure you want to complete this request and send the confirmation email?");

        if (!isConfirmed) return;

        try {
            setProcessingId(requestId);
            await API.post(`/vehicle-requests/complete/${requestId}`);

            setAllApprovedRequests(allApprovedRequests.filter(req => req.id !== requestId));
        } catch (error) {
            console.error("❌ Error completing request:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'APPROVED':
            case 'APPROVED_BY_VEHICLE_ADMIN': return 'admin-vehicle-status-approved';
            case 'REJECTED': return 'admin-vehicle-status-rejected';
            default: return 'admin-vehicle-status-pending';
        }
    };

    return (
        <div className="admin-vehicle-container fade-in">
            <div className="admin-vehicle-layout-grid">

                <div className="admin-vehicle-list-section">
                    <div className="admin-vehicle-card">
                        <div className="admin-vehicle-header">
                            <h4 className="admin-vehicle-title">Vehicle Requests Management</h4>
                            <p className="admin-vehicle-header-desc">Review and manage pending vehicle requests</p>
                        </div>

                        <div className="admin-vehicle-body">
                            {message.type && message.text && (
                                <div className={`admin-vehicle-alert admin-vehicle-alert-${message.type}`}>
                                    {message.text}
                                </div>
                            )}

                            {loading ? (
                                <div className="admin-vehicle-loading-wrapper">
                                    <div className="admin-vehicle-spinner"></div>
                                    <p className="admin-vehicle-loading-text">Loading incoming requests...</p>
                                </div>
                            ) : allRequests.length === 0 ? (
                                <div className="admin-vehicle-empty-wrapper">
                                    <p className="admin-vehicle-empty-text">No pending vehicle requests available to review.</p>
                                </div>
                            ) : (
                                <div className="admin-vehicle-list-wrapper">
                                    {allRequests.map((req) => (
                                        <div
                                            key={req.id || req._id}
                                            className={`admin-vehicle-item ${selectedRequest && (selectedRequest.id || selectedRequest._id) === (req.id || req._id) ? 'admin-vehicle-item-active' : ''}`}
                                            onClick={() => handleSelectRequest(req)}
                                        >
                                            <div className="admin-vehicle-item-meta">
                                                <span className="admin-vehicle-item-name">{req.requesterName || 'Unknown Employee'}</span>
                                                <span className="admin-vehicle-item-date">{req.travelDateTime ? new Date(req.travelDateTime).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                            <div className="admin-vehicle-item-details">
                                                <span>To: <strong>{req.toLocation}</strong></span>
                                                <span className={`admin-vehicle-badge ${getStatusClass(req.status)}`}>{req.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="admin-vehicle-details-section">
                    {selectedRequest ? (
                        <div className="admin-vehicle-card-details">
                            <div className="admin-vehicle-header-details">
                                <h4 className="admin-vehicle-title">Request Detailed View</h4>
                                <p className="admin-vehicle-header-desc">Employee info & journey justifications</p>
                            </div>

                            <div className="admin-vehicle-body-details">
                                <h5 className="admin-vehicle-section-title">Employee Details</h5>
                                <div className="admin-vehicle-info-block">
                                    <div className="admin-vehicle-info-row">
                                        <span className="admin-vehicle-info-label">Name:</span>
                                        <span className="admin-vehicle-info-value fw-bold">{selectedRequest.requesterName}</span>
                                    </div>
                                    <div className="admin-vehicle-info-row">
                                        <span className="admin-vehicle-info-label">Email Address:</span>
                                        <span className="admin-vehicle-info-value admin-vehicle-email-highlight">{selectedRequest.requesterEmail}</span>
                                    </div>
                                    <div className="admin-vehicle-info-row">
                                        <span className="admin-vehicle-info-label">Phone Number:</span>
                                        <span className="admin-vehicle-info-value">{selectedRequest.phoneNumber || 'N/A'}</span>
                                    </div>
                                    <div className="admin-vehicle-info-row">
                                        <span className="admin-vehicle-info-label">Designation:</span>
                                        <span className="admin-vehicle-info-value">{selectedRequest.requesterPosition}</span>
                                    </div>
                                    <div className="admin-vehicle-info-row">
                                        <span className="admin-vehicle-info-label">Department:</span>
                                        <span className="admin-vehicle-info-value">{selectedRequest.department}</span>
                                    </div>
                                </div>

                                <h5 className="admin-vehicle-section-title">Journey & Duty Details</h5>
                                <div className="admin-vehicle-info-block">
                                    <div className="admin-vehicle-info-row">
                                        <span className="admin-vehicle-info-label">Nature of Duty:</span>
                                        <span className="admin-vehicle-info-value">{selectedRequest.dutyNature}</span>
                                    </div>
                                    <div className="admin-vehicle-info-row">
                                        <span className="admin-vehicle-info-label">Route:</span>
                                        <span className="admin-vehicle-info-value">From <strong>{selectedRequest.fromLocation}</strong> to <strong>{selectedRequest.toLocation}</strong></span>
                                    </div>
                                    <div className="admin-vehicle-info-row">
                                        <span className="admin-vehicle-info-label">Distance:</span>
                                        <span className="admin-vehicle-info-value">{selectedRequest.distanceKm} Km</span>
                                    </div>
                                    <div className="admin-vehicle-info-row">
                                        <span className="admin-vehicle-info-label">Date & Time:</span>
                                        <span className="admin-vehicle-info-value">{selectedRequest.travelDateTime ? new Date(selectedRequest.travelDateTime).toLocaleString() : 'N/A'}</span>
                                    </div>
                                </div>

                                <h5 className="admin-vehicle-section-title">Justification Reason</h5>
                                <div className="admin-vehicle-reason-box">{selectedRequest.reason}</div>

                                {selectedRequest.status === 'PENDING' && (
                                    <>
                                        <h5 className="admin-vehicle-section-title " >Assign Vehicle & Driver</h5>
                                        <div className="admin-vehicle-assign-block">

                                            <div>
                                                <label className="admin-vehicle-info-label">Select Vehicle:</label>
                                                <select className="form-select admin-vehicle-dropdown" value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
                                                    <option value="">Choose Vehicle</option>
                                                    {vehicles.map(v => (
                                                        <option key={v.id || v._id} value={v.id || v._id} disabled={v.status === 'BOOKED'}
                                                            style={{ color: v.status === 'BOOKED' ? '#c1121f' : '#000' }}>
                                                            {v.vehicleNumber} - {v.vehicleModel || v.brand} {v.status === 'BOOKED' ? '(BOOKED)' : '(AVAILABLE)'}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="admin-vehicle-info-label">Select Driver:</label>
                                                <select className="form-select admin-vehicle-dropdown" value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
                                                    <option value="">Choose Driver</option>
                                                    {drivers.map(d => (
                                                        <option key={d.id || d._id} value={d.id || d._id} disabled={d.status === 'BOOKED'}
                                                            style={{ color: d.status === 'BOOKED' ? '#c1121f' : '#000' }}>
                                                            {d.driverName || d.name} {d.status === 'BOOKED' ? '(BOOKED)' : '(AVAILABLE)'}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="admin-vehicle-section-title">Reject Reason / Admin Remarks:</label>
                                            <select value={adminRejectRemark} onChange={(e) => setAdminRejectRemark(e.target.value)} className="admin-reject-select">
                                                <option value="">Select Reject Reason</option>
                                                <option value="Vehicle is not available for the requested date and time">Vehicle is not available</option>
                                                <option value="Insufficient request details provided">Insufficient request details</option>
                                                <option value="Request not approved by the relevant authority">Not approved by relevant authority</option>
                                                <option value="Driver is not available">Driver is not available</option>
                                                <option value="Request submitted outside the allowed time period">Late request submission</option>
                                                <option value="Budget or fuel allocation not approved">Budget/Fuel allocation not approved</option>
                                                <option value="Other">Other</option>
                                            </select>

                                            {adminRejectRemark === "Other" && (
                                                <textarea rows="2" placeholder="Enter custom reject reason..." value={customRejectReason}
                                                    onChange={(e) => setCustomRejectReason(e.target.value)} />)}
                                        </div>
                                    </>
                                )}

                                <div className="admin-vehicle-actions-wrapper">
                                    {selectedRequest.status === 'PENDING' ? (
                                        <div className="admin-vehicle-btn-group">
                                            <button className="admin-vehicle-btn-reject" onClick={() => handleAdminReject(selectedRequest.id || selectedRequest._id)}
                                                disabled={actionLoading}>Reject Request</button>
                                            <button className="admin-vehicle-btn-approve" onClick={() => handleVehicleApproval(selectedRequest.id || selectedRequest._id)}
                                                disabled={actionLoading || !selectedVehicle || !selectedDriver}>Approve & Assign Request</button>
                                        </div>
                                    ) : (
                                        <div className="admin-vehicle-final-status-msg"> This request has already been
                                            <strong className={`admin-vehicle-text-status-${selectedRequest.status.toLowerCase()}`}>{selectedRequest.status}</strong>.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="admin-vehicle-placeholder-box">
                            <p>Select a vehicle request from the list to view complete employee profiles and take action.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="admin-vehicle-all-request-wrapper" style={{ marginTop: '30px' }}>
                <div className="admin-vehicle-all-request-header">
                    <div>
                        <h1 className="admin-vehicle-all-request-title">Officer Approved Vehicle Requests</h1>
                        <p className="admin-vehicle-all-request-subtitle">
                            Review details and finalize vehicle deployments by sending notification emails.
                        </p>
                    </div>
                    <span className="admin-vehicle-all-request-badge">Pending Finalization: {allApprovedRequests.length}</span>
                </div>

                {allApprovedRequests.length === 0 ? (
                    <div className="admin-vehicle-all-request-empty-state">
                        <svg className="admin-vehicle-all-request-empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="admin-vehicle-all-request-empty-title">No approved requests available</p>
                        <p className="admin-vehicle-all-request-empty-subtitle">All processed requests have been finalized and notified.</p>
                    </div>
                ) : (
                    <div className="admin-vehicle-all-request-table-container">
                        <div className="admin-vehicle-all-request-table-scroll">
                            <table className="admin-vehicle-all-request-table">
                                <thead>
                                    <tr className="admin-vehicle-all-request-th-row">
                                        <th className="admin-vehicle-all-request-th">Employee</th>
                                        <th className="admin-vehicle-all-request-th">Email</th>
                                        <th className="admin-vehicle-all-request-th">Duty Nature</th>
                                        <th className="admin-vehicle-all-request-th">Journey Details</th>
                                        <th className="admin-vehicle-all-request-th">Assigned Vehicle and Drivers</th>
                                        <th className="admin-vehicle-all-request-th">Officer Remarks</th>
                                        <th className="admin-vehicle-all-request-th admin-vehicle-all-request-th--center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="admin-vehicle-all-request-tbody">
                                    {allApprovedRequests.map((request) => (
                                        <tr key={request.id || request._id} className="admin-vehicle-all-request-tr">

                                            <td className="admin-vehicle-all-request-td">{request.requesterName}</td>
                                            <td className="admin-vehicle-all-request-td">{request.requesterEmail}</td>
                                            <td className="admin-vehicle-all-request-td">{request.dutyNature}</td>

                                            <td className="admin-vehicle-all-request-td">
                                                <div className="admin-vehicle-all-request-location">{request.fromLocation} To {request.toLocation}</div>
                                                <div className="admin-vehicle-all-request-date">{request.travelDateTime ? new Date(request.travelDateTime).toLocaleString() : 'N/A'} ({request.distanceKm} km)</div>
                                            </td>

                                            <td className="admin-vehicle-all-request-td">
                                                <div className="admin-vehicle-all-request-allocation-group">

                                                    <div className="admin-vehicle-all-request-allocation-item">
                                                        <span className="admin-vehicle-all-request-alloc-tag admin-vehicle-all-request-alloc-tag--vehicle">
                                                            {request.assignedVehicle ? (
                                                                <>
                                                                    {request.assignedVehicle.vehicleNumber} <span className="admin-vehicle-all-request-alloc-tag admin-vehicle-all-request-alloc-tag--vehicle">({request.assignedVehicle.manufacturer || request.assignedVehicle.brand} {request.assignedVehicle.model || request.assignedVehicle.vehicleModel})</span>
                                                                </>
                                                            ) : (
                                                                <span className="admin-vehicle-all-request-no-remarks">Not Assigned</span>
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="admin-vehicle-all-request-allocation-item">
                                                        <span className="admin-vehicle-all-request-alloc-tag admin-vehicle-all-request-alloc-tag--driver">
                                                            {request.assignedDriver ? (
                                                                <>
                                                                    {request.assignedDriver.name || request.assignedDriver.driverName} <span className="admin-vehicle-all-request-alloc-tag admin-vehicle-all-request-alloc-tag--driver">- {request.assignedDriver.phoneNumber}</span>
                                                                </>
                                                            ) : (
                                                                <span className="admin-vehicle-all-request-no-remarks">Not Assigned</span>
                                                            )}
                                                        </span>
                                                    </div>

                                                </div>
                                            </td>

                                            <td className="admin-vehicle-all-request-td admin-vehicle-all-request-td--remarks">
                                                {request.officerRemarks ? `${request.officerRemarks}` : <span className="admin-vehicle-all-request-no-remarks">No remarks</span>}
                                            </td>

                                            <td className="admin-vehicle-all-request-td admin-vehicle-all-request-td--center">
                                                <button
                                                    onClick={() => handleCompleteRequest(request.id || request._id)}
                                                    disabled={processingId === (request.id || request._id)}
                                                    className={`admin-vehicle-all-request-action-btn ${processingId === (request.id || request._id) ? 'admin-vehicle-all-request-action-btn--disabled' : ''}`}
                                                >
                                                    {processingId === (request.id || request._id) ? (
                                                        <span className="admin-vehicle-all-request-btn-spinner-container">
                                                            <svg className="admin-vehicle-all-request-btn-spinner" fill="none" viewBox="0 0 24 24">
                                                                <circle className="admin-vehicle-all-request-spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="admin-vehicle-all-request-spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                            </svg>
                                                            Sending...
                                                        </span>
                                                    ) : 'Complete & Send Email'}
                                                </button>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminVehicleRequest;