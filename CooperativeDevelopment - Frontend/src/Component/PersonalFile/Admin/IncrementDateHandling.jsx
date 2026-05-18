import React, {
    useState,
    useEffect
} from 'react';

import api from '../../API/Axios';

import '../../CSS/IncrementDateHandling.css';

const IncrementDateHandling = () => {
    const [employees, setEmployees] = useState([]);
    const [upcomingEmployees, setUpcomingEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sendingEmailId, setSendingEmailId] = useState(null);
    const [submittedForms, setSubmittedForms] = useState([]);

    const [currentMonthIncrements, setCurrentMonthIncrements] = useState([]);
    const [nextMonthIncrements, setNextMonthIncrements] = useState([]);

    const fetchSubmittedForms = async () => {
        try {
            const response = await api.get('/increment-form/all-submitted');
            setSubmittedForms(response.data);
        } catch (err) {
            console.error("Error fetching submitted forms:", err);
        }
    };

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const response = await api.get('/personalfile/all-employees');
                const allData = response.data;
                setEmployees(allData);

                const now = new Date();

                // 1. ලබන මාසය (Target Month 1 - e.g., June if now is May)
                const targetMonth1Date = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                const t1Month = targetMonth1Date.getMonth();
                const t1Year = targetMonth1Date.getFullYear();

                // 2. ඊට පසු මාසය (Target Month 2 - e.g., July if now is May)
                const targetMonth2Date = new Date(now.getFullYear(), now.getMonth() + 2, 1);
                const t2Month = targetMonth2Date.getMonth();
                const t2Year = targetMonth2Date.getFullYear();

                // ලබන මාසයේ අය පෙරා ගැනීම (Target Month 1)
                const currentFiltered = allData.filter(emp => {
                    if (!emp.incrementDate) return false;
                    const incDate = new Date(emp.incrementDate);
                    const isProcessed = emp.incrementStatus === "EMAIL_SENT" || emp.incrementStatus === "COMPLETED";

                    return (
                        incDate.getMonth() === t1Month &&
                        incDate.getFullYear() === t1Year &&
                        !isProcessed
                    );
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
        fetchSubmittedForms();
    }, []);

    const handleSendEmail = async (id) => {
        setSendingEmailId(id);
        try {
            await api.post(`/personalfile/send-increment-email/${id}`);

            setCurrentMonthIncrements(prev => prev.filter(emp => emp.id !== id));
            setNextMonthIncrements(prev => prev.filter(emp => emp.id !== id));

            alert("✅ Message Sent Successfully!");
        } catch (err) {
            console.error("Error sending email:", err);
            alert(err.response?.data || "❌ The Message Could Not Be Sent.");
        } finally {
            setSendingEmailId(null);
        }
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
                                <th className="increment-Date-Handling-th">Email</th>
                                <th className="increment-Date-Handling-th">In: Date</th>
                            </tr>
                        </thead>
                        <tbody className="increment-Date-Handling-tbody">
                            {employees.map((emp) => (
                                <tr key={emp.id} className="increment-Date-Handling-tr">
                                    <td className="increment-Date-Handling-td">{emp.username}</td>
                                    <td className="increment-Date-Handling-td">{emp.phoneNumber || 'N/A'}</td>
                                    <td className="increment-Date-Handling-td">{emp.email}</td>
                                    <td className="increment-Date-Handling-td">
                                        <span className="increment-Date-Handling-date-text">
                                            {emp.incrementDate ? emp.incrementDate : 'Not recorded'}
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
                                                <span>INCREMENT DATE: {emp.incrementDate}</span>
                                            </div>
                                            <button className="send-email-btn" onClick={() => handleSendEmail(emp.id)} disabled={sendingEmailId === emp.id}>
                                                {sendingEmailId === emp.id ? 'SENDING...' : 'SUBMIT'}
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
                                                <span>INCREMENT DATE: {emp.incrementDate}</span>
                                            </div>
                                            <button className="send-email-btn" onClick={() => handleSendEmail(emp.id)} disabled={sendingEmailId === emp.id}>
                                                {sendingEmailId === emp.id ? 'SENDING...' : 'SUBMIT'}
                                            </button>
                                        </div>
                                    ))
                                ) : <p className="notification-section-no-data">No records for next month.</p>}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncrementDateHandling;