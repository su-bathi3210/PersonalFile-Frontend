import React, {
    useState,
    useEffect
} from 'react';

import API from '../API/Axios';

import '../CSS/DriverVehicleUpdate.css';

const DriverVehicleUpdate = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [serviceKm, setServiceKm] = useState('');
    const [serviceCost, setServiceCost] = useState('');
    const [nextServiceKm, setNextServiceKm] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const response = await API.get('/vehicles/all');
            setVehicles(response.data);
            setError('');
        } catch (err) {
            setError('⚠️ Unable to retrieve vehicle details. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddServiceRecord = async (vehicleId) => {
        if (!serviceKm || isNaN(serviceKm) || parseFloat(serviceKm) <= 0) {
            alert('⚠️ Please enter the correct meter reading for the service.');
            return;
        }
        if (!serviceCost || isNaN(serviceCost) || parseFloat(serviceCost) < 0) {
            alert('⚠️ Please enter the correct service cost.');
            return;
        }
        if (!nextServiceKm || isNaN(nextServiceKm) || parseFloat(nextServiceKm) <= parseFloat(serviceKm)) {
            alert('⚠️ The next service kilometer value must be greater than the meter value at which the service was performed.');
            return;
        }
        if (!description.trim()) {
            alert('⚠️ Please briefly describe the service performed.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');
            setSuccessMessage('');

            await API.post(
                `/vehicles/${vehicleId}/service-record?serviceKm=${serviceKm}&serviceCost=${serviceCost}&nextServiceKm=${nextServiceKm}&description=${encodeURIComponent(description)}`
            );

            setSuccessMessage('✅ Vehicle service record and current meter value successfully updated!');
            resetForm();
            await fetchVehicles();
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err) {
            const errorMsg = err.response?.data || '❌ Failed to insert service report.';
            setError(typeof errorMsg === 'string' ? errorMsg : '❌ Failed to insert service report.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedVehicleId(null);
        setServiceKm('');
        setServiceCost('');
        setNextServiceKm('');
        setDescription('');
    };

    const handleActionTrigger = (vehicleId) => {
        setServiceKm('');
        setServiceCost('');
        setNextServiceKm('');
        setDescription('');
        setSelectedVehicleId(vehicleId);
    };

    return (
        <div className="driver-vehicle-update-container">
            <div className="driver-vehicle-update-header-section">
                <h2 className="driver-vehicle-update-title">වාහන නඩත්තු සහ සේවා ලොග්</h2>
                <p className="driver-vehicle-update-subtitle">නව සේවා යාවත්කාලීන කිරීම්, වත්මන් සැතපුම් ගණන ඉදිරිපත් කරන්න, සහ ඉදිරි නඩත්තු කාලසටහන් නිරීක්ෂණය කරන්න.</p>
            </div>

            {error && <div className="driver-vehicle-update-alert-error">{error}</div>}
            {successMessage && <div className="driver-vehicle-update-alert-success">{successMessage}</div>}

            {loading ? (
                <div className="driver-vehicle-update-loading">Loading data...</div>
            ) : (
                <div className="driver-vehicle-update-grid">
                    {vehicles.map((vehicle) => {
                        const currentKm = Math.round(vehicle.currentKm || 0);
                        const nextService = Math.round(vehicle.nextServiceDueDateKm || 0);
                        const remainingKm = nextService > currentKm ? nextService - currentKm : 0;

                        return (
                            <div key={vehicle.id} className="driver-vehicle-update-card">
                                <div className="driver-vehicle-update-card-badge" data-status={vehicle.status}>
                                    {vehicle.status === 'AVAILABLE' ? 'Available' : 'Booked'}
                                </div>

                                <h3 className="driver-vehicle-update-car-number">{vehicle.vehicleNumber}</h3>
                                <p className="driver-vehicle-update-car-model">
                                    {vehicle.manufacturer} {vehicle.model} ({vehicle.vehicleType})
                                </p>

                                <div className="driver-vehicle-update-km-display-box">
                                    <div className="driver-vehicle-update-km-row service-due-row">
                                        <span className="driver-vehicle-update-km-label">ඊළඟ සේවාව</span>
                                        <span className="driver-vehicle-update-km-value text-warning">
                                            {nextService > 0 ? `${nextService} KM` : ''}
                                        </span>
                                    </div>
                                    {nextService > 0 && (
                                        <div className="driver-vehicle-service-remaining">More <strong>{remainingKm} KM</strong> Can be run</div>
                                    )}
                                </div>

                                <div className="driver-vehicle-update-summary-box service-summary-box">
                                    <h4 className="driver-vehicle-update-summary-title">අතීත සේවා වාර්තාවල සාරාංශය</h4>
                                    {vehicle.serviceHistorySummary && vehicle.serviceHistorySummary.length > 0 ? (
                                        <ul className="driver-vehicle-update-summary-list">
                                            {vehicle.serviceHistorySummary.map((service, index) => {
                                                const recordNumber = index + 1;
                                                return (
                                                    <li key={service.id || index} className="driver-vehicle-update-summary-item service-item">
                                                        <span className="driver-vehicle-update-summary-count service-count">{recordNumber}</span>
                                                        <span className="driver-vehicle-update-summary-text">
                                                            <strong>{Math.round(service.serviceCost || 0).toLocaleString()} LKR</strong> Spent and serviced
                                                            <small> Meter: {Math.round(service.serviceKm || 0)} KM | next service: {Math.round(service.nextServiceKm || 0)} KM</small>
                                                            <div className="service-desc-text">🔧 {service.description}</div>
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="driver-vehicle-update-no-summary">සේවා වාර්තා තවමත් ඇතුළත් කර නොමැත.</p>
                                    )}
                                </div>

                                {selectedVehicleId === vehicle.id ? (
                                    <div className="driver-vehicle-update-action-box">
                                        <div className="driver-tab-content">
                                            <div className="driver-vehicle-update-form-group">
                                                <label className="driver-input-label">Service KM</label>
                                                <input
                                                    type="number"
                                                    className="driver-vehicle-update-input"
                                                    placeholder={`Old meter: ${currentKm} KM`}
                                                    value={serviceKm}
                                                    onChange={(e) => setServiceKm(e.target.value)}
                                                    disabled={submitting}
                                                />
                                            </div>

                                            <div className="driver-vehicle-update-form-group">
                                                <label className="driver-input-label">Service cost (LKR)</label>
                                                <input
                                                    type="number"
                                                    className="driver-vehicle-update-input"
                                                    placeholder="Enter the price..."
                                                    value={serviceCost}
                                                    onChange={(e) => setServiceCost(e.target.value)}
                                                    disabled={submitting}
                                                />
                                            </div>

                                            <div className="driver-vehicle-update-form-group">
                                                <label className="driver-input-label">Meter value for next service</label>
                                                <input
                                                    type="number"
                                                    className="driver-vehicle-update-input"
                                                    placeholder="Ex: 5000"
                                                    value={nextServiceKm}
                                                    onChange={(e) => setNextServiceKm(e.target.value)}
                                                    disabled={submitting}
                                                />
                                            </div>

                                            <div className="driver-vehicle-update-form-group">
                                                <label className="driver-input-label">What was done </label>
                                                <textarea
                                                    className="driver-vehicle-update-input driver-textarea"
                                                    placeholder="Engine oil changed, Full service..."
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    disabled={submitting}
                                                    rows="2"
                                                />
                                            </div>

                                            <div className="driver-vehicle-update-action-row">
                                                <button className="driver-vehicle-update-btn-save service-save-btn" onClick={() => handleAddServiceRecord(vehicle.id)} disabled={submitting}>
                                                    {submitting ? 'Saving...' : 'Note the service'}
                                                </button>

                                                <button className="driver-vehicle-update-btn-cancel" onClick={resetForm} disabled={submitting}>Back</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <button className="driver-vehicle-update-btn-trigger" onClick={() => handleActionTrigger(vehicle.id)}>Enter a service report</button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DriverVehicleUpdate;