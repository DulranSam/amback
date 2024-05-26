const jwt = require('jsonwebtoken');
const { SECRET_KEY } = process.env;

function authenticate(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ error: "Authentication required." });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token." });
    }
    req.user = decoded;
    next();
  });
}

module.exports = authenticate;
