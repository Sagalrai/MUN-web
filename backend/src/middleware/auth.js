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
  if (!req.admin?.adminId || req.admin?.userType === 'oc') return res.status(403).json({ message: 'Admin access required' });
  next();
};

// Delegates do not have staff accounts. This token grants access only to the
// registration created in the same browser; it cannot grant dashboard access.
export const requireRegistrationAccess = (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return res.status(401).json({ message: 'Registration access is required' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'registration' || !payload.registrationId) return res.status(403).json({ message: 'Invalid registration access' });
    req.registrationAccess = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Registration access has expired. Please contact the conference team.' });
  }
};

export const requireOc = (req, res, next) => {
  if (req.admin?.userType !== 'oc') return res.status(403).json({ message: 'OC access required' });
  next();
};
