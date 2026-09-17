import { describe, it, expect } from 'vitest'
import { unconfiguredAdapter } from '../services/unconfigured'
import { UNCONFIGURED_CODE, UNCONFIGURED_MESSAGE } from '../services/backend'

describe('projects adapter (unconfigured seam)', () => {
  it('throws unconfigured on listPublished, so the landing can fall back', async () => {
    await expect(unconfiguredAdapter.projects.listPublished()).rejects.toMatchObject({
      code: UNCONFIGURED_CODE,
      message: UNCONFIGURED_MESSAGE,
    })
  })

  it('throws unconfigured on listAll', async () => {
    await expect(unconfiguredAdapter.projects.listAll()).rejects.toMatchObject({
      code: UNCONFIGURED_CODE,
    })
  })

  it('throws unconfigured on create, update, and remove', async () => {
    await expect(
      unconfiguredAdapter.projects.create({ title: 'Thing' }),
    ).rejects.toMatchObject({ code: UNCONFIGURED_CODE })
    await expect(
      unconfiguredAdapter.projects.update('id', { title: 'Thing' }),
    ).rejects.toMatchObject({ code: UNCONFIGURED_CODE })
    await expect(unconfiguredAdapter.projects.remove('id')).rejects.toMatchObject({
      code: UNCONFIGURED_CODE,
    })
  })
})

describe('roles adapter (unconfigured seam)', () => {
  it('reports no roles when there is no provider, mirroring a null session', async () => {
    await expect(unconfiguredAdapter.roles.isOwner()).resolves.toBe(false)
  })
})
