import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  const mongoUri = env.mongoUri;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is required');
  }

  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10
  });

  logger.info('MongoDB connected', {
    host: connection.connection.host,
    database: connection.connection.name
  });

  return connection;
};

export const disconnectDB = () => mongoose.connection.close(false);
