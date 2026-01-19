export default (req, res) => {
  const rawId = req.params?.id ?? 'ord_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  const rawStatus = req.query?.status ?? req.body?.status
  const statusValue = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus
  if (statusValue === 'shipped') {
    res.statusCode = 409
    return {
      ok: false,
      error: 'order_already_shipped',
      id,
    }
  }
  return {
    ok: true,
    id,
    status: 'canceled',
  }
}
