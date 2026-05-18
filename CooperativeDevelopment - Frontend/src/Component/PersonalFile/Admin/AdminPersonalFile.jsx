import React, {
    useEffect,
    useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import API from '../../API/Axios';

import { jsPDF } from 'jspdf';

import 'jspdf-autotable';

import * as XLSX from 'xlsx';

import {
    CalendarClock,
    Search,
    X,
    Plus,
    UserPlus,
    FileText,
    Download,
    Trash2,
    CheckSquare,
    Square,
    Filter,
    RotateCcw
} from 'lucide-react';

import '../../CSS/AdminPersonalFile.css';

const AdminPersonalFile = () => {
    const navigate = useNavigate();

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddMode, setIsAddMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const [previewData, setPreviewData] = useState([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [excelFile, setExcelFile] = useState(null);

    const [showNewDeptInput, setShowNewDeptInput] = useState(false);

    const [departments, setDepartments] = useState([]);
    const [newDeptName, setNewDeptName] = useState("");
    const [originalEmail, setOriginalEmail] = useState("");

    const [selectedDeptFilter, setSelectedDeptFilter] = useState("");
    const [selectedDesignationFilter, setSelectedDesignationFilter] = useState("");

    const initialFormState = {
        name: "", email: "", password: "", username: "",
        phoneNumber: "", designation: "", nic: "", address: "", dutyPlace: "",
        grade: "", salaryScale: "", department: "", gender: "",
        dateOfBirth: "", dateOfFirstAppointment: "", appointmentDateToPresentStatus: "",
        incrementDate: "", dateOfReceiptGradeI: "", dateOfReceiptGradeII: "",
        dateOfReceiptGradeIII: "", dateOfCompulsoryRetirement: "", dateOfReceiptOfRelevantGrade: "",
        firstAppointmentDate: "", presentStatusDate: "", wnopNumber: "",
        profileImage: null, serviceNumber: "", dateOfLanguageProficiency: ""
    };

    const [formData, setFormData] = useState(initialFormState);

    const formatDate = (date) => {
        if (!(date instanceof Date)) return date;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const handleExcelChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setExcelFile(file);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;

            const wb = XLSX.read(bstr, {
                type: 'binary',
                cellDates: true,
                cellNF: true,
                cellText: false
            });

            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];

            const data = XLSX.utils.sheet_to_json(ws, {
                header: [
                    "No", "Name Of The Employee", "Email", "National ID", "Phone Number",
                    "Address", "Date Of Birth", "Gender", "Service Number", "WNOP Number",
                    "Designation", "Department", "Duty Place", "Salary Scale",
                    "Date Of First Appointment", "Date Of Language Proficiency",
                    "Appointment Date To Present Status", "Increment Date",
                    "Date Of Compulsory Retirement", "Present Status Date", "Grade",
                    "III", "II", "I"
                ],
                range: 2,
                defval: ""
            });

            setPreviewData(data);
            setIsPreviewOpen(true);
        };
        reader.readAsBinaryString(file);
    };

    const handleBulkUpload = async () => {
        if (!excelFile) return;

        const formData = new FormData();
        formData.append("file", excelFile);

        try {
            setLoading(true);
            await API.post('/personalfile/upload-employees', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("✅ All employees uploaded successfully!");
            setIsPreviewOpen(false);
            setExcelFile(null);
            fetchFiles();
        } catch (err) {
            console.error(err);
            alert("❌ Upload failed: " + (err.response?.data || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
        fetchDepartments();
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await API.get('/personalfile/all-employees');
            setFiles(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching records:", err);
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await API.get('/departments/all');
            setDepartments(res.data);
        } catch (err) {
            console.error("Failed to load departments", err);
        }
    };

    const handleGrantIncrement = () => {
        if (!formData.incrementDate && !formData.dateOfFirstAppointment) {
            alert("Please Enter At Least The Date Of First Appointment First.");
            return;
        }
        const baseDate = formData.incrementDate || formData.dateOfFirstAppointment;
        const current = new Date(baseDate);
        current.setFullYear(current.getFullYear() + 1);
        const nextDate = current.toISOString().split('T')[0];
        setFormData({ ...formData, incrementDate: nextDate });
    };

    const toggleSelect = (id, e) => {
        e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const filtered = files.filter(f =>
            (f.name || f.username)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.employeeId?.includes(searchTerm)
        );
        if (selectedIds.length === filtered.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filtered.map(f => f.id));
        }
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        const dataToExport = files.filter(f => selectedIds.includes(f.id));
        if (dataToExport.length === 0) return alert("Select employees first!");

        doc.setFontSize(16);
        doc.text("Department of Cooperative Development - Staff Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

        const tableColumn = ["Emp ID", "Name", "Designation", "Department", "NIC"];
        const tableRows = dataToExport.map(emp => [
            emp.employeeId || 'N/A', emp.name || emp.username, emp.designation, emp.department, emp.nic
        ]);

        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 30 });
        doc.save("Employee_Report.pdf");
    };

    const generateExcel = () => {
        const dataToExport = files.filter(f => selectedIds.includes(f.id));
        if (dataToExport.length === 0) return alert("Select employees first!");

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Employee Data");
        XLSX.writeFile(wb, "Employee_Export.xlsx");
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const confirmMessage = selectedIds.length === 1
            ? "Are you sure you want to delete this record?"
            : `Are you sure you want to delete ${selectedIds.length} selected records?`;

        if (window.confirm(confirmMessage)) {
            try {
                if (selectedIds.length === 1) {
                    await API.delete(`/personalfile/delete/${selectedIds[0]}`);
                } else {
                    await API.post('/personalfile/delete-multiple', selectedIds);
                }

                alert("✅ Deletion Successful!");
                setSelectedIds([]);
                fetchFiles();
            } catch (err) {
                console.error("Delete Error:", err);
                alert("❌ Failed to delete: " + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleAddDepartment = async () => {
        if (!newDeptName.trim()) {
            alert("Please enter a department name.");
            return;
        }

        try {
            const res = await API.post('/departments/add', { name: newDeptName });

            if (res.status === 200 || res.status === 201) {
                alert("✅ Department Added Successfully!");
                setNewDeptName("");
                fetchDepartments();
            }
        } catch (err) {
            console.error("Error adding department:", err);
            alert("❌ Failed to add department: " + (err.response?.data?.message || err.message));
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openAddModal = () => {
        setFormData(initialFormState);
        setIsAddMode(true);
        setIsModalOpen(true);
    };

    const openEditModal = (file) => {
        const sanitized = Object.keys(file).reduce((acc, key) => {
            acc[key] = file[key] === null ? "" : file[key];
            return acc;
        }, {});

        setFormData({
            ...sanitized,
            id: file.id || file._id,
            name: file.name || file.username || "",
            username: file.username || "",
            password: "",
        });

        setIsAddMode(false);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isAddMode) {
                await API.post('/personalfile/add-employee', formData);
                alert("✅ New User Added!");
            } else {
                await API.put(`/personalfile/update-profile?id=${formData.id}`, formData);
                alert("✅ Profile Updated Successfully!");
            }
            setIsModalOpen(false);
            fetchFiles();
        } catch (err) {
            console.error(err);
            alert("❌ Error: " + (err.response?.data || err.message));
        }
    };

    const handleDeleteDepartment = async () => {
        const deptToDelete = departments.find(d => d.name === newDeptName);

        if (!deptToDelete) {
            alert("Please select a valid department to delete.");
            return;
        }

        if (window.confirm(`Are you sure you want to delete the department "${deptToDelete.name}"?`)) {
            try {
                const res = await API.delete(`/departments/delete/${deptToDelete.id}`);

                if (res.status === 200) {
                    alert("✅ Department Deleted Successfully!");
                    setNewDeptName("");
                    fetchDepartments();
                }
            } catch (err) {
                console.error("Error deleting department:", err);
                alert("❌ Failed to delete department: " + (err.response?.data || err.message));
            }
        }
    };

    const uniqueDesignations = [...new Set(files.map(f => f.designation).filter(Boolean))].sort();

    const filteredFiles = files.filter(f => {
        const matchesSearch = (f.name || f.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.employeeId || "").includes(searchTerm);

        const matchesDept = selectedDeptFilter === "" || f.department === selectedDeptFilter;

        const matchesDesignation = selectedDesignationFilter === "" || f.designation === selectedDesignationFilter;

        return matchesSearch && matchesDept && matchesDesignation;
    });

    const resetFilters = () => {
        setSelectedDeptFilter("");
        setSelectedDesignationFilter("");
    };

    const getInitials = (name) => {
        if (!name) return "??";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    return (
        <div className="admin-personal-container fade-in">
            <div className="admin-header-section">
                <div>
                    <h1 className="admin-personal-title">Personal File Management</h1>
                    <p className="admin-personal-subtitle">The Personal File Management system provides a centralized dashboard
                        for administering employee records, from personal contact details to professional milestones like
                        designations and salary increments. It ensures data accuracy with tools for tracking promotions,
                        managing retirement dates, and secure record maintenance. Looking for past updates?
                        <span className="history-link" onClick={() => navigate('/DetailsHistory')}> You can view the full User History here.</span></p>
                </div>
            </div>

            <div className="admin-personal-controls">
                <div className="admin-personal-search-wrapper">
                    <input
                        type="text"
                        placeholder="Search records..."
                        className="admin-personal-search-input"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="admin-personal-search-icon" size={15} />
                </div>

                <div className="admin-dept-add-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {!showNewDeptInput ? (
                        <select className="admin-dept-add-search-input custom-dropdown" value={newDeptName} onChange={(e) => {
                            if (e.target.value === "___ADD_NEW___") {
                                setShowNewDeptInput(true);
                                setNewDeptName("");
                            } else {
                                setNewDeptName(e.target.value);
                            }
                        }}>

                            <option value="">Select Department...</option>
                            {departments.map((d) => (<option key={d.id} value={d.name}>{d.name}</option>))}

                            <option value="___ADD_NEW___" style={{ fontWeight: 'bold', color: '#c1121f', fontSize: '10px', marginTop: '10px', textAlign: 'center' }}> + Add New Department </option>
                        </select>
                    ) : (
                        <div>
                            <input type="text" placeholder="Type New Dept Name..." value={newDeptName} className="admin-dept-add-search-input" autoFocus onChange={(e) => setNewDeptName(e.target.value)} />
                            <button type="button" onClick={() => { setShowNewDeptInput(false); setNewDeptName(""); }}>
                                <X size={14} /></button>
                        </div>
                    )}

                    <button onClick={async () => { await handleAddDepartment(); setShowNewDeptInput(false); }} className="admin-personal-details-add-department">
                        {showNewDeptInput ? "Save Dept" : "Add Dept"} </button>


                    {!showNewDeptInput && newDeptName && (
                        <button type="button" onClick={handleDeleteDepartment} className="admin-personal-bulk" title="Delete Selected Department">
                            <Trash2 size={14} /> </button>)}
                </div>


                <button onClick={openAddModal} className="admin-personal-details-add-user">
                    <UserPlus size={13} /> Add User
                </button>

                <div className="admin-excel-upload-wrapper">
                    <input type="file" accept=".xlsx, .xls" id="excel-upload" style={{ display: 'none' }} onChange={handleExcelChange} />

                    <label htmlFor="excel-upload">Excel Upload </label>
                </div>

                <button onClick={toggleSelectAll} className="admin-personal-details-add-select">
                    {selectedIds.length === filteredFiles.length && filteredFiles.length > 0 ? "Deselect All" : "Select All"}
                </button>
            </div>

            <div className="filter-controls-toolbar">
                <div className="filter-controls-left">
                    <div className="bulk-action-toolbar-inner">
                        <span className="selected-count-badge" data-count={selectedIds.length}>{selectedIds.length} Selected </span>

                        <button onClick={generatePDF} className="admin-personal-pdf" disabled={selectedIds.length === 0}>
                            <FileText size={13} /> PDF Report </button>

                        <button onClick={generateExcel} className="admin-personal-excel" disabled={selectedIds.length === 0}>
                            <Download size={13} /> Excel Export </button>


                        <button onClick={handleBulkDelete} className="admin-personal-bulk" disabled={selectedIds.length === 0}>
                            <Trash2 size={13} /> Delete </button>

                        <button onClick={() => setSelectedIds([])} className="admin-personal-details-bulk" disabled={selectedIds.length === 0}>
                            Cancel </button>
                    </div>
                </div>

                <div className="filter-controls-right">
                    <div className="filter-dropdown-group">

                        <select value={selectedDeptFilter} onChange={(e) => setSelectedDeptFilter(e.target.value)} className="admin-filter-dropdown">
                            <option value="">All Departments</option>
                            {departments.map((d) => (<option key={d.id} value={d.name}>{d.name}</option>))}
                        </select>

                        <select value={selectedDesignationFilter} onChange={(e) => setSelectedDesignationFilter(e.target.value)} className="admin-filter-dropdown"



                        >
                            <option value="">All Designations</option>
                            {uniqueDesignations.map((des, idx) => (
                                <option key={idx} value={des}>{des}</option>
                            ))}
                        </select>

                        {/* Reset Filter Button */}
                        {(selectedDeptFilter || selectedDesignationFilter) && (
                            <button onClick={resetFilters} className="btn-filter-reset" title="Clear Filters">
                                <RotateCcw size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="admin-personal-grid fade-in">
                {filteredFiles.map((file) => (
                    <div key={file.id} className={`user-card ${selectedIds.includes(file.id) ? 'selected' : ''}`} onClick={() => openEditModal(file)}>
                        <div className="admin-personal-checkbox" onClick={(e) => toggleSelect(file.id, e)}>
                            {selectedIds.includes(file.id) ? <CheckSquare size={13} /> : <Square size={13} />}
                        </div>
                        <div className="user-avatar">
                            {file.profileImage ? (
                                <img
                                    src={file.profileImage}
                                    alt="profile"
                                    style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                getInitials(file.name || file.username)
                            )}
                        </div>
                        <div className="user-info">
                            <h3 className="user-name">{file.name || file.username}</h3>
                            <p className="user-email">{file.email}</p>
                            <span className="user-designation-badge">{file.designation || 'Employee'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {isPreviewOpen && (
                <div className="admin-excel-data-preview-personal-overlay">
                    <div className="admin-excel-data-preview-personal-content">
                        <div className="admin-excel-data-preview-personal-header-section">
                            <h2 className="admin-excel-data-preview-personal-title">Excel Data Preview</h2>
                        </div>

                        <div className="excel-preview-table-container">
                            <table className="preview-table">
                                <thead>
                                    <tr>
                                        <th rowSpan="2">No</th>
                                        <th rowSpan="2">Name Of The Employee</th>
                                        <th rowSpan="2">Email</th>
                                        <th rowSpan="2">National ID</th>
                                        <th rowSpan="2">Phone Number</th>
                                        <th rowSpan="2">Address</th>
                                        <th rowSpan="2">Date Of Birth</th>
                                        <th rowSpan="2">Gender</th>
                                        <th rowSpan="2">Service Number</th>
                                        <th rowSpan="2">WNOP Number</th>
                                        <th rowSpan="2">Designation</th>
                                        <th rowSpan="2">Department</th>
                                        <th rowSpan="2">Duty Place</th>
                                        <th rowSpan="2">Salary Scale</th>
                                        <th rowSpan="2">Date of First Appointment</th>
                                        <th rowSpan="2">Date Of Language Proficiency</th>
                                        <th rowSpan="2">Appointment Date To Present Status</th>
                                        <th rowSpan="2">Increment Date</th>
                                        <th rowSpan="2">Date Of Compulsory Retirement</th>
                                        <th rowSpan="2">Present Status Date</th>
                                        <th rowSpan="2">Grade</th>
                                        <th colSpan="3" style={{ textAlign: 'center' }}>Date Of Receipt Of Relevant Grade</th>
                                    </tr>
                                    <tr>
                                        <th>I</th>
                                        <th>II</th>
                                        <th>III</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row["No"]}</td>
                                            <td>{row["Name Of The Employee"]}</td>
                                            <td>{row["Email"]}</td>
                                            <td>{row["National ID"]}</td>
                                            <td>{row["Phone Number"]}</td>
                                            <td>{row["Address"]}</td>
                                            <td>{formatDate(row["Date Of Birth"])}</td>
                                            <td>{row["Gender"]}</td>
                                            <td>{row["Service Number"]}</td>
                                            <td>{row["WNOP Number"]}</td>
                                            <td>{row["Designation"]}</td>
                                            <td>{row["Department"]}</td>
                                            <td>{row["Duty Place"]}</td>
                                            <td>{row["Salary Scale"]}</td>
                                            <td>
                                                {row["Date Of First Appointment"] instanceof Date
                                                    ? row["Date Of First Appointment"].toLocaleDateString()
                                                    : row["Date Of First Appointment"]}
                                            </td>

                                            <td>
                                                {row["Date Of Language Proficiency"] instanceof Date
                                                    ? row["Date Of Language Proficiency"].toLocaleDateString()
                                                    : row["Date Of Language Proficiency"]}
                                            </td>

                                            <td>
                                                {row["Appointment Date To Present Status"] instanceof Date
                                                    ? row["Appointment Date To Present Status"].toLocaleDateString()
                                                    : row["Appointment Date To Present Status"]}
                                            </td>

                                            <td>
                                                {row["Increment Date"] instanceof Date
                                                    ? row["Increment Date"].toLocaleDateString()
                                                    : row["Increment Date"]}
                                            </td>

                                            <td>
                                                {row["Date Of Compulsory Retirement"] instanceof Date
                                                    ? row["Date Of Compulsory Retirement"].toLocaleDateString()
                                                    : row["Date Of Compulsory Retirement"]}
                                            </td>

                                            <td>
                                                {row["Present Status Date"] instanceof Date
                                                    ? row["Present Status Date"].toLocaleDateString()
                                                    : row["Present Status Date"]}
                                            </td>

                                            <td>{row["Grade"]}</td>

                                            <td>
                                                {row["III"] instanceof Date
                                                    ? row["III"].toLocaleDateString()
                                                    : row["III"]}
                                            </td>

                                            <td>
                                                {row["II"] instanceof Date
                                                    ? row["II"].toLocaleDateString()
                                                    : row["II"]}
                                            </td>

                                            <td>
                                                {row["I"] instanceof Date
                                                    ? row["I"].toLocaleDateString()
                                                    : row["I"]}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="admin-personal-modal-footer">
                            <p>Total Records Found: {previewData.length}</p>
                            <button onClick={() => setIsPreviewOpen(false)} className="btn-modal-cancel">Cancel</button>
                            <button onClick={handleBulkUpload} className="btn-modal-update">Upload Employees</button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="admin-personal-modal-overlay">
                    <div className="admin-personal-modal-content">
                        <div className="admin-personal-admin-header-section">
                            <h2 className="admin-personal-model-title">{isAddMode ? "New Employee Profile" : "Edit Profile"}</h2>
                            <button className="close-x" onClick={() => setIsModalOpen(false)}><X size={17} /></button>
                        </div>

                        <div className="modal-profile-header-view">
                            <div className="modal-avatar-circle-large">
                                {formData.profileImage ? (
                                    <img
                                        src={formData.profileImage}
                                        alt="Profile"
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    getInitials(formData.name || formData.username)
                                )}
                            </div>
                            {!isAddMode && <p style={{ fontSize: '10px', color: '#555', marginTop: '5px', textTransform: 'uppercase' }}>Profile Image is Read-Only</p>}
                        </div>

                        <form onSubmit={handleSubmit} className="admin-personal-form-structured">
                            {isAddMode && (
                                <div className="admin-personal-form-row">
                                    <label className="admin-personal-form-label">Set Password</label>
                                    <input type="password" name="password" onChange={handleInputChange} className="admin-personal-form-input-field" required />
                                </div>
                            )}

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Service Number</label>
                                <input type="text" name="serviceNumber" value={formData.serviceNumber} onChange={handleInputChange} className="admin-personal-form-input-field" />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">WNOP Number</label>
                                <input type="text" name="wnopNumber" value={formData.wnopNumber} onChange={handleInputChange} className="admin-personal-form-input-field" />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Full Name</label>
                                <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="admin-personal-form-input-field" />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">NIC</label>
                                <input type="text" name="nic" value={formData.nic} onChange={handleInputChange} className="admin-personal-form-input-field" />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Address</label>
                                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="admin-personal-form-input-field" />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of Birth</label>
                                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="admin-personal-form-input-field" />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className="admin-personal-form-input"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Phone Number</label>
                                <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Designation</label>
                                <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="admin-personal-form-input-field" />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Department</label>
                                <select
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    className="admin-personal-form-input"
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.name}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of First Appointment</label>
                                <input type="date" name="dateOfFirstAppointment" value={formData.dateOfFirstAppointment} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Appointment Date To Present Status</label>
                                <input type="date" name="appointmentDateToPresentStatus" value={formData.appointmentDateToPresentStatus} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Increment Date</label>
                                <div className="admin-personal-input-group">
                                    <input
                                        type="date"
                                        name="incrementDate"
                                        value={formData.incrementDate || ""}
                                        onChange={handleInputChange}
                                        className="admin-personal-form-input-field"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGrantIncrement}
                                        className="admin-personal-btn-history"
                                    >
                                        <CalendarClock size={15} />
                                    </button>
                                </div>
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Duty Place</label>
                                <input type="text" name="dutyPlace" value={formData.dutyPlace} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Grade</label>
                                <input type="text" name="grade" value={formData.grade} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of Language Proficiency</label>
                                <input type="text" name="dateOfLanguageProficiency" value={formData.dateOfLanguageProficiency} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Salary Scale</label>
                                <input type="text" name="salaryScale" value={formData.salaryScale} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of Compulsory Retirement</label>
                                <input type="date" name="dateOfCompulsoryRetirement" value={formData.dateOfCompulsoryRetirement} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Present Status Date</label>
                                <input type="date" name="presentStatusDate" value={formData.presentStatusDate} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of Receipt GradeI</label>
                                <input type="date" name="dateOfReceiptGradeI" value={formData.dateOfReceiptGradeI} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of Receipt GradeII</label>
                                <input type="date" name="dateOfReceiptGradeII" value={formData.dateOfReceiptGradeII} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of Receipt GradeIII</label>
                                <input type="date" name="dateOfReceiptGradeIII" value={formData.dateOfReceiptGradeIII} onChange={handleInputChange} className="admin-personal-form-input-field" required />
                            </div>

                            <div className="admin-personal-modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-modal-cancel">Cancel</button>
                                <button type="submit" className="btn-modal-update">{isAddMode ? "Create User" : "Update Profile"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPersonalFile;