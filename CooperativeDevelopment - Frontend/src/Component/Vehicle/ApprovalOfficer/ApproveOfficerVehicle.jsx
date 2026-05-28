import React, {
    useEffect,
    useState
} from 'react';

import api from '../../API/Axios';

import '../../CSS/ApproveOfficerVehicle.css';

const ApproveOfficerVehicle = () => {
    const [requests, setRequests] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const [remarks, setRemarks] = useState({});

    const approveOptions = [
        "Approved for official duty",
        "Approved as requested",
        "Priority travel approved",
        "Other"
    ];

    const rejectOptions = [
        "No vehicles available at this time",
        "No drivers available at this time",
        "Incomplete journey details",
        "Request duplicated",
        "Other"
    ];

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setErrorMsg('');

            const [requestsRes, vehiclesRes, driversRes] = await Promise.all([
                api.get('/vehicle-requests/admin-approved-list'),
                api.get('/vehicles/all'),
                api.get('/drivers/all')
            ]);

            setRequests(requestsRes.data);
            setVehicles(vehiclesRes.data);
            setDrivers(driversRes.data);

        } catch (error) {
            console.error("Unable to retrieve data:", error);
            setErrorMsg('There was an error retrieving data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const getVehicleDetails = (vehicleId) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        return vehicle ? `${vehicle.vehicleNumber || vehicle.plateNumber} - (${vehicle.model || vehicle.type})` : 'Loading...';
    };

    const getDriverDetails = (driverId) => {
        const driver = drivers.find(d => d.id === driverId);
        return driver ? `${driver.name || driver.fullName} (${driver.phoneNumber || 'No Phone'})` : 'Loading...';
    };

    const handleOptionChange = (requestId, value) => {
        setRemarks(prev => ({
            ...prev,
            [requestId]: {
                ...prev[requestId],
                selectedOption: value,
                customText: value === 'Other' ? (prev[requestId]?.customText || '') : ''
            }
        }));
    };

    const handleCustomTextChange = (requestId, value) => {
        setRemarks(prev => ({
            ...prev,
            [requestId]: {
                ...prev[requestId],
                customText: value
            }
        }));
    };

    const getFinalRemark = (requestId) => {
        const remarkObj = remarks[requestId];
        if (!remarkObj) return '';
        if (remarkObj.selectedOption === 'Other') {
            return remarkObj.customText || '';
        }
        return remarkObj.selectedOption || '';
    };

    const handleFinalApprove = async (requestId) => {
        const finalRemark = getFinalRemark(requestId);

        if (!window.confirm('Would you like to give final approval to this vehicle request?')) {
            return;
        }

        try {
            await api.post(`/vehicle-requests/officer-approve/${requestId}`, null, {
                params: { remarks: finalRemark }
            });

            alert('The vehicle request was successfully granted final approval.');
            fetchAllData();
        } catch (error) {
            console.error("Unable to approve:", error);
            alert('Unable to approve: ' + (error.response?.data?.message || 'There is an error in the system.'));
        }
    };

    const handleReject = async (requestId) => {
        const finalRemark = getFinalRemark(requestId);

        if (!finalRemark.trim()) {
            alert('Please select a reason (Remarks) or write a reason under "Other" for rejecting the request.');
            return;
        }

        if (!window.confirm('Would you like to permanently deny this vehicle request?')) {
            return;
        }

        try {
            await api.post(`/vehicle-requests/officer-reject/${requestId}`, null, {
                params: { remarks: finalRemark }
            });

            alert('The vehicle request was successfully denied.');
            fetchAllData();
        } catch (error) {
            console.error("Couldn't refuse:", error);
            alert('Unable to reject:' + (error.response?.data?.message || 'There is an error in the system.'));
        }
    };

    return (
        <div className="vehicle-approve-officer-request-container">
            <div className="vehicle-approve-officer-request-wrapper">
                <h2 className="vehicle-approve-officer-request-title">Final approval of vehicle requests</h2>
                <p className="vehicle-approve-officer-request-description">
                    Here is a list of all vehicle requests that have been allocated vehicles and drivers by the Administration Division (Admin) and are awaiting approval. You can review each itinerary and booking, add your special notes, and make a final approval or rejection from here.
                </p>
                {errorMsg && (
                    <div className="vehicle-approve-officer-request-error">{errorMsg}</div>
                )}

                {loading ? (
                    <div className="vehicle-approve-officer-request-empty">Loading data...</div>
                ) : requests.length === 0 ? (
                    <div className="vehicle-approve-officer-request-empty">There are no new vehicle requests pending approval.</div>
                ) : (
                    <div className="vehicle-approve-officer-request-table-card">
                        <div className="vehicle-approve-officer-request-responsive-container">
                            <table className="vehicle-approve-officer-request-table">
                                <thead>
                                    <tr className="vehicle-approve-officer-request-thead-tr">
                                        <th className="vehicle-approve-officer-request-th">Applicant / Division</th>
                                        <th className="vehicle-approve-officer-request-th">Itinerary</th>
                                        <th className="vehicle-approve-officer-request-th">Date and time</th>
                                        <th className="vehicle-approve-officer-request-th vehicle-approve-officer-request-th-highlight">vehicle</th>
                                        <th className="vehicle-approve-officer-request-th vehicle-approve-officer-request-th-highlight">driver</th>
                                        <th className="vehicle-approve-officer-request-th">Special Notes</th>
                                        <th className="vehicle-approve-officer-request-th vehicle-approve-officer-request-th-center">Activities</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((request) => {
                                        const currentRemark = remarks[request.id] || { selectedOption: '', customText: '' };

                                        return (
                                            <tr key={request.id} className="vehicle-approve-officer-request-tbody-tr">
                                                <td className="vehicle-approve-officer-request-td">
                                                    <div className="vehicle-approve-officer-request-name">{request.requesterName}</div>
                                                    <div className="vehicle-approve-officer-request-email">{request.requesterEmail}</div>
                                                    <div className="vehicle-approve-officer-request-dept-badge">{request.department}</div>
                                                </td>
                                                <td className="vehicle-approve-officer-request-td">
                                                    <div><span className="vehicle-approve-officer-request-label-prefix">From:</span> {request.fromLocation}</div>
                                                    <div><span className="vehicle-approve-officer-request-label-prefix">To:</span> {request.toLocation}</div>
                                                    <div className="vehicle-approve-officer-request-distance">Km: {request.distanceKm} Km</div>
                                                </td>
                                                <td className="vehicle-approve-officer-request-td vehicle-approve-officer-request-td-nowrap">{new Date(request.travelDateTime).toLocaleString()}</td>

                                                <td className="vehicle-approve-officer-request-td">{getVehicleDetails(request.assignedVehicleId)}</td>
                                                <td className="vehicle-approve-officer-request-td">{getDriverDetails(request.assignedDriverId)}</td>

                                                <td className="vehicle-approve-officer-request-td">
                                                    <div className="vehicle-approve-officer-request-special-notes">
                                                        <select className="vehicle-approve-officer-request-select" value={currentRemark.selectedOption} onChange={(e) => handleOptionChange(request.id, e.target.value)}>
                                                            <option value="">Select Note / Reason</option>
                                                            <optgroup label="Approval Notes"> {approveOptions.map((opt, index) =>
                                                                (<option key={`app-${index}`} value={opt}>{opt}</option>))}</optgroup>

                                                            <optgroup label="Rejection Reasons"> {rejectOptions.map((opt, index) =>
                                                                (<option key={`rej-${index}`} value={opt}>{opt}</option>))}</optgroup>
                                                        </select>

                                                        {currentRemark.selectedOption === 'Other' && (
                                                            <textarea className="vehicle-approve-officer-request-textarea" placeholder="Please specify your custom reason here..."
                                                                value={currentRemark.customText} onChange={(e) => handleCustomTextChange(request.id, e.target.value)} />)}
                                                    </div>
                                                </td>

                                                <td className="vehicle-approve-officer-request-td vehicle-approve-officer-request-td-center">
                                                    <div className="vehicle-approve-officer-request-actions-container">
                                                        <button onClick={() => handleFinalApprove(request.id)} className="vehicle-approve-officer-request-btn-approve">✓ Approve</button>
                                                        <button onClick={() => handleReject(request.id)} className="vehicle-approve-officer-request-btn-reject"> ✕ Reject</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApproveOfficerVehicle;