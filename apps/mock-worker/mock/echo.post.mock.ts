const rule = {
  response: async (c) => {
    const body = await c.req.json().catch(() => null)
    return {
      ok: true,
      received: body,
    }
  },
}

export default rule
