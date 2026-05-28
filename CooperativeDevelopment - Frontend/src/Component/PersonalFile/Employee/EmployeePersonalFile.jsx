import React, {
    useState,
    useEffect
} from 'react';

import API from '../../API/Axios';

import '../../CSS/EmployeePersonalFile.css';

import {
    Pencil,
    Lock,
    UserRoundCog,
    Mail,
    Phone,
    MapPin,
    Cake,
    User as UserIcon,
    Eye,
    EyeOff,
    Transgender
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
        profileImage: null, serviceNumber: "", dateOfLanguageProficiency: ""
    });

    const [isIncrementFormOpen, setIsIncrementFormOpen] = useState(false);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [selectedImage, setSelectedImage] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [selectedNotification, setSelectedNotification] = useState(null);

    const [incrementFormData, setIncrementFormData] = useState({
        headOfficeFileNumber: "",
        officerName: "",
        grade: "",
        assistantCommissionerDivision: "",
        transferDateToACoffice: "",

        incrementDate: "",
        currentSalary: "",
        incrementAmount: "",
        totalWithIncrement: "",
        monthlyConsolidatedSalary: "",

        salaryIncrementSuspendedDetails: "",
        sickLeaveCount: "",

        passedSecondLanguageTest: false,
        passedFirstInspectorExam: false,
        examPassedDateAndYear: "",

        efficiencyBarReached: false,

        disciplinaryActionsDetails: "",
        warningsOrPunishmentsDetails: ""

    });

    const userEmail = localStorage.getItem('employeeEmail');

    useEffect(() => {
        fetchUserData();
    }, [userEmail]);

    const openIncrementForm = (notification) => {
        setSelectedNotification(notification);

        setIncrementFormData({
            ...incrementFormData,
            officerName: formData.username,
            grade: formData.grade,
            incrementDate: formData.incrementDate
        });

        setIsIncrementFormOpen(true);
    };

    const handleIncrementFormSubmit = async (e) => {

        e.preventDefault();

        try {

            await API.post("/increment-form/submit", {
                ...incrementFormData,
                userId: formData.id,
                notificationId: selectedNotification.id,
                submitted: true
            });

            alert("Increment Form Submitted Successfully");

            setIsIncrementFormOpen(false);

            fetchUserData();

            setNotifications(prev =>
                prev.filter(n => n.id !== selectedNotification.id)
            );

        } catch (err) {
            console.error(err);
            alert("Failed to submit increment form");
        }
    };

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await API.get(`/personalfile/notifications/${formData.id}`);
                setNotifications(response.data.filter(n => !n.read));
            } catch (err) {
                console.error("Error fetching notifications", err);
            }
        };
        if (formData.id) fetchNotifications();
    }, [formData.id]);

    const fetchUserData = async () => {
        if (!userEmail) {
            setLoading(false);
            return;
        }
        try {
            const response = await API.get(`/personalfile/me?email=${userEmail}`);
            if (response.data) setFormData(response.data);
            setSelectedImage(response.data.profileImage);

            if (response.data.profileImage) {
                localStorage.setItem('userImage', response.data.profileImage);
            }

        } catch (err) {
            console.error("Error fetching data", err);
        } finally {
            setLoading(false);
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
            alert("❌ Failed to update details. Check console for error.");
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

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

    if (loading) return (
        <div className="personalFile-container">
            <div className="personalFile-glass-layout">
                <h2 className="loading">Loading Profile...</h2>
            </div>
        </div>
    );

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
                            securely change your account password, and update your personal details such as contact
                            information and address. This section allows you to keep your employment records accurate,
                            up to date, and easily accessible at all times.</p>
                    </header>

                    {notifications.length > 0 && (
                        <div className="notification-alert-banner">
                            {notifications.map(n => (
                                <div key={n.id} className="alert-item" onClick={() => openIncrementForm(n)}>
                                    <Mail size={15} /><span>{n.message}</span></div>
                            ))}
                        </div>
                    )}

                    {isIncrementFormOpen && (
                        <div className="increment-modal-overlay">
                            <div className="increment-modal">
                                <button className="increment-modal-close-btn" onClick={() => setIsIncrementFormOpen(false)}>&times;</button>

                                <h2>සමුපකාර සංවර්ධන දෙපාර්තමේන්තුව - වාර්ෂික වැටුප් වර්ධක පත්‍රය</h2>

                                <div className="head-office-file-group">
                                    <label>ප්‍රධාන කාර්යාලීය ලිපි ගොනු අංකය: </label>
                                    <input
                                        type="text"
                                        className="head-office-input"
                                        value={incrementFormData.headOfficeFileNumber}
                                        onChange={(e) => setIncrementFormData({
                                            ...incrementFormData,
                                            headOfficeFileNumber: e.target.value
                                        })}
                                        placeholder="........................"
                                    />
                                </div>

                                <form onSubmit={handleIncrementFormSubmit} className="increment-form">

                                    <div className="form-row">
                                        <div className="personalFile-increment-form-group short-input">
                                            <label>1. නිලධාරියාගේ නම</label>
                                            <input type="text" value={incrementFormData.officerName} onChange={(e) => setIncrementFormData({ ...incrementFormData, officerName: e.target.value })} />
                                        </div>
                                        <div className="personalFile-increment-form-group short-input">
                                            <label>2. ශ්‍රේණිය</label>
                                            <input type="text" value={incrementFormData.grade} onChange={(e) => setIncrementFormData({ ...incrementFormData, grade: e.target.value })} />
                                        </div>
                                        <div className="personalFile-increment-form-group short-input">
                                            <label>3. කොට්ඨාශය</label>
                                            <input type="text" value={incrementFormData.assistantCommissionerDivision} onChange={(e) => setIncrementFormData({ ...incrementFormData, assistantCommissionerDivision: e.target.value })} />
                                        </div>
                                        <div className="personalFile-increment-form-group short-input">
                                            <label>4. මාරු වූ දිනය</label>
                                            <input type="date" value={incrementFormData.transferDateToACoffice} onChange={(e) => setIncrementFormData({ ...incrementFormData, transferDateToACoffice: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="personalFile-increment-form-group short-input">
                                            <label>5. වර්ධක දිනය</label>
                                            <input type="date" value={incrementFormData.incrementDate} onChange={(e) => setIncrementFormData({ ...incrementFormData, incrementDate: e.target.value })} />
                                        </div>
                                        <div className="personalFile-increment-form-group short-input">
                                            <label>6. වර්තමාන වැටුප</label>
                                            <input type="number" value={incrementFormData.currentSalary} onChange={(e) => setIncrementFormData({ ...incrementFormData, currentSalary: e.target.value })} />
                                        </div>
                                        <div className="personalFile-increment-form-group short-input">
                                            <label>7. ලැබිය යුතු වර්ධකය</label>
                                            <input type="number" value={incrementFormData.incrementAmount} onChange={(e) => setIncrementFormData({ ...incrementFormData, incrementAmount: e.target.value })} />
                                        </div>
                                        <div className="personalFile-increment-form-group short-input">
                                            <label>8. වර්ධකයේ එකතුව</label>
                                            <input type="number" value={incrementFormData.totalWithIncrement} onChange={(e) => setIncrementFormData({ ...incrementFormData, totalWithIncrement: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="form-row">
                                        <div className="personalFile-increment-form-group medium-input">
                                            <label>9. මාසික එකාබද්ධ වැටුප</label>
                                            <input type="number" value={incrementFormData.monthlyConsolidatedSalary} onChange={(e) => setIncrementFormData({ ...incrementFormData, monthlyConsolidatedSalary: e.target.value })} />
                                        </div>
                                        <div className="personalFile-increment-form-group medium-input">
                                            <label>10. අසනීප නිවාඩු ගණන</label>
                                            <input type="number" value={incrementFormData.sickLeaveCount} onChange={(e) => setIncrementFormData({ ...incrementFormData, sickLeaveCount: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="personalFile-increment-form-group full-width">
                                        <label>11. පසුගිය වර්ෂයේ වර්ධකය අත්හිටුවා/නතර කර/අඩු කර තිබේද? එසේ නම් විස්තර:</label>
                                        <textarea className="large-detail-box" value={incrementFormData.salaryIncrementSuspendedDetails} onChange={(e) => setIncrementFormData({ ...incrementFormData, salaryIncrementSuspendedDetails: e.target.value })} />
                                    </div>

                                    <div className="personalFile-increment-form-group full-width">
                                        <label>12. පත්වීම ස්ථිර කිරීමට තිබේ නම්</label>

                                        <div className="increment-form-row-12">
                                            <div className="increment-column">
                                                <label>(අ) නිලධාරියා නියමිත දෙවන භාෂා පරීක්ෂණයෙන් සමත් වී තිබේද?</label>
                                                <label style={{ marginLeft: "25px", marginTop: "5px" }}>(අවශ්‍ය තැන්හි)</label>
                                                <div className="checkbox-input-group">
                                                    <input
                                                        type="checkbox"
                                                        checked={incrementFormData.passedSecondLanguageTest === "Yes"}
                                                        onChange={(e) => setIncrementFormData({
                                                            ...incrementFormData,
                                                            passedSecondLanguageTest: e.target.checked ? "Yes" : "No"
                                                        })}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="විස්තර (අවශ්‍ය නම්)"
                                                        value={incrementFormData.secondLanguageTestDetails || ""}
                                                        onChange={(e) => setIncrementFormData({
                                                            ...incrementFormData,
                                                            secondLanguageTestDetails: e.target.value
                                                        })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="increment-column">
                                                <label>(ආ) නිලධාරියා පරීක්ෂකවරුන්ගේ පළමු පරීක්ෂණයෙන් සමත් වී තිබේද?</label>
                                                <label style={{ marginLeft: "25px", marginTop: "5px" }}>(සමත් නම් වර්ෂය හා දිනය)</label>
                                                <div className="checkbox-input-group">
                                                    <input
                                                        type="checkbox"
                                                        checked={incrementFormData.passedFirstInspectorExam === "Yes"}
                                                        onChange={(e) => setIncrementFormData({
                                                            ...incrementFormData,
                                                            passedFirstInspectorExam: e.target.checked ? "Yes" : "No"
                                                        })}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="වර්ෂය හා දිනය සඳහන් කරන්න"
                                                        value={incrementFormData.examPassedDateAndYear || ""}
                                                        onChange={(e) => setIncrementFormData({
                                                            ...incrementFormData,
                                                            examPassedDateAndYear: e.target.value
                                                        })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="personalFile-increment-form-group full-width">
                                        <div className="increment-row-inline">
                                            <label className="inline-label">
                                                13. කාර්යක්ෂමතා කඩඉමට පැමිණ තිබේද?
                                            </label>

                                            <div className="checkbox-wrap">
                                                <input
                                                    type="checkbox"
                                                    checked={incrementFormData.efficiencyBarReached === "Yes"}
                                                    onChange={(e) => setIncrementFormData({
                                                        ...incrementFormData,
                                                        efficiencyBarReached: e.target.checked ? "Yes" : "No"
                                                    })}
                                                />
                                                <span className="status-text">
                                                    {incrementFormData.efficiencyBarReached === "Yes" ? "ඔව් (Yes)" : "නැත (No)"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="personalFile-increment-form-group full-width">
                                        <label>14. විනයානුකූල ක්‍රියාමාර්ග තිබේද? විස්තර:</label>
                                        <textarea className="large-detail-box" value={incrementFormData.disciplinaryActionsDetails} onChange={(e) => setIncrementFormData({ ...incrementFormData, disciplinaryActionsDetails: e.target.value })} />
                                    </div>

                                    <div className="personalFile-increment-form-group full-width">
                                        <label>15. අවවාද හෝ දඬුවම් කර තිබේද? විස්තර:</label>
                                        <textarea className="large-detail-box" value={incrementFormData.warningsOrPunishmentsDetails} onChange={(e) => setIncrementFormData({ ...incrementFormData, warningsOrPunishmentsDetails: e.target.value })} />
                                    </div>

                                    <button type="submit" className="personalFile-increment-submit-btn">Submit Increment Form</button>
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
                        <div className="personalFile-modal-top">
                            <h3>Update Personal Details</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="personalFile-modal-form">

                            <div className="personalFile-modal-image-section">
                                <div className="personalFile-modal-avatar-preview">
                                    {selectedImage ? (
                                        <img src={selectedImage} alt="Preview" className="personalFile-modal-img-circle" />
                                    ) : (
                                        <div className="personalFile-modal-img-placeholder">
                                            {formData.username?.charAt(0) || "?"}
                                        </div>
                                    )}
                                </div>

                                <div className="image-action-buttons" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                                    <label htmlFor="imageUpload" className="personalFile-image-upload-label">
                                        Change Photo
                                    </label>

                                    {selectedImage && (
                                        <button
                                            type="button"
                                            onClick={handleDeletePhoto}
                                            className="delete-photo-btn"
                                            title="Remove Photo"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            <LuTrash2 size={12} color="#ff4d4f" />
                                        </button>
                                    )}
                                </div>

                                <input
                                    id="imageUpload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <div className="personalFile-form-row">

                                <div className="personalFile-form-group">
                                    <label>Full Name</label>
                                    <input name="username" value={formData.username} onChange={handleChange} required />
                                </div>
                                <div className="personalFile-form-group">
                                    <label>Email</label>
                                    <input name="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="personalFile-form-group">
                                    <label>NIC Number</label>
                                    <input name="nic" value={formData.nic} onChange={handleChange} required />
                                </div>
                                <div className="personalFile-form-group">
                                    <label>Phone Number</label>
                                    <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                                </div>
                                <div className="personalFile-form-group">
                                    <label>Gender</label>
                                    <select name="gender" value={formData.gender} onChange={handleChange}>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div className="personalFile-form-group">
                                    <label>Date Of Birth</label>
                                    <input name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="personalFile-form-group">
                                <label>Home Address</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} rows="3" />
                            </div>
                            <div className="personalFile-modal-footer">
                                <button type="button" className="personalFile-btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                                <button type="submit" className="personalFile-btn-primary" disabled={isSaving}>
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isChangingPassword && (
                <div className="pfChangingPassword-modal-overlay">
                    <div className="pfChangingPassword-modal mini-modal">
                        <div className="pfChangingPassword-modal-top">
                            <h3>Security Settings</h3>
                        </div>
                        <form onSubmit={handlePasswordSubmit} className="pfChangingPassword-modal-form">
                            <div className="pfChangingPassword-form-group">
                                <label>Current Password</label>
                                <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required />
                            </div>
                            <div className="pfChangingPassword-form-group">
                                <label>New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                    <button type="button" className="eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                            <div className="pfChangingPassword-form-group">
                                <label>Confirm Password</label>
                                <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} required />
                            </div>
                            <div className="pfChangingPassword-modal-footer">
                                <button type="button" className="pfChangingPassword-btn-secondary" onClick={() => setIsChangingPassword(false)}>Cancel</button>
                                <button type="submit" className="pfChangingPassword-btn-primary" disabled={isSaving}>
                                    {isSaving ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeePersonalFile;