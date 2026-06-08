import React, {
    useState,
    useEffect
} from 'react';

import api from '../../API/Axios';

import '../../CSS/IncrementDateHandling.css';

const IncrementDateHandling = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sendingEmailId, setSendingEmailId] = useState(null);

    const [currentMonthIncrements, setCurrentMonthIncrements] = useState([]);
    const [nextMonthIncrements, setNextMonthIncrements] = useState([]);

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

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await api.get('/personalfile/all-employees');
                const allData = response.data;
                setEmployees(allData);

                const now = new Date();

                const targetMonth1Date = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                const t1Month = targetMonth1Date.getMonth();
                const t1Year = targetMonth1Date.getFullYear();

                const targetMonth2Date = new Date(now.getFullYear(), now.getMonth() + 2, 1);
                const t2Month = targetMonth2Date.getMonth();
                const t2Year = targetMonth2Date.getFullYear();

                const currentFiltered = allData.filter(emp => {
                    if (!emp.incrementDate) return false;

                    const dateString = emp.incrementDate.includes('-') && emp.incrementDate.split('-').length === 2
                        ? `${new Date().getFullYear()}-${emp.incrementDate}`
                        : emp.incrementDate;

                    const incDate = new Date(dateString);
                    const isProcessed = emp.incrementStatus === "EMAIL_SENT" || emp.incrementStatus === "COMPLETED";

                    return (incDate.getMonth() === t1Month && !isProcessed);
                });

                const nextFiltered = allData.filter(emp => {
                    if (!emp.incrementDate) return false;
                    const incDate = new Date(emp.incrementDate);
                    const isProcessed = emp.incrementStatus === "EMAIL_SENT" || emp.incrementStatus === "COMPLETED";

                    return (
                        incDate.getMonth() === t2Month &&
                        incDate.getFullYear() === t2Year &&
                        !isProcessed
                    );
                });

                setCurrentMonthIncrements(currentFiltered);
                setNextMonthIncrements(nextFiltered);
                setLoading(false);
            } catch (err) {
                console.error("Error:", err);
                setError("Data could not be retrieved...");
                setLoading(false);
            }
        };
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
            alert("⚠️ Please select at least one increment form format!");
            return;
        }

        setSendingEmailId(selectedEmployeeId);
        setIsModalOpen(false);

        try {
            await api.post(`/personalfile/send-increment-email/${selectedEmployeeId}`, selectedTemplates);

            setCurrentMonthIncrements(prev => prev.filter(emp => emp.id !== selectedEmployeeId));
            setNextMonthIncrements(prev => prev.filter(emp => emp.id !== selectedEmployeeId));

            alert("✅ Message & Selected Form Formats Sent Successfully!");
        } catch (err) {
            console.error("Error sending email:", err);
            alert(err.response?.data || "❌ The Message Could Not Be Sent.");
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
                <p className="increment-Date-Handling-description">
                    This register provides a comprehensive overview of upcoming salary increment dates for all employees.
                </p>

                <div className="increment-Date-Handling-table-wrapper">
                    <table className="increment-Date-Handling-table">
                        <thead className="increment-Date-Handling-thead">
                            <tr>
                                <th className="increment-Date-Handling-th">Name</th>
                                <th className="increment-Date-Handling-th">Phone</th>
                                <th className="increment-Date-Handling-th" style={{ width: '260px' }}>Designation</th>
                                <th className="increment-Date-Handling-th">In: Date</th>
                            </tr>
                        </thead>
                        <tbody className="increment-Date-Handling-tbody">
                            {employees.map((emp) => (
                                <tr key={emp.id} className="increment-Date-Handling-tr">
                                    <td className="increment-Date-Handling-td">{emp.username}</td>
                                    <td className="increment-Date-Handling-td">{emp.phoneNumber}</td>
                                    <td className="increment-Date-Handling-td">{emp.designation}</td>
                                    <td className="increment-Date-Handling-td">
                                        <span className="increment-Date-Handling-date-text">
                                            {emp.incrementDate ? formatDayMonth(emp.incrementDate) : '-----'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="increment-Date-Handling-right-panel">
                <div className="upcoming-notifications-wrapper">
                    <div className="notifications-container-flex">

                        <div className="notification-section" style={{ backgroundColor: "#f5fff0" }}>
                            <h4 className="section-subtitle">{new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleString('default', { month: 'long' }).toUpperCase()} INCREMENTS</h4>
                            <div className="upcoming-list">
                                {currentMonthIncrements.length > 0 ? (
                                    currentMonthIncrements.map((emp) => (
                                        <div key={emp.id} className="upcoming-card">
                                            <div className="upcoming-info">
                                                <strong>{emp.username}</strong>
                                                <span>{emp.email}</span>
                                            </div>
                                            <button className="send-email-btn" onClick={() => openTemplateModal(emp.id)} disabled={sendingEmailId === emp.id}>
                                                {sendingEmailId === emp.id ? 'PROCESSING...' : 'CHOOSE & SEND'}
                                            </button>
                                        </div>
                                    ))
                                ) : <p className="notification-section-no-data">No records for this month.</p>}
                            </div>
                        </div>

                        <div className="notification-section" style={{ backgroundColor: "#f0f6ff" }}>
                            <h4 className="section-subtitle">{new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1).toLocaleString('default', { month: 'long' }).toUpperCase()} INCREMENTS</h4>
                            <div className="upcoming-list">
                                {nextMonthIncrements.length > 0 ? (
                                    nextMonthIncrements.map((emp) => (
                                        <div key={emp.id} className="upcoming-card">
                                            <div className="upcoming-info">
                                                <strong>{emp.username}</strong>
                                                <span>{emp.email}</span>
                                            </div>
                                            <button className="send-email-btn" onClick={() => openTemplateModal(emp.id)} disabled={sendingEmailId === emp.id}>
                                                {sendingEmailId === emp.id ? 'PROCESSING...' : 'CHOOSE & SEND'}
                                            </button>
                                        </div>
                                    ))
                                ) : <p className="notification-section-no-data">No records for next month.</p>}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="increment-modal-backdrop">
                    <div className="increment-modal-content">
                        <h3 className="modal-main-title">Select Increment Form Formats</h3>
                        <p className="modal-subtitle">
                            Select one or multiple formats based on the employee's designation to attach to their file request.
                        </p>

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
                            <button className="modal-btn-cancel" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="modal-btn-confirm" onClick={handleSendEmailAndTemplates}>
                                Confirm & Send Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncrementDateHandling;