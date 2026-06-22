import {
    useEffect,
    useState
} from 'react';

import api from '../../API/Axios';

import '../../CSS/IncrementFormsHandling.css';

const IncrementFormsHandling = () => {
    const [incrementNotifications, setIncrementNotifications] = useState([]);
    const [message, setMessage] = useState({ text: '', type: '' });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');

    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        fetchAdminNotifications();
    }, []);

    const handleGeneratePodu232 = async (notificationId, employeeName) => {
        try {
            const response = await api.get(`/personalfile/increment-notifications/${notificationId}/generate-podu232`);
            const fileUrl = response.data.fileUrl;

            if (fileUrl) {
                await handleDownloadFile(fileUrl, employeeName);
                alert("✅ The Gen 232 form was successfully prepared and downloaded!");
            }
        } catch (error) {
            console.error("❌ Error generating Podu 232 form:", error);
            alert("❌ Gen 232 format preparation failed: " + (error.response?.data?.message || error.message));
        }
    };

    const fetchAdminNotifications = async () => {
        try {
            const response = await api.get('/personalfile/increment-notifications');
            setIncrementNotifications(response.data);
        } catch (error) {
            showAlert('❌ Failed to retrieve data.', 'error');
        }
    };

    const handleApproveIncrement = async (notificationId) => {
        if (!window.confirm("⚠️ Are you sure you want to approve this salary increment form and update the date for next year?")) {
            return;
        }

        try {
            await api.put(`/personalfile/increment-notifications/${notificationId}/approve`, {});
            alert("✅ Successfully approved! Date updated for next year.");
            fetchAdminNotifications();
        } catch (error) {
            alert("❌ Failed to approve: " + (error.response?.data?.message || error.message));
        }
    };

    const handleCancelIncrement = async (notificationId) => {
        if (!window.confirm("⚠️ Are you sure you want to cancel and delete this increment notification? This action cannot be undone.")) {
            return;
        }

        try {
            await api.delete(`/personalfile/increment-notifications/${notificationId}/cancel`);
            alert("✅ Increment request successfully cancelled and deleted!");
            fetchAdminNotifications();
        } catch (error) {
            console.error("❌ Error cancelling increment:", error);
            alert("❌ Failed to cancel: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDownloadFile = async (fileUrl, employeeName) => {
        try {
            const fileParts = fileUrl.split('/');
            const fileNameWithTimestamp = fileParts[fileParts.length - 1];

            const firstUnderscoreIndex = fileNameWithTimestamp.indexOf('_');
            let originalFileName = fileNameWithTimestamp;
            if (firstUnderscoreIndex !== -1) {
                originalFileName = fileNameWithTimestamp.substring(firstUnderscoreIndex + 1);
            }

            const cleanedEmployeeName = employeeName ? employeeName.trim().replace(/\s+/g, '_') : 'Employee';
            const finalDownloadName = `${cleanedEmployeeName}_${originalFileName}`;

            const response = await api.get(fileUrl, { responseType: 'blob' });

            const blob = new Blob([response.data], { type: response.headers['content-type'] });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', finalDownloadName);

            document.body.appendChild(link);
            link.click();

            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("❌ Download error:", error);
            showAlert('❌ Document download failed.', 'error');
        }
    };

    const showAlert = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    const getYearFromDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString).getFullYear().toString();
    };

    const getMonthNameFromDate = (dateString) => {
        if (!dateString) return null;
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthIndex = new Date(dateString).getMonth();
        return months[monthIndex];
    };

    const dynamicYearsList = Array.from(
        new Set(
            incrementNotifications
                .map(notif => getYearFromDate(notif.incrementDate))
                .filter(Boolean)
        )
    ).sort((a, b) => b - a);

    const monthOrder = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const dynamicMonthsList = Array.from(
        new Set(
            incrementNotifications
                .map(notif => getMonthNameFromDate(notif.incrementDate))
                .filter(Boolean)
        )
    ).sort((a, b) => monthOrder.indexOf(a.toLowerCase()) - monthOrder.indexOf(b.toLowerCase()));

    const monthTranslations = {
        January: "ජනවාරි", February: "පෙබරවාරි", March: "මාර්තු", April: "අප්‍රේල්",
        May: "මැයි", June: "ජූනි", July: "ජූලි", August: "අගෝස්තු",
        September: "සැප්තැම්බර්", October: "ඔක්තෝබර්", November: "නොවැම්බර්", December: "දෙසැම්බර්"
    };

    const filteredNotifications = incrementNotifications.filter((notif) => {
        const matchesSearch =
            notif.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notif.email?.toLowerCase().includes(searchTerm.toLowerCase());

        const notifYear = getYearFromDate(notif.incrementDate);
        const notifMonth = getMonthNameFromDate(notif.incrementDate);

        const matchesYear = selectedYear === '' || notifYear === selectedYear;
        const matchesMonth = selectedMonth === '' || notifMonth?.toLowerCase() === selectedMonth.toLowerCase();

        return matchesSearch && matchesYear && matchesMonth;
    });

    return (
        <div className="increment-forms-handling-container fade-in">
            <h2 className="increment-forms-handling-title">Salary Increment Form Management Center</h2>
            <p className="increment-forms-handling-description">
                This central management dashboard allows you to oversee and process salary increment requests submitted by the department employees. Here, you can efficiently filter records by year or month, download submitted verification documents, and approve pending applications, which will automatically update the employee's next increment date for the upcoming year.
            </p>

            {message.text && (
                <div className={`increment-forms-handling-alert increment-forms-handling-alert-${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="increment-forms-handling-section">

                <div className="filter-bar-container">
                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="search-records-input"
                            placeholder="SEARCH RECORDS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="search-icon">🔍</span>
                    </div>

                    <div className="dropdown-wrapper">
                        <select
                            className="custom-filter-dropdown"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        >
                            <option value="">ALL YEARS</option>
                            {dynamicYearsList.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    <div className="dropdown-wrapper">
                        <select
                            className="custom-filter-dropdown"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        >
                            <option value="">ALL MONTHS</option>
                            {dynamicMonthsList.map(m => (
                                <option key={m} value={m}>
                                    {m.toUpperCase()} ({monthTranslations[m] || m})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="clear-btn-wrapper">
                        <button className="increment-clear-filters-btn"
                            onClick={() => { setSearchTerm(''); setSelectedYear(''); setSelectedMonth(''); }}>
                            Clear Filters
                        </button>
                    </div>
                </div>

                <div className="table-header-flex">
                    <h3 className="increment-forms-handling-section-title">List of forms submitted by employees</h3>
                </div>

                <div className="increment-forms-handling-table-wrapper">
                    <table className="increment-handling-table">
                        <thead>
                            <tr>
                                <th>Employee Name</th>
                                <th>Email</th>
                                <th>Send Date</th>
                                <th>Prev. Year Sick Used</th>
                                <th>Curr. Year Sick Used</th>
                                <th>Status</th>
                                <th>Submitted</th>
                                <th>Download</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredNotifications.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="no-data-td">No data was found matching the search criteria.</td>
                                </tr>
                            ) : (
                                filteredNotifications.map((notif) => (
                                    <tr key={notif.notificationId}>
                                        <td>{notif.employeeName}</td>
                                        <td>{notif.email}</td>
                                        <td><span className="date-increment">{notif.sentDate
                                            ? new Date(notif.sentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                            : '-'}</span>
                                        </td>
                                        <td>
                                            <span className="sick-leave-count-badge old-year">
                                                {Number(notif.oldYearSickUsed ?? 0)} Days
                                            </span>
                                        </td>
                                        <td>
                                            <span className="sick-leave-count-badge current-year">
                                                {Number(notif.currentYearSickUsed ?? 0)} Days
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`increment-forms-handling-badge ${notif.status === 'SUBMITTED'
                                                ? 'increment-forms-handling-badge-submitted'
                                                : notif.status === 'APPROVED'
                                                    ? 'increment-forms-handling-badge-approved'
                                                    : 'increment-forms-handling-badge-pending'
                                                }`}>
                                                {notif.status}
                                            </span>
                                        </td>
                                        <td><span className="date-increment">{notif.submittedDate
                                            ? new Date(notif.submittedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                            : '-'}</span></td>
                                        <td>
                                            {notif.submittedFileUrls && notif.submittedFileUrls.length > 0 ? (
                                                <ul className="increment-forms-handling-file-list">
                                                    {notif.submittedFileUrls.map((url, index) => (
                                                        <li key={index}>
                                                            <button onClick={() => handleDownloadFile(url, notif.employeeName)}
                                                                className="increment-forms-handling-file-link">Document {index + 1} Download
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="no-file-text">No Documents</span>
                                            )}
                                        </td>
                                        <td>
                                            {(notif.status === "SUBMITTED" || notif.status === "APPROVED") && (
                                                <button
                                                    onClick={() => handleGeneratePodu232(notif.notificationId, notif.employeeName)} className="btn-gen"
                                                    style={{ backgroundColor: isHovered ? '#000' : '#17a2b8', cursor: 'pointer', marginBottom: '5px', width: '80%' }}
                                                    onMouseEnter={() => setIsHovered(true)}
                                                    onMouseLeave={() => setIsHovered(false)}>Gen 232</button>
                                            )}

                                            {notif.status === "SUBMITTED" ? (
                                                <button onClick={() => handleApproveIncrement(notif.notificationId)}
                                                    className="btn-approve-increment" style={{ width: '80%' }}>Update Next Year</button>

                                            ) : notif.status === "APPROVED" ? (
                                                <span style={{ color: '#28a745', fontWeight: 'bold', display: 'block', textAlign: 'center', marginTop: '0px' }}></span>
                                            ) : (
                                                <span style={{ color: '#000' }}>{notif.status}</span>
                                            )}

                                            {notif.status !== "SUBMITTED" && notif.status !== "APPROVED" && (
                                                <button onClick={() => handleCancelIncrement(notif.notificationId)}
                                                    className="btn-cancel-increment"
                                                    style={{ width: '80%', marginTop: '6px', background: '#c1121f'}}>Cancel Request</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IncrementFormsHandling;