export default {
  response: async (_req: unknown, res: { setHeader: (key: string, value: string) => void }) => {
    res.setHeader('x-mokup-auth', 'issued')
    return {
      token: 'mokup-demo-token',
      expiresIn: 3600,
    }
  },
}
