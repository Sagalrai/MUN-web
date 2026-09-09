import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.admin?.userType === 'oc') return res.status(403).json({ message: 'Admin access required' });
  next();
};

export const requireOc = (req, res, next) => {
  if (req.admin?.userType !== 'oc') return res.status(403).json({ message: 'OC access required' });
  next();
};