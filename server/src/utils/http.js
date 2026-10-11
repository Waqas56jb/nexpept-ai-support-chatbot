export class HttpError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {string} [code]
   */
  constructor(status, message, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function notFound(message = 'Not found') {
  return new HttpError(404, message, 'NOT_FOUND')
}

export function badRequest(message = 'Bad request') {
  return new HttpError(400, message, 'VALIDATION')
}

export function unauthorized(message = 'Unauthorized') {
  return new HttpError(401, message, 'AUTH_FAILED')
}

export function conflict(message = 'Conflict') {
  return new HttpError(409, message, 'CONFLICT')
}

/** @param {import('express').Request} req */
export function getAgentId(req) {
  const header = req.headers['x-agent-id']
  if (typeof header === 'string' && header.trim()) return header.trim()
  if (req.body && typeof req.body.agentId === 'string') return req.body.agentId
  return null
}
