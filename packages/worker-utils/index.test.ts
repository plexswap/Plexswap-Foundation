import { describe, it, expect } from 'vitest'
import { CORS_ALLOW, isOriginAllowed } from './index'

describe('worker-utils', () => {
  it.each([
    ['https://swap.plexfinance.us', true],
    ['https://onramp-api.plexfinance.us', true],
    ['http://localhost:3000', true],
    ['http://localhost:4000', true],
    ['http://localhost:8787', true],
  ])(`isOriginAllowed(%s)`, (origin, expected) => {
    expect(isOriginAllowed(origin, CORS_ALLOW)).toBe(expected)
  })
})
