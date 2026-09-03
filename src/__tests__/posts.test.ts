import { describe, it, expect } from 'vitest'
import { unconfiguredAdapter } from '../services/unconfigured'
import { UNCONFIGURED_CODE, UNCONFIGURED_MESSAGE } from '../services/backend'

describe('Phase 2: Posts Adapter (unconfigured seam)', () => {
  it('throws unconfigured error on listFeed when provider is missing', async () => {
    await expect(unconfiguredAdapter.posts.listFeed()).rejects.toMatchObject({
      code: UNCONFIGURED_CODE,
      message: UNCONFIGURED_MESSAGE,
    })
  })

  it('throws unconfigured error on create post when provider is missing', async () => {
    await expect(
      unconfiguredAdapter.posts.create({ body: 'Hello marsh' })
    ).rejects.toMatchObject({
      code: UNCONFIGURED_CODE,
      message: UNCONFIGURED_MESSAGE,
    })
  })

  it('throws unconfigured error on delete post when provider is missing', async () => {
    await expect(
      unconfiguredAdapter.posts.delete('post-123')
    ).rejects.toMatchObject({
      code: UNCONFIGURED_CODE,
      message: UNCONFIGURED_MESSAGE,
    })
  })

  it('throws unconfigured error on toggleReaction when provider is missing', async () => {
    await expect(
      unconfiguredAdapter.posts.toggleReaction('post-123', 'like')
    ).rejects.toMatchObject({
      code: UNCONFIGURED_CODE,
      message: UNCONFIGURED_MESSAGE,
    })
  })

  it('throws unconfigured error on getReactionTypes when provider is missing', async () => {
    await expect(
      unconfiguredAdapter.posts.getReactionTypes()
    ).rejects.toMatchObject({
      code: UNCONFIGURED_CODE,
      message: UNCONFIGURED_MESSAGE,
    })
  })

  it('throws unconfigured error on getOwn profile when provider is missing', async () => {
    await expect(unconfiguredAdapter.profiles.getOwn()).rejects.toMatchObject({
      code: UNCONFIGURED_CODE,
      message: UNCONFIGURED_MESSAGE,
    })
  })
})
