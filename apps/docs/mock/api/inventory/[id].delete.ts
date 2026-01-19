export default (req) => {
  const rawId = req.params?.id ?? 'inv_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  return {
    ok: true,
    id,
  }
}
