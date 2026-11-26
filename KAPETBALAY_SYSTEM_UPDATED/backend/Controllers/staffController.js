import * as staffService from '../Services/staffService.js';

// STAFF LOGIN
export const loginStaff = async (req, res) => {
    try {
        const { username, password } = req.body;

        const staff = await staffService.loginStaff(
            username,
            password
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            staff
        });

    } catch (error) {
        console.error('Login error:', error);

        const statusCode =
            error.message === 'Invalid username or password.' ||
            error.message === 'Please enter your username and password.'
                ? 401
                : 500;

        return res.status(statusCode).json({
            success: false,
            message: error.message || 'Something went wrong during login.'
        });
    }
};