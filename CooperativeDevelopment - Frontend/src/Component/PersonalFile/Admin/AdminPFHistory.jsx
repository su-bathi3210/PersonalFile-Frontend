import React, {
    useEffect,
    useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import API from '../../API/Axios';

import '../../CSS/AdminPFHistory.css';

const AdminPFHistory = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [changeCount, setChangeCount] = useState(0);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDesignation, setSelectedDesignation] = useState('All');
    const [designations, setDesignations] = useState([]);

    const [pageLoading, setPageLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllEmployees = async () => {
            try {
                setPageLoading(true);
                const res = await API.get('/personalfile/all-employees');
                const empList = Array.isArray(res.data) ? res.data : [];
                setEmployees(empList);
                setFilteredEmployees(empList);

                const uniqueDesignations = ['All', ...new Set(empList.map(emp => emp.designation).filter(Boolean))];
                setDesignations(uniqueDesignations);
            } catch (err) {
                console.error("Error fetching employees:", err);
                setError("Unable to retrieve employee list.");
            } finally {
                setPageLoading(false);
            }
        };
        fetchAllEmployees();
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

    const handleEmployeeClick = async (emp) => {
        setSelectedEmployee(emp);
        setHistoryLoading(true);
        setHistoryData([]);
        setChangeCount(0);

        try {
            const [historyRes, countRes] = await Promise.all([
                API.get(`/personalfile/history/by-email/${emp.email}`),
                API.get(`/personalfile/history/count/by-email/${emp.email}`)
            ]);

            setHistoryData(Array.isArray(historyRes.data) ? historyRes.data : []);
            setChangeCount(countRes.data || 0);
        } catch (err) {
            console.error("Error fetching history:", err);
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
        <div className="pf-history-container">

            <div className="pf-history-top-navbar">

                <div>
                    <h2 className="pf-history-main-title">Cooperative Department Employees</h2>
                    <p className="pf-history-sub-title-desc"> All data changes made to the personal files of Cooperative Development
                        Department employees, revision frequency, and relevant historical notes can be checked here.</p>
                </div>

                <button className="pf-history-back-btn" onClick={() => navigate('/AdminPersonalFile')}> ← Back</button>
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
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="pf-history-no-match">ගැලපෙන සේවකයින් කිසිවෙකු හමු නොවීය.</td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp, index) => (
                                    <tr
                                        key={emp._id || emp.id}
                                        className={`pf-history-emp-row ${selectedEmployee?.email === emp.email ? 'active-row' : ''}`}>
                                        <td>{emp.username}</td>
                                        <td>{emp.email}</td>
                                        <td>{emp.address}</td>
                                        <td>{emp.dateOfBirth}</td>
                                        <td>{emp.phoneNumber}</td>
                                        <td>{emp.dutyPlace}</td>
                                        <td>{emp.designation || 'N/A'}</td>
                                        <td>
                                            <button className="pf-history-view-btn" onClick={() => handleEmployeeClick(emp)}>🔍︎</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedEmployee && (
                <div className="pf-history-section-details">

                    <div className="pf-history-header">
                        <h3 className="pf-history-title">History for: <span>{selectedEmployee.username}</span></h3>

                        <div className="pf-history-badge">Total Changes: <span className="pf-history-count-num">{changeCount}</span></div>
                    </div>

                    {historyLoading ? (
                        <div className="pf-history-sub-loading">ඉතිහාස දත්ත පූරණය වෙමින් පවතී...</div>
                    ) : historyData.length === 0 ? (
                        <div className="pf-history-empty">මෙම සේවකයාගේ දත්ත කිසිවක් තවමත් වෙනස් කර නොමැත.</div>
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

                                    <div className="pf-history-table-wrapper">
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
            )}
        </div>
    );
};

export default AdminPFHistory;