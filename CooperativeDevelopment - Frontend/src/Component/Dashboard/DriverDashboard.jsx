import React, {
  useState,
  useEffect,
  useMemo
} from 'react';

import API from '../API/Axios';

import '../CSS/DriverDashboard.css';

const DriverDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  const fetchDriverTrips = async () => {
    try {
      setLoading(true);
      const response = await API.get('/drivers/dashboard');
      const sortedTrips = response.data.sort((a, b) => {
        return new Date(b.travelDateTime || 0) - new Date(a.travelDateTime || 0);
      });

      setTrips(sortedTrips);
    } catch (err) {
      console.error("Error fetching driver trips:", err);
      setError('Failed to load assigned trips. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverTrips();
  }, []);

  const handleEndTrip = async (requestId) => {
    const isConfirmed = window.confirm("Do you guarantee that you successfully completed this journey?");
    if (!isConfirmed) return;

    try {
      setProcessingId(requestId);
      await API.post(`/vehicle-requests/end-trip/${requestId}`);
      alert("The journey was successfully completed! The vehicle and you are now AVAILABLE.");
      fetchDriverTrips();
    } catch (err) {
      console.error("Error ending trip:", err);
      alert("Unable to complete the journey. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const { uniqueYears, uniqueMonths } = useMemo(() => {
    const years = new Set();
    const months = new Set();

    trips.forEach(trip => {
      if (trip.travelDateTime) {
        const date = new Date(trip.travelDateTime);
        years.add(date.getFullYear().toString());
        months.add((date.getMonth() + 1).toString());
      }
    });

    return {
      uniqueYears: Array.from(years).sort((a, b) => b - a),
      uniqueMonths: Array.from(months).sort((a, b) => a - b)
    };
  }, [trips]);

  const getMonthName = (monthNumber) => {
    const monthNames = {
      '1': 'January',
      '2': 'February',
      '3': 'March',
      '4': 'April',
      '5': 'May',
      '6': 'June',
      '7': 'July',
      '8': 'August',
      '9': 'September',
      '10': 'October',
      '11': 'November',
      '12': 'December'
    };
    return monthNames[monthNumber] || monthNumber;
  };

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (trip.requesterName?.toLowerCase().includes(searchLower)) ||
        (trip.requesterPosition?.toLowerCase().includes(searchLower)) ||
        (trip.fromLocation?.toLowerCase().includes(searchLower)) ||
        (trip.toLocation?.toLowerCase().includes(searchLower)) ||
        (trip.dutyNature?.toLowerCase().includes(searchLower));

      const matchesStatus = selectedStatus === 'ALL' || trip.status === selectedStatus;

      let matchesYear = true;
      let matchesMonth = true;

      if (trip.travelDateTime) {
        const tripDate = new Date(trip.travelDateTime);
        if (selectedYear !== 'ALL') {
          matchesYear = tripDate.getFullYear().toString() === selectedYear;
        }
        if (selectedMonth !== 'ALL') {
          matchesMonth = (tripDate.getMonth() + 1).toString() === selectedMonth;
        }
      } else if (selectedYear !== 'ALL' || selectedMonth !== 'ALL') {
        return false;
      }

      return matchesSearch && matchesStatus && matchesYear && matchesMonth;
    });
  }, [trips, searchTerm, selectedStatus, selectedYear, selectedMonth]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'COMPLETED': return 'driver-dashboard-status-completed';
      case 'TRIP_STARTED': return 'driver-dashboard-status-ongoing';
      case 'APPROVED_BY_VEHICLE_APPROVAL_OFFICER': return 'driver-dashboard-status-approved';
      default: return 'driver-dashboard-status-pending';
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'COMPLETED': return 'The journey is over';
      case 'TRIP_STARTED': return 'Running';
      case 'APPROVED_BY_VEHICLE_APPROVAL_OFFICER': return 'Approved';
      default: return status;
    }
  };

  return (
    <div className="driver-dashboard-container fade-in">
      <div className="driver-dashboard-header-section">
        <h1 className="driver-dashboard-main-title">Driver Dashboard</h1>
        <p className="driver-dashboard-sub-title">All vehicles and itinerary details reserved for you are displayed here.</p>
      </div>

      <div className="driver-dashboard-control-panel">
        <div className="driver-dashboard-search-box">
          <input
            type="text"
            className="driver-dashboard-search-input"
            placeholder="Search by name, position or destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="driver-dashboard-filters">
          <select
            className="driver-dashboard-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="TRIP_STARTED">Running</option>
            <option value="APPROVED_BY_VEHICLE_APPROVAL_OFFICER">Approved</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            className="driver-dashboard-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="ALL">Years</option>
            {uniqueYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            className="driver-dashboard-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="ALL">Months</option>
            {uniqueMonths.map(month => (
              <option key={month} value={month}>{getMonthName(month)}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="driver-dashboard-loading-box">
          <div className="driver-dashboard-spinner"></div>
          <p className="driver-dashboard-loading-text">Loading data...</p>
        </div>
      ) : error ? (
        <div className="driver-dashboard-error-alert">
          {error}
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="driver-dashboard-empty-state">
          <p className="driver-dashboard-empty-text">No flights were found that matched the search criteria.</p>
        </div>
      ) : (
        <div className="driver-dashboard-table-wrapper">
          <table className="driver-dashboard-table">
            <thead>
              <tr className="driver-dashboard-th-row">
                <th className="driver-dashboard-th">Officer's Name & Division</th>
                <th className="driver-dashboard-th">Route</th>
                <th className="driver-dashboard-th">Date & Time</th>
                <th className="driver-dashboard-th">Nature of duty</th>
                <th className="driver-dashboard-th">KM</th>
                <th className="driver-dashboard-th">Status</th>
                <th className="driver-dashboard-th">Action</th>
              </tr>
            </thead>
            <tbody className="driver-dashboard-tbody">
              {filteredTrips.map((trip) => (
                <tr key={trip.id || trip._id} className="driver-dashboard-tr">
                  <td className="driver-dashboard-td">
                    <div className="driver-dashboard-emp-name">{trip.requesterName}</div>
                    <div className="driver-dashboard-emp-position">{trip.requesterPosition}</div>
                  </td>
                  <td className="driver-dashboard-td">
                    <div className="driver-dashboard-route"><strong>{trip.fromLocation}</strong> ➝ <strong>{trip.toLocation}</strong></div>
                  </td>
                  <td className="driver-dashboard-td">
                    <div className="driver-dashboard-date"> {trip.travelDateTime ? new Date(trip.travelDateTime).toLocaleString('lk-LK') : 'N/A'} </div>
                  </td>
                  <td className="driver-dashboard-td">
                    <div className="driver-dashboard-duty">{trip.dutyNature}</div>
                    {trip.reason && <div className="driver-dashboard-reason">{trip.reason}</div>}
                  </td>
                  <td className="driver-dashboard-td">
                    <div className="driver-dashboard-distance">{trip.distanceKm} km</div>
                  </td>
                  <td className="driver-dashboard-td">
                    <span className={`driver-dashboard-badge ${getStatusClass(trip.status)}`}>{translateStatus(trip.status)}</span>
                  </td>
                  <td className="driver-dashboard-td">
                    {trip.status === 'TRIP_STARTED' ? (
                      <button className="driver-dashboard-end-btn" onClick={() => handleEndTrip(trip.id || trip._id)} disabled={processingId === (trip.id || trip._id)}>
                        {processingId === (trip.id || trip._id) ? "Wait..." : "End Trip"}
                      </button>
                    ) : trip.status === 'COMPLETED' ? (
                      <span className="driver-dashboard-done-text">Completed</span>
                    ) : (
                      <span className="driver-dashboard-waiting-text">Not started</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;