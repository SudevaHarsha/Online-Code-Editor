// backend/models/user.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firebaseUserId: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String },
  imageUrl: { type: String },
  name: { type: String },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password || "default", 12);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);