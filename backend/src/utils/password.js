import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (candidatePassword, hashedPassword) =>
  bcrypt.compare(candidatePassword, hashedPassword);

export const isStrongPassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/.test(password);

export const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const random = Array.from(crypto.randomBytes(12), (byte) => alphabet[byte % alphabet.length]).join('');
  return `${random}Aa1!`;
};

export const generateUnpredictablePassword = (name, dob) => {
  const firstWord = (name || 'Employee').trim().split(/\s+/)[0];
  const cleanName = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).replace(/[^a-zA-Z0-9]/g, '');

  let dobString = '01012000';
  if (dob) {
    const date = new Date(dob);
    if (!isNaN(date.getTime())) {
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      dobString = `${day}${month}${year}`;
    }
  }

  const specialChars = '@#';
  const randSpecial1 = specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  const randSpecial2 = specialChars.charAt(Math.floor(Math.random() * specialChars.length));

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  const suffixLength = 2 + Math.floor(Math.random() * 3); // 2 to 4 characters
  for (let i = 0; i < suffixLength; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${cleanName}${randSpecial1}${dobString}${randSpecial2}${suffix}`;
};
