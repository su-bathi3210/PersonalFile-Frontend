import React, {
    useState,
    useEffect,
    useCallback
} from 'react';

import API from '../../API/Axios';

import '../../CSS/AdminDriversVehicles.css';

const AdminDriversVehicles = () => {
    const [loadingDriver, setLoadingDriver] = useState(false);
    const [loadingVehicle, setLoadingVehicle] = useState(false);

    const [driverMessage, setDriverMessage] = useState({ text: '', type: '' });
    const [vehicleMessage, setVehicleMessage] = useState({ text: '', type: '' });

    const [driversList, setDriversList] = useState([]);
    const [vehiclesList, setVehiclesList] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    const [driverData, setDriverData] = useState({
        name: '',
        phoneNumber: '',
        licenseNumber: '',
        nic: '',
        address: '',
        email: '',
        emergencyContact: '',
        licenseExpiryDate: ''
    });

    const [vehicleData, setVehicleData] = useState({
        vehicleNumber: '',
        vehicleType: '',
        manufacturer: '',
        model: '',
        status: 'AVAILABLE',
        licenseNumber: '',
        licenseIssueDate: '',
        licenseExpiryDate: ''
    });

    const fetchData = useCallback(async () => {
        setLoadingData(true);
        const token = localStorage.getItem('token');

        try {
            const headers = { 'Authorization': `Bearer ${token}` };

            const [driversRes, vehiclesRes] = await Promise.all([
                API.get('/drivers/all', { headers }),
                API.get('/vehicles/all', { headers })
            ]);

            if (driversRes.status === 200) {
                setDriversList(driversRes.data);
            }
            if (vehiclesRes.status === 200) {
                setVehiclesList(vehiclesRes.data);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDriverChange = (e) => {
        setDriverData({ ...driverData, [e.target.name]: e.target.value });
    };

    const handleVehicleChange = (e) => {
        setVehicleData({ ...vehicleData, [e.target.name]: e.target.value });
    };

    const handleDriverSubmit = async (e) => {
        e.preventDefault();
        setLoadingDriver(true);
        setDriverMessage({ text: '', type: '' });
        const token = localStorage.getItem('token');

        try {
            const response = await API.post('/drivers/add', driverData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200 || response.status === 201) {
                setDriverMessage({ text: 'The driver was successfully entered into the system!', type: 'success' });
                setDriverData({ name: '', phoneNumber: '', licenseNumber: '', nic: '', address: '', email: '', emergencyContact: '', licenseExpiryDate: '' });
                fetchData();
            }
        } catch (error) {
            const errorMsg = error.response?.data ? error.response.data : 'Driver insertion failed.';
            setDriverMessage({ text: errorMsg, type: 'error' });
        } finally {
            setLoadingDriver(false);
        }
    };

    const handleVehicleSubmit = async (e) => {
        e.preventDefault();
        setLoadingVehicle(true);
        setVehicleMessage({ text: '', type: '' });
        const token = localStorage.getItem('token');

        try {
            const response = await API.post('/vehicles/add', vehicleData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 200 || response.status === 201) {
                setVehicleMessage({ text: 'The vehicle was successfully entered into the system!', type: 'success' });
                setVehicleData({ vehicleNumber: '', vehicleType: '', manufacturer: '', model: '', status: 'AVAILABLE', licenseNumber: '', licenseIssueDate: '', licenseExpiryDate: '' });
                fetchData();
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Vehicle entry failed.';
            setVehicleMessage({ text: errorMsg, type: 'error' });
        } finally {
            setLoadingVehicle(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'AVAILABLE': return 'admin-vehicledrivers-badge-available';
            case 'BOOKED': return 'admin-vehicledrivers-badge-booked';
            case 'ON_TRIP': return 'admin-vehicledrivers-badge-ontrip';
            case 'REPAIR': return 'admin-vehicledrivers-badge-repair';
            default: return 'admin-vehicledrivers-badge-default';
        }
    };

    return (
        <div className="admin-vehicledrivers-container fade-in">

            <div className="admin-vehicledrivers-forms-grid">

                <div className="admin-vehicledrivers-card">
                    <div className="admin-vehicledrivers-card-content">
                        <h2 className="admin-vehicledrivers-card-title"> Adding a new driver </h2>

                        {driverMessage.text && (
                            <div className={`admin-vehicledrivers-message ${driverMessage.type === 'success' ? 'admin-vehicledrivers-msg-success' : 'admin-vehicledrivers-msg-error'
                                }`}>
                                {driverMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleDriverSubmit} className="admin-vehicledrivers-form">
                            <div className="admin-vehicledrivers-form-grid">
                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">Full Name</label>
                                    <input type="text" name="name" required value={driverData.name} onChange={handleDriverChange} className="admin-vehicledrivers-input" placeholder="W.A. Perera" />
                                </div>
                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">NIC Number</label>
                                    <input type="text" name="nic" required value={driverData.nic} onChange={handleDriverChange} className="admin-vehicledrivers-input" placeholder="199512345678" />
                                </div>
                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">Phone Number</label>
                                    <input type="tel" name="phoneNumber" required value={driverData.phoneNumber} onChange={handleDriverChange} className="admin-vehicledrivers-input" placeholder="0771234567" />
                                </div>
                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">Email</label>
                                    <input type="email" name="email" value={driverData.email} onChange={handleDriverChange} className="admin-vehicledrivers-input" placeholder="driver@gmail.com" />
                                </div>
                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">License Number</label>
                                    <input type="text" name="licenseNumber" required value={driverData.licenseNumber} onChange={handleDriverChange} className="admin-vehicledrivers-input" placeholder="B1234567" />
                                </div>
                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">license Expiry Date</label>
                                    <input type="date" name="licenseExpiryDate" required value={driverData.licenseExpiryDate} onChange={handleDriverChange} className="admin-vehicledrivers-input" />
                                </div>
                            </div>
                            <div className="admin-vehicledrivers-form-group">
                                <label className="admin-vehicledrivers-label">Emergency Contact</label>
                                <input type="text" name="emergencyContact" required value={driverData.emergencyContact} onChange={handleDriverChange} className="admin-vehicledrivers-input" placeholder="07xxxxxxxx" />
                            </div>
                            <div className="admin-vehicledrivers-form-group">
                                <label className="admin-vehicledrivers-label">Address</label>
                                <textarea name="address" required rows="2" value={driverData.address} onChange={handleDriverChange} className="admin-vehicledrivers-textarea" placeholder="Enter address here..."></textarea>
                            </div>
                            <div className="admin-vehicledrivers-form-footer">
                                <button type="submit" disabled={loadingDriver} className={`admin-vehicledrivers-btn admin-vehicledrivers-btn-driver ${loadingDriver ? 'disabled' : ''}`}>
                                    {loadingDriver ? 'Saving...' : 'Enter The driver'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="admin-vehicledrivers-card">
                    <div className="admin-vehicledrivers-card-content">
                        <h2 className="admin-vehicledrivers-card-title">Adding a new vehicle</h2>

                        {vehicleMessage.text && (
                            <div className={`admin-vehicledrivers-message ${vehicleMessage.type === 'success' ? 'admin-vehicledrivers-msg-success' : 'admin-vehicledrivers-msg-error'
                                }`}>
                                {vehicleMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleVehicleSubmit} className="admin-vehicledrivers-form">
                            <div className="admin-vehicledrivers-form-grid">
                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">Vehicle Number</label>
                                    <input type="text" name="vehicleNumber" required value={vehicleData.vehicleNumber} onChange={handleVehicleChange} className="admin-vehicledrivers-input" placeholder="WP CAS-1234" />
                                </div>
                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">Vehicle Type</label>
                                    <select name="vehicleType" required value={vehicleData.vehicleType} onChange={handleVehicleChange} className="admin-vehicledrivers-select">
                                        <option value="">Select</option>
                                        <option value="Car">Car</option>
                                        <option value="Van">Van</option>
                                        <option value="Cab">Cab</option>
                                        <option value="Bus">Bus</option>
                                        <option value="SUV">SUV</option>
                                    </select>
                                </div>
                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">Manufacturer</label>
                                    <input type="text" name="manufacturer" required value={vehicleData.manufacturer} onChange={handleVehicleChange} className="admin-vehicledrivers-input" placeholder="Toyota" />
                                </div>
                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">Model</label>
                                    <input type="text" name="model" required value={vehicleData.model} onChange={handleVehicleChange} className="admin-vehicledrivers-input" placeholder="Prius" />
                                </div>

                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">Status</label>
                                    <div className="admin-vehicledrivers-status-static">
                                        <span className="admin-vehicledrivers-pulse-dot"></span> AVAILABLE</div>
                                </div>

                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">License Number</label>
                                    <input type="text" name="licenseNumber" required value={vehicleData.licenseNumber} onChange={handleVehicleChange} className="admin-vehicledrivers-input" placeholder="LIC-98765" />
                                </div>
                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">License Issue Date</label>
                                    <input type="date" name="licenseIssueDate" required value={vehicleData.licenseIssueDate} onChange={handleVehicleChange} className="admin-vehicledrivers-input" />
                                </div>
                                <div className="admin-vehicledrivers-form-group">
                                    <label className="admin-vehicledrivers-label">license Expiry Date</label>
                                    <input type="date" name="licenseExpiryDate" required value={vehicleData.licenseExpiryDate} onChange={handleVehicleChange} className="admin-vehicledrivers-input" />
                                </div>
                            </div>
                            <div className="admin-vehicledrivers-form-footer">
                                <button type="submit" disabled={loadingVehicle} className={`admin-vehicledrivers-btn admin-vehicledrivers-btn-vehicle ${loadingVehicle ? 'disabled' : ''}`}>
                                    {loadingVehicle ? 'Saving...' : 'Enter The Vehicle'}
                                </button>
                            </div>

                            <p className="admin-vehicledrivers-helper-text"> If you need to view or update a vehicle's records,
                                please <span className="admin-vehicledrivers-link">click here</span> </p>
                        </form>
                    </div>
                </div>

            </div>

            <div className="admin-vehicledrivers-tables-grid">

                <div className="admin-vehicledrivers-table-card">
                    <div className="admin-vehicledrivers-table-header">
                        <h3 className="admin-vehicledrivers-table-title">Active Drivers</h3>
                    </div>
                    <div className="admin-vehicledrivers-table-scroll">
                        {loadingData ? (
                            <p className="admin-vehicledrivers-table-empty">Loading...</p>
                        ) : driversList.length === 0 ? (
                            <p className="admin-vehicledrivers-table-empty">There are no drivers in the system.</p>
                        ) : (
                            <table className="admin-vehicledrivers-table">
                                <thead className="admin-vehicledrivers-thead">
                                    <tr>
                                        <th className="admin-vehicledrivers-th">Name</th>
                                        <th className="admin-vehicledrivers-th">NIC</th>
                                        <th className="admin-vehicledrivers-th">License Number</th>
                                        <th className="admin-vehicledrivers-th">Li: Expiry Date</th>
                                        <th className="admin-vehicledrivers-th">Phone</th>
                                        <th className="admin-vehicledrivers-th">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="admin-vehicledrivers-tbody">
                                    {driversList.map((driver) => (
                                        <tr key={driver.id || driver._id} className="admin-vehicledrivers-tr">
                                            <td className="admin-vehicledrivers-td admin-vehicledrivers-td-highlight">{driver.driverName || driver.name}</td>
                                            <td className="admin-vehicledrivers-td">{driver.nic}</td>
                                            <td className="admin-vehicledrivers-td">{driver.licenseNumber}</td>
                                            <td className="admin-vehicledrivers-td">{driver.licenseExpiryDate}</td>
                                            <td className="admin-vehicledrivers-td">{driver.phoneNumber}</td>
                                            <td className="admin-vehicledrivers-td">
                                                <span className={`admin-vehicledrivers-badge ${getStatusBadgeClass(driver.status || 'AVAILABLE')}`}>
                                                    {driver.status || 'AVAILABLE'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="admin-vehicledrivers-table-card">
                    <div className="admin-vehicledrivers-table-header">
                        <h3 className="admin-vehicledrivers-table-title">Registered Vehicles</h3>
                    </div>
                    <div className="admin-vehicledrivers-table-scroll">
                        {loadingData ? (
                            <p className="admin-vehicledrivers-table-empty">Loading...</p>
                        ) : vehiclesList.length === 0 ? (
                            <p className="admin-vehicledrivers-table-empty">There are no vehicles in the system.</p>
                        ) : (
                            <table className="admin-vehicledrivers-table">
                                <thead className="admin-vehicledrivers-thead">
                                    <tr>
                                        <th className="admin-vehicledrivers-th">Vehicle Number</th>
                                        <th className="admin-vehicledrivers-th">Type / Model</th>
                                        <th className="admin-vehicledrivers-th">Manufacturer</th>
                                        <th className="admin-vehicledrivers-th">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="admin-vehicledrivers-tbody">
                                    {vehiclesList.map((vehicle) => (
                                        <tr key={vehicle.id || vehicle._id} className="admin-vehicledrivers-tr">
                                            <td className="admin-vehicledrivers-td admin-vehicledrivers-td-vehicle-num">{vehicle.vehicleNumber}</td>
                                            <td className="admin-vehicledrivers-td">{vehicle.manufacturer} {vehicle.model || vehicle.brand} ({vehicle.vehicleType})</td>
                                            <td className="admin-vehicledrivers-td">{vehicle.manufacturer}</td>
                                            <td className="admin-vehicledrivers-td">
                                                <span className={`admin-vehicledrivers-badge ${getStatusBadgeClass(vehicle.status)}`}>
                                                    {vehicle.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
};

export default AdminDriversVehicles;