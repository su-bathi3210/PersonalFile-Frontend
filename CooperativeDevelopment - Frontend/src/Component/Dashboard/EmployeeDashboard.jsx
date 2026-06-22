import React, {
  useState,
  useEffect
} from 'react';

import { useNavigate } from 'react-router-dom';

import api from '../API/Axios';

import '../CSS/EmployeeDashboard.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserEmail = localStorage.getItem('employeeEmail') || 'employee@mail.com';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const profileResponse = await api.get(`/personalfile/me?email=${currentUserEmail}`);
        setEmployeeData(profileResponse.data);

        setLoading(false);
      } catch (err) {
        console.error("Dashboard Data Fetching Error: ", err);
        setError("දත්ත ලබා ගැනීමේදී ගැටලුවක් මතු විය. කරුණාකර නැවත උත්සාහ කරන්න.");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUserEmail]);

  if (loading) {
    return (
      <div className="employee-dashboard-loading">
        <p>Loading</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-dashboard-error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="employee-dashboard-container fade-in">
      <div className="employee-dashboard-header">
        <h1>Department of Cooperative Development - Central Province</h1>
      </div>
      
      <div className="employee-dashboard-profile-wrapper">
        <div className="employee-dashboard-card employee-dashboard-profile-section">

          {employeeData ? (
            <div className="employee-dashboard-details-list">
              <div className="employee-dashboard-detail-item">
                <span className="employee-dashboard-label">නම:</span>
                <span className="employee-dashboard-value">{employeeData.username || 'N/A'}</span>
              </div>
              <div className="employee-dashboard-detail-item">
                <span className="employee-dashboard-label">තනතුර:</span>
                <span className="employee-dashboard-value">{employeeData.designation || 'N/A'}</span>
              </div>
              <div className="employee-dashboard-detail-item">
                <span className="employee-dashboard-label">වත්මන් වැටුප:</span>
                <span className="employee-dashboard-value">Rs. {employeeData.salary || '0.00'}</span>
              </div>
              <div className="employee-dashboard-detail-item">
                <span className="employee-dashboard-label">ඊළඟ වැටුප් වර්ධක දිනය:</span>
                <span className="employee-dashboard-value">{employeeData.incrementDate || 'N/A'}</span>
              </div>
              <div className="employee-dashboard-detail-item">
                <span className="employee-dashboard-label">විද්‍යුත් ලිපිනය:</span>
                <span className="employee-dashboard-value">{employeeData.email || 'N/A'}</span>
              </div>
              <div className="employee-dashboard-detail-item">
                <span className="employee-dashboard-label">දුරකථන අංකය:</span>
                <span className="employee-dashboard-value">{employeeData.phoneNumber || 'N/A'}</span>
              </div>
            </div>
          ) : (
            <p>පරිශීලක දත්ත හමු නොවිණි.</p>
          )}
        </div>
      </div>

      <div className="employee-dashboard-actions-section">
        <h2 className="employee-dashboard-actions-title">Quick Actions</h2>
        <div className="employee-dashboard-buttons-container">

          <button
            className="employee-dashboard-btn employee-dashboard-btn-vehicle"
            onClick={() => navigate('/EmployeeVehicle')}
          >
            <span className="employee-dashboard-btn-icon">🚗</span>
            <div className="employee-dashboard-btn-text">
              <h3>වාහන ඉල්ලීමක් සිදු කිරීමට</h3>
              <p>නව වාහන වෙන්කරවා ගැනීමේ අයදුම්පතක් යොමු කරන්න</p>
            </div>
          </button>

          <button
            className="employee-dashboard-btn employee-dashboard-btn-profile"
            onClick={() => navigate('/EmployeePersonalFile')}
          >
            <span className="employee-dashboard-btn-icon">📝</span>
            <div className="employee-dashboard-btn-text">
              <h3>පුද්ගලික ලිපිගොනු යාවත්කාලීන කිරීම</h3>
              <p>ඔබගේ තොරතුරු වෙනස් වී ඇත්නම් සංශෝධනය කරන්න</p>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;