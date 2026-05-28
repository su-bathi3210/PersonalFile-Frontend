import React, {
    useState,
    useEffect
} from 'react';

import axios from 'axios';

import api from '../API/Axios';

import { useNavigate } from 'react-router-dom';

import '../CSS/LoginRegister.css';

const LoginRegister = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [step, setStep] = useState(1);

    const [departments, setDepartments] = useState([]);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        department: '',
    });

    const [forgotData, setForgotData] = useState({
        email: '',
        serviceNumber: '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await api.get('/departments/all');
                setDepartments(response.data);
            } catch (err) {
                console.error("Error fetching departments:", err);
                if (err.response?.status === 403) {
                    localStorage.removeItem('token');
                }
            }
        };
        fetchDepartments();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleForgotChange = (e) => {
        setForgotData({ ...forgotData, [e.target.name]: e.target.value });
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);
        try {
            await api.post('/api/auth/forgot-password/request', {
                email: forgotData.email,
                serviceNumber: forgotData.serviceNumber
            });
            setMessage("The OTP has been sent to your email.");
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || "The information could not be verified.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await api.post('/api/auth/forgot-password/verify', {
                email: forgotData.email,
                otp: forgotData.otp
            });
            setStep(3);
        } catch (err) {
            setError("The OTP number entered is incorrect.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (forgotData.newPassword !== forgotData.confirmPassword) {
            setError("Passwords do not match!");
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/api/auth/forgot-password/reset', {
                email: forgotData.email,
                newPassword: forgotData.newPassword
            });
            setMessage("Password changed successfully. Login now.");
            setTimeout(() => {
                setIsForgotPassword(false);
                setIsLogin(true);
                setStep(1);
            }, 2000);
        } catch (err) {
            setError("Unable to change password.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const response = await api.post('/api/auth/login', {
                    username: formData.email, // Backend එක බලාපොරොත්තු වන Username එකට මේ field එකම යනවා (Email හෝ Phone එක)
                    password: formData.password
                });

                const { token, email, roles, username, profileImage } = response.data;

                localStorage.setItem('token', token);
                localStorage.setItem('employeeEmail', email);
                localStorage.setItem('username', username);
                localStorage.setItem('roles', JSON.stringify(roles));

                if (profileImage && profileImage.trim() !== "") {
                    localStorage.setItem('userImage', profileImage);
                } else {
                    localStorage.removeItem('userImage');
                }

                setMessage('Login Successful!');
                setTimeout(() => {
                    // --- Driver ඇතුළු අනෙකුත් සියලුම භූමිකාවන් සඳහා Dashboard Routes ---
                    if (roles.includes('ROLE_DRIVER')) navigate('/DriverDashboard');
                    else if (roles.includes('ROLE_EMPLOYEE')) navigate('/EmployeeDashboard');
                    else if (roles.includes('ROLE_VEHICLE_ADMIN')) navigate('/AdminVehicleDashboard');
                    else if (roles.includes('ROLE_VEHICLE_APPROVAL')) navigate('/ApprovalVehicleDashboard');
                    else if (roles.includes('ROLE_PERSONALFILE_ADMIN')) navigate('/AdminPFDashboard');
                    else if (roles.includes('ROLE_PERSONALFILE_APPROVAL')) navigate('/ApprovalPFDashboard');
                }, 1500);

            } else {
                await api.post('/api/auth/register', {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    department: formData.department
                });
                setMessage("Registration Successful! Please login.");
                setIsLogin(true);
                setFormData({ username: '', email: '', password: '', fullName: '', department: '' });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="toast-container">
                {message && (
                    <div className="toast success-toast">
                        <div className="toast-content"><strong>Success!</strong><p>{message}</p></div>
                        <span className="close-toast" onClick={() => setMessage('')}>&times;</span>
                    </div>
                )}
                {error && (
                    <div className="toast error-toast">
                        <div className="toast-content"><strong>Error!</strong><p>{error}</p></div>
                        <span className="close-toast" onClick={() => setError('')}>&times;</span>
                    </div>
                )}
            </div>

            <div className="bg"></div><div className="bg bg2"></div><div className="bg bg3"></div>

            <div className="card">
                <img src="/DCDLogo.png" alt="Department Logo" className="logo" />
                <h1 className="headingdep">Department of Cooperative Development</h1>

                {isForgotPassword ? (
                    <>
                        <h2 className="title">Reset Password</h2>
                        <form className="form-group">
                            {step === 1 && (
                                <>
                                    <input name="email" type="email" placeholder="Email Address" required
                                        value={forgotData.email} onChange={handleForgotChange} className="input-field" />
                                    <input name="serviceNumber" type="text" placeholder="Service Number" required
                                        value={forgotData.serviceNumber} onChange={handleForgotChange} className="input-field" />
                                    <button onClick={handleRequestOTP} className="submit-btn" disabled={isLoading}>
                                        {isLoading ? 'Sending...' : 'Send OTP'}
                                    </button>
                                </>
                            )}
                            {step === 2 && (
                                <>
                                    <input name="otp" type="text" placeholder="Enter 6-digit OTP" required
                                        value={forgotData.otp} onChange={handleForgotChange} className="input-field" />
                                    <button onClick={handleVerifyOTP} className="submit-btn" disabled={isLoading}>
                                        Verify OTP
                                    </button>
                                </>
                            )}
                            {step === 3 && (
                                <>
                                    <input name="newPassword" type="password" placeholder="New Password" required
                                        value={forgotData.newPassword} onChange={handleForgotChange} className="input-field" />
                                    <input name="confirmPassword" type="password" placeholder="Confirm Password" required
                                        value={forgotData.confirmPassword} onChange={handleForgotChange} className="input-field" />
                                    <button onClick={handleResetPassword} className="submit-btn" disabled={isLoading}>
                                        Update Password
                                    </button>
                                </>
                            )}
                            <p className="toggle-link" style={{ textAlign: 'center', marginTop: '10px' }}
                                onClick={() => { setIsForgotPassword(false); setStep(1); setError(''); setMessage(''); }}>Back to Sign In </p>
                        </form>
                    </>
                ) : (
                    <>
                        <h1 className="headingpara">Sign In To Continue To Your Account</h1>
                        <h2 className="title">{isLogin ? 'Login' : 'Registration'}</h2>
                        <form className="form-group" onSubmit={handleSubmit}>
                            {!isLogin && (
                                <>
                                    <input name="username" type="text" placeholder="Full Name" required value={formData.username} onChange={handleChange} className="input-field" />
                                    <select name="department" required value={formData.department} onChange={handleChange} className="input-field arrow">
                                        <option value="">Select Your Department</option>
                                        {departments.map((dept) => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                                    </select>
                                </>
                            )}
                            {/* රියදුරන්ට පහසු වෙන්න placeholder එක වෙනස් කළා */}
                            <input name="email" type="text" placeholder={isLogin ? "Email / NIC" : "Email Address"} required value={formData.email} onChange={handleChange} className="input-field" />
                            <input name="password" type="password" placeholder={isLogin ? "Password / Phone Number" : "Password"} required value={formData.password} onChange={handleChange} className="input-field" />

                            <div className="options">
                                <label><input type="checkbox" /> Remember me</label>
                                <span className="forgot" onClick={() => { setIsForgotPassword(true); setIsLogin(true); setError(''); setMessage(''); }}>
                                    Forgot Password?
                                </span>
                            </div>

                            <button type="submit" disabled={isLoading} className="submit-btn">
                                {isLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
                            </button>
                        </form>
                        <p className="toggle-text">
                            {isLogin ? (
                                <>Don't have an account? <span className="toggle-link" onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}>Sign Up here</span></>
                            ) : (
                                <span className="toggle-link" onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}>Back to Sign In</span>
                            )}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginRegister;