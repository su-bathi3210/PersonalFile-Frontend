import React from 'react';

const UnderMaintenance = () => {
    // Inline styles use karala thiyenne custom CSS file ekak nathuvath vada karanna
    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            backgroundColor: '#f8f9fa',
            color: '#333',
            textAlign: 'center',
            padding: '20px',
        },
        card: {
            backgroundColor: '#ffffff',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
            maxWidth: '500px',
            width: '100%',
        },
        icon: {
            fontSize: '64px',
            marginBottom: '20px',
            color: '#f39c12', // Warning color
        },
        title: {
            fontSize: '28px',
            fontWeight: '600',
            marginBottom: '15px',
            color: '#2c3e50',
        },
        text: {
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#7f8c8d',
            marginBottom: '25px',
        },
        spinner: {
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto',
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Maintenance Icon ekak (Emoji) */}
                <div style={styles.icon}>🛠️</div>

                <h1 style={styles.title}>Under Maintenance</h1>

                <p style={styles.text}>
                    We are currently performing scheduled maintenance to improve our services.
                    We'll be back online shortly. Thank you for your patience!
                </p>

                {/* Loading animation ekak hadaganna custom style injection ekak */}
                <div style={styles.spinner}></div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default UnderMaintenance;