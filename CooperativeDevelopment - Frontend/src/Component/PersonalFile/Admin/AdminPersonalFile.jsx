import {
    useEffect,
    useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import API from '../../API/Axios';

import { jsPDF } from 'jspdf';

import autoTable from 'jspdf-autotable'

import * as XLSX from 'xlsx';

import { GoArrowSwitch } from "react-icons/go";

import {
    CheckSquare,
    Download,
    FileText,
    Pencil,
    RotateCcw,
    Search,
    Square,
    Trash2,
    X,
    Columns,
    Printer
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

    const [activeFilters, setActiveFilters] = useState({});

    const [dynamicFieldConfigs, setDynamicFieldConfigs] = useState([]);
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);

    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedDay, setSelectedDay] = useState("");
    const [isDateFocused, setIsDateFocused] = useState(false);

    const [designationsSummary, setDesignationsSummary] = useState([]);
    const [designationEmployees, setDesignationEmployees] = useState([]);
    const [loadingDesignationData, setLoadingDesignationData] = useState(false);

    const [showDeactive, setShowDeactive] = useState(false);

    const [reasonModalOpen, setReasonModalOpen] = useState(false);
    const [reasonModalType, setReasonModalType] = useState("");
    const [reasonsList, setReasonsList] = useState([]);
    const [selectedReason, setSelectedReason] = useState("");
    const [newReasonText, setNewReasonText] = useState("");
    const [targetEmployeeId, setTargetEmployeeId] = useState(null);
    const [selectedReasonFilter, setSelectedReasonFilter] = useState("");

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState([]);

    const [newFieldData, setNewFieldData] = useState({
        fieldKey: "",
        displayName: "",
        fieldType: "text",
        required: false,
        scope: "GLOBAL",
        targetDesignations: [],
        employeeEmail: "",
        isAdminOnly: false
    });

    const [editingFieldId, setEditingFieldId] = useState(null);

    const initialFormState = {
        name: "", email: "", password: "", username: "",
        phoneNumber: "", emergencyContact: "", designation: "", nic: "", address: "", dutyPlace: "",
        grade: "", salaryScale: "", salary: "", department: "", gender: "",
        dateOfBirth: "", dateOfFirstAppointment: "", appointmentDateToPresentStatus: "",
        incrementDate: "", dateOfReceiptGradeI: "", dateOfReceiptGradeII: "",
        dateOfReceiptGradeIII: "", dateOfCompulsoryRetirement: "", dateOfReceiptOfRelevantGrade: "",
        firstAppointmentDate: "", presentStatusDate: "", wnopNumber: "",
        profileImage: null, serviceNumber: "", dateOfLanguageProficiency: "", dynamicFields: {}, status: "Active"
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleFilterChange = (columnKey, value) => {
        setActiveFilters(prev => {
            const updated = { ...prev };
            if (value === "") {
                delete updated[columnKey];
            } else {
                updated[columnKey] = value;
            }
            return updated;
        });
    };

    const removeFilter = (columnKey) => {
        setActiveFilters(prev => {
            const updated = { ...prev };
            delete updated[columnKey];
            return updated;
        });
    };

    const fetchDesignationsSummary = async () => {
        try {
            const response = await API.get("/dynamic-fields/designations-summary");
            setDesignationsSummary(response.data);
        } catch (error) {
            console.error("Error fetching designations summary:", error);
        }
    };

    const fetchEmployeesByDesignation = async (designationName) => {
        if (!designationName) {
            setDesignationEmployees([]);
            return;
        }
        setLoadingDesignationData(true);
        try {
            const response = await API.get(`/dynamic-fields/employees-by-designation?designation=${encodeURIComponent(designationName)}`);
            setDesignationEmployees(response.data);
        } catch (error) {
            console.error("Error fetching employees by designation:", error);
        } finally {
            setLoadingDesignationData(false);
        }
    };

    useEffect(() => {
        if (isFieldModalOpen) {
            fetchDesignationsSummary();
        }
    }, [isFieldModalOpen]);


    const handleNewFieldInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === "checkbox" ? checked : value;

        setNewFieldData(prev => {
            const updated = { ...prev, [name]: val };

            if (name === "targetDesignation") {
                fetchEmployeesByDesignation(value);
            }

            if (name === "scope" && value !== "DESIGNATION") {
                updated.targetDesignation = "";
                setDesignationEmployees([]);
            }

            return updated;
        });
    };

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

                const duplicateEmployees = rows.filter(row => {
                    const rowNic = row["National ID"] || row["nic"];
                    return files.some(emp =>
                        emp.nic && rowNic &&
                        String(emp.nic).trim().toLowerCase() === String(rowNic).trim().toLowerCase()
                    );
                });

                if (duplicateEmployees.length > 0) {
                    const duplicateNames = duplicateEmployees
                        .map(emp => `• ${emp["Name Of The Employee"] || "Employee"} (NIC: ${emp["National ID"]})`)
                        .join("\n");

                    setTimeout(() => {
                        alert(
                            `⚠️ Notice: System Existing Employees Detected!\n\n` +
                            `The following employee(s) in this Excel file are ALREADY REGISTERED in the system:\n\n` +
                            `${duplicateNames}\n\n` +
                            `Clicking "Upload Employees" will ONLY UPDATE their existing profile data with the new details from Excel.`
                        );
                    }, 300);
                }
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const handleBulkUpload = async () => {
        if (!excelFile) return;

        const duplicateCount = previewData.filter(row => {
            const rowNic = row["National ID"] || row["nic"];
            return files.some(emp =>
                emp.nic && rowNic &&
                String(emp.nic).trim().toLowerCase() === String(rowNic).trim().toLowerCase()
            );
        }).length;

        if (duplicateCount > 0) {
            const confirmUpload = window.confirm(
                `⚠️ Found ${duplicateCount} employee(s) that already exist in the system.\n\n` +
                `Existing records will be UPDATED with the new Excel data.\n\n` +
                `Do you want to proceed with the upload?`
            );

            if (!confirmUpload) {
                return;
            }
        }

        const formData = new FormData();
        formData.append("file", excelFile);

        try {
            setLoading(true);
            const response = await API.post('/personalfile/upload-employees', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data) {
                alert(`✅ ${response.data}`);
            } else {
                alert("✅ Excel process completed successfully!");
            }

            setIsPreviewOpen(false);
            setExcelFile(null);
            fetchFiles();
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data || err.message;
            alert("❌ Upload failed: " + errorMessage);
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

    useEffect(() => {
        const loadEmployees = async () => {
            setLoading(true);
            try {
                let res;
                if (showDeactive) {
                    res = await API.get('/personalfile/employees/deactivated');
                } else {
                    res = await API.get('/personalfile/all-employees');
                }
                setFiles(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadEmployees();
    }, [showDeactive]);

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
        const isAllFilteredSelected = filteredFiles.length > 0 &&
            filteredFiles.every(f => selectedIds.includes(f.id));

        if (isAllFilteredSelected) {
            const filteredIds = filteredFiles.map(f => f.id);
            setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
        } else {
            const filteredIds = filteredFiles.map(f => f.id);
            setSelectedIds(prev => {
                const uniqueIds = new Set([...prev, ...filteredIds]);
                return Array.from(uniqueIds);
            });
        }
    };

    const allAvailableColumns = [
        { key: "username", label: "Name Of The Employee" },
        { key: "email", label: "Email" },
        { key: "nic", label: "National ID" },
        { key: "phoneNumber", label: "Phone Number" },
        { key: "emergencyContact", label: "Emergency Contact" },
        { key: "address", label: "Address" },
        { key: "dateOfBirth", label: "Date Of Birth" },
        { key: "gender", label: "Gender" },
        { key: "serviceNumber", label: "Service Number" },
        { key: "wnopNumber", label: "WNOP Number" },
        { key: "designation", label: "Designation" },
        { key: "department", label: "Department" },
        { key: "dutyPlace", label: "Duty Place" },
        { key: "salaryScale", label: "Salary Scale" },
        { key: "salary", label: "Salary" },
        { key: "dateOfFirstAppointment", label: "Date Of First Appointment" },
        { key: "dateOfLanguageProficiency", label: "Date Of Language Proficiency" },
        { key: "appointmentDateToPresentStatus", label: "Appointment Date To Present Status" },
        { key: "incrementDate", label: "Increment Date" },
        { key: "dateOfCompulsoryRetirement", label: "Date Of Compulsory Retirement" },
        { key: "presentStatusDate", label: "Present Status Date" },
        { key: "grade", label: "Grade" },
        { key: "dateOfReceiptGradeIII", label: "Grade III Receipt Date" },
        { key: "dateOfReceiptGradeII", label: "Grade II Receipt Date" },
        { key: "dateOfReceiptGradeI", label: "Grade I Receipt Date" },
        ...dynamicFieldConfigs.map(f => ({ key: `dynamic_${f.fieldKey}`, label: f.displayName, isDynamic: true, fieldKey: f.fieldKey }))
    ];

    const handleOpenReportModal = () => {
        if (selectedIds.length === 0) return alert("Select employees first!");
        setSelectedColumns(["username"]);
        setIsReportModalOpen(true);
    };

    const toggleColumnSelection = (key) => {
        if (key === "username") return;
        setSelectedColumns(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const generatePDF = () => {
        const dataToExport = filteredFiles.filter(f => selectedIds.includes(f.id));
        if (dataToExport.length === 0) return alert("Select employees first!");

        const activeCols = allAvailableColumns.filter(c => selectedColumns.includes(c.key));

        const orientation = activeCols.length > 5 ? 'landscape' : 'portrait';

        const doc = new jsPDF({
            orientation: orientation,
            format: 'a4'
        });

        doc.setFontSize(16);
        doc.text("Department of Cooperative Development - Staff Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

        const tableColumn = activeCols.map(c => c.label);

        const tableRows = dataToExport.map(emp => {
            return activeCols.map(col => {
                if (col.isDynamic) {
                    return emp.dynamicFields?.[col.fieldKey] || "-";
                }
                if (['dateOfBirth', 'dateOfFirstAppointment', 'appointmentDateToPresentStatus', 'dateOfCompulsoryRetirement', 'presentStatusDate', 'dateOfReceiptGradeI', 'dateOfReceiptGradeII', 'dateOfReceiptGradeIII'].includes(col.key)) {
                    return formatDate(emp[col.key]);
                }
                if (col.key === 'incrementDate') {
                    return formatDayMonth(emp[col.key]);
                }
                return emp[col.key] || "-";
            });
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            styles: { fontSize: activeCols.length > 5 ? 8 : 10 }
        });

        doc.save("Employee_Report.pdf");
    };

    const handlePrint = () => {
        const dataToExport = filteredFiles.filter(f => selectedIds.includes(f.id));
        if (dataToExport.length === 0) return alert("Select employees first!");

        const activeCols = allAvailableColumns.filter(c => selectedColumns.includes(c.key));

        let tableHtml = `<table border="1" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 12px;">`;
        tableHtml += `<tr style="background-color: #f2f2f2;"><th>No</th>`;
        activeCols.forEach(col => {
            tableHtml += `<th style="padding: 8px;">${col.label}</th>`;
        });
        tableHtml += `</tr>`;

        dataToExport.forEach((emp, index) => {
            tableHtml += `<tr><td style="padding: 8px; text-align: center;">${index + 1}</td>`;
            activeCols.forEach(col => {
                let cellValue = "-";
                if (col.isDynamic) {
                    cellValue = emp.dynamicFields?.[col.fieldKey] || "-";
                } else if (['dateOfBirth', 'dateOfFirstAppointment', 'appointmentDateToPresentStatus', 'dateOfCompulsoryRetirement', 'presentStatusDate', 'dateOfReceiptGradeI', 'dateOfReceiptGradeII', 'dateOfReceiptGradeIII'].includes(col.key)) {
                    cellValue = formatDate(emp[col.key]);
                } else if (col.key === 'incrementDate') {
                    cellValue = formatDayMonth(emp[col.key]);
                } else {
                    cellValue = emp[col.key] || "-";
                }
                tableHtml += `<td style="padding: 8px;">${cellValue}</td>`;
            });
            tableHtml += `</tr>`;
        });
        tableHtml += `</table>`;

        const printWindow = window.open('', '_blank', 'height=600,width=800');
        printWindow.document.write(`
            <html>
            <head>
                <title>Print Employee Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h2 { margin-bottom: 5px; }
                    p { color: #555; font-size: 13px; margin-top: 0; margin-bottom: 20px; }
                    @page { size: auto; margin: 20mm; }
                </style>
            </head>
            <body>
                <h2>Department of Cooperative Development - Staff Report</h2>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                ${tableHtml}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    const generateWord = () => {
        const dataToExport = filteredFiles.filter(f => selectedIds.includes(f.id));
        if (dataToExport.length === 0) return alert("Select employees first!");

        const activeCols = allAvailableColumns.filter(c => selectedColumns.includes(c.key));

        let tableHtml = `<table border="1" style="border-collapse: collapse; width: 100%;">`;

        tableHtml += `<tr style="background-color: #f2f2f2;"><th>No</th>`;
        activeCols.forEach(col => {
            tableHtml += `<th>${col.label}</th>`;
        });
        tableHtml += `</tr>`;

        dataToExport.forEach((emp, index) => {
            tableHtml += `<tr><td>${index + 1}</td>`;
            activeCols.forEach(col => {
                let cellValue = "-";
                if (col.isDynamic) {
                    cellValue = emp.dynamicFields?.[col.fieldKey] || "-";
                } else if (['dateOfBirth', 'dateOfFirstAppointment', 'appointmentDateToPresentStatus', 'dateOfCompulsoryRetirement', 'presentStatusDate', 'dateOfReceiptGradeI', 'dateOfReceiptGradeII', 'dateOfReceiptGradeIII'].includes(col.key)) {
                    cellValue = formatDate(emp[col.key]);
                } else if (col.key === 'incrementDate') {
                    cellValue = formatDayMonth(emp[col.key]);
                } else {
                    cellValue = emp[col.key] || "-";
                }
                tableHtml += `<td>${cellValue}</td>`;
            });
            tableHtml += `</tr>`;
        });
        tableHtml += `</table>`;

        const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><title>Employee Report</title><style>body { font-family: Arial; }</style></head>
        <body>
            <h2>Department of Cooperative Development - Staff Report</h2>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            ${tableHtml}
        </body>
        </html>
        `;

        const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Employee_Report_${new Date().toISOString().split('T')[0]}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generateExcel = () => {
        const dataToExport = filteredFiles.filter(f => selectedIds.includes(f.id));
        if (dataToExport.length === 0) return alert("Select employees first!");

        const activeCols = allAvailableColumns.filter(c => selectedColumns.includes(c.key));

        const headerRow = ["No", ...activeCols.map(c => c.label)];
        const excelRows = dataToExport.map((emp, index) => {
            const rowData = [index + 1];
            activeCols.forEach(col => {
                if (col.isDynamic) {
                    rowData.push(emp.dynamicFields?.[col.fieldKey] || "-");
                } else if (col.key === 'dateOfBirth' || col.key === 'dateOfFirstAppointment' || col.key === 'appointmentDateToPresentStatus' || col.key === 'dateOfCompulsoryRetirement' || col.key === 'presentStatusDate' || col.key === 'dateOfReceiptGradeI' || col.key === 'dateOfReceiptGradeII' || col.key === 'dateOfReceiptGradeIII') {
                    rowData.push(formatDate(emp[col.key]));
                } else if (col.key === 'incrementDate') {
                    rowData.push(formatDayMonth(emp[col.key]));
                } else {
                    rowData.push(emp[col.key] || "-");
                }
            });
            return rowData;
        });

        const ws = XLSX.utils.aoa_to_sheet([headerRow, ...excelRows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Filtered Employee Data");
        XLSX.writeFile(wb, `Employee_Custom_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
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

    const checkExistingEmployeeByNic = (inputNic) => {
        if (!inputNic || !isAddMode) return null;
        const cleanInputNic = String(inputNic).trim().toLowerCase();

        return files.find(file => {
            const existingNic = file.nic || file["National ID"];
            return existingNic && String(existingNic).trim().toLowerCase() === cleanInputNic;
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (isAddMode && name === "nic" && value.trim().length >= 9) {
            const matchedEmployee = checkExistingEmployeeByNic(value);
            if (matchedEmployee) {
                const confirmRedirect = window.confirm(
                    `⚠️ Alert: This NIC (${value}) is already registered for employee "${matchedEmployee.name || matchedEmployee.username}".\n\nDo you want to view/edit this employee's profile card instead?`
                );

                if (confirmRedirect) {
                    openEditModal(matchedEmployee);
                }
            }
        }
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
            emergencyContact: file.emergencyContact || file["Emergency Contact"] || "",
            address: file.address || file["Address"] || "",
            gender: file.gender || file["Gender"] || "",
            serviceNumber: file.serviceNumber || file["Service Number"] || "",
            wnopNumber: file.wnopNumber || file["WNOP Number"] || "",
            designation: file.designation || file["Designation"] || "",
            department: file.department || file["Department"] || "",
            dutyPlace: file.dutyPlace || file["Duty Place"] || "",
            salaryScale: file.salaryScale || file["Salary Scale"] || "",
            salary: file.salary || file["Salary"] || "",
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

            status: file.status || "Active",
            password: "",
            dynamicFields: file.dynamicFields || {}
        });
        setIsAddMode(false);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isAddMode && formData.nic) {
            const matchedEmployee = checkExistingEmployeeByNic(formData.nic);
            if (matchedEmployee) {
                const openProfile = window.confirm(
                    `❌ Alert: This NIC (${formData.nic}) is already registered in the system under "${matchedEmployee.name || matchedEmployee.username}".\n\nYou cannot create a new user with this NIC. Would you like to view this employee's profile?`
                );

                if (openProfile) {
                    openEditModal(matchedEmployee);
                }
                return;
            }
        }

        let preparedFormData = { ...formData };

        if (preparedFormData.email) {
            const emailStr = String(preparedFormData.email).trim();

            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

            const isPureNumbers = /^\d+$/.test(emailStr);

            if (isPureNumbers) {
                alert("❌ Email field cannot contain numbers only! Please enter a valid email address.");
                return;
            }
            if (!emailStr.includes("@") || !emailRegex.test(emailStr)) {
                alert("❌ Invalid Email! Email must contain '@' and follow a valid email format (e.g., user@example.com).");
                return;
            }
        }

        if (preparedFormData.phoneNumber) {
            const phoneStr = String(preparedFormData.phoneNumber).trim();
            if (!phoneStr.startsWith("0")) {
                alert("❌ Invalid Phone Number! The phone number must start with '0'.");
                return;
            }
        }
        if (preparedFormData.emergencyContact) {
            const emergencyStr = String(preparedFormData.emergencyContact).trim();
            if (!emergencyStr.startsWith("0")) {
                alert("❌ Invalid Emergency Contact! The emergency contact number must start with '0'.");
                return;
            }
        }

        if (preparedFormData.salary) {
            const salaryStr = String(preparedFormData.salary).trim();
            if (!salaryStr.includes(",")) {
                alert("❌ Invalid Salary Format! Salary must include a comma ',' separator (e.g., 45,000 or 120,000.00).");
                return;
            }
        }

        if (preparedFormData.incrementDate) {
            let dateStr = preparedFormData.incrementDate.trim();
            const currentYear = new Date().getFullYear();

            const dayMonthRegex = /^(\d{1,2})-([a-zA-Z]{3,9})$/;

            const mmDdRegex = /^(\d{1,2})-(\d{1,2})$/;

            if (dayMonthRegex.test(dateStr)) {
                const parts = dateStr.match(dayMonthRegex);
                const day = parts[1];
                const monthStr = parts[2].toLowerCase();

                const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
                const mIdx = monthNames.findIndex(m => monthStr.startsWith(m));

                if (mIdx !== -1) {
                    const formattedMonth = String(mIdx + 1).padStart(2, '0');
                    const formattedDay = String(day).padStart(2, '0');
                    preparedFormData.incrementDate = `${currentYear}-${formattedMonth}-${formattedDay}`;
                } else {
                    alert("❌ Invalid Month Name in Increment Date! Use standard month names (e.g., Jan, Apr, Dec).");
                    return;
                }
            } else if (mmDdRegex.test(dateStr)) {
                const parts = dateStr.split('-');
                const month = String(parts[0]).padStart(2, '0');
                const day = String(parts[1]).padStart(2, '0');
                preparedFormData.incrementDate = `${currentYear}-${month}-${day}`;
            } else {
                alert("❌ Invalid Increment Date Format! Please use '20-Apr' or '04-20' format.");
                return;
            }
        }

        const dateFieldsToCheck = [
            "dateOfBirth", "dateOfFirstAppointment", "appointmentDateToPresentStatus",
            "dateOfCompulsoryRetirement", "presentStatusDate",
            "dateOfReceiptGradeI", "dateOfReceiptGradeII", "dateOfReceiptGradeIII"
        ];

        for (const fieldName of dateFieldsToCheck) {
            if (preparedFormData[fieldName]) {
                const dateObj = new Date(preparedFormData[fieldName]);
                if (isNaN(dateObj.getTime())) {
                    alert(`❌ Invalid Date format in field! Please re-check selected dates.`);
                    return;
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
                alert("✅ New User Added Successfully after Validation!");
            } else {
                await API.put(`/personalfile/update-profile?id=${formData.id}`, preparedFormData);
                alert("✅ Profile Updated Successfully after Validation!");
            }
            setIsModalOpen(false);
            fetchFiles();
        } catch (err) {
            console.error("Update Error:", err);
            alert("❌ Error: " + (err.response?.data || err.message));
        }
    };

    const fetchReasons = async (type) => {
        try {
            const res = await API.get(`/deactivation-reasons/type/${type}`);
            setReasonsList(res.data);
        } catch (err) {
            console.error("Error fetching reasons", err);
        }
    };

    const handleAddCustomReason = async () => {
        if (!newReasonText.trim()) return alert("Please enter a reason.");
        try {
            await API.post('/deactivation-reasons/add', {
                reasonText: newReasonText,
                type: reasonModalType
            });
            setNewReasonText("");
            fetchReasons(reasonModalType);
            alert("✅ New reason added successfully!");
        } catch (err) {
            alert("❌ Failed to add reason");
        }
    };

    const handleDeleteCustomReason = async (id) => {
        if (!window.confirm("Delete this reason?")) return;
        try {
            await API.delete(`/deactivation-reasons/delete/${id}`);
            fetchReasons(reasonModalType);
        } catch (err) {
            alert("❌ Failed to delete reason");
        }
    };

    const handleDeactivateEmployee = (id) => {
        setTargetEmployeeId(id);
        setReasonModalType("DEACTIVATE");
        setSelectedReason("");
        fetchReasons("DEACTIVATE");
        setReasonModalOpen(true);
    };

    const handleActivateEmployee = (userId) => {
        setTargetEmployeeId(userId);
        setReasonModalType("ACTIVATE");
        setSelectedReason("");
        fetchReasons("ACTIVATE");
        setReasonModalOpen(true);
    };

    const getUniqueReasonsForStatus = () => {
        const deactivatedList = files.filter(f => f.status === "Deactivated" || f.active === false);
        const allReasons = deactivatedList.map(emp => emp.reason).filter(Boolean);
        return [...new Set(allReasons)].sort();
    };

    const getEmployeeCountByReason = (reasonText) => {
        const deactivatedList = files.filter(f => f.status === "Deactivated" || f.active === false);
        return deactivatedList.filter(emp => emp.reason === reasonText).length;
    };

    const handleStatusConfirmSubmit = async () => {
        if (!selectedReason) {
            alert("❌ Please select a reason before submitting!");
            return;
        }

        try {
            const endpoint = reasonModalType === "DEACTIVATE" ? "deactivate" : "activate";
            await API.put(`/personalfile/${targetEmployeeId}/${endpoint}?reason=${encodeURIComponent(selectedReason)}`);

            alert(`✅ Employee status updated to ${reasonModalType.toLowerCase()}d!`);
            setReasonModalOpen(false);
            setIsModalOpen(false);
            fetchFiles();
        } catch (err) {
            alert("❌ Action failed: " + (err.response?.data?.message || err.message));
        }
    };

    const handleFieldConfigSubmit = async (e) => {
        e.preventDefault();

        const isGlobalBoolean = newFieldData.scope === "GLOBAL";
        const isAdminOnlyBoolean = newFieldData.isAdminOnly === true;

        if (newFieldData.scope === "SPECIFIC" && !newFieldData.employeeEmail) {
            alert("❌ Please select an employee for specific field type!");
            return;
        }

        const payload = {
            fieldKey: newFieldData.fieldKey,
            displayName: newFieldData.displayName,
            fieldType: newFieldData.fieldType,
            required: newFieldData.required === true,
            isGlobal: isGlobalBoolean,
            employeeEmail: isGlobalBoolean ? "" : newFieldData.employeeEmail || "",
            isAdminOnly: isAdminOnlyBoolean,
            scope: newFieldData.scope ? newFieldData.scope.toUpperCase() : (newFieldData.isGlobal ? "GLOBAL" : "SPECIFIC"),
            targetDesignations: newFieldData.scope === "DESIGNATION" ? newFieldData.targetDesignations : []
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
                fieldKey: "",
                displayName: "",
                fieldType: "text",
                required: false,
                scope: "GLOBAL",
                employeeEmail: "",
                targetDesignations: [],
                isAdminOnly: false
            });
            setEditingFieldId(null);
            setIsFieldModalOpen(false);
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
            fieldKey: field.fieldKey,
            displayName: field.displayName,
            fieldType: field.fieldType,
            required: field.required === true || String(field.required).toLowerCase() === "true",
            isGlobal: isDbGlobal,
            employeeEmail: field.employeeEmail || "",
            isAdminOnly: isDbAdmin,
            scope: field.scope ? field.scope.toUpperCase() : "GLOBAL",
            targetDesignations: field.targetDesignations || []
        });

        if (field.scope === "DESIGNATION" && field.targetDesignation) {
            fetchEmployeesByDesignation(field.targetDesignation);
        }

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

    const activeEmployeesOnly = files.filter(f => f.active === true || f.active === undefined);
    const deactiveEmployeesOnly = files.filter(f => f.active === false);

    const getUniqueValuesForColumn = () => {
        if (!selectedColumnFilter) return [];

        const targetList = showDeactive ? deactiveEmployeesOnly : activeEmployeesOnly;

        const allVals = targetList.map(emp => {
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

        const targetList = showDeactive ? deactiveEmployeesOnly : activeEmployeesOnly;

        const partsList = targetList.map(emp => {
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
        const targetList = showDeactive ? deactiveEmployeesOnly : activeEmployeesOnly;

        return targetList.filter(user => {
            let userVal = "";

            if (currentSelectedColumn?.isDynamic) {
                userVal = user.dynamicFields?.[selectedColumnFilter];
            } else {
                userVal = user[selectedColumnFilter];
                if (currentSelectedColumn?.isDayMonth && userVal) {
                    userVal = formatDayMonth(userVal);
                }
            }

            const normalizedUserVal = userVal ? String(userVal).trim().toLowerCase() : "not specified";
            const normalizedTargetVal = value ? String(value).trim().toLowerCase() : "not specified";

            return normalizedUserVal === normalizedTargetVal;
        }).length;
    };

    const getDatePartCount = (type, partValue) => {
        if (!selectedColumnFilter) return 0;
        const targetList = showDeactive ? deactiveEmployeesOnly : activeEmployeesOnly;

        return targetList.filter(user => {
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
        if (showDeactive) {
            if (f.status !== "Deactivated" && f.active !== false) return false;

            if (selectedReasonFilter && f.reason !== selectedReasonFilter) {
                return false;
            }
        } else {
            if (f.status === "Deactivated" || f.active === false) return false;
        }

        const searchLower = searchTerm.toLowerCase().trim();
        let matchesSearch = true;

        if (searchLower) {
            const standardFieldsMatch = Object.entries(f).some(([key, value]) => {
                if (key === 'profileImage' || !value) return false;
                return String(value).toLowerCase().includes(searchLower);
            });

            const dynamicFieldsMatch = f.dynamicFields ?
                Object.values(f.dynamicFields).some(value =>
                    value && String(value).toLowerCase().includes(searchLower)
                ) : false;

            matchesSearch = standardFieldsMatch || dynamicFieldsMatch;
        }

        if (!matchesSearch) return false;

        const matchesAllFilters = Object.entries(activeFilters).every(([columnKey, filterValue]) => {
            const columnConfig = filterableColumns.find(c => c.key === columnKey);

            let employeeValue = "";
            if (columnConfig?.isDynamic) {
                employeeValue = f.dynamicFields?.[columnKey];
            } else {
                employeeValue = f[columnKey];
                if (columnConfig?.isDayMonth && employeeValue) {
                    employeeValue = formatDayMonth(employeeValue);
                }
            }

            const normalizedEmpVal = employeeValue ? String(employeeValue).trim().toLowerCase() : "not specified";
            const normalizedFilterVal = filterValue ? String(filterValue).trim().toLowerCase() : "";

            return normalizedEmpVal === normalizedFilterVal;
        });

        if (isCurrentColumnDate) {
            let dateVal = currentSelectedColumn?.isDynamic ? f.dynamicFields?.[selectedColumnFilter] : f[selectedColumnFilter];
            if (!dateVal) return false;

            const dateStr = String(dateVal).split('T')[0];
            const parts = dateStr.split('-');

            let empYear = "", empMonth = "", empDay = "";
            if (parts.length === 3) {
                empYear = parts[0]; empMonth = parts[1]; empDay = parts[2];
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

            return matchesYear && matchesMonth && matchesDay && matchesAllFilters;
        }

        return matchesAllFilters;
    });

    const resetFilters = () => {
        setActiveFilters({});
        setSelectedColumnFilter("");
        setSelectedYear("");
        setSelectedMonth("");
        setSelectedDay("");
        setSelectedReasonFilter("");
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

            <div className="filter-controls-toolbar-container">
                <div className="filter-controls-toolbar">
                    <div className="filter-controls-left">
                        <div className="bulk-action-toolbar-inner">
                            <span className="selected-count-badge" data-count={selectedIds.length}>{selectedIds.length} Selected</span>

                            <button onClick={handleOpenReportModal} className="admin-personal-generate-report" disabled={selectedIds.length === 0}>
                                <Columns size={13} /> Generate Reports
                            </button>

                            <button onClick={handleBulkDelete} className="admin-personal-bulk" disabled={selectedIds.length === 0}><Trash2 size={13} /> Delete</button>
                            <button onClick={() => setSelectedIds([])} className="admin-personal-details-bulk" disabled={selectedIds.length === 0}>Cancel</button>
                        </div>
                    </div>

                    <div className="filter-controls-right">
                        <div className="filter-dropdown-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select value={selectedColumnFilter}
                                onChange={(e) => {
                                    setSelectedColumnFilter(e.target.value);
                                    setSelectedValueFilter("");
                                }}
                                className="admin-filter-dropdown"
                            >
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
                                <select
                                    value={activeFilters[selectedColumnFilter] || ""}
                                    disabled={!selectedColumnFilter}
                                    onChange={(e) => handleFilterChange(selectedColumnFilter, e.target.value)}
                                    className="admin-filter-dropdown"
                                >
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

                            {(selectedColumnFilter || Object.keys(activeFilters).length > 0 || selectedYear || selectedMonth || selectedDay) && (
                                <button onClick={resetFilters} className="btn-filter-reset" title="Clear Filters"><RotateCcw size={14} /></button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="custom-switch-row-section">
                    <div className="custom-animated-switch-wrapper" onClick={() => {
                        setShowDeactive(!showDeactive);
                        setSelectedIds([]);
                        setSelectedReasonFilter("");
                    }}>
                        <div className={`custom-switch-btn-icon ${showDeactive ? 'is-deactive' : 'is-active'}`}>
                            <GoArrowSwitch size={15} />
                        </div>
                        <span className="custom-switch-text-label">
                            {showDeactive
                                ? `Deactivated Employees: ${deactiveEmployeesOnly.length}`
                                : `Currently Active Employees: ${activeEmployeesOnly.length}`
                            }
                        </span>
                    </div>
                </div>

                {showDeactive && (
                    <div className="filter-dropdown-group" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                        <select
                            value={selectedReasonFilter}
                            onChange={(e) => setSelectedReasonFilter(e.target.value)}
                            className="admin-filter-dropdown"
                            style={{ minWidth: '220px' }}
                        >
                            <option value="">All Deactivation Reasons</option>
                            {getUniqueReasonsForStatus().map((reason, idx) => (
                                <option key={idx} value={reason}>
                                    {reason} ({getEmployeeCountByReason(reason)})
                                </option>
                            ))}
                        </select>

                        {selectedReasonFilter && (
                            <button
                                onClick={() => setSelectedReasonFilter("")}
                                className="btn-filter-reset"
                                title="Clear Reason Filter"
                            >
                                <RotateCcw size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="active-filter-tags">
                {Object.entries(activeFilters).map(([key, value]) => {
                    const label = filterableColumns.find(c => c.key === key)?.label || key;
                    return (
                        <div key={key} className="active-filter-tag-item">
                            <span className="active-filter-tag-label">{label}:</span>
                            <span className="active-filter-tag-value">{value}</span>
                            <span className="active-filter-tag-close" title="Remove Filter">
                                <X size={14} onClick={() => removeFilter(key)} />
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="admin-personal-grid fade-in">
                {filteredFiles.length === 0 ? (
                    <div className="no-records-found">
                        <p>⚠️ No Employees Found Matching Your Search Criterion.</p>
                    </div>
                ) : (
                    filteredFiles.map((file) => (
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

                                {file.status === "Deactivated" && (
                                    <span className="status-badge deactivated" style={{ backgroundColor: '#ffccd5', color: '#c1121f', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', marginLeft: '5px', fontWeight: 'bold' }}>
                                        Deactivated
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isReportModalOpen && (
                <div className="admin-personal-modal-overlay" style={{ zIndex: 2500 }}>
                    <div className="admin-personal-modal-content" style={{ maxWidth: '1200px', width: '90%' }}>
                        <div className="admin-personal-admin-header-section">
                            <h2 className="admin-personal-model-title">Generate Custom Report</h2>
                            <button className="close-x" onClick={() => setIsReportModalOpen(false)}><X size={15} /></button>
                        </div>

                        <div className="report-config-container">
                            <div className="report-step-section">
                                <p className="report-step-title">Step 1: Select Columns to Include in the Report</p>
                                <div className="checkbox-grid">
                                    {allAvailableColumns.map(col => (
                                        <label key={col.key} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={selectedColumns.includes(col.key)}
                                                onChange={() => toggleColumnSelection(col.key)}
                                                className="checkbox-input"
                                            />
                                            <span className="checkbox-text">{col.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="report-step-section">
                                <p className="report-step-title">Step 2: Preview Selected Employees & Columns</p>

                                <div className="report-total-count">
                                    Total Selected: <span>{filteredFiles.filter(f => selectedIds.includes(f.id)).length} Employee</span>
                                </div>

                                {filteredFiles.filter(f => selectedIds.includes(f.id)).length === 0 ? (
                                    <p className="report-no-records-preview">
                                        ⚠️ No employees selected for preview. Please select employees from the main dashboard.
                                    </p>
                                ) : selectedColumns.length === 0 ? (
                                    <p className="report-no-records-preview">
                                        ⚠️ Please select at least one column from Step 1 to preview the data table.
                                    </p>
                                ) : (
                                    <div className="report-excel-preview-table-container">
                                        <table className="report-preview-table">
                                            <thead>
                                                <tr>
                                                    <th>No</th>
                                                    {allAvailableColumns
                                                        .filter(col => selectedColumns.includes(col.key))
                                                        .map(col => (
                                                            <th key={col.key}>{col.label}</th>
                                                        ))
                                                    }
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredFiles
                                                    .filter(f => selectedIds.includes(f.id))
                                                    .map((emp, index) => {
                                                        const activeCols = allAvailableColumns.filter(c => selectedColumns.includes(c.key));

                                                        return (
                                                            <tr key={emp.id || index}>
                                                                <td>{index + 1}</td>
                                                                {activeCols.map(col => {
                                                                    let cellValue = "-";

                                                                    if (col.isDynamic) {
                                                                        cellValue = emp.dynamicFields?.[col.fieldKey] || "-";
                                                                    }
                                                                    else if ([
                                                                        'dateOfBirth', 'dateOfFirstAppointment', 'appointmentDateToPresentStatus',
                                                                        'dateOfCompulsoryRetirement', 'presentStatusDate',
                                                                        'dateOfReceiptGradeI', 'dateOfReceiptGradeII', 'dateOfReceiptGradeIII'
                                                                    ].includes(col.key)) {
                                                                        cellValue = formatDate(emp[col.key]);
                                                                    }
                                                                    else if (col.key === 'incrementDate') {
                                                                        cellValue = formatDayMonth(emp[col.key]);
                                                                    }
                                                                    else {
                                                                        cellValue = emp[col.key] || "-";
                                                                    }

                                                                    return <td key={col.key}>{cellValue}</td>;
                                                                })}
                                                            </tr>
                                                        );
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="admin-personal-modal-footer">
                                <button type="button" onClick={generateExcel} className="admin-personal-excel"><Download size={14} /> Export Excel</button>
                                <button type="button" onClick={generateWord} className="admin-personal-word"><FileText size={14} /> Export Word</button>
                                <button type="button" onClick={generatePDF} className="admin-personal-pdf"><FileText size={14} /> Export PDF</button>
                                <button type="button" onClick={handlePrint} className="admin-personal-print"><Printer size={14} /> Print Report</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                        <th rowSpan="2">Emergency Contact</th>
                                        <th rowSpan="2">Address</th>
                                        <th rowSpan="2">Date Of Birth</th>
                                        <th rowSpan="2">Gender</th>
                                        <th rowSpan="2">Service Number</th>
                                        <th rowSpan="2">WNOP Number</th>
                                        <th rowSpan="2">Designation</th>
                                        <th rowSpan="2">Department</th>
                                        <th rowSpan="2">Duty Place</th>
                                        <th rowSpan="2">Salary Scale</th>
                                        <th rowSpan="2">Salary</th>
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
                                    {previewData.map((row, index) => {
                                        const isDuplicateNIC = files.some(emp =>
                                            emp.nic && row["National ID"] &&
                                            String(emp.nic).trim().toLowerCase() === String(row["National ID"]).trim().toLowerCase());

                                        return (
                                            <tr key={index} style={isDuplicateNIC ? { backgroundColor: '#eaf4ff', color: '#0056b3' } : {}}>
                                                <td>{row["No"]}</td>

                                                <td>
                                                    {row["Name Of The Employee"]}
                                                    {isDuplicateNIC && <span style={{ fontSize: '10px', marginLeft: '5px', fontWeight: 'bold', color: '#0077b6' }}>(Will be Updated)</span>}
                                                </td>

                                                <td>{row["Email"]}</td>

                                                <td style={isDuplicateNIC ? { fontWeight: 'bold', color: '#0056b3' } : {}}>{row["National ID"]}</td>

                                                <td>{row["Phone Number"]}</td>
                                                <td>{row["Emergency Contact"]}</td>
                                                <td>{row["Address"]}</td>
                                                <td>{formatDate(row["Date Of Birth"])}</td>
                                                <td>{row["Gender"]}</td>
                                                <td>{row["Service Number"]}</td>
                                                <td>{row["WNOP Number"]}</td>
                                                <td>{row["Designation"]}</td>
                                                <td>{row["Department"]}</td>
                                                <td>{row["Duty Place"]}</td>
                                                <td>{row["Salary Scale"]}</td>
                                                <td>{row["Salary"]}</td>
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
                                        );
                                    })}
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
                                setIsFieldModalOpen(false);
                                setEditingFieldId(null);
                                setNewFieldData({
                                    fieldKey: "", displayName: "", fieldType: "text", required: false,
                                    scope: "GLOBAL", targetDesignation: "", employeeEmail: "", isAdminOnly: false
                                });
                                setDesignationEmployees([]);
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
                                <select
                                    value={newFieldData.scope ? newFieldData.scope.toLowerCase() : (newFieldData.isGlobal ? "global" : "specific")}
                                    onChange={(e) => {
                                        const selectedScope = e.target.value;
                                        setNewFieldData({
                                            ...newFieldData,
                                            scope: selectedScope.toUpperCase(),
                                            isGlobal: selectedScope === "global",
                                            employeeEmail: "",
                                            targetDesignation: ""
                                        });
                                        setDesignationEmployees([]);
                                    }}
                                    className="admin-personal-field-open-form-input"
                                >
                                    <option value="global">Global (All Employees)</option>
                                    <option value="specific">Specific Employee Only</option>
                                    <option value="designation">By Designation</option>
                                </select>
                            </div>

                            {newFieldData.scope === "SPECIFIC" && (
                                <div className="admin-personal-field-open-form-row admin-personal-field-open-fade-in">
                                    <label className="admin-personal-field-open-form-label">Select Employee</label>
                                    <select value={newFieldData.employeeEmail} onChange={(e) => setNewFieldData({ ...newFieldData, employeeEmail: e.target.value })} className="admin-personal-field-open-form-input" required>
                                        <option value="">Choose Employee</option>
                                        {files.map((emp) => (
                                            <option key={emp.id} value={emp.email}>{emp.name || emp.username} ({emp.email})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {newFieldData.scope === "DESIGNATION" && (
                                <div className="admin-personal-field-open-form-row admin-personal-field-open-fade-in">
                                    <label className="admin-personal-field-open-form-label">Select Target Designations</label>
                                    <div className="designations-checkbox-list">
                                        {designationsSummary.map((item, index) => {
                                            const isChecked = newFieldData.targetDesignations.includes(item.designation);
                                            return (
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => {
                                                            const checkedList = [...newFieldData.targetDesignations];
                                                            if (e.target.checked) {
                                                                checkedList.push(item.designation);
                                                            } else {
                                                                const idx = checkedList.indexOf(item.designation);
                                                                if (idx > -1) checkedList.splice(idx, 1);
                                                            }
                                                            setNewFieldData({ ...newFieldData, targetDesignations: checkedList });
                                                        }}
                                                    />
                                                    <span>{item.designation} ({item.employeeCount})</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {newFieldData.scope === "DESIGNATION" && newFieldData.targetDesignation && (
                                <div className="admin-personal-field-open-form-row admin-personal-field-open-fade-in" style={{ paddingLeft: '5px' }}>
                                    <div>
                                        <span>👥 Employees with this Designation ({designationEmployees.length})</span>
                                        {loadingDesignationData ? (
                                            <p>Loading employees...</p>
                                        ) : designationEmployees.length === 0 ? (
                                            <p>No employees found for this designation.</p>
                                        ) : (
                                            <ul>
                                                {designationEmployees.map((emp) => (
                                                    <li key={emp.id}>
                                                        {emp.username || emp.name} ({emp.email})
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
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
                                                        {field.scope === "DESIGNATION" ? (
                                                            <div>
                                                                <span className="badge-designation" style={{ color: '#4e73df', fontWeight: 'bold' }}>Designation</span>
                                                                <br />
                                                                <small className="admin-personal-field-open-table-small" style={{ color: '#5a5c69', fontStyle: 'italic' }}>
                                                                    {field.targetDesignations && field.targetDesignations.length > 0
                                                                        ? field.targetDesignations.join(", ")
                                                                        : "No Designation Target"}
                                                                </small>
                                                            </div>
                                                        ) : (field.isGlobal === true || String(field.isGlobal).toLowerCase() === "true" || field.scope === "GLOBAL") ? (
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


            {reasonModalOpen && (
                <div className="admin-personal-modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="admin-personal-modal-content" style={{ maxWidth: '500px' }}>
                        <div className="admin-personal-admin-header-section">
                            <h2 className="admin-personal-model-title">
                                Reason to {reasonModalType === "DEACTIVATE" ? "Deactivate" : "Activate"} Employee
                            </h2>
                            <button className="close-x" onClick={() => setReasonModalOpen(false)}><X size={15} /></button>
                        </div>

                        <div style={{ padding: '15px 0' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', textTransform: 'uppercase' }}>
                                <input
                                    type="text"
                                    placeholder={`Add new ${reasonModalType.toLowerCase()} reason...`}
                                    value={newReasonText}
                                    onChange={(e) => setNewReasonText(e.target.value)}
                                    className="admin-personal-form-input-field"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCustomReason}
                                    className="admin-personal-details-add-department"
                                >Add</button>
                            </div>

                            <label className="admin-personal-form-label">Select Predefined Reason </label>
                            <select
                                value={selectedReason}
                                onChange={(e) => setSelectedReason(e.target.value)}
                                className="admin-personal-form-input"
                                required
                            >
                                <option value="">Choose a Reason</option>
                                {reasonsList.map((r) => (
                                    <option key={r.id} value={r.reasonText}>{r.reasonText}</option>
                                ))}
                            </select>

                            <div className="reasons-container">
                                <small className="reasons-title">Saved Reasons List (Click 🗑️ to remove)</small>

                                <div className="reasons-list">
                                    {reasonsList.map(r => (
                                        <div key={r.id} className="reason-item">
                                            <span className="reason-text">• {r.reasonText}</span>
                                            <Trash2
                                                className="delete-icon"
                                                onClick={() => handleDeleteCustomReason(r.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="admin-personal-modal-footer">
                            <button type="button" onClick={() => setReasonModalOpen(false)} className="btn-modal-cancel">Cancel</button>
                            <button
                                type="button"
                                onClick={handleStatusConfirmSubmit}
                                className="btn-modal-update"
                                style={{ backgroundColor: reasonModalType === "DEACTIVATE" ? '#c1121f' : '#2a9d8f', color: '#fff' }}
                            >
                                Confirm Action
                            </button>
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
                                <label className="admin-personal-form-label">Emergency Contact</label>
                                <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
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
                                <label className="admin-personal-form-label">Salary</label>
                                <input type="text" name="salary" value={formData.salary} onChange={handleInputChange} className="admin-personal-form-input-field" required={false} />
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
                                .filter(field => {
                                    if (field.isGlobal || field.scope === "GLOBAL") return true;

                                    if (field.scope === "DESIGNATION" && formData.designation &&
                                        field.targetDesignations?.includes(formData.designation)) {
                                        return true;
                                    }

                                    if ((field.scope === "SPECIFIC" || !field.isGlobal) && formData.email && field.employeeEmail === formData.email) {
                                        return true;
                                    }

                                    return false;
                                })
                                .map((field) => (
                                    <div className="admin-personal-form-row" key={field.id}>
                                        <label className="admin-personal-form-label">{field.displayName}</label>
                                        <input
                                            type={field.fieldType}
                                            name={field.fieldKey}
                                            value={formData.dynamicFields?.[field.fieldKey] || ""}
                                            onChange={handleDynamicInputChange}
                                            className="admin-personal-form-input-field"
                                        />
                                    </div>
                                ))}

                            <div className="admin-personal-modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-modal-cancel">Cancel</button>

                                {!isAddMode && formData.active === true && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeactivateEmployee(formData.id)}
                                        className="btn-modal-delete"
                                        style={{ backgroundColor: '#c1121f', color: '#fff' }}
                                    >
                                        Deactivate Employee
                                    </button>
                                )}

                                {!isAddMode && formData.active === false && (
                                    <button
                                        type="button"
                                        onClick={() => handleActivateEmployee(formData.id)}
                                        className="btn-modal-update"
                                        style={{ backgroundColor: '#2a9d8f', color: '#fff' }}
                                    >
                                        Activate Employee
                                    </button>
                                )}

                                <button type="submit" className="btn-modal-update">
                                    {isAddMode ? "Create User" : "Update Profile"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPersonalFile;