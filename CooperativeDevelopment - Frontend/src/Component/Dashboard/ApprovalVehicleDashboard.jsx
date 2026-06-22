import React, {
    useState,
    useEffect
} from 'react';

import api from '../API/Axios';

import '../CSS/ApprovalVehicleDashboard.css';

const ApprovalVehicleDashboard = () => {
    const [officerEmail, setOfficerEmail] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [emailSuccessMessage, setEmailSuccessMessage] = useState('');
    const [emailErrorMessage, setEmailErrorMessage] = useState('');

    const fetchOfficerEmail = async () => {
        try {
            const response = await api.get('/vehicle-requests/officer-email');
            if (response.data) {
                setOfficerEmail(response.data);
            }
        } catch (err) {
            console.error("❌ Error fetching officer email:", err);
        }
    };

    useEffect(() => {
        fetchOfficerEmail();
    }, []);

    const handleEmailSave = async (e) => {
        e.preventDefault();
        setEmailLoading(true);
        setEmailSuccessMessage('');
        setEmailErrorMessage('');

        try {
            await api.put(`/vehicle-requests/officer-email?email=${encodeURIComponent(officerEmail)}`);
            setEmailSuccessMessage('✅ Notification Email updated successfully!');
            setTimeout(() => setEmailSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Error updating officer email:", err);
            setEmailErrorMessage('❌ Failed to update email. Please try again.');
        } finally {
            setEmailLoading(false);
        }
    };

    return (
        <div className="approval-vehicle-dashboard-container">
            <div className="approval-vehicle-dashboard-header-zone">
                <h2 className="approval-vehicle-dashboard-title">Vehicle Request Approval Officer Board</h2>
                <p className="approval-vehicle-dashboard-subtitle">Welcome to the Assistant Commissioner and Approval Officer
                    Division control panel. Please ensure to bind your official communication email address below to receive
                    real-time updates and direct alert logs regarding any incoming vehicle allocation requests instantly.</p>
            </div>

            <div className="approval-vehicle-dashboard-email-config-card">
                <div className="email-config-header">
                    <span className="email-config-icon">✉️</span>
                    <div className="email-config-title-wrapper">
                        <h3 className="email-config-main-title">Notification Email Settings</h3>
                        <p className="email-config-sub-title">Configure your email address to receive real-time vehicle request alert logs</p>
                    </div>
                </div>

                <form onSubmit={handleEmailSave} className="email-config-form">
                    <div className="email-input-wrapper">
                        <input
                            type="email"
                            className="email-config-input"
                            placeholder="enter.your.email@coop.gov.lk"
                            value={officerEmail}
                            onChange={(e) => setOfficerEmail(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className="email-config-submit-btn"
                            disabled={emailLoading}
                        >
                            {emailLoading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>

                {emailSuccessMessage && <div className="email-config-alert-success">✓ {emailSuccessMessage}</div>}
                {emailErrorMessage && <div className="email-config-alert-error">⚠️ {emailErrorMessage}</div>}
            </div>
        </div>
    );
};

export default ApprovalVehicleDashboard;