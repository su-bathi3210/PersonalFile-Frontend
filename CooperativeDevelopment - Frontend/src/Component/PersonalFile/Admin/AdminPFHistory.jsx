import React, {
    useEffect,
    useState
} from 'react';

import {
    useNavigate,
    useLocation
} from 'react-router-dom';

import API from '../../API/Axios';

import '../../CSS/AdminPFHistory.css';

const AdminPFHistory = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);

    const [expandedEmployeeId, setExpandedEmployeeId] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [changeCount, setChangeCount] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDesignation, setSelectedDesignation] = useState('All');
    const [designations, setDesignations] = useState([]);

    const [pageLoading, setPageLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [error, setError] = useState(null);

    const [highlightedUserEmails, setHighlightedUserEmails] = useState([]);

    useEffect(() => {
        if (location.state && location.state.highlightUserEmails) {
            setHighlightedUserEmails(location.state.highlightUserEmails);
        }
    }, [location]);

    useEffect(() => {
        const fetchHistoryEmployees = async () => {
            try {
                setPageLoading(true);
                const res = await API.get('/personalfile/history-employees');
                const empList = Array.isArray(res.data) ? res.data : [];
                setEmployees(empList);
                setFilteredEmployees(empList);

                const uniqueDesignations = ['All', ...new Set(empList.map(emp => emp.designation).filter(Boolean))];
                setDesignations(uniqueDesignations);
            } catch (err) {
                console.error("❌ Error fetching sorted history employees:", err);
                setError("❌ Unable to retrieve employee update history list.");
            } finally {
                setPageLoading(false);
            }
        };
        fetchHistoryEmployees();
    }, []);

    useEffect(() => {
        let result = employees;

        if (searchTerm.trim() !== '') {
            result = result.filter(emp =>
                (emp.username && emp.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedDesignation !== 'All') {
            result = result.filter(emp => emp.designation === selectedDesignation);
        }

        setFilteredEmployees(result);
    }, [searchTerm, selectedDesignation, employees]);

    const handleToggleExpand = async (emp) => {
        const empId = emp._id || emp.id;

        if (expandedEmployeeId === empId) {
            setExpandedEmployeeId(null);
            setHistoryData([]);
            setChangeCount(0);
            return;
        }

        setExpandedEmployeeId(empId);
        setHistoryLoading(true);
        setHistoryData([]);
        setChangeCount(0);

        if (highlightedUserEmails.includes(emp.email)) {
            setHighlightedUserEmails(prev => prev.filter(email => email !== emp.email));
            window.history.replaceState({}, document.title);

            try {
                await API.put(`/personalfile/increment-notifications/mark-as-read/${emp.email}`);
                console.log("✅ Notification marked as read/resolved on backend.");
            } catch (apiErr) {
                console.error("❌ Error updating notification status on backend:", apiErr);
            }
        }

        try {
            const [historyRes, countRes] = await Promise.all([
                API.get(`/personalfile/history/by-email/${emp.email}`),
                API.get(`/personalfile/history/count/by-email/${emp.email}`)
            ]);

            const rawHistory = Array.isArray(historyRes.data) ? historyRes.data : [];
            const sortedTimeline = rawHistory.sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

            setHistoryData(sortedTimeline);
            setChangeCount(countRes.data || 0);
        } catch (err) {
            console.error("❌ Error fetching history details:", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return "N/A";
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateTimeString).toLocaleDateString('en-US', options);
    };

    const formatFieldName = (fieldName) => {
        if (!fieldName) return "";
        return fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    };

    if (error) return <div className="pf-history-error">{error}</div>;

    return (
        <div className="pf-history-container fade-in">
            <div className="pf-history-top-navbar">
                <div>
                    <h2 className="pf-history-main-title">Profile Update History</h2>
                    <p className="pf-history-sub-title-desc">
                        Showing only employees who have modified their profiles, sorted by the most recent data revision first.
                    </p>
                </div>
                <button className="pf-history-back-btn" onClick={() => navigate('/AdminPFDashboard')}> ← Back</button>
            </div>

            <div className="pf-history-filter-section">
                <input type="text" className="pf-history-search-input" placeholder="🔍 Search by Name or Email..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

                <select className="pf-history-select-filter" value={selectedDesignation} onChange={(e) => setSelectedDesignation(e.target.value)}>
                    {designations.map((des, index) => (
                        <option key={index} value={des}>{des}</option>
                    ))}
                </select>
            </div>

            <div className="pf-history-section-list">
                <div className="pf-history-table-wrapper">
                    <table className="pf-history-emp-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>Birthday</th>
                                <th>Phone</th>
                                <th>Duty Place</th>
                                <th>Designation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageLoading ? (
                                <tr>
                                    <td colSpan="7" className="pf-history-no-match">Loading modification history...</td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="pf-history-no-match">No profile changes found.</td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => {
                                    const empId = emp._id || emp.id;
                                    const isExpanded = expandedEmployeeId === empId;
                                    const isHighlighted = highlightedUserEmails.includes(emp.email);

                                    let rowClassName = "pf-history-emp-row";
                                    if (isExpanded) {
                                        rowClassName += " active-row";
                                    } else if (isHighlighted) {
                                        rowClassName += " pf-history-highlighted-row";
                                    }

                                    return (
                                        <React.Fragment key={empId}>
                                            <tr className={rowClassName}>
                                                <td className="pf-history-name-cell" onClick={() => handleToggleExpand(emp)}>
                                                    <span className={`pf-history-expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>{emp.username} </td>
                                                <td>{emp.email}</td>
                                                <td>{emp.address}</td>
                                                <td>{emp.dateOfBirth}</td>
                                                <td>{emp.phoneNumber}</td>
                                                <td>{emp.dutyPlace}</td>
                                                <td>{emp.designation || 'N/A'}</td>
                                            </tr>

                                            {isExpanded && (
                                                <tr className="pf-history-expanded-detail-row">
                                                    <td colSpan="7">
                                                        <div className="pf-history-inline-details fade-in">
                                                            <div className="pf-history-header">
                                                                <h3 className="pf-history-title">History for: <span>{emp.username}</span></h3>
                                                                <div className="pf-history-badge">Total Changes: <span className="pf-history-count-num">{changeCount}</span></div>
                                                            </div>

                                                            {historyLoading ? (
                                                                <div className="pf-history-sub-loading">Loading historical data...</div>
                                                            ) : historyData.length === 0 ? (
                                                                <div className="pf-history-empty">None of this employee's data has been changed yet.</div>
                                                            ) : (
                                                                <div className="pf-history-timeline">
                                                                    {historyData.map((record) => (
                                                                        <div key={record._id || record.id} className="pf-history-card">
                                                                            <div className="pf-history-card-top">
                                                                                <span className="pf-history-revision">Revision {record.revisionNumber}</span>
                                                                                <span className="pf-history-date">{formatDateTime(record.changedAt)}</span>
                                                                            </div>

                                                                            <div className="pf-history-author">
                                                                                Changed By: <span className={`pf-history-role-badge ${record.changedBy === 'PERSONALFILE_ADMIN' ? 'role-admin' : 'role-employee'}`}>
                                                                                    {record.changedBy}
                                                                                </span>
                                                                            </div>

                                                                            <div className="pf-history-table-wrapper-inner">
                                                                                <table className="pf-history-table">
                                                                                    <thead>
                                                                                        <tr>
                                                                                            <th>Field Name</th>
                                                                                            <th>Old Value</th>
                                                                                            <th>New Value</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {record.changes && record.changes.map((change, index) => (
                                                                                            <tr key={index}>
                                                                                                <td className="pf-history-field-name">{formatFieldName(change.fieldName)}</td>
                                                                                                <td className="pf-history-old-val">{change.oldValue || <span className="pf-history-null">Empty</span>}</td>
                                                                                                <td className="pf-history-new-val">{change.newValue || <span className="pf-history-null">Empty</span>}</td>
                                                                                            </tr>
                                                                                        ))}
                                                                                    </tbody>
                                                                                </table>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPFHistory;