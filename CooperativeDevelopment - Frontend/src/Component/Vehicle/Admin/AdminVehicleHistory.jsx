import {
    useEffect,
    useState,
    useRef
} from 'react';

import api from '../../API/Axios';

import jsPDF from 'jspdf';

import autoTable from 'jspdf-autotable';

import '../../CSS/AdminVehicleHistory.css';

const AdminVehicleHistory = () => {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [selectedYear, setSelectedYear] = useState('ALL');
    const [selectedMonth, setSelectedMonth] = useState('ALL');

    const [availableYears, setAvailableYears] = useState([]);
    const [availableMonths, setAvailableMonths] = useState([]);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [isReportSetupOpen, setIsReportSetupOpen] = useState(false);
    const [reportType, setReportType] = useState('MONTHLY');
    const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
    const [reportMonth, setReportMonth] = useState(new Date().getMonth().toString());
    const [reportWeek, setReportWeek] = useState('1');
    const [reportData, setReportData] = useState([]);

    const [exportFormat, setExportFormat] = useState('PDF');
    const [paperSize, setPaperSize] = useState('A4');
    const [orientation, setOrientation] = useState('L');

    const previewRef = useRef(null);

    const monthNames = [
        { value: '0', name: 'January' }, { value: '1', name: 'February' },
        { value: '2', name: 'March' }, { value: '3', name: 'April' },
        { value: '4', name: 'May' }, { value: '5', name: 'June' },
        { value: '6', name: 'July' }, { value: '7', name: 'August' },
        { value: '8', name: 'September' }, { value: '9', name: 'October' },
        { value: '10', name: 'November' }, { value: '11', name: 'December' }
    ];

    useEffect(() => {
        const fetchAllRequests = async () => {
            try {
                const response = await api.get('/vehicle-requests/admin/all-requests');
                const data = response.data;
                setRequests(data);
                setFilteredRequests(data);

                const yearsSet = new Set();
                const monthsSet = new Set();

                data.forEach(req => {
                    if (req.travelDateTime) {
                        const date = new Date(req.travelDateTime);
                        yearsSet.add(date.getFullYear().toString());
                        monthsSet.add(date.getMonth().toString());
                    }
                });

                setAvailableYears([...yearsSet].sort((a, b) => b - a));
                setAvailableMonths([...monthsSet].sort((a, b) => a - b));
                setLoading(false);
            } catch (err) {
                console.error("❌ Error fetching requests:", err);
                setError("❌ Unable to obtain vehicle application details.");
                setLoading(false);
            }
        };

        fetchAllRequests();
    }, []);

    useEffect(() => {
        let tempRequests = requests;

        if (selectedStatus !== 'ALL') {
            tempRequests = tempRequests.filter(req => req.status === selectedStatus);
        }

        if (selectedYear !== 'ALL') {
            tempRequests = tempRequests.filter(req => {
                const reqYear = new Date(req.travelDateTime).getFullYear().toString();
                return reqYear === selectedYear;
            });
        }

        if (selectedMonth !== 'ALL') {
            tempRequests = tempRequests.filter(req => {
                const reqMonth = new Date(req.travelDateTime).getMonth().toString();
                return reqMonth === selectedMonth;
            });
        }

        if (searchTerm.trim() !== '') {
            const lowSearch = searchTerm.toLowerCase();
            tempRequests = tempRequests.filter(req =>
                (req.requesterName && req.requesterName.toLowerCase().includes(lowSearch)) ||
                (req.department && req.department.toLowerCase().includes(lowSearch)) ||
                (req.fromLocation && req.fromLocation.toLowerCase().includes(lowSearch)) ||
                (req.toLocation && req.toLocation.toLowerCase().includes(lowSearch))
            );
        }

        setFilteredRequests(tempRequests);
    }, [searchTerm, selectedStatus, selectedYear, selectedMonth, requests]);

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'status-pending';
            case 'APPROVED_BY_VEHICLE_ADMIN': return 'status-admin-approved';
            case 'APPROVED_BY_VEHICLE_APPROVAL_OFFICER': return 'status-officer-approved';
            case 'COMPLETED': return 'status-completed';
            case 'TRIP_PROCESS_CONFIRMED': return 'status-completed';
            case 'TRIP_STARTED': return 'status-ongoing';
            case 'REJECTED':
            case 'REJECTED_BY_VEHICLE_ADMIN':
            case 'EMPLOYEE_CANCELLED':
            case 'REJECTED_BY_VEHICLE_APPROVAL_OFFICER':
                return 'status-rejected';
            default: return 'status-default';
        }
    };

    const openDetailsModal = (request) => {
        setSelectedRequest(request);
        setIsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setSelectedRequest(null);
        setIsModalOpen(false);
    };

    const handleFilterReportData = () => {
        let temp = requests;

        temp = temp.filter(req => new Date(req.travelDateTime).getFullYear().toString() === reportYear);

        if (reportType === 'MONTHLY' || reportType === 'WEEKLY') {
            temp = temp.filter(req => new Date(req.travelDateTime).getMonth().toString() === reportMonth);
        }

        if (reportType === 'WEEKLY') {
            temp = temp.filter(req => {
                const date = new Date(req.travelDateTime).getDate();
                const weekNum = Math.ceil(date / 7);
                return weekNum.toString() === reportWeek;
            });
        }

        setReportData(temp);
    };

    useEffect(() => {
        if (isReportSetupOpen) {
            handleFilterReportData();
        }
    }, [reportType, reportYear, reportMonth, reportWeek, isReportSetupOpen, requests]);

    const generatePDFReport = () => {
        const orientationParam = orientation.toLowerCase() === 'p' ? 'p' : 'l';
        const paperSizeParam = paperSize.toLowerCase() === 'a3' ? 'a3' : 'a4';

        const doc = new jsPDF(orientationParam, 'mm', paperSizeParam);

        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text("DEPARTMENT OF COOPERATIVE DEVELOPMENT", pageWidth / 2, 20, { align: 'center' });

        doc.setTextColor(193, 18, 31);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("VEHICLE REQUEST MANAGEMENT SYSTEM", pageWidth / 2, 28, { align: 'center' });

        doc.setTextColor(51, 51, 51);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const focusPeriodStr = `SCOPE: ${reportType} SUMMARY | FOCUS PERIOD: ${reportYear} ${(reportType === 'MONTHLY' || reportType === 'WEEKLY') ? `- MONTH ${parseInt(reportMonth) + 1}` : ''
            } ${reportType === 'WEEKLY' ? `(WEEK ${reportWeek})` : ''}`;
        doc.text(focusPeriodStr.toUpperCase(), pageWidth / 2, 36, { align: 'center' });

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.line(15, 42, pageWidth - 15, 42);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL LOGS: ${reportData.length} REQUESTS COMPILED.`, 15, 50);

        doc.setFont('helvetica', 'normal');
        doc.text(`REPORT GENERATE DATE: ${new Date().toLocaleDateString()}`, pageWidth - 15, 50, { align: 'right' });

        const tableRows = reportData.map((req, index) => {
            const requesterCell = `${req.requesterName || 'N/A'}\n(${req.requesterEmail || 'N/A'})`;
            const journeyCell = `${req.fromLocation || ''} TO ${req.toLocation || ''}\nDISTANCE: ${req.distanceKm || 0} KM`;

            let resourceCell = 'NOT ASSIGNED';
            if (req.assignedVehicle || req.assignedDriver) {
                const vehicleStr = req.assignedVehicle ? `${req.assignedVehicle.vehicleNumber} (${req.assignedVehicle.manufacturer} ${req.assignedVehicle.model})` : '';
                const driverStr = req.assignedDriver ? `${req.assignedDriver.name} - ${req.assignedDriver.phoneNumber}` : '';
                resourceCell = [vehicleStr, driverStr].filter(Boolean).join('\n');
            }

            return [
                index + 1,
                requesterCell.toUpperCase(),
                journeyCell.toUpperCase(),
                resourceCell.toUpperCase()
            ];
        });

        const availableWidth = pageWidth - 30;
        const colWidths = {
            0: availableWidth * 0.08,
            1: availableWidth * 0.25,
            2: availableWidth * 0.42,
            3: availableWidth * 0.25
        };

        autoTable(doc, {
            startY: 56,
            margin: { left: 15, right: 15 },
            head: [['', 'NAME', 'JOURNEY (FROM - TO)', 'ASSIGNED VEHICLE AND DRIVERS']],
            body: tableRows,
            theme: 'grid',
            headStyles: {
                fillColor: [249, 250, 251],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center',
                lineColor: [209, 213, 223],
                lineWidth: 0.2
            },
            styles: {
                fontSize: 9,
                cellPadding: 4,
                textColor: [0, 0, 0],
                font: 'helvetica',
                halign: 'center',
                valign: 'middle'
            },
            alternateRowStyles: {
                fillColor: [252, 252, 252]
            },
            columnStyles: {
                0: { cellWidth: colWidths[0] },
                1: { cellWidth: colWidths[1] },
                2: { cellWidth: colWidths[2] },
                3: { cellWidth: colWidths[3] }
            }
        });

        let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 25 : 150;
        const pageHeight = doc.internal.pageSize.getHeight();

        if (finalY > (pageHeight - 35)) {
            doc.addPage();
            finalY = 30;
        }

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);

        doc.line(15, finalY, 75, finalY);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text("PREPARED BY (ADMIN)", 45, finalY + 5, { align: 'center' });

        doc.line(pageWidth - 75, finalY, pageWidth - 15, finalY);
        doc.text("AUTHORIZED SIGNATURE", pageWidth - 45, finalY + 5, { align: 'center' });

        doc.save(`Vehicle_Request_Report_${reportType}_${reportYear}.pdf`);
    };

    const generateWordReport = () => {
        const headerHtml = `
            <div style="text-align: center; font-family: Arial, sans-serif;">
                <h1 style="font-size: 20px; margin: 0; color: #000;">DEPARTMENT OF COOPERATIVE DEVELOPMENT</h1>
                <h3 style="font-size: 14px; margin: 5px 0; color: #c1121f;">VEHICLE REQUEST MANAGEMENT SYSTEM</h3>
                <p style="font-size: 11px; text-transform: uppercase; color: #333;">
                    Scope: ${reportType} Summary | Focus Period: ${reportYear} ${(reportType === 'MONTHLY' || reportType === 'WEEKLY') ? `- Month ${parseInt(reportMonth) + 1}` : ''} ${reportType === 'WEEKLY' ? `(Week ${reportWeek})` : ''}
                </p>
                <hr style="border: 1px solid #000;" />
                <table style="width: 100%; font-size: 11px; margin-bottom: 20px;">
                    <tr>
                        <td><strong>TOTAL LOGS:</strong> ${reportData.length} Requests compiled.</td>
                        <td style="text-align: right;"><strong>REPORT GENERATED:</strong> ${new Date().toLocaleDateString()}</td>
                    </tr>
                </table>
            </div>
        `;

        let tableRowsHtml = '';
        reportData.forEach((req, idx) => {
            let resourceStr = 'NOT ASSIGNED';
            if (req.assignedVehicle || req.assignedDriver) {
                const vehicle = req.assignedVehicle ? `${req.assignedVehicle.vehicleNumber} (${req.assignedVehicle.manufacturer} ${req.assignedVehicle.model})` : '';
                const driver = req.assignedDriver ? `${req.assignedDriver.name} - ${req.assignedDriver.phoneNumber}` : '';
                resourceStr = [vehicle, driver].filter(Boolean).join('<br/>');
            }

            tableRowsHtml += `
                <tr>
                    <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">${idx + 1}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;"><b>${req.requesterName || ''}</b><br/><span style="font-size:9px;">${req.requesterEmail || ''}</span></td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${req.fromLocation} TO ${req.toLocation}<br/><span style="font-size:9px;">Distance: ${req.distanceKm} km</span></td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${resourceStr}</td>
                </tr>
            `;
        });

        const tableHtml = `
            <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px;">
                <thead>
                    <tr style="background-color: #f9fafb;">
                        <th style="border: 1px solid #d1d5db; padding: 10px; width: 5%;">#</th>
                        <th style="border: 1px solid #d1d5db; padding: 10px; width: 25%;">NAME</th>
                        <th style="border: 1px solid #d1d5db; padding: 10px; width: 45%;">JOURNEY (FROM - TO)</th>
                        <th style="border: 1px solid #d1d5db; padding: 10px; width: 25%;">ASSIGNED VEHICLE & DRIVER</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>
        `;

        const footerHtml = `
            <br/><br/><br/>
            <table style="width: 100%; font-family: Arial, sans-serif; font-size: 11px; margin-top: 50px;">
                <tr>
                    <td style="width: 40%; border-top: 1px solid #000; text-align: center;"><br/>PREPARED BY (ADMIN)</td>
                    <td style="width: 20%;"></td>
                    <td style="width: 40%; border-top: 1px solid #000; text-align: center;"><br/>AUTHORIZED SIGNATURE</td>
                </tr>
            </table>
        `;

        const content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <title>Vehicle Request Report</title>
                <!--[if gte mso 9]>
                <xml>
                    <w:WordDocument>
                        <w:View>Print</w:View>
                        <w:Zoom>100</w:Zoom>
                        <w:DoNotOptimizeForBrowser/>
                    </w:WordDocument>
                </xml>
                <![endif]-->
                <style>
                    @page {
                        size: ${paperSize === 'A3' ? '29.7cm 42cm' : '21cm 29.7cm'};
                        margin: 2cm;
                        mso-page-orientation: ${orientation === 'L' ? 'landscape' : 'portrait'};
                    }
                    body { font-family: Arial, sans-serif; }
                </style>
            </head>
            <body>
                ${headerHtml}
                ${tableHtml}
                ${footerHtml}
            </body>
            </html>
        `;

        const blob = new Blob(['\ufeff' + content], {
            type: 'application/msword'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Vehicle_Request_Report_${reportType}_${reportYear}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handlePrint = () => {
        const style = document.createElement('style');
        style.innerHTML = `
            @page { 
                size: ${paperSize} ${orientation === 'L' ? 'landscape' : 'portrait'}; 
                margin: 15mm; 
            }
        `;
        document.head.appendChild(style);
        window.print();
        setTimeout(() => {
            document.head.removeChild(style);
        }, 1000);
    };

    const handleGenerateReport = () => {
        if (exportFormat === 'PDF') {
            generatePDFReport();
        } else if (exportFormat === 'WORD') {
            generateWordReport();
        }
    };

    if (error) return <div className="error-container">{error}</div>;

    return (
        <div className="admin-vehicle-history-container fade-in">
            <div className="admin-vehicle-history-header-section">
                <h1 className="admin-vehicle-history-title">Vehicle Request History</h1>
                <p className="admin-vehicle-history-subtitle">All vehicle requests in the system and their current status can be viewed here.</p>
            </div>

            <div className="admin-vehicle-history-controls-row">
                <div className="admin-vehicle-history-search-wrapper">
                    <input type="text" placeholder="Search by name, section or route..."
                        className="admin-vehicle-history-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>

                <div className="admin-vehicle-history-filters-group">

                    <select className="admin-vehicle-history-filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        <option value="ALL">All Years</option> {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                    </select>

                    <select className="admin-vehicle-history-filter-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                        <option value="ALL">All Months</option>
                        {monthNames
                            .filter(m => availableMonths.includes(m.value))
                            .map(m => (<option key={m.value} value={m.value}>{m.name}</option>))
                        }
                    </select>

                    <select className="admin-vehicle-history-filter-select" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="EMPLOYEE_CANCELLED">Employee Cancel</option>
                        <option value="APPROVED_BY_VEHICLE_ADMIN">Admin Approved</option>
                        <option value="APPROVED_BY_VEHICLE_APPROVAL_OFFICER">Officer Approved</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="REJECTED_BY_VEHICLE_ADMIN">Rejected By Admin</option>
                        <option value="REJECTED_BY_VEHICLE_APPROVAL_OFFICER">Rejected By Officer</option>
                    </select>

                    <button className="admin-vehicle-history-generate-report-trigger-btn" onClick={() => setIsReportSetupOpen(true)}>Generate Report</button>
                </div>
            </div>

            <div className="admin-vehicle-history-table-wrapper">
                <table className="admin-vehicle-history-table">
                    <thead className="admin-vehicle-history-thead">
                        <tr>
                            <th className="admin-vehicle-history-th">Requester Name</th>
                            <th className="admin-vehicle-history-th">Email</th>
                            <th className="admin-vehicle-history-th">Travel Date & Time</th>
                            <th className="admin-vehicle-history-th">Journey (From - To)</th>
                            <th className="admin-vehicle-history-th">Assigned Vehicle and Drivers</th>
                            <th className="admin-vehicle-history-th">Status</th>
                            <th className="admin-vehicle-history-th">Action</th>
                        </tr>
                    </thead>
                    <tbody className="admin-vehicle-history-tbody">
                        {filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="admin-vehicle-history-no-data">
                                    No data was found that matched the selected year, month, or search.
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.map((request) => (
                                <tr key={request.id} className="admin-vehicle-history-tr">
                                    <td className="admin-vehicle-history-td">{request.requesterName}</td>
                                    <td className="admin-vehicle-history-td">{request.requesterEmail}</td>
                                    <td className="admin-vehicle-history-td">{request.travelDateTime
                                        ? request.travelDateTime.replace('T', ' ').split('.')[0]
                                        : 'N/A'
                                    }</td>
                                    <td className="admin-vehicle-history-td">
                                        <div className="admin-vehicle-history-journey">
                                            {request.fromLocation} <span className="admin-vehicle-history-arrow">➡️</span> {request.toLocation}
                                        </div>
                                        <div className="admin-vehicle-history-distance">Distance: {request.distanceKm} km</div>
                                    </td>
                                    <td className="admin-vehicle-history-td">
                                        {request.assignedVehicle || request.assignedDriver ? (
                                            <div className="admin-vehicle-history-combined-info">
                                                {request.assignedVehicle && (
                                                    <div className="admin-vehicle-history-vehicle-info">
                                                        <span>{request.assignedVehicle.vehicleNumber}</span>
                                                        <span>{" "}({request.assignedVehicle.manufacturer} {request.assignedVehicle.model})</span>
                                                    </div>
                                                )}
                                                {request.assignedDriver && (
                                                    <div className="admin-vehicle-history-driver-info">
                                                        <span>{request.assignedDriver.name}</span>
                                                        <span>{" "} - {request.assignedDriver.phoneNumber}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="admin-vehicle-history-not-assignedd">Not Assigned</span>
                                        )}
                                    </td>
                                    <td className="admin-vehicle-history-td">
                                        <span className={`admin-vehicle-history-badge ${getStatusClass(request.status)}`}>
                                            {request.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="admin-vehicle-history-td model-history" onClick={() => openDetailsModal(request)}
                                        style={{ cursor: 'pointer', textAlign: 'center' }}>📚</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isReportSetupOpen && (
                <div className="report-setup-modal-overlay" onClick={() => setIsReportSetupOpen(false)}>
                    <div className="report-setup-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="report-setup-modal-header">
                            <h2>📊 Setup & Preview Vehicle Analytics Report</h2>
                        </div>

                        <div className="report-setup-modal-body">
                            <div className="report-config-form-grid">
                                <div>
                                    <label>Report Dynamic Boundary</label>
                                    <select className="admin-vehicle-report-setup-filter-select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                        <option value="WEEKLY">Weekly Summary Report</option>
                                        <option value="MONTHLY">Monthly Summary Report</option>
                                        <option value="YEARLY">Yearly Summary Report</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Target Year</label>
                                    <select className="admin-vehicle-report-setup-filter-select" value={reportYear} onChange={(e) => setReportYear(e.target.value)}>
                                        {availableYears.map(yr => <option key={yr} value={yr}>{yr}</option>)}
                                    </select>
                                </div>
                                {(reportType === 'MONTHLY' || reportType === 'WEEKLY') && (
                                    <div>
                                        <label>Target Month</label>
                                        <select className="admin-vehicle-report-setup-filter-select" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
                                            {monthNames.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {reportType === 'WEEKLY' && (
                                    <div>
                                        <label>Target Week</label>
                                        <select className="admin-vehicle-report-setup-filter-select" value={reportWeek} onChange={(e) => setReportWeek(e.target.value)}>
                                            <option value="1">Week 1 (1st - 7th)</option>
                                            <option value="2">Week 2 (8th - 14th)</option>
                                            <option value="3">Week 3 (15th - 21st)</option>
                                            <option value="4">Week 4 (22nd - 28th)</option>
                                            <option value="5">Week 5 (29th - End)</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="report-control-options">
                                <div className="report-control-item">
                                    <label>Export Format</label>
                                    <select className="admin-vehicle-report-setup-filter-select" value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                                        <option value="PDF">PDF Document (.pdf)</option>
                                        <option value="WORD">Word Document (.doc)</option>
                                    </select>
                                </div>
                                <div className="report-control-item">
                                    <label>Paper Size</label>
                                    <select className="admin-vehicle-report-setup-filter-select" value={paperSize} onChange={(e) => setPaperSize(e.target.value)}>
                                        <option value="A4">A4 (Standard)</option>
                                        <option value="A3">A3 (Large)</option>
                                    </select>
                                </div>
                                <div className="report-control-item">
                                    <label>Orientation</label>
                                    <select className="admin-vehicle-report-setup-filter-select" value={orientation} onChange={(e) => setOrientation(e.target.value)}>
                                        <option value="L">Landscape</option>
                                        <option value="P">Portrait</option>
                                    </select>
                                </div>
                            </div>

                            <h3>Live Document Preview ({reportData.length} Records)</h3>

                            <div className="print-preview-area" ref={previewRef}>
                                <div className="report-setup-pdf-mock-header">
                                    <h2>DEPARTMENT OF COOPERATIVE DEVELOPMENT</h2>
                                    <h4>VEHICLE REQUEST MANAGEMENT SYSTEM</h4>
                                    <p>Scope: {reportType} Summary | Focus Period: {reportYear} {(reportType === 'MONTHLY' || reportType === 'WEEKLY') && `- Month ${parseInt(reportMonth) + 1}`} {reportType === 'WEEKLY' && `(Week ${reportWeek})`}</p>
                                </div>
                                <hr />
                                <div className="report-setup-pdf-mock-meta">
                                    <p><strong>Total Logs:</strong> {reportData.length} requests compiled.</p>
                                    <p><strong>Report Generate Date:</strong> {new Date().toLocaleDateString()}</p>
                                </div>
                                <table className="report-setup-pdf-mock-table">
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'center', width: '5%' }}></th>
                                            <th style={{ textAlign: 'center', width: '20%' }}>Name</th>
                                            <th className="admin-vehicle-history-th" style={{ textAlign: 'center', width: '50%' }}>Journey (From - To)</th>
                                            <th style={{ textAlign: 'center', width: '25%' }}>Assigned Vehicle and Drivers</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="report-setup-text-center">No logs found for selected criteria.</td>
                                            </tr>
                                        ) : (
                                            reportData.map((req, idx) => (
                                                <tr key={req.id}>
                                                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                                    <td className="admin-vehicle-history-td" style={{ textAlign: 'center' }}>
                                                        <div className="admin-vehicle-history-journey">{req.requesterName}</div>
                                                        <div className="admin-vehicle-history-distance">{req.requesterEmail}</div>
                                                    </td>
                                                    <td className="admin-vehicle-history-td" style={{ textAlign: 'center' }}>
                                                        <div className="admin-vehicle-history-journey">
                                                            {req.fromLocation} <span className="admin-vehicle-history-arrow">➡️</span> {req.toLocation}
                                                        </div>
                                                        <div className="admin-vehicle-history-distance">Distance: {req.distanceKm} km</div>
                                                    </td>
                                                    <td className="admin-vehicle-history-td" style={{ textAlign: 'center' }}>
                                                        {req.assignedVehicle || req.assignedDriver ? (
                                                            <div className="admin-vehicle-history-combined-info">
                                                                {req.assignedVehicle && (
                                                                    <div className="admin-vehicle-history-vehicle-info">
                                                                        <span>{req.assignedVehicle.vehicleNumber}</span>
                                                                        <span>{" "}({req.assignedVehicle.manufacturer} {req.assignedVehicle.model})</span>
                                                                    </div>
                                                                )}
                                                                {req.assignedDriver && (
                                                                    <div className="admin-vehicle-history-driver-info">
                                                                        <span>{req.assignedDriver.name}</span>
                                                                        <span>{" "} - {req.assignedDriver.phoneNumber}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="admin-vehicle-history-not-assignedd">Not Assigned</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="report-setup-modal-footer">
                            <button className="report-setup-close-footer-btn" onClick={() => setIsReportSetupOpen(false)}>Cancel</button>
                            <button className="report-setup-close-footer-btn" style={{ backgroundColor: '#2a9d8f', color: '#fff' }} disabled={reportData.length === 0} onClick={handlePrint}>
                                Print / Save Document
                            </button>
                            <button
                                className="report-setup-close-footer-btn"
                                disabled={reportData.length === 0}
                                onClick={handleGenerateReport}
                            >
                                Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {isModalOpen && selectedRequest && (
                <div className="history-modal-overlay" onClick={closeDetailsModal}>
                    <div className="history-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="history-modal-header">
                            <h2>Full Vehicle Request Details</h2>
                        </div>

                        <div className="history-modal-body">
                            <div className="modal-data-section">
                                <h3>Requester & Journey Information</h3>
                                <div className="modal-grid-two-col">
                                    <p><strong>Name:</strong> {selectedRequest.requesterName} ({selectedRequest.requesterPosition})</p>
                                    <p><strong>Department/Branch:</strong> {selectedRequest.department}</p>
                                    <p><strong>Email:</strong> {selectedRequest.requesterEmail}</p>
                                    <p><strong>Phone Number:</strong> {selectedRequest.phoneNumber}</p>
                                    <p><strong>Travel Date & Time:</strong> {new Date(selectedRequest.travelDateTime).toLocaleString()}</p>
                                    <p><strong>Nature of Duty:</strong> {selectedRequest.dutyNature}</p>
                                    <p><strong>Route:</strong> {selectedRequest.fromLocation} ➡️ {selectedRequest.toLocation}</p>
                                    <p><strong>Distance (Estimated):</strong> {selectedRequest.distanceKm} km</p>
                                    <p className="full-width-text"><strong>Reason for Journey:</strong> {selectedRequest.reason}</p>
                                </div>
                            </div>

                            <div className="modal-data-section">
                                <h3>Assigned Resource Allocations</h3>
                                {selectedRequest.assignedVehicle || selectedRequest.assignedDriver ? (
                                    <div className="modal-tables-grid">

                                        <div className="modal-info-table-wrapper">
                                            <table className="modal-info-style-table">
                                                <thead>
                                                    <tr>
                                                        <th colSpan="2" className="table-main-header">VEHICLE INFORMATION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedRequest.assignedVehicle ? (
                                                        <>
                                                            <tr>
                                                                <td className="table-label-col">VEHICLE NUMBER</td>
                                                                <td className="table-value-col">{selectedRequest.assignedVehicle.vehicleNumber}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-col">TYPE</td>
                                                                <td className="table-value-col">{selectedRequest.assignedVehicle.vehicleType || 'N/A'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-col">MODEL</td>
                                                                <td className="table-value-col">{selectedRequest.assignedVehicle.manufacturer} {selectedRequest.assignedVehicle.model}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-col">LICEN EXPIERY DATE</td>
                                                                <td className="table-value-col">{selectedRequest.assignedVehicle.licenseExpiryDate || 'N/A'}</td>
                                                            </tr>
                                                        </>
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="2" className="table-no-data-msg">No vehicle allocated to this request.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="modal-info-table-wrapper">
                                            <table className="modal-info-style-table">
                                                <thead>
                                                    <tr>
                                                        <th colSpan="2" className="table-main-header">DRIVER INFORMATION</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {selectedRequest.assignedDriver ? (
                                                        <>
                                                            <tr>
                                                                <td className="table-label-col">DRIVER NAME</td>
                                                                <td className="table-value-col">{selectedRequest.assignedDriver.name}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-col">NIC</td>
                                                                <td className="table-value-col">{selectedRequest.assignedDriver.nic || 'N/A'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="table-label-col">PHONE NUMBER</td>
                                                                <td className="table-value-col">{selectedRequest.assignedDriver.phoneNumber}</td>
                                                            </tr>
                                                        </>
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="2" className="table-no-data-msg">No driver allocated to this request.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                    </div>
                                ) : (
                                    <div className="modal-no-assignment-alert">
                                        ⚠️ Resources (Vehicle / Driver) have not been assigned to this request yet.
                                    </div>
                                )}
                            </div>

                            <div className="modal-data-section">
                                <h3>Workflow Tracking & Remarks</h3>
                                <div className="modal-status-flex">
                                    <p><strong>Current Status:</strong>
                                        <span className={`admin-vehicle-history-badge ${getStatusClass(selectedRequest.status)}`} style={{ marginLeft: '10px' }}>
                                            {selectedRequest.status.replace(/_/g, ' ')}
                                        </span>
                                    </p>
                                    <p><strong>Created Date:</strong> {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="modal-grid-two-col" style={{ marginTop: '10px' }}>
                                    <div className="remarks-box admin-remarks">
                                        <strong>Vehicle Admin Remarks:</strong>
                                        <p>*{selectedRequest.adminRemarks || "No remarks provided by Vehicle Admin."}*</p>
                                    </div>
                                    <div className="remarks-box officer-remarks">
                                        <strong>Approval Officer Remarks:</strong>
                                        <p>*{selectedRequest.officerRemarks || "No remarks provided by Approval Officer."}*</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="history-modal-footer">
                            <button className="modal-close-footer-btn" onClick={closeDetailsModal}>Close Window</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVehicleHistory;