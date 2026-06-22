export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI,
  clientOrigins: (process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || 'sharpkode-workforce',
  defaultOfficeLatitude: Number(process.env.OFFICE_LATITUDE || 0),
  defaultOfficeLongitude: Number(process.env.OFFICE_LONGITUDE || 0),
  defaultOfficeAllowedRadiusMeters: Number(process.env.OFFICE_ALLOWED_RADIUS_METERS || 100)
};

export const isProduction = env.nodeEnv === 'production';

const requiredEnvironmentVariables = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  ...(isProduction
    ? ['CLIENT_ORIGINS', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    : [])
];

const missingEnvironmentVariables = requiredEnvironmentVariables.filter(
  (key) => !process.env[key] || process.env[key].trim() === ''
);

if (missingEnvironmentVariables.length > 0) {
  throw new Error(
    `Startup blocked: missing required environment variable(s): ${missingEnvironmentVariables.join(', ')}`
  );
}
