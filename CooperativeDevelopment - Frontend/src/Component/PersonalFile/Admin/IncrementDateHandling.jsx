import {
    useEffect,
    useState
} from 'react';

import api from '../../API/Axios';

import '../../CSS/IncrementDateHandling.css';

const EmployeeLeaveBadge = ({ email, incrementDate }) => {
    const [leaveCount, setLeaveCount] = useState('...');

    useEffect(() => {
        if (!email || !incrementDate) {
            setLeaveCount('-');
            return;
        }
        api.get('/personalfile/calculate-increment-leave', {
            params: {
                email: email,
                incrementDate: incrementDate
            }
        })
            .then(response => {
                setLeaveCount(`${response.data} Days`);
            })
            .catch(error => {
                console.error("Error fetching leave count for:", email, error);
                setLeaveCount('0 Days');
            });
    }, [email, incrementDate]);

    return (
        <span className="increment-leave-badge-text" style={{ fontWeight: '600', color: '#0077b6' }}>{leaveCount}</span>
    );
};

const IncrementDateHandling = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sendingEmailId, setSendingEmailId] = useState(null);

    const [currentMonthIncrements, setCurrentMonthIncrements] = useState([]);
    const [nextMonthIncrements, setNextMonthIncrements] = useState([]);
    const [afterNextMonthIncrements, setAfterNextMonthIncrements] = useState([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [selectedTemplates, setSelectedTemplates] = useState([]);

    const availableTemplates = [
        { id: "t1", name: "වාර්ෂික වැටුප් වර්ධක පත්‍රය - සමුපකාර සංවර්ධන නිලධාරී සේවය.docx", displayName: "වාර්ෂික වැටුප් වර්ධක පත්‍රය - සමුපකාර සංවර්ධන නිලධාරී සේවය" },
        { id: "t2", name: "කාර්ය සාධක පරීක්ෂණ වාර්තා - ප්‍රධාන කළමනාකරණ සේවා නිලධාරි.docx", displayName: "කාර්ය සාධක පරීක්ෂණ වාර්තා - ප්‍රධාන කළමනාකරණ සේවා නිලධාරි" },
        { id: "t3", name: "කාර්ය සාධන ඇගයීම් වාර්තා - කණිෂ්ඨ සේවය.docx", displayName: "කාර්ය සාධන ඇගයීම් වාර්තා - කණිෂ්ඨ සේවය" },
        { id: "t4", name: "කාර්ය සාධන ඇගයීම් වාර්තා - සංවර්ධන නිලධාරි.docx", displayName: "කාර්ය සාධන ඇගයීම් වාර්තා - සංවර්ධන නිලධාරි" },
        { id: "t5", name: "කාර්යසාධන ඇගයිම කළමනාකරණ - සහකාර සේවයේ නිලධාරින්.docx", displayName: "කාර්යසාධන ඇගයිම කළමනාකරණ - සහකාර සේවයේ නිලධාරින්" }
    ];

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await api.get('/personalfile/all-employees');
            const allData = response.data;
            setEmployees(allData);

            const now = new Date();

            const currentMonth = now.getMonth();

            const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const nextMonth = nextMonthDate.getMonth();

            const afterNextMonthDate = new Date(now.getFullYear(), now.getMonth() + 2, 1);
            const afterNextMonth = afterNextMonthDate.getMonth();

            const getParsedDate = (dateStr) => {
                if (!dateStr) return null;
                if (dateStr.includes('-') && dateStr.split('-').length === 2) {
                    return new Date(`${now.getFullYear()}-${dateStr}`);
                }
                return new Date(dateStr);
            };

            const currentFiltered = allData.filter(emp => {
                if (!emp.incrementDate) return false;
                const incDate = getParsedDate(emp.incrementDate);
                if (!incDate || isNaN(incDate.getTime())) return false;

                const isProcessed = emp.incrementStatus === "EMAIL_SENT" || emp.incrementStatus === "COMPLETED";
                return (incDate.getMonth() === currentMonth && !isProcessed);
            });

            const nextFiltered = allData.filter(emp => {
                if (!emp.incrementDate) return false;
                const incDate = getParsedDate(emp.incrementDate);
                if (!incDate || isNaN(incDate.getTime())) return false;

                const isProcessed = emp.incrementStatus === "EMAIL_SENT" || emp.incrementStatus === "COMPLETED";
                return (incDate.getMonth() === nextMonth && !isProcessed);
            });

            const afterNextFiltered = allData.filter(emp => {
                if (!emp.incrementDate) return false;
                const incDate = getParsedDate(emp.incrementDate);
                if (!incDate || isNaN(incDate.getTime())) return false;

                const isProcessed = emp.incrementStatus === "EMAIL_SENT" || emp.incrementStatus === "COMPLETED";
                return (incDate.getMonth() === afterNextMonth && !isProcessed);
            });

            setCurrentMonthIncrements(currentFiltered);
            setNextMonthIncrements(nextFiltered);
            setAfterNextMonthIncrements(afterNextFiltered);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const openTemplateModal = (employeeId) => {
        setSelectedEmployeeId(employeeId);
        setSelectedTemplates([]);
        setIsModalOpen(true);
    };

    const handleTemplateCheckboxChange = (templateName) => {
        if (selectedTemplates.includes(templateName)) {
            setSelectedTemplates(prev => prev.filter(name => name !== templateName));
        } else {
            setSelectedTemplates(prev => [...prev, templateName]);
        }
    };

    const handleSendEmailAndTemplates = async () => {
        if (selectedTemplates.length === 0) {
            alert("⚠️ Please select at least one template!");
            return;
        }

        setSendingEmailId(selectedEmployeeId);
        setIsModalOpen(false);

        try {
            await api.post(`/personalfile/send-increment-email/${selectedEmployeeId}`, selectedTemplates);
            alert("✅ Email and automated forms were successfully prepared and sent!");
            fetchEmployees();
        } catch (err) {
            console.error("Error sending templates:", err);
            alert(err.response?.data || "❌ The message or form could not be sent.");
        } finally {
            setSendingEmailId(null);
            setSelectedEmployeeId(null);
        }
    };

    const formatDayMonth = (dateStr) => {
        if (!dateStr) return "-";

        const cleanDate = dateStr.split('T')[0];
        const parts = cleanDate.split('-');

        let month, day;
        if (parts.length === 3) {
            month = parseInt(parts[1], 10) - 1;
            day = parseInt(parts[2], 10);
        } else if (parts.length === 2) {
            month = parseInt(parts[0], 10) - 1;
            day = parseInt(parts[1], 10);
        } else {
            return dateStr;
        }

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${day}-${monthNames[month]}`;
    };

    if (error) return <div className="increment-Date-Handling-error">{error}</div>;

    return (
        <div className="increment-Date-Handling-main-wrapper fade-in">
            <div className="increment-Date-Handling-left-panel">
                <h2 className="increment-Date-Handling-title">Employee Salary Increment Date Register</h2>
                <p className="increment-Date-Handling-description"> Provides a detailed overview of upcoming salary increment dates for all employees.</p>

                <div className="increment-Date-Handling-table-wrapper">
                    <table className="increment-Date-Handling-table">
                        <thead className="increment-Date-Handling-thead">
                            <tr>
                                <th className="increment-Date-Handling-th" style={{ width: '0px' }}>Name</th>
                                <th className="increment-Date-Handling-th" style={{ width: '0px' }}>Email</th>
                                <th className="increment-Date-Handling-th" style={{ width: '0px' }}>Address</th>
                                <th className="increment-Date-Handling-th" style={{ width: '0px' }}>Phone Number</th>
                                <th className="increment-Date-Handling-th" style={{ width: '0px' }}>NIC</th>
                                <th className="increment-Date-Handling-th" style={{ width: '420px' }}>Designation</th>
                                <th className="increment-Date-Handling-th" style={{ width: '150px' }}>In: Date</th>
                                <th className="increment-Date-Handling-th" style={{ width: '150px' }}>Leaves</th>
                            </tr>
                        </thead>
                        <tbody className="increment-Date-Handling-tbody">
                            {employees.map((emp) => (
                                <tr key={emp.id} className="increment-Date-Handling-tr">
                                    <td className="increment-Date-Handling-td">{emp.username}</td>
                                    <td className="increment-Date-Handling-td">{emp.email}</td>
                                    <td className="increment-Date-Handling-td">{emp.address}</td>
                                    <td className="increment-Date-Handling-td">{emp.phoneNumber}</td>
                                    <td className="increment-Date-Handling-td">{emp.nic}</td>
                                    <td className="increment-Date-Handling-td">{emp.designation}</td>
                                    <td className="increment-Date-Handling-td">
                                        <span className="increment-Date-Handling-date-text">
                                            {emp.incrementDate ? formatDayMonth(emp.incrementDate) : '-'}
                                        </span>
                                    </td>
                                    <td className="increment-Date-Handling-td"><EmployeeLeaveBadge email={emp.email} incrementDate={emp.incrementDate} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="increment-Date-Handling-right-panel">
                <div className="upcoming-notifications-wrapper">
                    <div className="notifications-container-flex">

                        <div className="notification-section" style={{ backgroundColor: "#e2eafc" }}>
                            <h4 className="section-subtitle">
                                {new Date().toLocaleString('default', { month: 'long' }).toUpperCase()} INCREMENTS
                            </h4>
                            <div className="upcoming-list">
                                {currentMonthIncrements.length > 0 ? (
                                    currentMonthIncrements.map((emp) => (
                                        <div key={emp.id} className="upcoming-card">
                                            <div className="upcoming-info">
                                                <strong>{emp.username}</strong>
                                                <span>{emp.email}</span>
                                            </div>
                                            <button
                                                className="send-email-btn"
                                                onClick={() => openTemplateModal(emp.id)}
                                                disabled={sendingEmailId !== null}
                                            >
                                                {sendingEmailId === emp.id ? 'PROCESSING...' : 'CHOOSE & SEND'}
                                            </button>
                                        </div>
                                    ))
                                ) : <p className="notification-section-no-data">No records for this month.</p>}
                            </div>
                        </div>

                        <div className="notification-section" style={{ backgroundColor: "#eae4e9" }}>
                            <h4 className="section-subtitle">
                                {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleString('default', { month: 'long' }).toUpperCase()} INCREMENTS
                            </h4>
                            <div className="upcoming-list">
                                {nextMonthIncrements.length > 0 ? (
                                    nextMonthIncrements.map((emp) => (
                                        <div key={emp.id} className="upcoming-card">
                                            <div className="upcoming-info">
                                                <strong>{emp.username}</strong>
                                                <span>{emp.email}</span>
                                            </div>
                                            <button
                                                className="send-email-btn"
                                                onClick={() => openTemplateModal(emp.id)}
                                                disabled={sendingEmailId !== null}
                                            >
                                                {sendingEmailId === emp.id ? 'PROCESSING...' : 'CHOOSE & SEND'}
                                            </button>
                                        </div>
                                    ))
                                ) : <p className="notification-section-no-data">No records for next month.</p>}
                            </div>
                        </div>

                        <div className="notification-section" style={{ backgroundColor: "#d8e2dc" }}>
                            <h4 className="section-subtitle">
                                {new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1).toLocaleString('default', { month: 'long' }).toUpperCase()} INCREMENTS
                            </h4>
                            <div className="upcoming-list">
                                {afterNextMonthIncrements.length > 0 ? (
                                    afterNextMonthIncrements.map((emp) => (
                                        <div key={emp.id} className="upcoming-card">
                                            <div className="upcoming-info">
                                                <strong>{emp.username}</strong>
                                                <span>{emp.email}</span>
                                            </div>
                                            <button
                                                className="send-email-btn"
                                                onClick={() => openTemplateModal(emp.id)}
                                                disabled={sendingEmailId !== null}
                                            >
                                                {sendingEmailId === emp.id ? 'PROCESSING...' : 'CHOOSE & SEND'}
                                            </button>
                                        </div>
                                    ))
                                ) : <p className="notification-section-no-data">No records for this month.</p>}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="increment-modal-backdrop">
                    <div className="increment-modal-content">
                        <h3 className="modal-main-title">Select Increment Form Formats</h3>

                        <div className="modal-templates-list">
                            {availableTemplates.map((template) => (
                                <label key={template.id} className="modal-template-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedTemplates.includes(template.name)}
                                        onChange={() => handleTemplateCheckboxChange(template.name)}
                                    />
                                    <div className="template-details">
                                        <span className="template-display-name">{template.displayName}</span>
                                        <span className="template-file-name">({template.name})</span>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="modal-action-buttons">
                            <button className="modal-btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button className="modal-btn-confirm" onClick={handleSendEmailAndTemplates}>Confirm & Send Request</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncrementDateHandling;