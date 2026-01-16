const rule = {
  response: req => ({
    ok: true,
    received: req.body ?? null,
  }),
}

export default rule
