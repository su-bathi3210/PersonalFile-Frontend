import {
    useEffect,
    useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import API from '../../API/Axios';

import { jsPDF } from 'jspdf';

import 'jspdf-autotable';

import * as XLSX from 'xlsx';

import {
    CheckSquare,
    Download,
    FileText,
    Pencil,
    RotateCcw,
    Search,
    Square,
    Trash2,
    X
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

    const [selectedColumnFilter, setSelectedColumnFilter] = useState("");
    const [selectedValueFilter, setSelectedValueFilter] = useState("");

    const [dynamicFieldConfigs, setDynamicFieldConfigs] = useState([]);
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);

    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedDay, setSelectedDay] = useState("");
    const [isDateFocused, setIsDateFocused] = useState(false);

    const [newFieldData, setNewFieldData] = useState({
        fieldKey: "",
        displayName: "",
        fieldType: "text",
        required: false,
        isGlobal: true,
        employeeEmail: "",
        isAdminOnly: false
    });

    const [editingFieldId, setEditingFieldId] = useState(null);

    const initialFormState = {
        name: "", email: "", password: "", username: "",
        phoneNumber: "", designation: "", nic: "", address: "", dutyPlace: "",
        grade: "", salaryScale: "", department: "", gender: "",
        dateOfBirth: "", dateOfFirstAppointment: "", appointmentDateToPresentStatus: "",
        incrementDate: "", dateOfReceiptGradeI: "", dateOfReceiptGradeII: "",
        dateOfReceiptGradeIII: "", dateOfCompulsoryRetirement: "", dateOfReceiptOfRelevantGrade: "",
        firstAppointmentDate: "", presentStatusDate: "", wnopNumber: "",
        profileImage: null, serviceNumber: "", dateOfLanguageProficiency: "", dynamicFields: {}
    };

    const [formData, setFormData] = useState(initialFormState);

    const formatDate = (date) => {
        if (!date) return "-";
        if (typeof date === 'string') {
            const cleanDate = date.split('T')[0];
            const parts = cleanDate.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
            return date;
        }

        if (!(date instanceof Date) || isNaN(date.getTime())) return date;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };

    const handleExcelChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setExcelFile(file);
        const reader = new FileReader();

        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, {
                type: 'array',
                cellDates: true,
                dateNF: 'yyyy-mm-dd'
            });

            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            const jsonData = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                raw: false
            });

            if (jsonData.length > 1) {
                const mainHeaders = jsonData[0].map(h => h ? h.toString().trim() : "");
                const subHeaders = jsonData[1] ? jsonData[1].map(h => h ? h.toString().trim() : "") : [];

                const rows = jsonData.slice(2).map(row => {
                    let rowData = {};

                    mainHeaders.forEach((header, index) => {
                        let cellValue = row[index] !== undefined ? row[index].toString().trim() : "";

                        let actualHeader = header;
                        if (!actualHeader && index > 0) {
                            actualHeader = mainHeaders[index - 1] || mainHeaders[index - 2] || "";
                        }

                        if (actualHeader) {
                            const sub = subHeaders[index];
                            if (sub === "I" || sub === "II" || sub === "III") {
                                if (actualHeader.includes("Grade")) {
                                    rowData[`dateOfReceiptGrade${sub}`] = cellValue;
                                } else {
                                    rowData[`${actualHeader}_${sub}`] = cellValue;
                                }
                            } else {
                                rowData[actualHeader] = cellValue;
                            }
                        }
                    });
                    return rowData;
                }).filter(row => Object.values(row).some(val => val !== ""));

                setPreviewData(rows);
                setIsPreviewOpen(true);
            }
        };

        reader.readAsArrayBuffer(file);
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
            const errorMessage = err.response?.data?.message || err.response?.data || err.message;

            if (typeof errorMessage === 'string' && errorMessage.includes("දැනටමත්")) {
                alert(`⚠️ Warning: ${errorMessage}`);
            } else {
                alert("❌ Upload failed: " + errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
        fetchDepartments();
        fetchDynamicFields();
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

    const fetchDynamicFields = async () => {
        try {
            const res = await API.get('/dynamic-fields/all');
            const sanitizedFields = res.data.map(field => ({
                ...field,
                isAdminOnly: field.isAdminOnly === true
            }));
            setDynamicFieldConfigs(sanitizedFields);
        } catch (err) {
            console.error("Failed to load dynamic fields:", err);
        }
    };

    const toggleSelect = (id, e) => {
        e.stopPropagation();
        setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        const filtered = files.filter(f =>
            (f.name || f.username)?.toLowerCase().includes(searchTerm.toLowerCase()) || f.employeeId?.includes(searchTerm)
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
        const activeDynamicFieldKeys = [];
        dynamicFieldConfigs.forEach(field => {
            const isGlobal = field.isGlobal === true || String(field.isGlobal).toLowerCase() === "true";
            const isApplicableToAnySelected = dataToExport.some(emp =>
                isGlobal || (emp.email && field.employeeEmail?.toLowerCase() === emp.email.toLowerCase())
            );
            if (isApplicableToAnySelected) {
                activeDynamicFieldKeys.push({
                    key: field.fieldKey,
                    label: field.displayName || field.fieldKey
                });
            }
        });

        const headerRow1 = [
            "No", "Name Of The Employee", "Email", "National ID", "Phone Number",
            "Address", "Date Of Birth", "Gender", "Service Number", "WNOP Number",
            "Designation", "Department", "Duty Place", "Salary Scale",
            "Date Of First Appointment", "Date Of Language Proficiency",
            "Appointment Date To Present Status", "Increment Date",
            "Date Of Compulsory Retirement", "Present Status Date", "Grade",
            "Date Of Receipt Of Relevant Grade", "", ""
        ];

        const headerRow2 = [
            "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
            "III", "II", "I"
        ];

        activeDynamicFieldKeys.forEach(field => {
            headerRow1.push(field.label);
            headerRow2.push("");
        });

        const excelHeaders = [headerRow1, headerRow2];

        const excelRows = dataToExport.map((emp, index) => {
            const standardData = [
                index + 1, emp.name || emp.username || "-", emp.email || "-", emp.nic || "-", emp.phoneNumber || "-",
                emp.address || "-", emp.dateOfBirth ? formatDate(emp.dateOfBirth) : "-", emp.gender || "-",
                emp.serviceNumber || "-", emp.wnopNumber || "-", emp.designation || "-", emp.department || "-",
                emp.dutyPlace || "-", emp.salaryScale || "-", emp.dateOfFirstAppointment ? formatDate(emp.dateOfFirstAppointment) : "-",
                emp.dateOfLanguageProficiency || "-", emp.appointmentDateToPresentStatus ? formatDate(emp.appointmentDateToPresentStatus) : "-",
                emp.incrementDate ? formatDayMonth(emp.incrementDate) : "-", emp.dateOfCompulsoryRetirement ? formatDate(emp.dateOfCompulsoryRetirement) : "-",
                emp.presentStatusDate ? formatDate(emp.presentStatusDate) : "-", emp.grade || "-",
                emp.dateOfReceiptGradeIII ? formatDate(emp.dateOfReceiptGradeIII) : "-",
                emp.dateOfReceiptGradeII ? formatDate(emp.dateOfReceiptGradeII) : "-",
                emp.dateOfReceiptGradeI ? formatDate(emp.dateOfReceiptGradeI) : "-"
            ];

            const dynamicData = activeDynamicFieldKeys.map(field => {
                if (emp.dynamicFields && emp.dynamicFields[field.key] !== undefined && emp.dynamicFields[field.key] !== null && emp.dynamicFields[field.key] !== "") {
                    return emp.dynamicFields[field.key];
                }
                return "-";
            });

            return [...standardData, ...dynamicData];
        });

        const ws = XLSX.utils.aoa_to_sheet([...excelHeaders, ...excelRows]);
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 21 }, e: { r: 0, c: 23 } });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Employee Data");
        XLSX.writeFile(wb, `Employee_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const confirmMessage = selectedIds.length === 1 ? "Are you sure you want to delete this record?" : `Are you sure you want to delete ${selectedIds.length} selected records?`;

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

    const handleDynamicInputChange = (e) => {
        setFormData({
            ...formData,
            dynamicFields: { ...formData.dynamicFields, [e.target.name]: e.target.value }
        });
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

        const mappedBirthDate = file["Date Of Birth"] || file.dateOfBirth || "";
        const mappedFirstApp = file["Date Of First Appointment"] || file.dateOfFirstAppointment || "";
        const mappedPresentStatus = file["Appointment Date To Present Status"] || file.appointmentDateToPresentStatus || "";
        const mappedRetirement = file["Date Of Compulsory Retirement"] || file.dateOfCompulsoryRetirement || "";
        const mappedStatusDate = file["Present Status Date"] || file.presentStatusDate || "";
        const mappedI = file["I"] || file.dateOfReceiptGradeI || "";
        const mappedII = file["II"] || file.dateOfReceiptGradeII || "";
        const mappedIII = file["III"] || file.dateOfReceiptGradeIII || "";
        const mappedIncrement = file["Increment Date"] || file.incrementDate || "";

        const formatForInput = (dVal) => {
            if (!dVal) return "";
            return String(dVal).split('T')[0];
        };

        setFormData({
            ...sanitized,
            id: file.id || file._id,
            name: file.name || file["Name Of The Employee"] || file.username || "",
            username: file.username || file["Name Of The Employee"] || "",
            email: file.email || file["Email"] || "",
            nic: file.nic || file["National ID"] || "",
            phoneNumber: file.phoneNumber || file["Phone Number"] || "",
            address: file.address || file["Address"] || "",
            gender: file.gender || file["Gender"] || "",
            serviceNumber: file.serviceNumber || file["Service Number"] || "",
            wnopNumber: file.wnopNumber || file["WNOP Number"] || "",
            designation: file.designation || file["Designation"] || "",
            department: file.department || file["Department"] || "",
            dutyPlace: file.dutyPlace || file["Duty Place"] || "",
            salaryScale: file.salaryScale || file["Salary Scale"] || "",
            grade: file.grade || file["Grade"] || "",
            dateOfLanguageProficiency: file.dateOfLanguageProficiency || file["Date Of Language Proficiency"] || "",

            dateOfBirth: formatForInput(mappedBirthDate),
            dateOfFirstAppointment: formatForInput(mappedFirstApp),
            appointmentDateToPresentStatus: formatForInput(mappedPresentStatus),
            dateOfCompulsoryRetirement: formatForInput(mappedRetirement),
            presentStatusDate: formatForInput(mappedStatusDate),
            dateOfReceiptGradeI: formatForInput(mappedI),
            dateOfReceiptGradeII: formatForInput(mappedII),
            dateOfReceiptGradeIII: formatForInput(mappedIII),
            incrementDate: mappedIncrement,

            password: "",
            dynamicFields: file.dynamicFields || {}
        });
        setIsAddMode(false);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let preparedFormData = { ...formData };

        if (preparedFormData.incrementDate) {
            let dateStr = preparedFormData.incrementDate.trim();
            const currentYear = new Date().getFullYear();

            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts.length === 2) {
                    if (isNaN(parts[0]) && !isNaN(parts[1])) {
                        preparedFormData.incrementDate = `${currentYear}-${parts[0]}-${parts[1]}`;
                    } else if (!isNaN(parts[0]) && isNaN(parts[1])) {
                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        const mIdx = monthNames.findIndex(m => m.toLowerCase() === parts[1].toLowerCase());
                        if (mIdx !== -1) {
                            const formattedMonth = String(mIdx + 1).padStart(2, '0');
                            const formattedDay = String(parts[0]).padStart(2, '0');
                            preparedFormData.incrementDate = `${currentYear}-${formattedMonth}-${formattedDay}`;
                        }
                    } else if (!isNaN(parts[0]) && !isNaN(parts[1])) {
                        preparedFormData.incrementDate = `${currentYear}-${parts[0]}-${parts[2] || parts[1]}`;
                    }
                }
            }
        }

        Object.keys(preparedFormData).forEach(key => {
            if (preparedFormData[key] === "") {
                preparedFormData[key] = null;
            }
        });

        try {
            if (isAddMode) {
                await API.post('/personalfile/add-employee', preparedFormData);
                alert("✅ New User Added!");
            } else {
                await API.put(`/personalfile/update-profile?id=${formData.id}`, preparedFormData);
                alert("✅ Profile Updated Successfully!");
            }
            setIsModalOpen(false);
            fetchFiles();
        } catch (err) {
            console.error("Update Error:", err);
            alert("❌ Error: " + (err.response?.data || err.message));
        }
    };

    const handleFieldConfigSubmit = async (e) => {
        e.preventDefault();
        const isGlobalBoolean = newFieldData.isGlobal === true || String(newFieldData.isGlobal).toLowerCase() === "true";
        const isAdminOnlyBoolean = newFieldData.isAdminOnly === true || String(newFieldData.isAdminOnly).toLowerCase() === "true";

        if (!isGlobalBoolean && !newFieldData.employeeEmail) {
            alert("❌ Please select an employee for specific field type!");
            return;
        }

        const payload = {
            fieldKey: newFieldData.fieldKey,
            displayName: newFieldData.displayName,
            fieldType: newFieldData.fieldType,
            required: newFieldData.required === true || String(newFieldData.required).toLowerCase() === "true",
            isGlobal: isGlobalBoolean,
            employeeEmail: isGlobalBoolean ? "" : newFieldData.employeeEmail || "",
            isAdminOnly: isAdminOnlyBoolean
        };

        try {
            if (editingFieldId) {
                await API.put(`/dynamic-fields/update/${editingFieldId}`, payload);
                alert("✅ Field Configuration Updated!");
            } else {
                await API.post('/dynamic-fields/add', payload);
                alert("✅ New Field Added Successfully!");
            }

            setNewFieldData({
                fieldKey: "", displayName: "", fieldType: "text", required: false,
                isGlobal: true, employeeEmail: "", isAdminOnly: false
            });
            setEditingFieldId(null);
            fetchDynamicFields();
            fetchFiles();
        } catch (err) {
            console.error("Field Submission Error:", err);
            alert("❌ Action Failed: " + (err.response?.data || err.message));
        }
    };

    const handleEditFieldClick = (field) => {
        const isDbAdmin = field.isAdminOnly === true || field.isadminonly === true || String(field.isAdminOnly).toLowerCase() === "true";
        const isDbGlobal = field.isGlobal === true || field.isGlobal !== false || String(field.isGlobal).toLowerCase() === "true";

        setNewFieldData({
            fieldKey: field.fieldKey, displayName: field.displayName, fieldType: field.fieldType,
            required: field.required === true || String(field.required).toLowerCase() === "true",
            isGlobal: isDbGlobal, employeeEmail: field.employeeEmail || "", isAdminOnly: isDbAdmin
        });
        setEditingFieldId(field.id);
    };

    const handleDeleteFieldClick = async (id) => {
        if (window.confirm("⚠️ Are you sure you want to delete this field? It will be permanently removed from ALL employee profiles!")) {
            try {
                await API.delete(`/dynamic-fields/delete/${id}`);
                alert("✅ Field removed successfully from the entire system!");
                fetchDynamicFields();
                fetchFiles();
            } catch (err) {
                alert("❌ Delete failed: " + (err.response?.data || err.message));
            }
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
                alert("❌ Failed to delete department: " + (err.response?.data?.message || err.message));
            }
        }
    };

    const getInitials = (name) => {
        if (!name) return "??";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    const formatDayMonth = (dateVal) => {
        if (!dateVal) return "-";
        let dateStr = dateVal;

        if (dateVal instanceof Date) {
            const year = dateVal.getFullYear();
            const month = String(dateVal.getMonth() + 1).padStart(2, '0');
            const day = String(dateVal.getDate()).padStart(2, '0');
            dateStr = `${year}-${month}-${day}`;
        }

        if (typeof dateStr !== 'string') dateStr = String(dateStr);

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

        const monthNames = ["Jan", "Feb", "Mar", "April", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${day}-${monthNames[month]}`;
    };

    const filterableColumns = [
        { key: "designation", label: "Designation" },
        { key: "department", label: "Department" },
        { key: "gender", label: "Gender" },
        { key: "grade", label: "Grade" },
        { key: "dutyPlace", label: "Duty Place" },
        { key: "salaryScale", label: "Salary Scale" },
        { key: "nic", label: "National ID (NIC)" },
        { key: "serviceNumber", label: "Service Number" },
        { key: "wnopNumber", label: "WNOP Number" },
        { key: "dateOfBirth", label: "Date Of Birth", isDate: true },
        { key: "dateOfFirstAppointment", label: "Date Of First Appointment", isDate: true },
        { key: "appointmentDateToPresentStatus", label: "Appointment Date To Present Status", isDate: true },
        { key: "incrementDate", label: "Increment Date", isDayMonth: true },
        { key: "dateOfCompulsoryRetirement", label: "Date Of Compulsory Retirement", isDate: true },
        { key: "presentStatusDate", label: "Present Status Date", isDate: true },
        ...dynamicFieldConfigs.map(field => ({
            key: field.fieldKey,
            label: `${field.displayName} (Custom Field)`,
            isDynamic: true,
            isDate: field.fieldType === 'date'
        }))
    ];

    const currentSelectedColumn = filterableColumns.find(c => c.key === selectedColumnFilter);
    const isCurrentColumnDate = currentSelectedColumn?.isDate;

    const getUniqueValuesForColumn = () => {
        if (!selectedColumnFilter) return [];

        const allVals = files.map(emp => {
            if (currentSelectedColumn?.isDynamic) {
                return emp.dynamicFields?.[selectedColumnFilter];
            }
            const val = emp[selectedColumnFilter];
            if (!val) return null;
            if (currentSelectedColumn?.isDayMonth) return formatDayMonth(val);
            return val;
        });

        return [...new Set(allVals.filter(Boolean))].sort();
    };

    const getUniqueDateParts = (partType) => {
        if (!selectedColumnFilter || !isCurrentColumnDate) return [];

        const partsList = files.map(emp => {
            let dateVal = currentSelectedColumn?.isDynamic ? emp.dynamicFields?.[selectedColumnFilter] : emp[selectedColumnFilter];
            if (!dateVal) return null;

            const dateStr = String(dateVal).split('T')[0];
            const parts = dateStr.split('-');

            if (parts.length === 3) {
                if (partType === 'year') return parts[0];
                if (partType === 'month') return parts[1];
                if (partType === 'day') return parts[2];
            } else {
                const d = new Date(dateVal);
                if (isNaN(d.getTime())) return null;
                if (partType === 'year') return String(d.getFullYear());
                if (partType === 'month') return String(d.getMonth() + 1).padStart(2, '0');
                if (partType === 'day') return String(d.getDate()).padStart(2, '0');
            }
            return null;
        });

        return [...new Set(partsList.filter(Boolean))].sort();
    };

    const getMonthName = (monthNum) => {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return months[parseInt(monthNum, 10) - 1] || monthNum;
    };

    const getValueCountForColumn = (value) => {
        if (!selectedColumnFilter) return 0;
        return files.filter(user => {
            let userVal = "";

            if (selectedColumnFilter === "designation") userVal = user.designation;
            else if (selectedColumnFilter === "department") userVal = user.department;
            else if (selectedColumnFilter === "grade") userVal = user.grade;
            else if (selectedColumnFilter === "dutyPlace") userVal = user.dutyPlace;
            else if (selectedColumnFilter === "gender") userVal = user.gender;
            else if (user.dynamicFields && user.dynamicFields[selectedColumnFilter]) {
                userVal = user.dynamicFields[selectedColumnFilter];
            }

            const normalizedUserVal = userVal ? String(userVal).trim() : "Not Specified";
            const normalizedTargetVal = value ? String(value).trim() : "Not Specified";

            return normalizedUserVal === normalizedTargetVal;
        }).length;
    };

    const getDatePartCount = (type, partValue) => {
        if (!selectedColumnFilter) return 0;
        return files.filter(user => {
            const dateStr = user[selectedColumnFilter];
            if (!dateStr) return false;

            const dateObj = new Date(dateStr);
            if (isNaN(dateObj.getTime())) return false;

            if (type === 'year') {
                return String(dateObj.getFullYear()) === String(partValue);
            }
            if (type === 'month') {
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                return m === String(partValue);
            }
            if (type === 'day') {
                const d = String(dateObj.getDate()).padStart(2, '0');
                return d === String(partValue);
            }
            return false;
        }).length;
    };

    const filteredFiles = files.filter(f => {
        const matchesSearch = (f.name || f.username || "").toLowerCase().includes(searchTerm.toLowerCase()) || (f.employeeId || "").includes(searchTerm);

        if (!selectedColumnFilter) return matchesSearch;

        if (isCurrentColumnDate) {
            let dateVal = currentSelectedColumn?.isDynamic ? f.dynamicFields?.[selectedColumnFilter] : f[selectedColumnFilter];
            if (!dateVal) return false;

            const dateStr = String(dateVal).split('T')[0];
            const parts = dateStr.split('-');

            let empYear = "";
            let empMonth = "";
            let empDay = "";

            if (parts.length === 3) {
                empYear = parts[0];
                empMonth = parts[1];
                empDay = parts[2];
            } else {
                const d = new Date(dateVal);
                if (isNaN(d.getTime())) return false;
                empYear = String(d.getFullYear());
                empMonth = String(d.getMonth() + 1).padStart(2, '0');
                empDay = String(d.getDate()).padStart(2, '0');
            }

            const matchesYear = selectedYear ? empYear === selectedYear : true;
            const matchesMonth = selectedMonth ? empMonth === selectedMonth : true;
            const matchesDay = selectedDay ? empDay === selectedDay : true;

            return matchesSearch && matchesYear && matchesMonth && matchesDay;
        }

        if (!selectedValueFilter) return matchesSearch;

        let actualValue = "";
        if (currentSelectedColumn?.isDynamic) {
            actualValue = f.dynamicFields?.[selectedColumnFilter];
        } else {
            actualValue = f[selectedColumnFilter];
            if (currentSelectedColumn?.isDayMonth && actualValue) actualValue = formatDayMonth(actualValue);
        }

        const matchesDynamicFilter = String(actualValue || "").toLowerCase() === String(selectedValueFilter).toLowerCase();
        return matchesSearch && matchesDynamicFilter;
    });

    const resetFilters = () => {
        setSelectedColumnFilter("");
        setSelectedValueFilter("");
        setSelectedYear("");
        setSelectedMonth("");
        setSelectedDay("");
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
                        <span className="history-link" onClick={() => navigate('/AdminPFHistory')}> You can view the full User History here.</span></p>
                </div>
            </div>

            <div className="admin-personal-controls">
                <div className="admin-personal-search-wrapper">
                    <input type="text" placeholder="Search records..." className="admin-personal-search-input" onChange={(e) => setSearchTerm(e.target.value)} />
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
                            <button type="button" onClick={() => { setShowNewDeptInput(false); setNewDeptName(""); }}><X size={14} /></button>
                        </div>
                    )}

                    <button onClick={async () => { await handleAddDepartment(); setShowNewDeptInput(false); }}
                        className="admin-personal-details-add-department">{showNewDeptInput ? "Save Dept" : "Add Dept"}</button>

                    {!showNewDeptInput && newDeptName && (
                        <button type="button" onClick={handleDeleteDepartment}
                            className="admin-personal-bulk" title="Delete Selected Department"><Trash2 size={14} /></button>)}
                </div>

                <button onClick={() => setIsFieldModalOpen(true)} className="admin-personal-details-add-user" style={{ backgroundColor: '#6d597a' }}>Manage Fields</button>
                <button onClick={openAddModal} className="admin-personal-details-add-user">Add User</button>

                <div className="admin-excel-upload-wrapper">
                    <input type="file" accept=".xlsx, .xls" id="excel-upload" style={{ display: 'none', cursor: 'pointer' }} onChange={handleExcelChange} />
                    <label htmlFor="excel-upload">Excel Upload</label>
                </div>

                <button onClick={toggleSelectAll} className="admin-personal-details-add-select">
                    {selectedIds.length === filteredFiles.length && filteredFiles.length > 0 ? "Deselect All" : "Select All"}
                </button>
            </div>

            <div className="filter-controls-toolbar">
                <div className="filter-controls-left">
                    <div className="bulk-action-toolbar-inner">
                        <span className="selected-count-badge" data-count={selectedIds.length}>{selectedIds.length} Selected</span>
                        <button onClick={generatePDF} className="admin-personal-pdf" disabled={selectedIds.length === 0}><FileText size={13} /> PDF Report</button>
                        <button onClick={generateExcel} className="admin-personal-excel" disabled={selectedIds.length === 0}><Download size={13} /> Excel Export</button>
                        <button onClick={handleBulkDelete} className="admin-personal-bulk" disabled={selectedIds.length === 0}><Trash2 size={13} /> Delete</button>
                        <button onClick={() => setSelectedIds([])} className="admin-personal-details-bulk" disabled={selectedIds.length === 0}>Cancel</button>
                    </div>
                </div>

                <div className="filter-controls-right">
                    <div className="filter-dropdown-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

                        {/* Main Column Selector */}
                        <select value={selectedColumnFilter} onChange={(e) => {
                            setSelectedColumnFilter(e.target.value);
                            setSelectedValueFilter("");
                            setSelectedYear("");
                            setSelectedMonth("");
                            setSelectedDay("");
                        }} className="admin-filter-dropdown">
                            <option value="">Select Filter Column</option>
                            {filterableColumns.map((col) => (
                                <option key={col.key} value={col.key}>{col.label}</option>
                            ))}
                        </select>

                        {selectedColumnFilter && isCurrentColumnDate ? (
                            <>
                                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}
                                    className="admin-filter-dropdown date-sub-filter" style={{ width: '110px' }}>
                                    <option value="">Year</option>
                                    {getUniqueDateParts('year').map((yr, idx) => (
                                        <option key={idx} value={yr}>{yr} - {getDatePartCount('year', yr)}</option>
                                    ))}
                                </select>

                                <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="admin-filter-dropdown date-sub-filter" style={{ width: '130px' }}>
                                    <option value="">Month</option>
                                    {getUniqueDateParts('month').map((mn, idx) => (
                                        <option key={idx} value={mn}>{getMonthName(mn)} - {getDatePartCount('month', mn)}</option>
                                    ))}
                                </select>

                                <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}
                                    className="admin-filter-dropdown date-sub-filter" style={{ width: '110px' }}>
                                    <option value="">Date</option>
                                    {getUniqueDateParts('day').map((dy, idx) => (
                                        <option key={idx} value={dy}>{dy} - {getDatePartCount('day', dy)}</option>
                                    ))}
                                </select>
                            </>
                        ) : (
                            <select value={selectedValueFilter} disabled={!selectedColumnFilter}
                                onChange={(e) => setSelectedValueFilter(e.target.value)} className="admin-filter-dropdown">
                                <option value="">
                                    {selectedColumnFilter ? "Choose Value" : "Select Column First"}
                                </option>
                                {getUniqueValuesForColumn().map((val, idx) => (
                                    <option key={idx} value={val}>
                                        {val || "Not Specified"} -  {getValueCountForColumn(val)}
                                    </option>
                                ))}
                            </select>
                        )}

                        {(selectedColumnFilter || selectedValueFilter || selectedYear || selectedMonth || selectedDay) && (
                            <button onClick={resetFilters} className="btn-filter-reset" title="Clear Filters"><RotateCcw size={14} /></button>
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
                                <img src={file.profileImage} alt="profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
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
                                            <td>{row["Date Of First Appointment"] instanceof Date ? row["Date Of First Appointment"].toLocaleDateString() : row["Date Of First Appointment"]}</td>
                                            <td>{row["Date Of Language Proficiency"] instanceof Date ? row["Date Of Language Proficiency"].toLocaleDateString() : row["Date Of Language Proficiency"]}</td>
                                            <td>{row["Appointment Date To Present Status"] instanceof Date ? row["Appointment Date To Present Status"].toLocaleDateString() : row["Appointment Date To Present Status"]}</td>
                                            <td>{formatDayMonth(row["Increment Date"])}</td>
                                            <td>{row["Date Of Compulsory Retirement"] instanceof Date ? row["Date Of Compulsory Retirement"].toLocaleDateString() : row["Date Of Compulsory Retirement"]}</td>
                                            <td>{row["Present Status Date"] instanceof Date ? row["Present Status Date"].toLocaleDateString() : row["Present Status Date"]}</td>
                                            <td>{row["Grade"]}</td>
                                            <td>{row["III"] instanceof Date ? row["III"].toLocaleDateString() : row["III"]}</td>
                                            <td>{row["II"] instanceof Date ? row["II"].toLocaleDateString() : row["II"]}</td>
                                            <td>{row["I"] instanceof Date ? row["I"].toLocaleDateString() : row["I"]}</td>
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

            {isFieldModalOpen && (
                <div className="admin-personal-field-open-overlay">
                    <div className="admin-personal-field-open-content">
                        <div className="admin-personal-field-open-header-section">
                            <h2 className="admin-personal-field-open-model-title">Manage System Dynamic Fields</h2>
                            <button className="admin-personal-field-open-close" onClick={() => {
                                setIsFieldModalOpen(false); setEditingFieldId(null); setNewFieldData({
                                    fieldKey: "", displayName: "", fieldType: "text", required: false,
                                    isGlobal: true, employeeEmail: "", isAdminOnly: false
                                });
                            }}><X size={17} /></button>
                        </div>

                        <form onSubmit={handleFieldConfigSubmit} className="admin-personal-field-open-form-structured">
                            <div className="admin-personal-field-open-form-row">
                                <label className="admin-personal-field-open-form-label">Field Permission</label>
                                <select value={newFieldData.isAdminOnly} onChange={(e) => { setNewFieldData({ ...newFieldData, isAdminOnly: e.target.value === "true" }); }} className="admin-personal-field-open-form-input" required>
                                    <option value={true}>Admin Only</option>
                                    <option value={false}>Admin & Employee</option>
                                </select>
                            </div>

                            <div className="admin-personal-field-open-form-row">
                                <label className="admin-personal-field-open-form-label">Field Scope</label>
                                <select value={newFieldData.isGlobal ? "global" : "specific"} onChange={(e) => {
                                    const isGlbl = e.target.value === "global";
                                    setNewFieldData({ ...newFieldData, isGlobal: isGlbl, employeeEmail: isGlbl ? "" : newFieldData.employeeEmail });
                                }} className="admin-personal-field-open-form-input">
                                    <option value="global">Global</option>
                                    <option value="specific">Specific Employee Only</option>
                                </select>
                            </div>

                            {!newFieldData.isGlobal && (
                                <div className="admin-personal-field-open-form-row admin-personal-field-open-fade-in">
                                    <label className="admin-personal-field-open-form-label">Select Employee</label>
                                    <select value={newFieldData.employeeEmail} onChange={(e) => setNewFieldData({ ...newFieldData, employeeEmail: e.target.value })} className="admin-personal-field-open-form-input" required>
                                        <option value="">Choose Employee</option>
                                        {files.map((emp) => (
                                            <option key={emp.id} value={emp.email}>{emp.name || emp.username} ({emp.email})</option>))}
                                    </select>
                                </div>
                            )}

                            <div className="admin-personal-field-open-form-row">
                                <label className="admin-personal-field-open-form-label">Field Key</label>
                                <input type="text" placeholder="e.g. pensionNo" value={newFieldData.fieldKey} disabled={editingFieldId !== null} onChange={(e) => setNewFieldData({ ...newFieldData, fieldKey: e.target.value })} className="admin-personal-field-open-form-input-field" required />
                            </div>

                            <div className="admin-personal-field-open-form-row">
                                <label className="admin-personal-field-open-form-label">Display Name</label>
                                <input type="text" placeholder="e.g. Pension Number" value={newFieldData.displayName} onChange={(e) => setNewFieldData({ ...newFieldData, displayName: e.target.value })} className="admin-personal-field-open-form-input-field" required />
                            </div>

                            <div className="admin-personal-field-open-form-row">
                                <label className="admin-personal-field-open-form-label">Field Type</label>
                                <select value={newFieldData.fieldType} onChange={(e) => setNewFieldData({ ...newFieldData, fieldType: e.target.value })} className="admin-personal-field-open-form-input">
                                    <option value="text">Text Box</option>
                                    <option value="number">Number Box</option>
                                    <option value="date">Date Picker</option>
                                </select>
                            </div>

                            <div className="admin-personal-field-open-form-row admin-personal-field-open-checkbox-row">
                                <input type="checkbox" checked={newFieldData.required} onChange={(e) => setNewFieldData({ ...newFieldData, required: e.target.checked })} id="field-required-chk" />
                                <label htmlFor="field-required-chk">This Field is Required</label>
                            </div>

                            <div className="admin-personal-field-open-submit-container">
                                <button type="submit" className="admin-personal-field-open-btn-update"> {editingFieldId ? "Update Configuration" : "Add Field to System"} </button>
                            </div>
                        </form>

                        <div className="admin-personal-field-open-existing-section">
                            <h4 className="admin-personal-field-open-sub-title">Existing Fields List</h4>
                            {dynamicFieldConfigs.length === 0 ? (
                                <p className="admin-personal-field-open-empty-text">No dynamic fields registered yet.</p>
                            ) : (
                                <div className="admin-personal-field-open-table-container">
                                    <table className="admin-personal-field-open-preview-table">
                                        <thead>
                                            <tr>
                                                <th>Scope</th>
                                                <th>Permission</th>
                                                <th>Key</th>
                                                <th>Label</th>
                                                <th>Type</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dynamicFieldConfigs.map((field) => (
                                                <tr key={field.id}>
                                                    <td>
                                                        {(field.isGlobal === true || String(field.isGlobal).toLowerCase() === "true") ? (
                                                            <span className="badge-global" style={{ color: 'green', fontWeight: 'bold' }}>Global</span>
                                                        ) : (
                                                            <div>
                                                                <span className="badge-specific" style={{ color: '#e76f51', fontWeight: 'bold' }}>Specific</span>
                                                                <br />
                                                                <small title={field.employeeEmail} className="admin-personal-field-open-table-small">
                                                                    {files.find(emp => emp.email === field.employeeEmail)?.name ||
                                                                        files.find(emp => emp.email === field.employeeEmail)?.username ||
                                                                        field.employeeEmail || "No Employee Assigned"}
                                                                </small>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {String(field.isAdminOnly) === "true" ? (
                                                            <span style={{ fontWeight: 'bold', color: '#c1121f' }}>Admin Only</span>
                                                        ) : (
                                                            <span style={{ fontWeight: 'bold', color: '#0077b6' }}>Admin & Employee</span>
                                                        )}
                                                    </td>
                                                    <td>{field.fieldKey}</td>
                                                    <td>{field.displayName} {field.required}</td>
                                                    <td>{field.fieldType}</td>
                                                    <td>
                                                        <button type="button" className="admin-personal-field-open-table-btn-edit" onClick={() => handleEditFieldClick(field)}><Pencil size={13} /></button>
                                                        <button type="button" className="admin-personal-field-open-table-btn-delete" onClick={() => handleDeleteFieldClick(field.id)}><Trash2 size={13} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
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
                                    <img src={formData.profileImage} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
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
                                <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
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
                                <select name="gender" value={formData.gender} onChange={handleInputChange} className="admin-personal-form-input">
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Phone Number</label>
                                <input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Designation</label>
                                <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} className="admin-personal-form-input-field" />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Department</label>
                                <select name="department" value={formData.department} onChange={handleInputChange} className="admin-personal-form-input" required={false}>
                                    <option value="">Select Department</option>
                                    {departments.map((d) => (<option key={d.id} value={d.name}>{d.name}</option>))}
                                </select>
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of First Appointment</label>
                                <input type="date" name="dateOfFirstAppointment" value={formData.dateOfFirstAppointment} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Appointment Date To Present Status</label>
                                <input type="date" name="appointmentDateToPresentStatus" value={formData.appointmentDateToPresentStatus} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Increment Date</label>
                                <div className="admin-personal-input-group">
                                    <input
                                        type="text"
                                        name="incrementDate"
                                        placeholder="MM-DD (e.g. 04-20)"
                                        value={isDateFocused ? (formData.incrementDate || "") : formatDayMonth(formData.incrementDate)}
                                        onChange={handleInputChange}
                                        onFocus={() => setIsDateFocused(true)}
                                        onBlur={() => setIsDateFocused(false)}
                                        className="admin-personal-form-input-field" />
                                </div>
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Duty Place</label>
                                <input type="text" name="dutyPlace" value={formData.dutyPlace} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Grade</label>
                                <input type="text" name="grade" value={formData.grade} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of Language Proficiency</label>
                                <input type="text" name="dateOfLanguageProficiency" value={formData.dateOfLanguageProficiency} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Salary Scale</label>
                                <input type="text" name="salaryScale" value={formData.salaryScale} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of Compulsory Retirement</label>
                                <input type="date" name="dateOfCompulsoryRetirement" value={formData.dateOfCompulsoryRetirement} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Present Status Date</label>
                                <input type="date" name="presentStatusDate" value={formData.presentStatusDate} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of Receipt GradeI</label>
                                <input type="date" name="dateOfReceiptGradeI" value={formData.dateOfReceiptGradeI} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of Receipt GradeII</label>
                                <input type="date" name="dateOfReceiptGradeII" value={formData.dateOfReceiptGradeII} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
                            </div>

                            <div className="admin-personal-form-row">
                                <label className="admin-personal-form-label">Date Of Receipt GradeIII</label>
                                <input type="date" name="dateOfReceiptGradeIII" value={formData.dateOfReceiptGradeIII} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
                            </div>

                            {dynamicFieldConfigs
                                .filter(field => field.isGlobal || (formData.email && field.employeeEmail === formData.email))
                                .map((field) => (
                                    <div className="admin-personal-form-row" key={field.id}>
                                        <label className="admin-personal-form-label">
                                            {field.displayName} {field.required && <span style={{ color: 'red' }}>*</span>}
                                        </label>
                                        <input
                                            type={field.fieldType}
                                            name={field.fieldKey}
                                            value={formData.dynamicFields?.[field.fieldKey] || ""}
                                            onChange={handleDynamicInputChange}
                                            className="admin-personal-form-input-field"
                                            required={false}
                                        />
                                    </div>
                                ))}

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