import React, {
    useState,
    useEffect
} from 'react';

import { useNavigate } from 'react-router-dom';

import API from '../API/Axios';

import '../CSS/AdminVehicleDashboard.css';

const AdminVehicleDashboard = () => {
    const navigate = useNavigate();
    const [adminEmail, setAdminEmail] = useState('');
    const [pendingCount, setPendingCount] = useState(0);
    const [officerApprovedCount, setOfficerApprovedCount] = useState(0);
    const [todayTripsCount, setTodayTripsCount] = useState(0);
    const [totalVehicles, setTotalVehicles] = useState(0);
    const [totalDrivers, setTotalDrivers] = useState(0);

    const [loading, setLoading] = useState(false);
    const [countLoading, setCountLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [serviceHistory, setServiceHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        fetchCurrentAdminEmail();
        fetchDashboardCounts();
        fetchDriverLogs();
    }, []);

    const fetchDashboardCounts = async () => {
        try {
            setCountLoading(true);
            const [pendingRes, approvedRes, todayRes, vehiclesRes, driversRes] = await Promise.all([
                API.get('/vehicle-requests/admin/pending-count'),
                API.get('/vehicle-requests/admin/officer-approved-count'),
                API.get('/vehicle-requests/today'),
                API.get('/vehicles/count'),
                API.get('/drivers/count')
            ]);

            setPendingCount(pendingRes.data);
            setOfficerApprovedCount(approvedRes.data);
            setTodayTripsCount(todayRes.data ? todayRes.data.length : 0);

            setTotalVehicles(typeof vehiclesRes.data === 'number' ? vehiclesRes.data : (vehiclesRes.data?.length || 0));
            setTotalDrivers(typeof driversRes.data === 'number' ? driversRes.data : (driversRes.data?.length || 0));

        } catch (error) {
            console.error("Error fetching dashboard counts:", error);
        } finally {
            setCountLoading(false);
        }
    };

    const fetchDriverLogs = async () => {
        try {
            setHistoryLoading(true);
            const response = await API.get('/vehicles/service-history');
            setServiceHistory(response.data || []);
        } catch (error) {
            console.error("Error fetching driver logs:", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchCurrentAdminEmail = async () => {
        try {
            const response = await API.get('/vehicle-requests/admin-email');
            if (response.data) {
                setAdminEmail(response.data);
            }
        } catch (error) {
            console.error("Error fetching admin email:", error);
        }
    };

    const handleSubmitEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await API.put(`/vehicle-requests/admin-email?email=${encodeURIComponent(adminEmail)}`);
            setMessage({
                type: 'success',
                text: 'Email address successfully updated!'
            });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error("Error updating admin email:", error);
            setMessage({
                type: 'error',
                text: 'There was a problem saving the email address. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toLocaleString('si-LK', { hour12: true });
    };

    return (
        <div className="admin-vehicle-dashboard-container fade-in">

            <div className="dashboard-header-banner">
                <h1>පරිපාලන පාලක පැනලය</h1>
                <p>දෙපාර්තමේන්තු වාහන පද්ධතියේ වත්මන් තත්ත්වය සහ දෛනික සාරාංශය මෙතැනින් කළමනාකරණය කරන්න.</p>
            </div>

            <div className="admin-vehicle-dashboard-grid-zone">

                <div className="admin-vehicle-dashboard-count-card pending-card" onClick={() => navigate('/AdminVehicleRequest')}>
                    <div className="admin-vehicle-dashboard-count-icon pending-icon">📋</div>
                    <div className="admin-vehicle-dashboard-count-info">
                        <span className="admin-vehicle-dashboard-count-label">නව ඉල්ලුම්පත්‍ර</span>
                        <h3 className="admin-vehicle-dashboard-count-value pending-value">
                            {countLoading ? '...' : pendingCount}
                        </h3>
                    </div>
                    <div className="admin-vehicle-dashboard-count-arrow">→</div>
                </div>

                <div className="admin-vehicle-dashboard-count-card approved-card" onClick={() => navigate('/AdminVehicleRequest')}>
                    <div className="admin-vehicle-dashboard-count-icon approved-icon">✅</div>
                    <div className="admin-vehicle-dashboard-count-info">
                        <span className="admin-vehicle-dashboard-count-label">අනුමත කළ ඉල්ලුම්</span>
                        <h3 className="admin-vehicle-dashboard-count-value approved-value">
                            {countLoading ? '...' : officerApprovedCount}
                        </h3>
                    </div>
                    <div className="admin-vehicle-dashboard-count-arrow">→</div>
                </div>

                <div className="admin-vehicle-dashboard-count-card ongoing-card" onClick={() => navigate('/AdminOngoingVehicleRequest')}>
                    <div className="admin-vehicle-dashboard-count-icon ongoing-icon">🚚</div>
                    <div className="admin-vehicle-dashboard-count-info">
                        <span className="admin-vehicle-dashboard-count-label">අද දින ධාවනයන්</span>
                        <h3 className="admin-vehicle-dashboard-count-value ongoing-value">
                            {countLoading ? '...' : todayTripsCount}
                        </h3>
                    </div>
                    <div className="admin-vehicle-dashboard-count-arrow">→</div>
                </div>

                <div className="admin-vehicle-dashboard-count-card vehicle-total-card" onClick={() => navigate('/AdminDriversVehicles')}>
                    <div className="admin-vehicle-dashboard-count-icon vehicle-total-icon">🚘</div>
                    <div className="admin-vehicle-dashboard-count-info">
                        <span className="admin-vehicle-dashboard-count-label">ලියාපදිංචි වාහන</span>
                        <h3 className="admin-vehicle-dashboard-count-value vehicle-total-value">
                            {countLoading ? '...' : totalVehicles}
                        </h3>
                    </div>
                    <div className="admin-vehicle-dashboard-count-arrow">→</div>
                </div>

                <div className="admin-vehicle-dashboard-count-card driver-total-card" onClick={() => navigate('/AdminDriversVehicles')}>
                    <div className="admin-vehicle-dashboard-count-icon driver-total-icon">🧑‍✈️</div>
                    <div className="admin-vehicle-dashboard-count-info">
                        <span className="admin-vehicle-dashboard-count-label">සේවයේ නියුතු රියදුරන්</span>
                        <h3 className="admin-vehicle-dashboard-count-value driver-total-value">
                            {countLoading ? '...' : totalDrivers}
                        </h3>
                    </div>
                    <div className="admin-vehicle-dashboard-count-arrow">→</div>
                </div>

            </div>

            <div className="dashboard-content-layout-flex">

                <div className="logs-card">
                    <h2 className="admin-vehicle-dashboard-title">🛠️ රියදුරු යාවත්කාලීන කිරීම්</h2>
                    <p className="admin-vehicle-dashboard-description">
                        රියදුරන් විසින් වාහන වල සිදුකළ නඩත්තු සහ සේවා වාර්තා ඇතුළත් කිරීම් මෙතනින් සෘජුවම නිරීක්ෂණය කළ හැක.
                        <span className="view-all-logs-btn" onClick={() => navigate('/AdminDriversVehicles')}
                            title="Click to view all service history records">වැඩි විස්තර සඳහා →</span>
                    </p>

                    {historyLoading ? (
                        <div className="dashboard-logs-loading">දත්ත පූරණය වෙමින් පවතී...</div>
                    ) : (
                        <div className="dashboard-table-wrapper">
                            <table className="dashboard-logs-table">
                                <thead>
                                    <tr>
                                        <th>Vehicle Number</th>
                                        <th>Driver</th>
                                        <th>Service KM</th>
                                        <th>Next KM</th>
                                        <th>Cost</th>
                                        <th>Description</th>
                                        <th>Date & Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {serviceHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="no-data">
                                                කිසිදු නඩත්තු වාර්තාවක් ඇතුළත් කර නොමැත.
                                            </td>
                                        </tr>
                                    ) : (
                                        serviceHistory.map((log) => (
                                            <tr key={log.id}>
                                                <td>{log.vehicleNumber}</td>
                                                <td>{log.driverName}</td>
                                                <td>{log.serviceKm} KM</td>
                                                <td>{log.nextServiceKm} KM</td>
                                                <td>රු. {log.serviceCost?.toLocaleString()}</td>
                                                <td><span className="description-cell" title={log.description}>{log.description}</span></td>
                                                <td className="date-text-dim">{formatDateTime(log.servicedAt)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="admin-vehicle-dashboard-card settings-card">
                    <h2 className="admin-vehicle-dashboard-title ">⚙️ පරිපාලන සැකසුම්</h2>
                    <p className="admin-vehicle-dashboard-description">
                        නව වාහන ඉල්ලුම්පත්‍ර සහ උදෑසන 6:00 ස්වයංක්‍රීය සාරාංශ වාර්තා ලැබිය යුතු ප්‍රධාන ඊමේල් ලිපිනය යාවත්කාලීන කරන්න.
                    </p>

                    <form onSubmit={handleSubmitEmail} className="admin-vehicle-dashboard-form">
                        <div className="admin-vehicle-dashboard-form-group">
                            <label htmlFor="adminEmail" className="admin-vehicle-dashboard-label">
                                පරිපාලක ඊමේල් ලිපිනය
                            </label>
                            <input
                                type="email"
                                id="adminEmail"
                                className="admin-vehicle-dashboard-input"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                placeholder="උදා: admin@coopdept.gov.lk"
                                required
                            />
                        </div>

                        {message.text && (
                            <div className={`admin-vehicle-dashboard-message admin-vehicle-dashboard-message-${message.type}`}>
                                {message.type === 'success' ? '✅ ' : '❌ '} {message.text}
                            </div>
                        )}

                        <button type="submit" className="admin-vehicle-dashboard-submit-btn" disabled={loading}>
                            {loading ? 'සුරකිමින්...' : 'ඊමේල් ලිපිනය සුරකින්'}
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default AdminVehicleDashboard;