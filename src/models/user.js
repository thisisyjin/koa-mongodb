import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// 스키마 생성
const UserSchema = new Schema({
  username: String,
  hashedPassword: String,
});

// 인스턴스 메서드 (모델 인스턴스에서 사용)

UserSchema.methods.serialize = function () {
  const data = this.toJSON();
  delete data.hashedPassword;
  return data;
};

UserSchema.methods.setPassword = async function (password) {
  const hash = await bcrypt.hash(password, 10);
  this.hashedPassword = hash;
};

UserSchema.methods.checkPassword = async function (password) {
  const result = await bcrypt.compare(password, this.hashedPassword);
  return result;
};

// 정적 메서드 (모델에서 사용)
UserSchema.statics.findByUsername = function (username) {
  return this.findOne({ username });
};

UserSchema.methods.generateToken = function () {
  const token = jwt.sign(
    {
      _id: this.id,
      username: this.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    },
  );
  return token;
};

// 모델 생성
const User = mongoose.model('User', UserSchema);
export default User;
