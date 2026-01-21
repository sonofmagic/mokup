import type { MockResponseHandler } from 'mokup'

const handler: MockResponseHandler = (c) => {
  c.status(201)
  return {
    ok: true,
    data: {
      id: 'msg_2001',
      subject: 'Message 2001',
      status: 'unread',
      createdAt: '2026-01-19T12:00:00.000Z',
      updatedAt: '2026-01-19T12:00:00.000Z',
      fromId: 'usr_1001',
      toId: 'usr_1002',
      body: 'Hello!',
    },
  }
}

export default handler
