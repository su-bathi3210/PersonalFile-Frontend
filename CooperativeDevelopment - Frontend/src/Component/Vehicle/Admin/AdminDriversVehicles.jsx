import React, {
    useCallback,
    useEffect,
    useState
} from 'react';

import API from '../../API/Axios';

import '../../CSS/AdminDriversVehicles.css';

import {
    Car,
    ChevronDown,
    ChevronRight,
    Edit,
    Loader2,
    Trash2,
    Users
} from 'lucide-react';

const AdminDriversVehicles = () => {
    const [activeTab, setActiveTab] = useState('vehicle');

    const [loadingDriver, setLoadingDriver] = useState(false);
    const [loadingVehicle, setLoadingVehicle] = useState(false);

    const [driverMessage, setDriverMessage] = useState({ text: '', type: '' });
    const [vehicleMessage, setVehicleMessage] = useState({ text: '', type: '' });

    const [driversList, setDriversList] = useState([]);
    const [vehiclesList, setVehiclesList] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    const [editingDriverId, setEditingDriverId] = useState(null);
    const [editingVehicleId, setEditingVehicleId] = useState(null);

    const [expandedVehicleId, setExpandedVehicleId] = useState(null);

    const toggleVehicleExpand = (id) => {
        setExpandedVehicleId(expandedVehicleId === id ? null : id);
    };

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
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            let response;
            if (editingDriverId) {
                response = await API.put(`/drivers/update/${editingDriverId}`, driverData, { headers });
            } else {
                response = await API.post('/drivers/add', driverData, { headers });
            }

            if (response.status === 200 || response.status === 201) {
                setDriverMessage({
                    text: editingDriverId ? 'Driver records successfully updated!' : 'Driver successfully entered into the system!',
                    type: 'success'
                });
                resetDriverForm();
                fetchData();
            }
        } catch (error) {
            const errorMsg = error.response?.data ? error.response.data : 'Driver operation failed.';
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
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            let response;
            if (editingVehicleId) {
                response = await API.put(`/vehicles/update/${editingVehicleId}`, vehicleData, { headers });
            } else {
                response = await API.post('/vehicles/add', vehicleData, { headers });
            }

            if (response.status === 200 || response.status === 201) {
                setVehicleMessage({
                    text: editingVehicleId ? 'Vehicle records successfully updated!' : 'Vehicle successfully entered into the system!',
                    type: 'success'
                });
                resetVehicleForm();
                fetchData();
            }
        } catch (error) {
            const errorMsg = error.response?.data ? error.response.data : 'Vehicle operation failed.';
            setVehicleMessage({ text: errorMsg, type: 'error' });
        } finally {
            setLoadingVehicle(false);
        }
    };

    const handleDriverDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this driver? This is a non-reversible action.")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await API.delete(`/drivers/delete/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert(response.data || "Driver deleted successfully.");
            fetchData();
        } catch (error) {
            alert(error.response?.data || "Driver deletion failed.");
        }
    };

    const handleVehicleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this vehicle? This is a non-reversible action.")) return;

        const token = localStorage.getItem('token');
        try {
            const response = await API.delete(`/vehicles/delete/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            alert(response.data || "Vehicle deleted successfully.");
            fetchData();
        } catch (error) {
            alert(error.response?.data || "Vehicle deletion failed.");
        }
    };

    const handleDriverEditTrigger = (driver) => {
        setEditingDriverId(driver.id || driver._id);
        setDriverData({
            name: driver.name || driver.driverName || '',
            phoneNumber: driver.phoneNumber || '',
            licenseNumber: driver.licenseNumber || '',
            nic: driver.nic || '',
            address: driver.address || '',
            email: driver.email || '',
            emergencyContact: driver.emergencyContact || '',
            licenseExpiryDate: driver.licenseExpiryDate || ''
        });
        setActiveTab('driver');
    };

    const handleVehicleEditTrigger = (vehicle) => {
        setEditingVehicleId(vehicle.id || vehicle._id);
        setVehicleData({
            vehicleNumber: vehicle.vehicleNumber || '',
            vehicleType: vehicle.vehicleType || '',
            manufacturer: vehicle.manufacturer || '',
            model: vehicle.model || '',
            status: vehicle.status || 'AVAILABLE',
            licenseNumber: vehicle.licenseNumber || '',
            licenseIssueDate: vehicle.licenseIssueDate || '',
            licenseExpiryDate: vehicle.licenseExpiryDate || ''
        });
        setActiveTab('vehicle');
    };

    const resetDriverForm = () => {
        setEditingDriverId(null);
        setDriverData({ name: '', phoneNumber: '', licenseNumber: '', nic: '', address: '', email: '', emergencyContact: '', licenseExpiryDate: '' });
    };

    const resetVehicleForm = () => {
        setEditingVehicleId(null);
        setVehicleData({ vehicleNumber: '', vehicleType: '', manufacturer: '', model: '', status: 'AVAILABLE', licenseNumber: '', licenseIssueDate: '', licenseExpiryDate: '' });
    };

    const getStatusIndicator = (status) => {
        let statusClass = "admin-driver-vehicle-status-unknown";
        let label = "Unknown";

        if (status === 'AVAILABLE') { statusClass = "admin-driver-vehicle-status-available"; label = "Active"; }
        else if (status === 'BOOKED') { statusClass = "admin-driver-vehicle-status-booked"; label = "BOOKED"; }
        else if (status === 'ON_TRIP') { statusClass = "admin-driver-vehicle-status-ontrip"; label = "Operational"; }
        else if (status === 'REPAIR') { statusClass = "admin-driver-vehicle-status-repair"; label = "Maintenance"; }

        return (
            <span className={`admin-driver-vehicle-status-badge ${statusClass}`}>
                <span className="admin-driver-vehicle-status-dot-container">
                    {status !== 'DEFAULT' && <span className="admin-driver-vehicle-status-ping"></span>}
                    <span className="admin-driver-vehicle-status-dot"></span>
                </span>
                {label}
            </span>
        );
    };

    const MessageBox = ({ text, type }) => {
        if (!text) return null;
        const msgClass = type === 'success' ? 'admin-driver-vehicle-msg-success' : 'admin-driver-vehicle-msg-error';
        return (
            <div className={`admin-driver-vehicle-message-box ${msgClass}`}>
                <p>{text}</p>
            </div>
        );
    };

    return (
        <div className="admin-driver-vehicle-wrapper fade-in">

            <div className="admin-driver-vehicle-intro-card">
                <div className="admin-driver-vehicle-intro-text">
                    <h1 className="admin-driver-vehicle-main-title">Vehicle & Driver Management Panel</h1>

                    <p className="admin-driver-vehicle-sub-title">Welcome, Administrator. Seamlessly register vehicles, track asset
                        status, manage corporate drivers, and review maintenance history all from a single, intuitive interface.</p>
                </div>

                <div className="admin-driver-vehicle-intro-buttons">
                    <button onClick={() => setActiveTab('vehicle')}
                        className={`admin-driver-vehicle-btn ${activeTab === 'vehicle' ?
                            'admin-driver-vehicle-btn-primary' : 'admin-driver-vehicle-btn-secondary'}`}> Add Vehicle </button>

                    <button onClick={() => setActiveTab('driver')}
                        className={`admin-driver-vehicle-btn ${activeTab === 'driver' ? 'admin-driver-vehicle-btn-primary' :
                            'admin-driver-vehicle-btn-secondary'}`}> Register Driver </button>
                </div>
            </div>

            {activeTab === 'vehicle' && (
                <div className="admin-driver-vehicle-add-v-sec admin-driver-vehicle-section-gap">

                    <div className="admin-driver-vehicle-form-card">
                        <div className="admin-driver-vehicle-form-header">
                            <div className={`admin-driver-vehicle-icon-wrapper ${editingVehicleId ?
                                'admin-driver-vehicle-mode-edit' : 'admin-driver-vehicle-mode-add'}`}></div>

                            <h2 className="admin-driver-vehicle-form-title">{editingVehicleId ? `Update ${vehicleData.vehicleNumber}` : 'Add New Corporate Vehicle'}</h2>
                        </div>

                        <MessageBox text={vehicleMessage.text} type={vehicleMessage.type} />

                        <form onSubmit={handleVehicleSubmit} className="admin-driver-vehicle-form">
                            <div className="admin-driver-vehicle-form-grid-4">
                                {[
                                    { label: 'Vehicle Plate Number', name: 'vehicleNumber', type: 'text', placeholder: 'e.g., CAS-1234', required: true, value: vehicleData.vehicleNumber, onChange: handleVehicleChange },
                                    { label: 'Type', name: 'vehicleType', type: 'select', options: ['', 'Car', 'Van', 'Cab', 'Bus', 'SUV'], required: true, value: vehicleData.vehicleType, onChange: handleVehicleChange },
                                    { label: 'Manufacturer', name: 'manufacturer', type: 'text', placeholder: 'e.g., Toyota', required: true, value: vehicleData.manufacturer, onChange: handleVehicleChange },
                                    { label: 'Model', name: 'model', type: 'text', placeholder: 'e.g., Prius', required: true, value: vehicleData.model, onChange: handleVehicleChange },
                                    { label: 'License Number', name: 'licenseNumber', type: 'text', placeholder: 'e.g., LIC-98765', required: true, value: vehicleData.licenseNumber, onChange: handleVehicleChange },
                                    { label: 'License Issue Date', name: 'licenseIssueDate', type: 'date', required: true, value: vehicleData.licenseIssueDate, onChange: handleVehicleChange },
                                    { label: 'License Expiry Date', name: 'licenseExpiryDate', type: 'date', required: true, value: vehicleData.licenseExpiryDate, onChange: handleVehicleChange }
                                ].map((field, idx) => (
                                    <div key={idx} className="admin-driver-vehicle-input-group">
                                        <label className="admin-driver-vehicle-label">{field.label}</label>
                                        {field.type === 'select' ? (
                                            <div className="admin-driver-vehicle-select-container">
                                                <select name={field.name} required={field.required} value={field.value} onChange={field.onChange} className="admin-driver-vehicle-select">
                                                    {field.options.map(opt => <option key={opt} value={opt}>{opt || 'Select'}</option>)}
                                                </select>
                                            </div>
                                        ) : (
                                            <input type={field.type} name={field.name} placeholder={field.placeholder} required={field.required} value={field.value} onChange={field.onChange} className="admin-driver-vehicle-input" />
                                        )}
                                    </div>
                                ))}

                                <div className="admin-driver-vehicle-input-group">
                                    <label className="admin-driver-vehicle-label">Status</label>
                                    <div className="admin-driver-vehicle-status-static-preview">{getStatusIndicator(vehicleData.status)}</div>
                                </div>
                            </div>

                            <div className="admin-driver-vehicle-form-actions">
                                {editingVehicleId && (
                                    <button type="button" onClick={resetVehicleForm}
                                        className="admin-driver-vehicle-btn admin-driver-vehicle-btn-cancel">Cancel Update </button>)}

                                <button type="submit" disabled={loadingVehicle} className={`admin-driver-vehicle-btn ${editingVehicleId ? 'admin-driver-vehicle-btn-save-edit' : 'admin-driver-vehicle-btn-save-add'}`}>
                                    {loadingVehicle ? 'Processing...' : editingVehicleId ? 'Save Changes' : 'Register Vehicle'}</button>
                            </div>
                        </form>
                    </div>

                    <div className="admin-driver-vehicle-table-card">

                        <div className="admin-driver-vehicle-table-responsive">
                            {loadingData ? (
                                <div className="admin-driver-vehicle-loading-state">
                                    <Loader2 size={35} className="admin-driver-vehicle-spinner" />
                                    <p>Fetching register...</p>
                                </div>
                            ) : vehiclesList.length === 0 ? (
                                <div className="admin-driver-vehicle-empty-state">
                                    <Car size={60} />
                                    <p>No vehicles registered yet. Use the form above to add your first asset.</p>
                                </div>
                            ) : (
                                <table className="admin-driver-vehicle-table">
                                    <thead>
                                        <tr>
                                            <th className="admin-driver-vehicle-th">Vehicle Number</th>
                                            <th className="admin-driver-vehicle-th">Type</th>
                                            <th className="admin-driver-vehicle-th">Model</th>
                                            <th className="admin-driver-vehicle-th">Manufacturer</th>
                                            <th className="admin-driver-vehicle-th">License Number</th>
                                            <th className="admin-driver-vehicle-th">License Issue Date</th>
                                            <th className="admin-driver-vehicle-th">License Expiry Date</th>
                                            <th className="admin-driver-vehicle-th">Current KM</th>
                                            <th className="admin-driver-vehicle-th">Status</th>
                                            <th className="admin-driver-vehicle-th admin-driver-vehicle-text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vehiclesList.map((vehicle) => {
                                            const vehicleId = vehicle.id || vehicle._id;
                                            const isExpanded = expandedVehicleId === vehicleId;
                                            return (
                                                <React.Fragment key={vehicleId}>
                                                    <tr className={`admin-driver-vehicle-tr ${isExpanded ? 'admin-driver-vehicle-tr-active' : ''}`}>
                                                        <td className="admin-driver-vehicle-td admin-driver-vehicle-flex-td">
                                                            <button onClick={() => toggleVehicleExpand(vehicleId)} className={`admin-driver-vehicle-expand-btn ${isExpanded ? 'active' : ''}`}>
                                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                            </button>{vehicle.vehicleNumber}
                                                        </td>

                                                        <td className="admin-driver-vehicle-td">{vehicle.vehicleType}</td>
                                                        <td className="admin-driver-vehicle-td">{vehicle.model}</td>
                                                        <td className="admin-driver-vehicle-td">{vehicle.manufacturer}</td>
                                                        <td className="admin-driver-vehicle-td">{vehicle.licenseNumber}</td>
                                                        <td className="admin-driver-vehicle-td">{vehicle.licenseIssueDate}</td>
                                                        <td className="admin-driver-vehicle-td">{vehicle.licenseExpiryDate}</td>
                                                        <td className="admin-driver-vehicle-td">{vehicle.currentKm?.toLocaleString() ?? 0} KM</td>
                                                        <td className="admin-driver-vehicle-td">{getStatusIndicator(vehicle.status)}</td>
                                                        <td className="admin-driver-vehicle-td admin-driver-vehicle-text-right">
                                                            <div className="admin-driver-vehicle-actions-group">
                                                                <button onClick={() => handleVehicleEditTrigger(vehicle)} title="Edit Vehicle" className="admin-driver-vehicle-action-btn admin-driver-vehicle-btn-edit"><Edit size={16} /></button>
                                                                <button onClick={() => handleVehicleDelete(vehicleId)} title="Delete Vehicle" className="admin-driver-vehicle-action-btn admin-driver-vehicle-btn-delete"><Trash2 size={16} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {expandedVehicleId === vehicleId && (
                                                        <tr>
                                                            <td colSpan="10" className="admin-driver-vehicle-expanded-td">
                                                                <div className="admin-driver-vehicle-expanded-card">
                                                                    <div className="admin-driver-vehicle-expanded-header">
                                                                        <div className="admin-driver-vehicle-expanded-title">
                                                                            <h4>🛠️ Complete Maintenance & Service History</h4>
                                                                        </div>
                                                                        <span className="admin-driver-vehicle-records-badge">
                                                                            Records: {vehicle.serviceHistorySummary ? vehicle.serviceHistorySummary.length : 0}
                                                                        </span>
                                                                    </div>

                                                                    <div className="admin-driver-vehicle-table-responsive">
                                                                        {vehicle.serviceHistorySummary && vehicle.serviceHistorySummary.length > 0 ? (
                                                                            <table className="admin-driver-vehicle-table">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th className="admin-driver-vehicle-th">Driver Name</th>
                                                                                        <th className="admin-driver-vehicle-th">Description</th>
                                                                                        <th className="admin-driver-vehicle-th">Meter KM</th>
                                                                                        <th className="admin-driver-vehicle-th">Next Due</th>
                                                                                        <th className="admin-driver-vehicle-th">Cost</th>
                                                                                        <th className="admin-driver-vehicle-th">Serviced At</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {vehicle.serviceHistorySummary.map((srv, idx) => (
                                                                                        <tr key={srv.id || idx} className="admin-driver-vehicle-tr">
                                                                                            
                                                                                            <td className="admin-driver-vehicle-td">{srv.driverName}</td>
                                                                                            <td className="admin-driver-vehicle-td">{srv.description}</td>
                                                                                            <td className="admin-driver-vehicle-td">{srv.serviceKm} KM</td>
                                                                                            <td className="admin-driver-vehicle-td">{srv.nextServiceKm} KM</td>
                                                                                            <td className="admin-driver-vehicle-td">LKR {srv.serviceCost?.toLocaleString()}</td>
                                                                                            <td className="admin-driver-vehicle-td">{new Date(srv.servicedAt).toLocaleString()}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        ) : (
                                                                            <div className="admin-driver-vehicle-history-empty">
                                                                                <h5>No records found</h5>
                                                                                <p>This vehicle hasn't been logged for any service or maintenance yet.</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'driver' && (
                <div className="admin-driver-vehicle-add-d-sec admin-driver-vehicle-section-gap">

                    <div className="admin-driver-vehicle-form-card">
                        <div className="admin-driver-vehicle-form-header">
                            <div className={`admin-driver-vehicle-icon-wrapper ${editingDriverId ? 'admin-driver-vehicle-mode-edit' : 'admin-driver-vehicle-mode-driver'}`}></div>
                            <h2 className="admin-driver-vehicle-form-title">{editingDriverId ? `Update Profile: ${driverData.name}` : 'Add Active Driver to Roster'}</h2>
                        </div>

                        <MessageBox text={driverMessage.text} type={driverMessage.type} />

                        <form onSubmit={handleDriverSubmit} className="admin-driver-vehicle-form">
                            <div className="admin-driver-vehicle-form-grid-3">
                                {[
                                    { label: 'Driver Full Name', name: 'name', type: 'text', placeholder: 'e.g., W.A. Perera', required: true, value: driverData.name, onChange: handleDriverChange },
                                    { label: 'NIC / ID Number', name: 'nic', type: 'text', placeholder: 'e.g., 199512345678', required: true, value: driverData.nic, onChange: handleDriverChange },
                                    { label: 'Phone Number (Main)', name: 'phoneNumber', type: 'tel', placeholder: '0771234567', required: true, value: driverData.phoneNumber, onChange: handleDriverChange },
                                    { label: 'Email Address', name: 'email', type: 'email', placeholder: 'driver@gmail.com', required: false, value: driverData.email, onChange: handleDriverChange },
                                    { label: 'Driving License Number', name: 'licenseNumber', type: 'text', placeholder: 'B1234567', required: true, value: driverData.licenseNumber, onChange: handleDriverChange },
                                    { label: 'License Expiry Date', name: 'licenseExpiryDate', type: 'date', required: true, value: driverData.licenseExpiryDate, onChange: handleDriverChange }
                                ].map((field, idx) => (
                                    <div key={idx} className="admin-driver-vehicle-input-group">
                                        <label className="admin-driver-vehicle-label">{field.label}{!field.required && ' (Opt.)'}</label>
                                        <input type={field.type} name={field.name} placeholder={field.placeholder} required={field.required} value={field.value} onChange={field.onChange} className="admin-driver-vehicle-input" />
                                    </div>
                                ))}
                            </div>

                            <div className="admin-driver-vehicle-form-grid-2">
                                <div className="admin-driver-vehicle-input-group">
                                    <label className="admin-driver-vehicle-label">Emergency Contact Information</label>
                                    <input type="text" name="emergencyContact" placeholder="Name - Relationship (07xxxxxxxx)" required value={driverData.emergencyContact} onChange={handleDriverChange} className="admin-driver-vehicle-input" />
                                </div>
                                <div className="admin-driver-vehicle-input-group">
                                    <label className="admin-driver-vehicle-label">Residential Address</label>
                                    <textarea name="address" required rows="1" value={driverData.address} onChange={handleDriverChange} placeholder="Enter complete address here..." className="admin-driver-vehicle-textarea"></textarea>
                                </div>
                            </div>

                            <div className="admin-driver-vehicle-form-actions">
                                {editingDriverId && (
                                    <button type="button" onClick={resetDriverForm}
                                        className="admin-driver-vehicle-btn admin-driver-vehicle-btn-cancel">Cancel Update</button>)}

                                <button type="submit" disabled={loadingDriver} className={`admin-driver-vehicle-btn ${editingDriverId ? 'admin-driver-vehicle-btn-save-edit' : 'admin-driver-vehicle-btn-save-driver'}`}>
                                    {loadingDriver ? 'Processing...' : editingDriverId ? 'Save Profile' : 'Register Driver'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="admin-driver-vehicle-table-card">
                        <div className="admin-driver-vehicle-table-header"></div>

                        <div className="admin-driver-vehicle-table-responsive">
                            {loadingData ? (
                                <div className="admin-driver-vehicle-loading-state">
                                    <Loader2 size={35} className="admin-driver-vehicle-spinner" />
                                    <p>Fetching roster...</p>
                                </div>
                            ) : driversList.length === 0 ? (
                                <div className="admin-driver-vehicle-empty-state">
                                    <Users size={60} /><p>No drivers registered in the system roster yet.</p></div>
                            ) : (
                                <table className="admin-driver-vehicle-table">
                                    <thead>
                                        <tr>
                                            <th className="admin-driver-vehicle-th">Full Name</th>
                                            <th className="admin-driver-vehicle-th">Email</th>
                                            <th className="admin-driver-vehicle-th">Address</th>
                                            <th className="admin-driver-vehicle-th">NIC</th>
                                            <th className="admin-driver-vehicle-th">Phone</th>
                                            <th className="admin-driver-vehicle-th">Emergency</th>
                                            <th className="admin-driver-vehicle-th">Li: Number</th>
                                            <th className="admin-driver-vehicle-th">Li: Expiry</th>
                                            <th className="admin-driver-vehicle-th">Status</th>
                                            <th className="admin-driver-vehicle-th admin-driver-vehicle-text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {driversList.map((driver) => {
                                            const dId = driver.id || driver._id;
                                            return (
                                                <tr key={dId} className="admin-driver-vehicle-tr">
                                                    <td className="admin-driver-vehicle-td">{driver.name || driver.driverName}</td>
                                                    <td className="admin-driver-vehicle-td">{driver.email}</td>
                                                    <td className="admin-driver-vehicle-td">{driver.address}</td>
                                                    <td className="admin-driver-vehicle-td">{driver.nic}</td>
                                                    <td className="admin-driver-vehicle-td">{driver.phoneNumber}</td>
                                                    <td className="admin-driver-vehicle-td">{driver.emergencyContact}</td>
                                                    <td className="admin-driver-vehicle-td">{driver.licenseNumber}</td>
                                                    <td className="admin-driver-vehicle-td admin-driver-vehicle-expiry-text">{driver.licenseExpiryDate}</td>

                                                    <td className="admin-driver-vehicle-td">
                                                        {getStatusIndicator(driver.status || 'AVAILABLE')}
                                                    </td>
                                                    <td className="admin-driver-vehicle-td admin-driver-vehicle-text-right">
                                                        <div className="admin-driver-vehicle-actions-group">
                                                            <button onClick={() => handleDriverEditTrigger(driver)} title="Edit Driver Profile" className="admin-driver-vehicle-action-btn admin-driver-vehicle-btn-edit"><Edit size={16} /></button>
                                                            <button onClick={() => handleDriverDelete(dId)} title="Remove Driver" className="admin-driver-vehicle-action-btn admin-driver-vehicle-btn-delete"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDriversVehicles;