// Authentication service for handling login state and credentials

// Dummy credentials for testing
const DUMMY_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Check if user is authenticated
export const isAuthenticated = () => {
    return localStorage.getItem('isAuthenticated') === 'true';
};

// Login function
export const login = (username, password) => {
    if (username === DUMMY_CREDENTIALS.username && password === DUMMY_CREDENTIALS.password) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify({ username }));
        return true;
    }
    return false;
};

// Logout function
export const logout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
};

// Get current user
export const getCurrentUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};