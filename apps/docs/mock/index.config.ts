export default {
  headers: {
    'x-mokup-scope': 'docs',
  },
  delay: 120,
  middleware: [
    async (
      _req: unknown,
      res: { setHeader: (key: string, value: string) => void },
      _ctx: unknown,
      next: () => Promise<unknown>,
    ) => {
      res.setHeader('x-mokup-middleware', 'enabled')
      return await next()
    },
  ],
}
