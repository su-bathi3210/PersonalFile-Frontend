import {
    useEffect,
    useState
} from 'react';

import api from '../../API/Axios';

import '../../CSS/AdminVehicleHistory.css';

const AdminVehicleHistory = () => {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [selectedYear, setSelectedYear] = useState('ALL');
    const [selectedMonth, setSelectedMonth] = useState('ALL');

    const [availableYears, setAvailableYears] = useState([]);
    const [availableMonths, setAvailableMonths] = useState([]);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const monthNames = [
        { value: '0', name: 'January' }, { value: '1', name: 'February' },
        { value: '2', name: 'March' }, { value: '3', name: 'April' },
        { value: '4', name: 'May' }, { value: '5', name: 'June' },
        { value: '6', name: 'July' }, { value: '7', name: 'August' },
        { value: '8', name: 'September' }, { value: '9', name: 'October' },
        { value: '10', name: 'November' }, { value: '11', name: 'December' }
    ];

    useEffect(() => {
        const fetchAllRequests = async () => {
            try {
                const response = await api.get('/vehicle-requests/admin/all-requests');
                const data = response.data;
                setRequests(data);
                setFilteredRequests(data);

                const yearsSet = new Set();
                const monthsSet = new Set();

                data.forEach(req => {
                    if (req.travelDateTime) {
                        const date = new Date(req.travelDateTime);
                        yearsSet.add(date.getFullYear().toString());
                        monthsSet.add(date.getMonth().toString());
                    }
                });

                setAvailableYears([...yearsSet].sort((a, b) => b - a));
                setAvailableMonths([...monthsSet].sort((a, b) => a - b));

                setLoading(false);
            } catch (err) {
                console.error("Error fetching requests:", err);
                setError("Unable to obtain vehicle application details.");
                setLoading(false);
            }
        };

        fetchAllRequests();
    }, []);

    useEffect(() => {
        let tempRequests = requests;

        if (selectedStatus !== 'ALL') {
            tempRequests = tempRequests.filter(req => req.status === selectedStatus);
        }

        if (selectedYear !== 'ALL') {
            tempRequests = tempRequests.filter(req => {
                const reqYear = new Date(req.travelDateTime).getFullYear().toString();
                return reqYear === selectedYear;
            });
        }

        if (selectedMonth !== 'ALL') {
            tempRequests = tempRequests.filter(req => {
                const reqMonth = new Date(req.travelDateTime).getMonth().toString();
                return reqMonth === selectedMonth;
            });
        }

        if (searchTerm.trim() !== '') {
            const lowSearch = searchTerm.toLowerCase();
            tempRequests = tempRequests.filter(req =>
                (req.requesterName && req.requesterName.toLowerCase().includes(lowSearch)) ||
                (req.department && req.department.toLowerCase().includes(lowSearch)) ||
                (req.fromLocation && req.fromLocation.toLowerCase().includes(lowSearch)) ||
                (req.toLocation && req.toLocation.toLowerCase().includes(lowSearch))
            );
        }

        setFilteredRequests(tempRequests);
    }, [searchTerm, selectedStatus, selectedYear, selectedMonth, requests]);

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'APPROVED_BY_VEHICLE_ADMIN': return 'status-admin-approved';
            case 'APPROVED_BY_VEHICLE_APPROVAL_OFFICER': return 'status-officer-approved';
            case 'COMPLETED': return 'status-completed';
            case 'TRIP_PROCESS_CONFIRMED': return 'status-completed';
            case 'TRIP_STARTED': return 'status-ongoing';
            case 'REJECTED': 
            case 'REJECTED_BY_VEHICLE_ADMIN':
            case 'EMPLOYEE_CANCEL':
            case 'REJECTED_BY_VEHICLE_APPROVAL_OFFICER':
                return 'status-rejected';
            default: return 'status-default';
        }
    };

    const openDetailsModal = (request) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setSelectedRequest(null);
        setIsModalOpen(false);
    };

    return (
        <div className="admin-vehicle-history-container fade-in">
            <div className="admin-vehicle-history-header-section">
                <h1 className="admin-vehicle-history-title">Vehicle Request History</h1>
                <p className="admin-vehicle-history-subtitle">All vehicle requests in the system and their current status can be viewed here.</p>
            </div>

            <div className="admin-vehicle-history-controls-row">
                <div className="admin-vehicle-history-search-wrapper">
                    <input type="text" placeholder="Search by name, section or route..."
                        className="admin-vehicle-history-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="admin-vehicle-history-filters-group">
                    <select className="admin-vehicle-history-filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        <option value="ALL">All Years</option> {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                    </select>

                    <select className="admin-vehicle-history-filter-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                        <option value="ALL">All Months</option>
                        {monthNames
                            .filter(m => availableMonths.includes(m.value))
                            .map(m => (<option key={m.value} value={m.value}>{m.name}</option>))
                        }
                    </select>

                    <select className="admin-vehicle-history-filter-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="EMPLOYEE_CANCEL">Employee Cancel</option>
                        <option value="APPROVED_BY_VEHICLE_ADMIN">Admin Approved</option>
                        <option value="APPROVED_BY_VEHICLE_APPROVAL_OFFICER">Officer Approved</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="REJECTED_BY_VEHICLE_ADMIN">Rejected By Admin</option>
                        <option value="REJECTED_BY_VEHICLE_APPROVAL_OFFICER">Rejected By Officer</option>
                    </select>
                </div>
            </div>

            <div className="admin-vehicle-history-table-wrapper">
                <table className="admin-vehicle-history-table">
                    <thead className="admin-vehicle-history-thead">
                        <tr>
                            <th className="admin-vehicle-history-th">Requester Name</th>
                            <th className="admin-vehicle-history-th">Email</th>
                            <th className="admin-vehicle-history-th">Department</th>
                            <th className="admin-vehicle-history-th">Journey (From - To)</th>
                            <th className="admin-vehicle-history-th">Assigned Vehicle and Drivers</th>
                            <th className="admin-vehicle-history-th">Status</th>
                            <th className="admin-vehicle-history-th">Action</th>
                        </tr>
                    </thead>
                    <tbody className="admin-vehicle-history-tbody">
                        {filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="admin-vehicle-history-no-data">
                                    No data was found that matched the selected year, month, or search.
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((request) => (
                                <tr key={request.id} className="admin-vehicle-history-tr">
                                    <td className="admin-vehicle-history-td">{request.requesterName}</td>
                                    <td className="admin-vehicle-history-td">{request.requesterEmail}</td>
                                    <td className="admin-vehicle-history-td">{request.department}</td>

                                    <td className="admin-vehicle-history-td">
                                        <div className="admin-vehicle-history-journey">
                                            {request.fromLocation} <span className="admin-vehicle-history-arrow">➡️</span> {request.toLocation}
                                        </div>
                                        <div className="admin-vehicle-history-distance">Distance: {request.distanceKm} km</div>
                                    </td>

                                    <td className="admin-vehicle-history-td">
                                        {request.assignedVehicle || request.assignedDriver ? (
                                            <div className="admin-vehicle-history-combined-info">
                                                {request.assignedVehicle && (
                                                    <div className="admin-vehicle-history-vehicle-info">
                                                        <span>{request.assignedVehicle.vehicleNumber}</span>
                                                        <span>{" "}({request.assignedVehicle.manufacturer} {request.assignedVehicle.model})</span>
                                                    </div>
                                                )}

                                                {request.assignedDriver && (
                                                    <div className="admin-vehicle-history-driver-info">
                                                        <span>{request.assignedDriver.name}</span>
                                                        <span>{" "} - {request.assignedDriver.phoneNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="admin-vehicle-history-not-assignedd">Not Assigned</span>
                                        )}
                                    </td>

                                    <td className="admin-vehicle-history-td">
                                        <span className={`admin-vehicle-history-badge ${getStatusClass(request.status)}`}>
                                            {request.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>

                                    <td className="admin-vehicle-history-td model-history"
                                        onClick={() => openDetailsModal(request)}
                                        style={{ cursor: 'pointer', textAlign: 'center' }}>
                                        📚
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && selectedRequest && (
                <div className="history-modal-overlay" onClick={closeDetailsModal}>
                    <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="history-modal-header">
                            <h2>Full Vehicle Request Details</h2>
                        </div>

                        <div className="history-modal-body">
                            <div className="modal-data-section">
                                <h3>Requester & Journey Information</h3>
                                <div className="modal-grid-two-col">
                                    <p><strong>Name:</strong> {selectedRequest.requesterName} ({selectedRequest.requesterPosition})</p>
                                    <p><strong>Department/Branch:</strong> {selectedRequest.department}</p>
                                    <p><strong>Email:</strong> {selectedRequest.requesterEmail}</p>
                                    <p><strong>Phone Number:</strong> {selectedRequest.phoneNumber}</p>
                                    <p><strong>Travel Date & Time:</strong> {new Date(selectedRequest.travelDateTime).toLocaleString()}</p>
                                    <p><strong>Nature of Duty:</strong> {selectedRequest.dutyNature}</p>
                                    <p><strong>Route:</strong> {selectedRequest.fromLocation} ➡️ {selectedRequest.toLocation}</p>
                                    <p><strong>Distance (Estimated):</strong> {selectedRequest.distanceKm} km</p>
                                    <p className="full-width-text"><strong>Reason for Journey:</strong> {selectedRequest.reason}</p>
                                </div>
                            </div>

                            <div className="modal-data-section">
                                <h3>Assigned Resource Allocations</h3>
                                {selectedRequest.assignedVehicle || selectedRequest.assignedDriver ? (
                                    <div className="modal-tables-grid">

                                        <div className="modal-info-table-wrapper">
                                            <table className="modal-info-style-table">
                                                <thead>
                                                    <tr>
                                                        <th colSpan="2" className="table-main-header">VEHICLE INFORMATION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedRequest.assignedVehicle ? (
                                                        <>
                                                            <tr>
                                                                <td className="table-label-col">VEHICLE NUMBER</td>
                                                                <td className="table-value-col">{selectedRequest.assignedVehicle.vehicleNumber}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-col">TYPE</td>
                                                                <td className="table-value-col">{selectedRequest.assignedVehicle.vehicleType || 'N/A'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-col">MODEL</td>
                                                                <td className="table-value-col">{selectedRequest.assignedVehicle.manufacturer} {selectedRequest.assignedVehicle.model}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-col">LICEN EXPIERY DATE</td>
                                                                <td className="table-value-col">{selectedRequest.assignedVehicle.licenseExpiryDate || 'N/A'}</td>
                                                            </tr>
                                                        </>
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="2" className="table-no-data-msg">No vehicle allocated to this request.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="modal-info-table-wrapper">
                                            <table className="modal-info-style-table">
                                                <thead>
                                                    <tr>
                                                        <th colSpan="2" className="table-main-header">DRIVER INFORMATION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedRequest.assignedDriver ? (
                                                        <>
                                                            <tr>
                                                                <td className="table-label-col">DRIVER NAME</td>
                                                                <td className="table-value-col">{selectedRequest.assignedDriver.name}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-col">NIC</td>
                                                                <td className="table-value-col">{selectedRequest.assignedDriver.nic || 'N/A'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-col">PHONE NUMBER</td>
                                                                <td className="table-value-col">{selectedRequest.assignedDriver.phoneNumber}</td>
                                                            </tr>
                                                        </>
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="2" className="table-no-data-msg">No driver allocated to this request.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="modal-no-assignment-alert">
                                        ⚠️ Resources (Vehicle / Driver) have not been assigned to this request yet.
                                    </div>
                                )}
                            </div>

                            <div className="modal-data-section">
                                <h3>Workflow Tracking & Remarks</h3>
                                <div className="modal-status-flex">
                                    <p><strong>Current Status:</strong>
                                        <span className={`admin-vehicle-history-badge ${getStatusClass(selectedRequest.status)}`} style={{ marginLeft: '10px' }}>
                                            {selectedRequest.status.replace(/_/g, ' ')}
                                        </span>
                                    </p>
                                    <p><strong>Created Date:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="modal-grid-two-col" style={{ marginTop: '10px' }}>
                                    <div className="remarks-box admin-remarks">
                                        <strong>Vehicle Admin Remarks:</strong>
                                        <p>*{selectedRequest.adminRemarks || "No remarks provided by Vehicle Admin."}*</p>
                                    </div>
                                    <div className="remarks-box officer-remarks">
                                        <strong>Approval Officer Remarks:</strong>
                                        <p>*{selectedRequest.officerRemarks || "No remarks provided by Approval Officer."}*</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="history-modal-footer">
                            <button className="modal-close-footer-btn" onClick={closeDetailsModal}>Close Window</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVehicleHistory;