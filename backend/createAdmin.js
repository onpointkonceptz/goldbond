const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/goldbond')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

async function createAdmin() {
    try {
        // Check if admin exists
        const existingAdmin = await User.findOne({ email: 'goldbondadmin@gmail.com' });
        
        if (existingAdmin) {
            console.log('Updating existing admin...');
            existingAdmin.role = 'super_admin';
            existingAdmin.status = 'active';
            existingAdmin.password = 'goldbond123'; // Will be hashed by pre-save hook
            await existingAdmin.save();
            console.log('✅ Admin updated successfully!');
        } else {
            console.log('Creating new admin...');
            const admin = await User.create({
                fullName: 'Goldbond Admin',
                firstName: 'Goldbond',
                lastName: 'Admin',
                email: 'goldbondadmin@gmail.com',
                phone: '08012345678',
                password: 'goldbond123',
                role: 'super_admin',
                status: 'active'
            });
            console.log('✅ Admin created successfully!');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createAdmin();