export default async (req: { params?: Record<string, string | string[]> }) => {
  const id = req.params?.id ?? 'unknown'
  return {
    id,
    name: Array.isArray(id) ? id.join('-') : `User ${id}`,
    role: 'viewer',
  }
}
