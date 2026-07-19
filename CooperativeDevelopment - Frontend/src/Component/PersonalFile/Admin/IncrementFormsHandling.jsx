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

    const [designations, setDesignations] = useState([]);
    const [configLoading, setConfigLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDesignation, setSelectedDesignation] = useState('');
    const [selectedTemplates, setSelectedTemplates] = useState([]);
    const [saving, setSaving] = useState(false);

    const [activeRightDesignation, setActiveRightDesignation] = useState('');
    const [mappedTemplates, setMappedTemplates] = useState([]);

    const availableTemplates = [
        { id: "t1", name: "පොදු 232 ආකෘතිය.docx", displayName: "පොදු 232 ආකෘතිය" },
        { id: "t2", name: "වාර්ෂික වැටුප් වර්ධක පත්‍රය - සමුපකාර සංවර්ධන නිලධාරී සේවය.docx", displayName: "වාර්ෂික වැටුප් වර්ධක පත්‍රය - සමුපකාර සංවර්ධන නිලධාරී සේවය" },
        { id: "t3", name: "කාර්ය සාධක පරීක්ෂණ වාර්තා - ප්‍රධාන කළමනාකරණ සේවා නිලධාරි.docx", displayName: "කාර්ය සාධක පරීක්ෂණ වාර්තා - ප්‍රධාන කළමනාකරණ සේවා නිලධාරි" },
        { id: "t4", name: "කාර්ය සාධන ඇගයීම් වාර්තා - කණිෂ්ඨ සේවය.docx", displayName: "කාර්ය සාධන ඇගයීම් වාර්තා - කණිෂ්ඨ සේවය" },
        { id: "t5", name: "කාර්ය සාධන ඇගයීම් වාර්තා - සංවර්ධන නිලධාරි.docx", displayName: "කාර්ය සාධන ඇගයීම් වාර්තා - සංවර්ධන නිලධාරි" },
        { id: "t6", name: "කාර්යසාධන ඇගයිම කළමනාකරණ - සහකාර සේවයේ නිලධාරින්.docx", displayName: "කාර්යසාධන ඇගයිම කළමනාකරණ - සහකාර සේවයේ නිලධාරින්" }
    ];

    useEffect(() => {
        fetchAdminNotifications();
        fetchUniqueDesignations();
    }, []);

    useEffect(() => {
        if (activeRightDesignation) {
            fetchTemplatesForDesignation(activeRightDesignation);
        } else {
            setMappedTemplates([]);
        }
    }, [activeRightDesignation]);


    const fetchUniqueDesignations = async () => {
        try {
            setConfigLoading(true);
            const response = await api.get('/personalfile/all-employees');
            const allDesignations = response.data
                .map(emp => emp.designation)
                .filter(des => des && des.trim() !== '')
                .filter((value, index, self) => self.indexOf(value) === index);
            setDesignations(allDesignations);

            if (allDesignations.length > 0) {
                setActiveRightDesignation(allDesignations[0]);
            }
        } catch (err) {
            console.error("❌ Error fetching designations:", err);
        } finally {
            setConfigLoading(false);
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

    const fetchTemplatesForDesignation = async (desigName) => {
        try {
            const response = await api.get(`/designation-templates/${encodeURIComponent(desigName)}`);
            setMappedTemplates(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching designation templates:", error);
            setMappedTemplates([]);
        }
    };

    const handleSaveMapping = async () => {
        if (selectedTemplates.length === 0) {
            alert("⚠️ Please select at least one template!");
            return;
        }
        setSaving(true);
        try {
            await api.post('/designation-templates', {
                designation: selectedDesignation,
                templateNames: selectedTemplates
            });
            alert(`✅ ${selectedDesignation} Templates for the post have been saved!`);
            setIsModalOpen(false);

            setActiveRightDesignation(selectedDesignation);
            fetchTemplatesForDesignation(selectedDesignation);
        } catch (err) {
            console.error("❌ Error saving mapping:", err);
            alert("❌ The data could not be saved.");
        } finally {
            setSaving(false);
        }
    };

    const openMappingModal = async (designationName) => {
        setSelectedDesignation(designationName);
        try {
            const response = await api.get(`/designation-templates/${encodeURIComponent(designationName)}`);
            setSelectedTemplates(Array.isArray(response.data) ? response.data : []);
        } catch (e) {
            setSelectedTemplates([]);
        }
        setIsModalOpen(true);
    };

    const handleTemplateCheckboxChange = (templateName) => {
        if (selectedTemplates.includes(templateName)) {
            setSelectedTemplates(prev => prev.filter(name => name !== templateName));
        } else {
            setSelectedTemplates(prev => [...prev, templateName]);
        }
    };

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
        return months[new Date(dateString).getMonth()];
    };

    const dynamicYearsList = Array.from(
        new Set(incrementNotifications.map(notif => getYearFromDate(notif.incrementDate)).filter(Boolean))
    ).sort((a, b) => b - a);

    const monthOrder = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const dynamicMonthsList = Array.from(
        new Set(incrementNotifications.map(notif => getMonthNameFromDate(notif.incrementDate)).filter(Boolean))
    ).sort((a, b) => monthOrder.indexOf(a.toLowerCase()) - monthOrder.indexOf(b.toLowerCase()));

    const monthTranslations = {
        January: "ජනවාරි", February: "පෙබරවාරි", March: "මාර්තු", April: "අප්‍රේල්",
        May: "මැයි", June: "ජූනි", July: "ජූලි", August: "අගෝස්තු",
        September: "සැප්තැම්බර්", October: "ඔක්තෝබර්", November: "නොවැම්බර්", December: "දෙසැම්බර්"
    };

    const filteredNotifications = incrementNotifications.filter((notif) => {
        const matchesSearch = notif.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) || notif.email?.toLowerCase().includes(searchTerm.toLowerCase());
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
                This central management dashboard allows you to oversee and process salary increment requests submitted by the department employees. Here, you can efficiently filter records by year or month, download submitted verification documents, and approve pending applications.
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

                <div className="designation-template-config-row">
                    <div className="config-left-side">
                        <h4>System Designations & Process</h4>
                        <p>List of positions available in the system. Press the Setup button to connect or change the template.</p>

                        {configLoading ? (
                            <div></div>
                        ) : (
                            <div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Designation Title</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {designations.length > 0 ? (
                                            designations.map((desig, idx) => (
                                                <tr key={idx}
                                                    style={{ borderBottom: '1px solid #edf2f7', cursor: 'pointer', backgroundColor: activeRightDesignation === desig ? '#ebf8ff' : 'transparent' }}
                                                    onClick={() => setActiveRightDesignation(desig)}
                                                >
                                                    <td>{desig}</td>
                                                    <td>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openMappingModal(desig); }}
                                                        >
                                                            Setup
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="2">No Designations Found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="config-right-side">
                        <h4>Current Mapped Templates</h4>

                        {activeRightDesignation ? (
                            <div>
                                <div>
                                    <span>Selected Designation: <strong>{activeRightDesignation}</strong></span>
                                </div>

                                {mappedTemplates.length > 0 ? (
                                    <ul>
                                        {mappedTemplates.map((template, idx) => (
                                            <li key={idx}>
                                                📄 {template}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>⚠️ No templates assigned yet for this designation.</p>
                                )}
                            </div>
                        ) : (
                            <p>Select a designation from the left table to view its templates.</p>
                        )}
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
                                <th>In: Date</th>
                                <th>Prev:Sick</th>
                                <th>Curr:Sick</th>
                                <th>Send Date</th>
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
                                        <td>{notif.incrementDate}</td>
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
                                            <span className="date-increment">
                                                {notif.sentDate ? new Date(notif.sentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`increment-forms-handling-badge ${notif.status === 'SUBMITTED' ? 'increment-forms-handling-badge-submitted' : notif.status === 'APPROVED' ? 'increment-forms-handling-badge-approved' : 'increment-forms-handling-badge-pending'}`}>
                                                {notif.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="date-increment">
                                                {notif.submittedDate ? new Date(notif.submittedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                            </span>
                                        </td>
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
                                            {notif.status === "SUBMITTED" && (
                                                <button onClick={() => handleApproveIncrement(notif.notificationId)}
                                                    className="btn-approve-increment">Update Next Year</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="inc-custom-modal-backdrop">
                    <div className="increment-custom-modal-card">
                        <div className="increment-modal-top-bar">
                            <h3>Setup Templates for Designation</h3>
                            <button onClick={() => setIsModalOpen(false)}>×</button>
                        </div>

                        <div className="inc-custom-modal-backdrop-modal-body">
                            <div>
                                Target Designation: <span>{selectedDesignation}</span>
                            </div>

                            <p>කරුණාකර මෙම තනතුරට අදාළ වන පරිදි වැටුප් වර්ධක ආකෘති පත්‍ර තෝරන්න.</p>

                            <div className="inc-custom-modal-backdrop-modal-checkbox-list">
                                {availableTemplates.map((template) => (
                                    <label key={template.id}>
                                        <input
                                            type="checkbox"
                                            checked={selectedTemplates.includes(template.name)}
                                            onChange={() => handleTemplateCheckboxChange(template.name)}
                                        />
                                        <div>
                                            <span>{template.displayName}</span>
                                            <span>({template.name})</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="inc-custom-modal-backdrop-modal-footer-bar">
                            <button onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</button>
                            <button onClick={handleSaveMapping} disabled={saving}>
                                {saving ? 'Saving Changes...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncrementFormsHandling;