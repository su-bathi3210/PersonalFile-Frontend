import {
    useEffect,
    useState
} from 'react';

import PizZip from 'pizzip';

import Docxtemplater from 'docxtemplater';

import { saveAs } from 'file-saver';

import JSZipUtils from 'jszip-utils';

import api from '../../API/Axios';

import { useNavigate } from 'react-router-dom';

import '../../CSS/IncrementFormsHandling.css';

const IncrementFormsHandling = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [selectedForm, setSelectedForm] = useState(null);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const [nextIncrementDate, setNextIncrementDate] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [currentNotificationUserId, setCurrentNotificationUserId] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/personalfile/increment-notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            setLoading(false);
        }
    };

    const handleAutoCalculateDate = (currentDate) => {
        if (!currentDate) return;
        const date = new Date(currentDate);
        date.setFullYear(date.getFullYear() + 1);

        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');

        setNextIncrementDate(`${yyyy}-${mm}-${dd}`);
    };

    const handleUpdateIncrementDate = async () => {
        if (!currentNotificationUserId) {
            alert("User identity not found.");
            return;
        }
        if (!nextIncrementDate) {
            alert("Please select or calculate a valid date first.");
            return;
        }

        setIsUpdating(true);
        try {
            const token = localStorage.getItem('token');
            await api.put(`/personalfile/update-increment-date/${currentNotificationUserId}`,
                { nextIncrementDate: nextIncrementDate },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            alert("Employee's Next Increment Date updated successfully in profile!");
            setSelectedForm(null);
            fetchNotifications();
        } catch (error) {
            console.error("Error updating increment date:", error);
            alert("Failed to update increment date in employee profile.");
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredNotifications = notifications.filter((note) => {
        const isCompleted = note.status === 'COMPLETED';

        const formYear = note.submittedDate ? note.submittedDate.split('-')[0] : (note.incrementDate ? note.incrementDate.split('-')[0] : '');
        const matchesYear = formYear === selectedYear;

        const searchString = searchTerm.toLowerCase();
        const matchesSearch =
            note.employeeName?.toLowerCase().includes(searchString) ||
            note.email?.toLowerCase().includes(searchString) ||
            note.phoneNumber?.toLowerCase().includes(searchString);

        return isCompleted && matchesYear && matchesSearch;
    });

    const availableYears = [...new Set(notifications.map(note => {
        if (note.incrementDate) {
            return note.incrementDate.split('-')[0];
        }
        return null;
    }).filter(year => year !== null))].sort((a, b) => b - a);

    const groupedByMonth = filteredNotifications.reduce((acc, note) => {
        const date = new Date(note.incrementDate);
        const month = date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
        if (!acc[month]) acc[month] = [];
        acc[month].push(note);
        return acc;
    }, {});

    const monthOrder = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ].reverse();

    const handleViewDetails = async (notificationId, userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/increment-form/all-submitted', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const formDetails = response.data.find(f => f.notificationId === notificationId);
            if (formDetails) {
                setSelectedForm(formDetails);
                setCurrentNotificationUserId(userId);
                setNextIncrementDate("");
            } else {
                alert("The form data related to this notification could not be found.");
            }
        } catch (error) {
            alert("Error fetching form details");
        }
    };

    const handleDirectDownload = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/increment-form/all-submitted', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const formDetails = response.data.find(f => f.notificationId === notificationId);
            if (formDetails) {
                generateWordReport(formDetails);
            } else {
                alert("The form data related to this notification could not be found.");
            }
        } catch (error) {
            alert("Error fetching form details for download");
        }
    };

    const generateWordReport = (formData) => {
        JSZipUtils.getBinaryContent('/GovernmnetReport.docx', (error, content) => {
            if (error) {
                alert("The Word template cannot be found.");
                return;
            }

            try {
                const zip = new PizZip(content);
                const doc = new Docxtemplater(zip, {
                    paragraphLoop: true,
                    linebreaks: true,
                });

                doc.render({
                    officerName: formData.officerName || "...................",
                    grade: formData.grade || "...................",
                    assistantCommissionerDivision: formData.assistantCommissionerDivision || "...................",
                    transferDateToACoffice: formData.transferDateToACoffice || "...................",
                    incrementDate: formData.incrementDate || "...................",
                    currentSalary: formData.currentSalary || "...................",
                    incrementAmount: formData.incrementAmount || "...................",
                    totalWithIncrement: formData.totalWithIncrement || "...................",
                    monthlyConsolidatedSalary: formData.monthlyConsolidatedSalary || "...................",
                    salaryIncrementSuspendedDetails: formData.salaryIncrementSuspendedDetails || "නැත",
                    sickLeaveCount: formData.sickLeaveCount || "0",
                    passedSecondLanguageTest: formData.passedSecondLanguageTest || "...................",
                    examDetails: (formData.passedFirstInspectorExam || "") + " " + (formData.examPassedDateAndYear || ""),
                    efficiencyBarReached: formData.efficiencyBarReached || "...................",
                    disciplinaryActionsDetails: formData.disciplinaryActionsDetails || "නැත",
                    warningsOrPunishmentsDetails: formData.warningsOrPunishmentsDetails || "නැත"
                });

                const out = doc.getZip().generate({
                    type: 'blob',
                    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                });

                saveAs(out, `IncrementForm - ${formData.officerName}.docx`);

            } catch (err) {
                console.error("Docx Generation Error:", err);
                alert("An error occurred while generating the report.");
            }
        });
    };

    return (
        <div className="increment-forms-handling-container fade-in">
            <div className="increment-forms-handling-left-side">
                <h2 className="increment-forms-handling-title">Annual salary increment form management</h2>

                <p className="increment-forms-handling-description">
                    This is where you can review and approve annual salary increment applications submitted by departmental
                    officers and prepare relevant reports (Word Reports). After verifying that all data is correct, forward
                    for further action.
                </p>

                <div className="increment-forms-handling-table-wrapper">
                    <table className="increment-forms-handling-table">
                        <thead>
                            <tr className="increment-forms-handling-table-header-row">
                                <th className="increment-forms-handling-th">Name</th>
                                <th className="increment-forms-handling-th">Email</th>
                                <th className="increment-forms-handling-th">Phone</th>
                                <th className="increment-forms-handling-th">Inc: Date</th>
                                <th className="increment-forms-handling-th">Status</th>
                                <th className="increment-forms-handling-th">Sub: Date</th>
                                <th className="increment-forms-handling-th">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {notifications.map((note) => (
                                <tr key={note.notificationId} className="increment-forms-handling-table-body-row">
                                    <td className="increment-forms-handling-td">{note.employeeName}</td>
                                    <td className="increment-forms-handling-td">{note.email}</td>
                                    <td className="increment-forms-handling-td">{note.phoneNumber}</td>
                                    <td className="increment-forms-handling-td">{note.incrementDate}</td>
                                    <td className="increment-forms-handling-td">
                                        <span className={`increment-forms-handling-status-badge ${note.status === 'COMPLETED' ? 'increment-forms-handling-status-completed' : 'increment-forms-handling-status-pending'}`}>
                                            {note.status === 'COMPLETED' ? 'Complete' : 'Waiting'}
                                        </span>
                                    </td>
                                    <td className="increment-forms-handling-td">
                                        {note.submittedDate ?
                                            new Date(note.submittedDate).toLocaleDateString('en-GB', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })
                                            : '---'}
                                    </td>
                                    <td className="increment-forms-handling-td">
                                        {note.status === 'COMPLETED' && (
                                            <button onClick={() => handleViewDetails(note.notificationId, note.userId)}
                                                className="increment-forms-handling-view-btn"> View </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedForm && (
                <div className="increment-forms-handling-modal-overlay">
                    <div className="increment-forms-handling-modal-content">
                        <button onClick={() => setSelectedForm(null)} className="increment-forms-handling-modal-close-x">&times;</button>

                        <h2 className="increment-forms-view-title">සමුපකාර සංවර්ධන දෙපාර්තමේන්තුව - වාර්ෂික වැටුප් වර්ධක පත්‍රය</h2>

                        <div className="head-office-display-group">
                            <span className="head-office-label">ප්‍රධාන කාර්යාලීය ලිපි ගොනු අංකය:</span>
                            <span className="head-office-value">
                                {selectedForm.headOfficeFileNumber || "........................"}
                            </span>
                        </div>

                        <div className="increment-forms-handling-modal-grid">
                            <div className="increment-forms-handling-detail-row">
                                <span className="increment-forms-label">01. නිලධාරියාගේ / නිලධාරිනියගේ නම:</span>
                                <span className="increment-forms-value">{selectedForm.officerName}</span>
                            </div>

                            <div className="increment-forms-handling-detail-row">
                                <span className="increment-forms-label">02. ශ්‍රේණිය:</span>
                                <span className="increment-forms-value">{selectedForm.grade}</span>
                            </div>

                            <div className="increment-forms-handling-detail-row">
                                <span className="increment-forms-label">03. සහකාර කොමසාරිස් කොට්ඨාශය:</span>
                                <span className="increment-forms-value">{selectedForm.assistantCommissionerDivision}</span>
                            </div>

                            <div className="increment-forms-handling-detail-row">
                                <span className="increment-forms-label">04. සහකාර කොමසාරිස් කාර්යාලයට මාරු වූ දිනය:</span>
                                <span className="increment-forms-value">{selectedForm.transferDateToACoffice}</span>
                            </div>

                            <div className="increment-forms-handling-detail-row">
                                <span className="increment-forms-label">05. වැටුප් වර්ධක දිනය:</span>
                                <span className="increment-forms-value">{selectedForm.incrementDate}</span>
                            </div>

                            <div className="increment-forms-handling-detail-row">
                                <span className="increment-forms-label">06. වර්තමාන වැටුප:</span>
                                <span className="increment-forms-value">{selectedForm.currentSalary}</span>
                            </div>

                            <div className="increment-forms-handling-detail-row">
                                <span className="increment-forms-label">07. ලැබිය යුතු වර්ධකය:</span>
                                <span className="increment-forms-value">{selectedForm.incrementAmount}</span>
                            </div>

                            <div className="increment-forms-handling-detail-row">
                                <span className="increment-forms-label">08. වර්තමාන වැටුපෙහි වර්ධකයේ එකතුව:</span>
                                <span className="increment-forms-value">{selectedForm.totalWithIncrement}</span>
                            </div>

                            <div className="increment-forms-handling-detail-row">
                                <span className="increment-forms-label">09. මාසික එකාබද්ධ වැටුප:</span>
                                <span className="increment-forms-value">{selectedForm.monthlyConsolidatedSalary}</span>
                            </div>

                            <div className="increment-forms-handling-detail-row">
                                <span className="increment-forms-label">10. වැටුප් වර්ධක වර්ෂය තුළ අසනීප සඳහා ගත් නිවාඩු:</span>
                                <span className="increment-forms-value">{selectedForm.sickLeaveCount}</span>
                            </div>

                            <div className="increment-forms-handling-detail-row full-width">
                                <span className="increment-forms-label">11. පසුගිය වර්ෂයෙන් පසු වැටුප් වර්ධකය අත්හිටුවා, නතර කර, අඩු කර හෝ විලම්බනය කර තිබේද? එසේ නම් ඒ පිළිබඳ විස්තර:</span>
                                <div className="view-detail-box">{selectedForm.salaryIncrementSuspendedDetails || "විස්තර නොමැත"}</div>
                            </div>

                            <div className="increment-forms-handling-detail-row full-width">
                                <span className="increment-forms-label">12. පත්වීම ස්ථිර කිරීමට තිබේ නම්:</span>
                                <div className="sub-detail-row">
                                    <span>(අ) නිලධාරියා නියමිත දෙවන භාෂා පරීක්ෂණයෙන් සමත් වී තිබේද?: <strong>{selectedForm.passedSecondLanguageTest}</strong></span>
                                    <p className="detail-small-text">{selectedForm.secondLanguageTestDetails}</p>
                                </div>
                                <div className="sub-detail-row">
                                    <span>(ආ) නිලධාරියා පරික්ෂකවරුන්ගේ පළමු පරීක්ෂණයෙන් සමත් වී තිබේද?: <strong>{selectedForm.passedFirstInspectorExam}</strong></span>
                                    <p className="detail-small-text">සමත් නම් වර්ෂය හා දිනය සඳහන් කරන්න: {selectedForm.examPassedDateAndYear || "-"}</p>
                                </div>
                            </div>

                            <div className="increment-forms-handling-detail-row">
                                <span className="increment-forms-label">13. කාර්යක්ෂමතා කඩඉමට පැමිණ තිබේද?:</span>
                                <span className="increment-forms-value">{selectedForm.efficiencyBarReached}</span>
                            </div>

                            <div className="increment-forms-handling-detail-row full-width">
                                <span className="increment-forms-label">14. ඔහුට / ඇයට විරුද්ධව විනයානුකූල ක්‍රියාමාර්ග ගැනීමට තිබේද? එසේ නම් ඒ පිළිබඳ විස්තර:</span>
                                <div className="view-detail-box">{selectedForm.disciplinaryActionsDetails || "විස්තර නොමැත"}</div>
                            </div>

                            <div className="increment-forms-handling-detail-row full-width">
                                <span className="increment-forms-label">15. වැටුප් වර්ධක වර්ෂය තුළ ඔහුට / ඇයට අවවාද කර තිබේද? වෙනත් ආකාරයේ දඬුවම් කර තිබේද? එසේ නම් ඒ පිළිබඳ විස්තර:</span>
                                <div className="view-detail-box">{selectedForm.warningsOrPunishmentsDetails || "විස්තර නොමැත"}</div>
                            </div>
                        </div>


                        <div className="increment-date-update-section">
                            <h3>Update Next Increment Date for Employee Profile</h3>

                            <div>
                                <input type="date" value={nextIncrementDate} onChange={(e) => setNextIncrementDate(e.target.value)} />
                                <button type="button" onClick={() => handleAutoCalculateDate(selectedForm.incrementDate)}>🔄 Auto +1 Year</button>

                                <button type="button" onClick={handleUpdateIncrementDate} disabled={isUpdating}>
                                    {isUpdating ? "Updating Profile..." : "Confirm & Update Profile"}
                                </button>
                            </div>
                            <small>බටන් එක click කළ විට අදාළ නිලධාරියාගේ profile එකෙහි ඊළඟ වැටුප් වර්ධක දිනය පමණක් යාවත්කාලීන වේ.</small>
                        </div>


                        <div className="increment-forms-handling-modal-footer">
                            <button onClick={() => generateWordReport(selectedForm)} className="increment-forms-handling-generate-btn">
                                Generate Word Report
                            </button>
                            <button onClick={() => setSelectedForm(null)} className="increment-forms-handling-close-btn">
                                CLOSE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="increment-forms-handling-right-side">

                <div className="filter-controls-wrapper">
                    <input
                        type="text"
                        placeholder="Search by name, email, or any detail..."
                        className="search-bar-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select className="year-filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        {availableYears.length === 0 && (
                            <option value={new Date().getFullYear().toString()}> {new Date().getFullYear()}</option>)}

                        {availableYears.map(year => (<option key={year} value={year}>{year}</option>))} </select>
                </div>

                <div className="months-container">
                    {monthOrder.map(month => {
                        if (!groupedByMonth[month]) return null;

                        return (
                            <div key={month} className="month-section">
                                <div className="month-header-flex">
                                    <h3 className="month-title">{month}</h3>
                                </div>
                                <table className="mini-increment-table">
                                    <thead>
                                        <tr>
                                            <th>EMAIL</th>
                                            <th>IN:DATE</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedByMonth[month].map(note => (
                                            <tr key={note.notificationId}>
                                                <td>{note.email}</td>
                                                <td>{note.incrementDate}</td>
                                                <td>
                                                    <button
                                                        onClick={() => handleDirectDownload(note.notificationId)}
                                                        className="mini-table-download-btn"
                                                        style={{
                                                            background: 'none', color: 'white',
                                                            border: 'none', cursor: 'pointer', fontSize: '10px'
                                                        }}>📩</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}

                    {filteredNotifications.length === 0 && (
                        <p className="increment-no-data-msg">No completed records found for the selected criteria.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IncrementFormsHandling;