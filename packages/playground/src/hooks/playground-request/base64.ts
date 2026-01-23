function decodeBase64(input: string) {
  const trimmed = input.trim()
  if (!trimmed) {
    return { value: undefined as Uint8Array | undefined }
  }
  const normalized = trimmed.startsWith('data:')
    ? trimmed.split('base64,').pop() ?? ''
    : trimmed
  const cleaned = normalized.replace(/\s+/g, '')
  try {
    const binary = atob(cleaned)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    return { value: bytes }
  }
  catch (err) {
    return { error: err instanceof Error ? err.message : 'Invalid base64' }
  }
}

export { decodeBase64 }
