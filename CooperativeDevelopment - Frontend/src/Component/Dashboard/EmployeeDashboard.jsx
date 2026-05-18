import React, {
    useState,
    useEffect
} from 'react';

import '../CSS/EmployeeDashboard.css';

const EmployeeDashboard = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="welcome-section">
                    <h1>Welcome! <span className="employee-user-name"></span></h1>
                </div>
                <div className="date-time-section">
                    <p className="current-date">{formatDate(currentTime)}</p>
                    <p className="current-time">{formatTime(currentTime)}</p>
                </div>
            </header>

            <main className="dashboard-content">
            </main>
        </div>
    );
};

export default EmployeeDashboard;