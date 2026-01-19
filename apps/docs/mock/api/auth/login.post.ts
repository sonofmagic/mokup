export default (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const username = body.username
  const password = body.password
  if (username !== 'demo' || password !== 'mokup') {
    res.statusCode = 401
    return {
      ok: false,
      error: 'invalid_credentials',
    }
  }
  return {
    token: 'mokup-demo-token',
    expiresIn: 3600,
    user: {
      id: 'usr_1001',
      name: 'Demo User',
      email: 'demo@example.com',
    },
  }
}
