// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
    }
}, { timestamps: true });

// Middleware para hashear la contraseña
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    console.log('Contraseña antes de hashear:', this.password);

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('Contraseña hasheada:', this.password);
        next();
    } catch (error) {
        console.error('Error al hashear:', error);
        next(error);
    }
});

// Metodo para comparar contraseñas
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);