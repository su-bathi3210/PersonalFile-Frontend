import {
    useEffect,
    useState
} from 'react';

import API from '../../API/Axios';

import '../../CSS/EmployeePersonalFile.css';

import {
    Cake,
    Download,
    Eye,
    EyeOff,
    Lock,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Transgender,
    User as UserIcon,
    UserRoundCog
} from 'lucide-react';

import { LuTrash2 } from "react-icons/lu";

const EmployeePersonalFile = () => {
    const [formData, setFormData] = useState({
        name: "", email: "", password: "", username: "",
        phoneNumber: "", designation: "", nic: "", address: "", dutyPlace: "",
        grade: "", salaryScale: "", department: "", gender: "",
        dateOfBirth: "", dateOfFirstAppointment: "", appointmentDateToPresentStatus: "",
        incrementDate: "", dateOfReceiptGradeI: "", dateOfReceiptGradeII: "",
        dateOfReceiptGradeIII: "", dateOfCompulsoryRetirement: "", dateOfReceiptOfRelevantGrade: "",
        presentStatusDate: "", wnopNumber: "",
        profileImage: null, serviceNumber: "", dateOfLanguageProficiency: "",
        dynamicFields: {}
    });

    const [dynamicFieldConfigs, setDynamicFieldConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const [notifications, setNotifications] = useState([]);
    const [isIncrementModalOpen, setIsIncrementModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const [incrementNotifications, setIncrementNotifications] = useState([]);

    const userEmail = localStorage.getItem('employeeEmail');

    const BACKEND_BASE_URL = "https://personalfile-backend.onrender.com";

    useEffect(() => {
        const initComponent = async () => {
            setLoading(true);
            await fetchDynamicFieldConfigs();
            await fetchUserData();
            setLoading(false);
        };
        initComponent();
    }, [userEmail]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await API.get(`/personalfile/notifications/${formData.id}`);
                setNotifications(response.data.filter(n => !n.read && n.status === "PENDING"));
            } catch (err) {
                console.error("Error fetching notifications", err);
            }
        };
        if (formData.id) fetchNotifications();
    }, [formData.id]);

    const fetchDynamicFieldConfigs = async () => {
        try {
            const res = await API.get('/dynamic-fields/all');
            setDynamicFieldConfigs(res.data);
        } catch (err) {
            console.error("Error fetching dynamic field configurations:", err);
        }
    };

    const fetchUserData = async () => {
        if (!userEmail) return;
        try {
            const response = await API.get(`/personalfile/me?email=${userEmail}`);
            if (response.data) {
                const data = response.data;
                if (!data.dynamicFields) {
                    data.dynamicFields = {};
                }
                setFormData(data);
            }
            setSelectedImage(response.data.profileImage);

            if (response.data.profileImage) {
                localStorage.setItem('userImage', response.data.profileImage);
            }
        } catch (err) {
            console.error("Error fetching data", err);
        }
    };

    const openIncrementModal = (notification) => {
        setSelectedNotification(notification);
        setSelectedFiles([]);
        setIsIncrementModalOpen(true);
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files));
        }
    };

    const handleFormUploadSubmit = async (e) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            alert("⚠️ Please select at least one completed document to upload!");
            return;
        }

        setIsUploading(true);

        const uploadData = new FormData();
        uploadData.append("notificationId", selectedNotification.id);

        selectedFiles.forEach((file) => {
            uploadData.append("files", file);
        });

        try {
            await API.post("/personalfile/upload-submitted-forms", uploadData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

            alert("✅ Completed Increment Forms Uploaded Successfully!");
            setIsIncrementModalOpen(false);

            setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
        } catch (err) {
            console.error("Error uploading forms:", err);
            alert(err.response?.data || "❌ Failed to upload increment forms.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setSelectedImage(base64String);
                setFormData({ ...formData, profileImage: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeletePhoto = () => {
        setSelectedImage(null);
        setFormData({ ...formData, profileImage: "" });
        localStorage.removeItem('userImage');
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDynamicFieldChange = (e) => {
        setFormData({
            ...formData,
            dynamicFields: { ...formData.dynamicFields, [e.target.name]: e.target.value }
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await API.put(`/personalfile/update-profile?id=${formData.id}`, formData);
            alert("✅ Personal details updated successfully!");
            setIsEditing(false);
            fetchUserData();
        } catch (err) {
            alert("❌ Failed to update details.");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("❌ New passwords do not match!");
            return;
        }
        setIsSaving(true);
        try {
            await API.post('/api/auth/change-password', passwordData);
            alert("✅ Password changed successfully!");
            setIsChangingPassword(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            alert("❌ Failed to change password.");
        } finally {
            setIsSaving(false);
        }
    };

    const DataItem = ({ label, value, icon: Icon }) => (
        <div className="info-item-box">
            {Icon && <Icon size={16} className="item-icon" />}
            <div className="item-content">
                <span className="item-label">{label}</span>
                <span className="item-value">{value || "—"}</span>
            </div>
        </div>
    );

    return (
        <div className="personalFile-container fade-in">
            <div className="personalFile-glass-layout">
                <main className="personalFile-main">
                    <header className="personalFile-header">
                        <h1>Employee Personal File</h1>
                        <p>View and manage your complete service history, track appointment and increment dates,
                            securely change your account password, and update your personal details such as contact information
                            and address. This section allows you to keep your employment records accurate, up to date, and
                            easily accessible at all times.</p>
                    </header>

                    {notifications.length > 0 && (
                        <div className="notification-alert-banner">
                            {notifications.map(n => (
                                <div key={n.id} className="alert-item" onClick={() => openIncrementModal(n)}>
                                    <Mail size={15} />
                                    <span>{n.message}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {isIncrementModalOpen && selectedNotification && (
                        <div className="increment-modal-overlay">
                            <div className="increment-modal">
                                <button className="increment-modal-close-btn" onClick={() => setIsIncrementModalOpen(false)}>&times;</button>

                                <h2>Annual Salary Increment Request</h2>
                                <p>Admin has requested you to fill out the following document format(s). Your common service details have been automatically filled. Please download them, complete the remaining sections, and upload the final files below.</p>

                                <div>
                                    <h4>Step 1: Download Auto-Filled Templates</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                        {selectedNotification && selectedNotification.submittedFileUrls && selectedNotification.submittedFileUrls.length > 0 ? (
                                            selectedNotification.submittedFileUrls.map((fileUrl, index) => {
                                                let originalName = selectedNotification.requestedTemplates;

                                                if (selectedNotification.submittedFileUrls.length > 1) {
                                                    originalName = originalName ? originalName.replace(".docx", ` (Part ${index + 1}).docx`) : `Increment_Form_${index + 1}.docx`;
                                                } else {
                                                    originalName = originalName || `Increment_Form_${index + 1}.docx`;
                                                }

                                                return (
                                                    <a
                                                        key={index}
                                                        href={`${BACKEND_BASE_URL}${fileUrl}`}
                                                        download
                                                        className="template-download-link-btn"
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#e3e3dc'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = '#edede9'}
                                                    >
                                                        <Download size={18} color="#2a9d8f" />
                                                        <span>{originalName}</span>
                                                    </a>
                                                );
                                            })
                                        ) : (
                                            <p style={{ color: '#e63946', fontSize: '12px', fontWeight: '500' }}>⚠️ No auto-filled documents found. Please contact the Admin section.</p>
                                        )}
                                    </div>
                                </div>

                                <form onSubmit={handleFormUploadSubmit} style={{ marginTop: '20px' }}>
                                    <div>
                                        <h4>Step 2: Upload Completed Documents</h4>

                                        <input type="file" multiple accept=".docx,.pdf" onChange={handleFileChange} />

                                        {selectedFiles.length > 0 && (
                                            <div className="personalFile-increment-selected-file">
                                                <span>Selected Files {selectedFiles.length}</span>
                                                <ul> {selectedFiles.map((file, idx) => (
                                                    <li key={idx}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                                                ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <button type="submit" disabled={isUploading} className="personalFile-increment-submit-btn">
                                        {isUploading ? "UPLOADING FILES..." : "SUBMIT COMPLETED FORMS"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="personalFile-grid">
                        <section className="personalFile-card">
                            <div className="personalFile-card-title"><UserRoundCog size={20} /> Service History</div>
                            <div className="personalFile-card-grid">
                                <DataItem label="Service Number" value={formData.serviceNumber} />
                                <DataItem label="WNOP Number" value={formData.wnopNumber} />
                                <DataItem label="Designation" value={formData.designation} />
                                <DataItem label="Department" value={formData.department} />
                                <DataItem label="Duty Place" value={formData.dutyPlace} />
                                <DataItem label="Salary Scale" value={formData.salaryScale} />
                                <DataItem label="Grade" value={formData.grade} />
                                <DataItem label="Date Of First Appointment" value={formData.dateOfFirstAppointment} />
                                <DataItem label="Appointment Date To Present Status" value={formData.appointmentDateToPresentStatus} />
                                <DataItem label="Date Of Language Proficiency" value={formData.dateOfLanguageProficiency} />
                                <DataItem label="Increment Date" value={formData.incrementDate} />
                                <DataItem label="Date Of Compulsory Retirement" value={formData.dateOfCompulsoryRetirement} />
                                <DataItem label="Present Status Date" value={formData.presentStatusDate} />
                                <DataItem label="Grade I" value={formData.dateOfReceiptGradeI} />
                                <DataItem label="Grade II" value={formData.dateOfReceiptGradeII} />
                                <DataItem label="Grade III" value={formData.dateOfReceiptGradeIII} />

                                {dynamicFieldConfigs
                                    .filter(field => (field.isGlobal || field.employeeEmail?.toLowerCase() === userEmail?.toLowerCase()) && field.isAdminOnly === true)
                                    .map((field) => (
                                        <DataItem
                                            key={field.id}
                                            label={field.displayName || field.fieldKey}
                                            value={formData.dynamicFields && formData.dynamicFields[field.fieldKey] !== undefined ? formData.dynamicFields[field.fieldKey] : "—"}
                                        />
                                    ))}
                            </div>
                        </section>
                    </div>
                </main>

                <aside className="personalFile-sidebar">
                    <div className="personalFile-sidebar-header">
                        <div className="personalFile-avatar-wrapper">
                            <div className="personalFile-avatar-circle">
                                {formData.profileImage ? (
                                    <img src={formData.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div className="name-initial">{formData.username?.charAt(0) || <UserIcon />}</div>
                                )}
                            </div>
                            <button className="personalFile-edit-p-btn" onClick={() => setIsEditing(true)}>
                                <Pencil size={9} />
                            </button>
                        </div>
                        <h2 className="personalFile-user-name">{formData.username || "Employee"}</h2>
                        <span className="personalFile-user-badge">{formData.email}</span>
                    </div>

                    <div className="personalFile-sidebar-info-list">
                        <DataItem label="NIC" value={formData.nic} icon={UserIcon} />
                        <DataItem label="Phone" value={formData.phoneNumber} icon={Phone} />
                        <DataItem label="Address" value={formData.address} icon={MapPin} />
                        <DataItem label="Birthday" value={formData.dateOfBirth} icon={Cake} />
                        <DataItem label="Gender" value={formData.gender} icon={Transgender} />

                        {dynamicFieldConfigs
                            .filter(field => (field.isGlobal || field.employeeEmail?.toLowerCase() === userEmail?.toLowerCase()) && (field.isAdminOnly === false || field.isAdminOnly === undefined))
                            .map((field) => (
                                <DataItem
                                    key={field.id}
                                    label={field.displayName || field.fieldKey}
                                    value={formData.dynamicFields && formData.dynamicFields[field.fieldKey] !== undefined ? formData.dynamicFields[field.fieldKey] : "—"}
                                    icon={UserIcon}
                                />
                            ))}

                        <div className="personalFile-security-section">
                            <div className="personalFile-item-label">Account Security</div>
                            <div className="personalFile-password-display-row">
                                <div className="personalFile-pw-dots">••••••••</div>
                                <button className="personalFile-pw-change-link" onClick={() => setIsChangingPassword(true)}>
                                    <Lock size={12} /> Change
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {isEditing && (
                <div className="personalFile-modal-overlay">
                    <div className="personalFile-modal">
                        <div className="personalFile-modal-top"><h3>Update Personal Details</h3></div>
                        <form onSubmit={handleSubmit} className="personalFile-modal-form">
                            <div className="personalFile-modal-image-section">
                                <div className="personalFile-modal-avatar-preview">
                                    {selectedImage ? (
                                        <img src={selectedImage} alt="Preview" className="personalFile-modal-img-circle" />
                                    ) : (
                                        <div className="personalFile-modal-img-placeholder">{formData.username?.charAt(0) || "?"}</div>
                                    )}
                                </div>
                                <div className="image-action-buttons" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                                    <label htmlFor="imageUpload" className="personalFile-image-upload-label">Change Photo</label>
                                    {selectedImage && (
                                        <button type="button" onClick={handleDeletePhoto} className="delete-photo-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <LuTrash2 size={12} color="#ff4d4f" />
                                        </button>
                                    )}
                                </div>
                                <input id="imageUpload" type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
                            </div>

                            <div className="personalFile-form-row">
                                <div className="personalFile-form-group"><label>Full Name</label><input name="username" value={formData.username} onChange={handleChange} required /></div>
                                <div className="personalFile-form-group"><label>Email</label><input name="email" value={formData.email} onChange={handleChange} required /></div>
                                <div className="personalFile-form-group"><label>NIC Number</label><input name="nic" value={formData.nic} onChange={handleChange} required /></div>
                                <div className="personalFile-form-group"><label>Phone Number</label><input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} /></div>
                                <div className="personalFile-form-group">
                                    <label>Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div className="personalFile-form-group"><label>Date Of Birth</label><input name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} /></div>
                            </div>

                            <div className="personalFile-form-group"><label>Home Address</label><textarea name="address" value={formData.address} onChange={handleChange} rows="3" /></div>

                            {dynamicFieldConfigs
                                .filter(field => (field.isGlobal || field.employeeEmail?.toLowerCase() === userEmail?.toLowerCase()) && (field.isAdminOnly === false || field.isAdminOnly === undefined))
                                .map((field) => {
                                    const rawType = field.fieldType || field.fieldtype || "text";
                                    return (
                                        <div className="personalFile-form-group" key={field.id}>
                                            <label>
                                                {field.displayName || field.fieldKey}
                                                {field.required && <span style={{ color: 'red', marginLeft: '4px' }}>*</span>}
                                            </label>
                                            <input
                                                type={rawType.toLowerCase()}
                                                name={field.fieldKey}
                                                value={formData.dynamicFields && formData.dynamicFields[field.fieldKey] !== undefined ? formData.dynamicFields[field.fieldKey] : ""}
                                                onChange={handleDynamicFieldChange}
                                                required={field.required}
                                            />
                                        </div>
                                    );
                                })}

                            <div className="personalFile-modal-footer">
                                <button type="button" className="personalFile-btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button type="submit" className="personalFile-btn-primary" disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isChangingPassword && (
                <div className="pfChangingPassword-modal-overlay">
                    <div className="pfChangingPassword-modal mini-modal">
                        <div className="pfChangingPassword-modal-top"><h3>Security Settings</h3></div>
                        <form onSubmit={handlePasswordSubmit} className="pfChangingPassword-modal-form">
                            <div className="pfChangingPassword-form-group"><label>Current Password</label><input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required /></div>
                            <div className="pfChangingPassword-form-group">
                                <label>New Password</label>
                                <div className="password-input-wrapper">
                                    <input type={showPassword ? "text" : "password"} name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required />
                                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                                </div>
                            </div>
                            <div className="pfChangingPassword-form-group"><label>Confirm Password</label><input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required /></div>
                            <div className="pfChangingPassword-modal-footer">
                                <button type="button" className="pfChangingPassword-btn-secondary" onClick={() => setIsChangingPassword(false)}>Cancel</button>
                                <button type="submit" className="pfChangingPassword-btn-primary" disabled={isSaving}>{isSaving ? "Updating..." : "Update Password"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeePersonalFile;