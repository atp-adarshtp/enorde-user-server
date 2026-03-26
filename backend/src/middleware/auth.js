import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function generateToken(userId) {
  const expirationHours = parseInt(process.env.JWT_EXPIRATION_HOURS || '24', 10);
  const expiresIn = expirationHours * 60 * 60;
  
  return jwt.sign(
    { sub: userId },
    JWT_SECRET,
    { expiresIn }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
