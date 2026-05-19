import React, {
  useEffect,
  useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import API from '../API/Axios';

import {
  Users,
  Building2,
  FileClock,
  UserPlus,
  FolderOpen,
  ChevronRight,
  Bell,
  ArrowUpRight
} from 'lucide-react';

import '../CSS/AdminPFDashboard.css';

const AdminPFDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    pendingIncrements: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const empRes = await API.get('/personalfile/all-employees');
        const deptRes = await API.get('/departments/all');

        setStats({
          totalEmployees: empRes.data.length,
          totalDepartments: deptRes.data.length,
          pendingIncrements: 3
        });
      } catch (err) {
        console.error("Dashboard දත්ත ලබා ගැනීමේදී දෝෂයක් ඇති විය:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);


  return (
    <div className="pf-admin-dashboard-container pf-admin-dashboard-fade-in">
      <div className="pf-admin-dashboard-header">
        <div>
          <h1 className="pf-admin-dashboard-title">Personal File Dashboard</h1>
          <p className="pf-admin-dashboard-subtitle">මධ්‍යම පළාත් සමුපකාර සංවර්ධන දෙපාර්තමේන්තු සේවක දත්ත පාලක පුවරුව</p>
        </div>
        <div className="pf-admin-dashboard-date">
          <span className="pf-admin-dashboard-date-badge">
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </span>
        </div>
      </div>

      <div className="pf-admin-dashboard-grid-stats">

        <div className="pf-admin-dashboard-stat-card pf-admin-dashboard-card-blue" onClick={() => navigate('/AdminPersonalFile')}>
          <div className="pf-admin-dashboard-stat-card-inner">
            <div>
              <p className="pf-admin-dashboard-stat-label">මුළු සේවකයින් සංඛ්‍යාව</p>
              <h3 className="pf-admin-dashboard-stat-value">{stats.totalEmployees}</h3>
            </div>
            <div className="pf-admin-dashboard-stat-icon-wrapper">
              <Users size={24} />
            </div>
          </div>
          <div className="pf-admin-dashboard-stat-card-footer">
            <span>සියල්ල බලන්න</span>
            <ChevronRight size={14} />
          </div>
        </div>

        <div className="pf-admin-dashboard-stat-card pf-admin-dashboard-card-green" onClick={() => navigate('/AdminPersonalFile')}>
          <div className="pf-admin-dashboard-stat-card-inner">
            <div>
              <p className="pf-admin-dashboard-stat-label">දෙපාර්තමේන්තු</p>
              <h3 className="pf-admin-dashboard-stat-value">{stats.totalDepartments}</h3>
            </div>
            <div className="pf-admin-dashboard-stat-icon-wrapper">
              <Building2 size={24} />
            </div>
          </div>
          <div className="pf-admin-dashboard-stat-card-footer">
            <span>කළමනාකරණය කරන්න</span>
            <ChevronRight size={14} />
          </div>
        </div>

        <div className="pf-admin-dashboard-stat-card pf-admin-dashboard-card-orange" onClick={() => navigate('/Informs')}>
          <div className="pf-admin-dashboard-stat-card-inner">
            <div>
              <p className="pf-admin-dashboard-stat-label">ප්‍රතිචාර නොදැක්වූ වැටුප් වර්ධක</p>
              <h3 className="pf-admin-dashboard-stat-value">{stats.pendingIncrements}</h3>
            </div>
            <div className="pf-admin-dashboard-stat-icon-wrapper">
              <FileClock size={24} />
            </div>
          </div>
          <div className="pf-admin-dashboard-stat-card-footer">
            <span>පෝරම පරීක්ෂා කරන්න</span>
            <ChevronRight size={14} />
          </div>
        </div>
      </div>

      <div className="pf-admin-dashboard-sections-layout">
        <div className="pf-admin-dashboard-section-card">
          <h2 className="pf-admin-dashboard-section-heading">ඉක්මන් ක්‍රියාකාරකම්</h2>
          <div className="pf-admin-dashboard-quick-actions-list">
            <button className="pf-admin-dashboard-action-btn" onClick={() => navigate('/AdminPersonalFile')}>
              <UserPlus size={16} />
              <span>අලුත් සේවකයෙකු ඇතුළත් කිරීම</span>
              <ArrowUpRight size={14} className="pf-admin-dashboard-arrow-icon" />
            </button>

            <button className="pf-admin-dashboard-action-btn" onClick={() => navigate('/DetailsHistory')}>
              <FolderOpen size={16} />
              <span>සේවක ඉතිහාසය පරීක්ෂාව</span>
              <ArrowUpRight size={14} className="pf-admin-dashboard-arrow-icon" />
            </button>
          </div>
        </div>

        <div className="pf-admin-dashboard-section-card">
          <h2 className="pf-admin-dashboard-section-heading">පද්ධති දැනුම්දීම්</h2>
          <div className="pf-admin-dashboard-reminder-list">
            <div className="pf-admin-dashboard-reminder-item pf-admin-dashboard-reminder-highlight">
              <Bell size={16} className="pf-admin-dashboard-reminder-icon-bell" />
              <div className="pf-admin-dashboard-reminder-details">
                <p className="pf-admin-dashboard-reminder-text">ලබන මාසයේ වැටුප් වර්ධක හිමි සේවකයින්ට ඊමේල් මතක් කිරීම් යවන්න.</p>
                <span className="pf-admin-dashboard-reminder-time">අද දිනට අදාළයි</span>
              </div>
            </div>

            <div className="pf-admin-dashboard-reminder-item">
              <FileClock size={16} className="pf-admin-dashboard-reminder-icon-clock" />
              <div className="pf-admin-dashboard-reminder-details">
                <p className="pf-admin-dashboard-reminder-text">Excel Upload පහසුකම මඟින් එකවර දත්ත ඇතුළත් කිරීමේදී ආකෘතිය නිවැරදිදැයි තහවුරු කරගන්න.</p>
                <span className="pf-admin-dashboard-reminder-time">පද්ධති උපදෙස්</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPFDashboard;