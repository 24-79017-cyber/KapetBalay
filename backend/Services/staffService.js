import bcrypt from 'bcryptjs';
import * as staffModel from '../Models/staffModel.js';

// STAFF LOGIN
export const loginStaff = async (username, password) => {
    if (!username || !password) {
        throw new Error('Please enter your username and password.');
    }

    const staff = await staffModel.getStaffByUsername(username);

    if (!staff) {
        throw new Error('Invalid username or password.');
    }

    const passwordMatch = await bcrypt.compare(
        password,
        staff.password
    );

    if (!passwordMatch) {
        throw new Error('Invalid username or password.');
    }

    return {
        staff_id: staff.staff_id,
        username: staff.username,
        full_name: staff.full_name
    };
};