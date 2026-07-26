import {
    useCallback,
    useEffect,
    useState
} from 'react';

import API from '../../API/Axios';

import '../../CSS/EmployeeVehicle.css';

const EmployeeVehicle = () => {
    const currentEmployeeEmail = localStorage.getItem('employeeEmail') || '';

    const initialFormState = {
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
    };

    const [formData, setFormData] = useState(initialFormState);

    const [requestsList, setRequestsList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [cancelLoadingId, setCancelLoadingId] = useState(null);

    const [editingRequestId, setEditingRequestId] = useState(null);

    const [designations, setDesignations] = useState({});
    const [selectedDesignation, setSelectedDesignation] = useState('');
    const [travelersList, setTravelersList] = useState([]);

    const fetchUserProfile = useCallback(async () => {
        if (!currentEmployeeEmail) return;
        try {
            const response = await API.get(`/vehicle-requests/profile/${currentEmployeeEmail}`);
            if (response.data) {
                setFormData(prev => ({
                    ...prev,
                    requesterName: response.data.username || response.data.fullName || '',
                    requesterPosition: response.data.designation || response.data.position || ''
                }));
            }
        } catch (error) {
            console.error('❌ Error fetching user profile:', error);
            const storedUsername = localStorage.getItem('username') || '';
            setFormData(prev => ({ ...prev, requesterName: storedUsername }));
        }
    }, [currentEmployeeEmail]);

    const fetchDesignationsSummary = useCallback(async () => {
        try {
            const response = await API.get('/vehicle-requests/designations-summary');
            setDesignations(response.data);
        } catch (error) {
            console.error('❌ Error fetching designations summary:', error);
        }
    }, []);

    useEffect(() => {
        const fetchEmployeesByDesignation = async () => {
            if (!selectedDesignation) {
                setTravelersList([]);
                return;
            }
            try {
                const response = await API.get(`/vehicle-requests/by-designation?designation=${selectedDesignation}`);
                setTravelersList(response.data);
            } catch (error) {
                console.error('❌ Error fetching employees by designation:', error);
            }
        };
        fetchEmployeesByDesignation();
    }, [selectedDesignation]);

    const fetchEmployeeRequests = useCallback(async () => {
        if (!currentEmployeeEmail) return;
        setHistoryLoading(true);
        try {
            const response = await API.get(`/vehicle-requests/employee/${currentEmployeeEmail}`);
            setRequestsList(response.data);
        } catch (error) {
            console.error('❌ Error fetching requests:', error);
        } finally {
            setHistoryLoading(false);
        }
    }, [currentEmployeeEmail]);

    useEffect(() => {
        if (currentEmployeeEmail) {
            setFormData(prev => ({ ...prev, requesterEmail: currentEmployeeEmail }));
            fetchUserProfile();
            fetchDesignationsSummary();
        }
    }, [currentEmployeeEmail, fetchUserProfile, fetchDesignationsSummary]);

    useEffect(() => {
        if (currentEmployeeEmail) {
            fetchEmployeeRequests();
        }
    }, [fetchEmployeeRequests]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleTravelerSelect = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) {
            setFormData(prev => ({
                ...prev,
                travelerName: '',
                travelerPosition: '',
                department: '',
                phoneNumber: ''
            }));
            return;
        }

        const traveler = travelersList.find(t => (t.id || t._id) === selectedId);
        if (traveler) {
            setFormData(prev => ({
                ...prev,
                travelerName: traveler.username || traveler.fullName || '',
                travelerPosition: traveler.designation || '',
                department: traveler.department || '',
                phoneNumber: traveler.phoneNumber || ''
            }));
        }
    };

    const handleEditClick = (req) => {
        setEditingRequestId(req.id || req._id);

        let formattedDate = '';
        if (req.travelDateTime) {
            const dateObj = new Date(req.travelDateTime);
            const tzOffset = dateObj.getTimezoneOffset() * 60000;
            formattedDate = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
        }

        setFormData({
            requesterEmail: req.requesterEmail || currentEmployeeEmail,
            requesterName: req.requesterName || '',
            requesterPosition: req.requesterPosition || '',
            travelerName: req.travelerName || '',
            travelerPosition: req.travelerPosition || '',
            department: req.department || '',
            phoneNumber: req.phoneNumber || '',
            dutyNature: req.dutyNature || '',
            fromLocation: req.fromLocation || '',
            toLocation: req.toLocation || '',
            distanceKm: req.distanceKm || '',
            travelDateTime: formattedDate,
            reason: req.reason || ''
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingRequestId(null);
        setFormData(prev => ({
            ...initialFormState,
            requesterEmail: currentEmployeeEmail,
            requesterName: prev.requesterName,
            requesterPosition: prev.requesterPosition
        }));
        setSelectedDesignation('');
        setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const formattedTravelDateTime = formData.travelDateTime
            ? new Date(formData.travelDateTime).toISOString()
            : null;

        const finalSubmissionData = {
            ...formData,
            travelDateTime: formattedTravelDateTime,
            requesterEmail: currentEmployeeEmail
        };

        try {
            if (editingRequestId) {
                const response = await API.put(
                    `/vehicle-requests/${editingRequestId}/update?email=${currentEmployeeEmail}`,
                    finalSubmissionData
                );

                if (response.status === 200) {
                    setMessage({ type: 'success', text: ' ✅ Vehicle request updated successfully!' });
                    setEditingRequestId(null);
                }
            } else {
                const response = await API.post('/vehicle-requests', finalSubmissionData);

                if (response.status === 201 || response.status === 200) {
                    setMessage({ type: 'success', text: ' ✅ Vehicle request submitted successfully!' });
                }
            }

            setFormData(prev => ({
                ...initialFormState,
                requesterEmail: currentEmployeeEmail,
                requesterName: prev.requesterName,
                requesterPosition: prev.requesterPosition
            }));
            setSelectedDesignation('');
            fetchEmployeeRequests();

        } catch (error) {
            console.error('Error submitting request:', error);
            const errorMsg = error.response?.data?.message || error.response?.data || 'Failed to submit/update request.';
            setMessage({ type: 'danger', text: `❌ ${errorMsg}` });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelRequest = async (requestId) => {
        if (!window.confirm("⚠️ Are you sure you want to cancel this vehicle request?")) return;
        setCancelLoadingId(requestId);
        try {
            const response = await API.put(`/vehicle-requests/${requestId}/cancel`);
            if (response.status === 200) {
                setMessage({ type: 'success', text: ' ✅ Vehicle request cancelled successfully!' });
                fetchEmployeeRequests();
            }
        } catch (error) {
            setMessage({ type: 'danger', text: 'Failed to cancel the request.' });
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
                        <h4 className="employee-vehicle-title">
                            {editingRequestId ? '✏️ Edit Vehicle Request' : 'New Vehicle Request Form'}
                        </h4>
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
                                        <input type="text" className="employee-vehicle-input" name="requesterName" value={formData.requesterName} onChange={handleChange} required placeholder="Enter your name" style={{ color: '#7209b7' }} />
                                    </div>
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Requester Position</label>
                                        <input type="text" className="employee-vehicle-input" name="requesterPosition" value={formData.requesterPosition} onChange={handleChange} required placeholder="e.g., Management Assistant" style={{ color: '#7209b7' }} />
                                    </div>

                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Select Traveler Position (Designation)</label>
                                        <select className="employee-vehicle-input" value={selectedDesignation}
                                            onChange={(e) => setSelectedDesignation(e.target.value)} style={{ color: '#40916c' }}>
                                            <option value="">-- Choose Designation --</option>
                                            {Object.entries(designations).map(([designationName, count]) => (
                                                <option key={designationName} value={designationName}>
                                                    {designationName} - {count}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Traveler Name</label>
                                        {editingRequestId ? (
                                            <input type="text" className="employee-vehicle-input" name="travelerName" value={formData.travelerName} onChange={handleChange} required style={{ color: '#40916c' }} />
                                        ) : (
                                            <select className="employee-vehicle-input" onChange={handleTravelerSelect} style={{ color: '#40916c' }} required disabled={!selectedDesignation}>
                                                <option value="">-- Choose Employee --</option>
                                                {travelersList.map((t) => (
                                                    <option key={t.id || t._id} value={t.id || t._id}>
                                                        {t.username || t.fullName}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="employee-vehicle-form-row-four">
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Traveler Position</label>
                                        <input type="text" className="employee-vehicle-input" name="travelerPosition" value={formData.travelerPosition} onChange={handleChange} style={{ color: '#40916c' }} required placeholder="Traveler position" />
                                    </div>
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Department / Division</label>
                                        <input type="text" className="employee-vehicle-input" name="department" value={formData.department} onChange={handleChange} style={{ color: '#40916c' }} placeholder="Department" />
                                    </div>
                                    <div className="employee-vehicle-form-group">
                                        <label className="employee-vehicle-label">Phone Number</label>
                                        <input type="tel" className="employee-vehicle-input" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} style={{ color: '#40916c' }} required placeholder="Phone number" />
                                    </div>
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

                                <div className="employee-vehicle-action-area" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    {editingRequestId && (
                                        <button type="button" className="employee-vehicle-btn-cancel" onClick={handleCancelEdit}>Cancel Edit</button>
                                    )}

                                    <button type="submit" className="employee-vehicle-btn-submit" disabled={loading}>
                                        {loading ? (
                                            <div className="employee-vehicle-spinner-container">
                                                <span className="employee-vehicle-spinner"></span>
                                                {editingRequestId ? 'Updating...' : 'Submitting...'}
                                            </div>
                                        ) : editingRequestId ? 'Update Request' : 'Submit Request'}
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
                                                        <div className="employee-vehicle-table-main-text">{req.fromLocation} to {req.toLocation}</div>
                                                    </td>
                                                    <td className="employee-vehicle-td">
                                                        <span className="employee-vehicle-table-sub-text">
                                                            {req.travelDateTime
                                                                ? new Date(req.travelDateTime).toLocaleString('en-LK', {
                                                                    year: 'numeric',
                                                                    month: '2-digit',
                                                                    day: '2-digit',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                })
                                                                : 'N/A'
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="employee-vehicle-td fw-semibold">{req.distanceKm} Km</td>
                                                    <td className="employee-vehicle-td">
                                                        <span className={`employee-vehicle-badge ${getStatusClass(req.status)}`}>
                                                            {req.status}
                                                        </span>
                                                    </td>
                                                    <td className="employee-vehicle-td">
                                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                            {req.status === 'PENDING' && (
                                                                <button className="employee-vehicle-btn-edit"onClick={() => handleEditClick(req)}>Edit</button>
                                                            )}

                                                            {['PENDING', 'APPROVED_BY_VEHICLE_ADMIN', 'APPROVED_BY_VEHICLE_APPROVAL_OFFICER', 'TRIP_PROCESS_CONFIRMED'].includes(req.status) ? (
                                                                <button
                                                                    className="employee-vehicle-btn-cancel"
                                                                    onClick={() => handleCancelRequest(req.id || req._id)}
                                                                    disabled={cancelLoadingId === (req.id || req._id)}
                                                                >
                                                                    {cancelLoadingId === (req.id || req._id) ? 'Cancelling...' : 'Cancel'}
                                                                </button>
                                                            ) : (
                                                                <span className="employee-vehicle-btn-not-allow">Not Allowed</span>
                                                            )}
                                                        </div>
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