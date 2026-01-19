export default (req) => {
  const rawId = req.params?.id ?? 'grp_unknown'
  const id = Array.isArray(rawId) ? rawId.join('-') : rawId
  return {
    ok: true,
    id,
  }
}
