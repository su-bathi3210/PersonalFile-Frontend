import {
    useCallback,
    useEffect,
    useState
} from 'react';

import API from '../../API/Axios';

import '../../CSS/EmployeeVehicle.css';

const EmployeeVehicle = () => {
    const currentEmployeeEmail = localStorage.getItem('employeeEmail') || '';

    const [formData, setFormData] = useState({
        requesterEmail: '',
        requesterName: '',
        requesterPosition: '',
        travelerName: '',
        travelerPosition: '',
        department: '',
        phoneNumber: '',
        dutyNature: '',
        fromLocation: '',
        toLocation: '',
        distanceKm: '',
        travelDateTime: '',
        reason: ''
    });

    const [requestsList, setRequestsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [cancelLoadingId, setCancelLoadingId] = useState(null);

    const fetchEmployeeRequests = useCallback(async () => {
        if (!currentEmployeeEmail) return;

        setHistoryLoading(true);
        try {
            const response = await API.get(`/vehicle-requests/employee/${currentEmployeeEmail}`);
            setRequestsList(response.data);
        } catch (error) {
            console.error('❌ Error fetching employee requests:', error);
            if (error.response && error.response.status === 403) {
                setMessage({ type: 'danger', text: 'Session expired or Unauthorized. Please login again.' });
            }
        } finally {
            document.body.style.cursor = 'default';
            setHistoryLoading(false);
        }
    }, [currentEmployeeEmail]);

    useEffect(() => {
        if (currentEmployeeEmail) {
            setFormData(prev => ({
                ...prev,
                requesterEmail: currentEmployeeEmail
            }));
        }
    }, [currentEmployeeEmail]);

    useEffect(() => {
        if (currentEmployeeEmail) {
            fetchEmployeeRequests();
        }
    }, [fetchEmployeeRequests]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const finalSubmissionData = {
            ...formData,
            requesterEmail: currentEmployeeEmail
        };

        try {
            const response = await API.post('/vehicle-requests', finalSubmissionData);

            if (response.status === 201 || response.status === 200) {
                setMessage({ type: 'success', text: ' ✅ Vehicle request submitted successfully!' });

                setFormData({
                    requesterEmail: currentEmployeeEmail,
                    requesterName: '',
                    requesterPosition: '',
                    travelerName: '',
                    travelerPosition: '',
                    department: '',
                    phoneNumber: '',
                    dutyNature: '',
                    fromLocation: '',
                    toLocation: '',
                    distanceKm: '',
                    travelDateTime: '',
                    reason: ''
                });

                fetchEmployeeRequests();
            }
        } catch (error) {
            console.error('❌ Error submitting vehicle request:', error);
            setMessage({ type: 'danger', text: 'Failed to submit request.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRequest = async (requestId) => {
        if (!window.confirm("⚠️ Are you sure you want to cancel this vehicle request?")) {
            return;
        }

        setCancelLoadingId(requestId);
        setMessage({ type: '', text: '' });

        try {
            const response = await API.put(`/vehicle-requests/${requestId}/cancel`);
            if (response.status === 200) {
                setMessage({ type: 'success', text: ' ✅ Vehicle request cancelled successfully!' });
                fetchEmployeeRequests();
            }
        } catch (error) {
            console.error('❌ Error cancelling vehicle request:', error);
            const errorMsg = error.response?.data || 'Failed to cancel the request.';
            setMessage({ type: 'danger', text: errorMsg });
        } finally {
            setCancelLoadingId(null);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'APPROVED_BY_VEHICLE_ADMIN': return 'employee-vehicle-status-approved';
            case 'APPROVED_BY_VEHICLE_APPROVAL_OFFICER': return 'employee-vehicle-status-approved';

            case 'REJECTED_BY_VEHICLE_ADMIN': return 'employee-vehicle-status-rejected';
            case 'REJECTED_BY_VEHICLE_APPROVAL_OFFICER': return 'employee-vehicle-status-rejected';
            case 'EMPLOYEE_CANCELLED': return 'employee-vehicle-status-cancelled';

            default: return 'employee-vehicle-status-pending';
        }
    };

    return (
        <div className="employee-vehicle-container fade-in">
            <div className="employee-vehicle-layout-vertical">

                <div className="employee-vehicle-form-section">
                    <div className="employee-vehicle-header">
                        <h4 className="employee-vehicle-title">New Vehicle Request Form</h4>
                        <p className="employee-vehicle-header-description">
                            Please fill out this form with accurate details to request an official vehicle for structural or field duties. Ensure all fields are completed before submission.
                        </p>
                    </div>

                    <div className="employee-vehicle-card">
                        <div className="employee-vehicle-body">
                            {message.text && (
                                <div className={`employee-vehicle-alert employee-vehicle-alert-${message.type}`}>
                                    {message.text}
                                </div>
                            )}

                            <form className="employee-vehicle-form" onSubmit={handleSubmit}>

                                <h5 className="employee-vehicle-section-title">1. Personnel Details</h5>
                                <div className="employee-vehicle-form-row-four">
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Requester Name</label>
                                        <input type="text" className="employee-vehicle-input" name="requesterName" value={formData.requesterName} onChange={handleChange} required placeholder="Enter your name" />
                                    </div>
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Requester Position</label>
                                        <input type="text" className="employee-vehicle-input" name="requesterPosition" value={formData.requesterPosition} onChange={handleChange} required placeholder="e.g., Management Assistant" />
                                    </div>
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Traveler Name</label>
                                        <input type="text" className="employee-vehicle-input" name="travelerName" value={formData.travelerName} onChange={handleChange} required placeholder="Who is traveling?" />
                                    </div>
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Traveler Position</label>
                                        <input type="text" className="employee-vehicle-input" name="travelerPosition" value={formData.travelerPosition} onChange={handleChange} required placeholder="e.g., Director / Officer" />
                                    </div>
                                </div>

                                <div className="employee-vehicle-form-row-four">
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Department / Division</label>
                                        <input type="text" className="employee-vehicle-input" name="department" value={formData.department} onChange={handleChange} required placeholder="e.g., Cooperative Audit" />
                                    </div>
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Phone Number</label>
                                        <input type="tel" className="employee-vehicle-input" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required placeholder="e.g., 0771234567" />
                                    </div>
                                    <div className="employee-vehicle-form-group-empty"></div>
                                    <div className="employee-vehicle-form-group-empty"></div>
                                </div>

                                <h5 className="employee-vehicle-section-title" style={{ marginTop: '30px' }}>2. Journey & Duty Details</h5>

                                <div className="employee-vehicle-form-row-four">
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Nature of Duty</label>
                                        <input type="text" className="employee-vehicle-input" name="dutyNature" value={formData.dutyNature} onChange={handleChange} required placeholder="e.g., Official Audit Inspection" />
                                    </div>
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">From Location</label>
                                        <input type="text" className="employee-vehicle-input" name="fromLocation" value={formData.fromLocation} onChange={handleChange} required placeholder="Starting point" />
                                    </div>
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">To Location</label>
                                        <input type="text" className="employee-vehicle-input" name="toLocation" value={formData.toLocation} onChange={handleChange} required placeholder="Destination" />
                                    </div>
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Distance (Km)</label>
                                        <input type="number" step="0.1" className="employee-vehicle-input" name="distanceKm" value={formData.distanceKm} onChange={handleChange} required placeholder="e.g., 45.5" />
                                    </div>
                                </div>

                                <div className="employee-vehicle-form-row-four">
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Travel Date & Time</label>
                                        <input type="datetime-local" className="employee-vehicle-input" name="travelDateTime" value={formData.travelDateTime} onChange={handleChange} required />
                                    </div>
                                    <div className="employee-vehicle-form-group-three-span">
                                        <label className="employee-vehicle-label">Specific Reason for Request</label>
                                        <input type="text" className="employee-vehicle-input" name="reason" value={formData.reason} onChange={handleChange} required placeholder="Provide detailed justification..." />
                                    </div>
                                </div>

                                <div className="employee-vehicle-action-area">
                                    <button type="submit" className="employee-vehicle-btn-submit" disabled={loading}>
                                        {loading ? (
                                            <div className="employee-vehicle-spinner-container">
                                                <span className="employee-vehicle-spinner"></span>
                                                Submitting...
                                            </div>
                                        ) : 'Submit Request'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="employee-vehicle-history-section">
                    <h5 className="employee-vehicle-section-title" style={{ marginBottom: '15px' }}>Vehicle Request History</h5>
                    <div className="employee-vehicle-card-history">
                        <div className="employee-vehicle-body-history">
                            {historyLoading ? (
                                <div className="employee-vehicle-loading-wrapper">
                                    <div className="employee-vehicle-spinner-large"></div>
                                    <p className="employee-vehicle-loading-text">Loading your requests...</p>
                                </div>
                            ) : requestsList.length === 0 ? (
                                <div className="employee-vehicle-empty-wrapper">
                                    <p className="employee-vehicle-empty-text">No vehicle requests found for your email address.</p>
                                </div>
                            ) : (
                                <div className="employee-vehicle-table-container">
                                    <table className="employee-vehicle-table">
                                        <thead className="employee-vehicle-thead">
                                            <tr>
                                                <th className="employee-vehicle-th">Requester Name</th>
                                                <th className="employee-vehicle-th">Traveler Name</th>
                                                <th className="employee-vehicle-th">Phone Number</th>
                                                <th className="employee-vehicle-th">Destination</th>
                                                <th className="employee-vehicle-th">Date & Time</th>
                                                <th className="employee-vehicle-th">Distance</th>
                                                <th className="employee-vehicle-th">Status</th>
                                                <th className="employee-vehicle-th" style={{ textAlign: 'center' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="employee-vehicle-tbody">
                                            {requestsList.map((req) => (
                                                <tr key={req.id || req._id} className="employee-vehicle-tr">
                                                    <td className="employee-vehicle-td">{req.requesterName}</td>
                                                    <td className="employee-vehicle-td">{req.travelerName}</td>
                                                    <td className="employee-vehicle-td">{req.phoneNumber}</td>
                                                    <td className="employee-vehicle-td">
                                                        <div className="employee-vehicle-table-main-text">{req.toLocation} to {req.fromLocation}</div>
                                                    </td>
                                                    <td className="employee-vehicle-td">
                                                        <span className="employee-vehicle-table-sub-text">
                                                            {req.travelDateTime ? new Date(req.travelDateTime).toLocaleString() : 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="employee-vehicle-td fw-semibold">{req.distanceKm} Km</td>
                                                    <td className="employee-vehicle-td">
                                                        <span className={`employee-vehicle-badge ${getStatusClass(req.status)}`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="employee-vehicle-td">
                                                        {['PENDING', 'APPROVED_BY_VEHICLE_ADMIN', 'APPROVED_BY_VEHICLE_APPROVAL_OFFICER'].includes(req.status) ? (
                                                            <button
                                                                className="employee-vehicle-btn-cancel"
                                                                onClick={() => handleCancelRequest(req.id || req._id)} disabled={cancelLoadingId === (req.id || req._id)}>
                                                                {cancelLoadingId === (req.id || req._id) ? 'Cancelling...' : 'Cancel'}
                                                            </button>
                                                        ) : (
                                                            <span className="employee-vehicle-btn-not-allow">Not Allowed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EmployeeVehicle;