// Authentication Configuration
const AUTH_CONFIG = {
    STAGING_URL: 'https://api.brilliantplus.app',
    PRODUCTION_URL: 'https://api.brilliantplus.app',
    TOKEN_ENDPOINT: '/Token'
};

// Store tokens securely
let authTokens = {
    access_token: null,
    refresh_token: null,
    token_type: null,
    expires_in: null,
    expires_at: null
};

// Function to get authentication token
async function getAuthToken(credentials = null) {
    // If we already have a valid token, return the current tokens
    if (authTokens.access_token) {
        const now = new Date();
        const expiresAt = new Date(authTokens.expires_at);
        if (expiresAt > now) {
            return authTokens;
        }
    }

    // Use stored credentials if none provided
    const defaultCredentials = {
        personIdentifier: 'MattHBrilliant',
        personTypeId: '3'
    };

    credentials = credentials || defaultCredentials;

    try {
        const url = `${AUTH_CONFIG.STAGING_URL}${AUTH_CONFIG.TOKEN_ENDPOINT}`;
        const formData = new URLSearchParams();

        if (credentials.personIdentifier) {
            formData.append('grant_type', 'password');
            formData.append('personIdentifier', credentials.personIdentifier);
            formData.append('personTypeId', credentials.personTypeId);
        } else {
            formData.append('grant_type', 'password');
            formData.append('username', credentials.username);
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Update stored tokens
        authTokens = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            token_type: data.token_type,
            expires_at: new Date(new Date().getTime() + data.expires_in * 1000)
        };

        return authTokens;
    } catch (error) {
        console.error('Authentication error:', error);
        throw error;
    }
}

// Function to get current valid token
async function getValidToken() {
    if (!authTokens.access_token) {
        throw new Error('No authentication token available. Please authenticate first.');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiresAt = new Date(authTokens.expires_at);
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresAt - now < fiveMinutes) {
        // Token is expired or about to expire, refresh it
        await refreshAuthToken();
    }

    return {
        token: authTokens.access_token,
        type: authTokens.token_type
    };
}

// Function to refresh token
async function refreshAuthToken() {
    try {
        if (!authTokens.refresh_token) {
            throw new Error('No refresh token available');
        }

        const url = `${AUTH_CONFIG.STAGING_URL}${AUTH_CONFIG.TOKEN_ENDPOINT}`;
        const formData = new URLSearchParams();
        formData.append('grant_type', 'refresh_token');
        formData.append('refresh_token', authTokens.refresh_token);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // Update stored tokens
        authTokens = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            token_type: data.token_type,
            expires_at: new Date(new Date().getTime() + data.expires_in * 1000)
        };

        return authTokens;
    } catch (error) {
        console.error('Token refresh error:', error);
        throw error;
    }
}

// Function to get authentication headers
async function getAuthHeaders() {
    const { token, type } = await getValidToken();
    return {
        'Authorization': `${type} ${token}`,
        'Content-Type': 'application/json'
    };
}

// Export functions
export {
    getAuthToken,
    refreshAuthToken,
    getValidToken,
    getAuthHeaders
}; 