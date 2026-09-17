import {
  useCallback,
  useEffect,
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Link, navigate } from '../../app/router'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { backend, isBackendError } from '../../services'
import type { ProjectEntry } from '../../types/domain'

/**
 * Owner-only dashboard for the landing page project list.
 * RLS is the real gate; the owner check here only decides what to render.
 */

interface Draft {
  title: string
  description: string
  repo: string
  imageUrl: string
  sort: string
  published: boolean
}

const EMPTY_DRAFT: Draft = {
  title: '',
  description: '',
  repo: '',
  imageUrl: '',
  sort: '0',
  published: true,
}

function toDraft(project: ProjectEntry): Draft {
  return {
    title: project.title,
    description: project.description,
    repo: project.repo,
    imageUrl: project.imageUrl ?? '',
    sort: String(project.sort),
    published: project.published,
  }
}

export function AdminPage() {
  const showToast = useToast()
  const [checking, setChecking] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [projects, setProjects] = useState<ProjectEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    setChecking(true)
    try {
      const owner = await backend.roles.isOwner()
      setIsOwner(owner)
      setProjects(owner ? await backend.projects.listAll() : [])
    } catch (err) {
      setError(
        isBackendError(err) ? err.message : 'Could not load the project list.',
      )
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function createProject(draft: Draft): Promise<boolean> {
    try {
      const created = await backend.projects.create({
        title: draft.title,
        description: draft.description,
        repo: draft.repo,
        imageUrl: draft.imageUrl,
        sort: Number(draft.sort) || 0,
        published: draft.published,
      })
      setProjects((prev) => [...prev, created])
      showToast('success', 'Project added.')
      return true
    } catch (err) {
      showToast(
        'error',
        isBackendError(err) ? err.message : 'Could not add the project.',
      )
      return false
    }
  }

  async function saveProject(id: string, draft: Draft): Promise<boolean> {
    try {
      const updated = await backend.projects.update(id, {
        title: draft.title,
        description: draft.description,
        repo: draft.repo,
        imageUrl: draft.imageUrl,
        sort: Number(draft.sort) || 0,
        published: draft.published,
      })
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
      showToast('success', 'Project saved.')
      return true
    } catch (err) {
      showToast(
        'error',
        isBackendError(err) ? err.message : 'Could not save the project.',
      )
      return false
    }
  }

  async function deleteProject(id: string): Promise<void> {
    try {
      await backend.projects.remove(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      showToast('success', 'Project deleted.')
    } catch (err) {
      showToast(
        'error',
        isBackendError(err) ? err.message : 'Could not delete the project.',
      )
    }
  }

  async function onSignOut() {
    await backend.auth.signOut()
    navigate('/')
  }

  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label="Primary">
        <Link className="app-brand" to="/feed">
          Hallowmarsh
        </Link>
        <div className="app-nav-actions">
          <Link className="btn btn-ghost" to="/feed">
            Back to feed
          </Link>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void onSignOut()}
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="app-main">
        <h1>Projects</h1>

        {checking ? (
          <div className="boot-screen" role="status" aria-live="polite">
            <p>Checking permissions…</p>
          </div>
        ) : error ? (
          <Card className="feed-error-card">
            <p className="form-error" role="alert">
              {error}
            </p>
            <Button variant="primary" onClick={() => void load()}>
              Retry
            </Button>
          </Card>
        ) : !isOwner ? (
          <EmptyState
            icon={<i className="fa-solid fa-lock" aria-hidden="true" />}
            title="Not available."
            hint="Managing the project list is limited to the owner."
          />
        ) : (
          <>
            <NewProjectForm onCreate={createProject} />

            <h2 className="admin-section-title">
              {projects.length} project{projects.length === 1 ? '' : 's'}
            </h2>

            {projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onSave={saveProject}
                onDelete={deleteProject}
              />
            ))}
          </>
        )}
      </main>
    </div>
  )
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/**
 * File picker plus preview. On choose, the file uploads immediately and the
 * resolved public URL lands in the draft, so Save just stores the link.
 */
function ImageUpload({
  onUploaded,
}: {
  onUploaded: (url: string) => void
}) {
  const showToast = useToast()
  const inputId = useId()
  const [uploading, setUploading] = useState(false)

  async function onChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow re-choosing the same file
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Only image files can be uploaded.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showToast('error', 'Images must be 5 MB or smaller.')
      return
    }

    setUploading(true)
    try {
      onUploaded(await backend.storage.uploadImage(file))
      showToast('success', 'Image uploaded.')
    } catch (err) {
      showToast(
        'error',
        isBackendError(err) ? err.message : 'Could not upload the image.',
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin-upload">
      <input
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={uploading}
        onChange={(e) => void onChange(e)}
      />
      <label className="btn btn-ghost admin-upload-btn" htmlFor={inputId}>
        {uploading ? (
          <span className="btn-spinner" aria-hidden="true" />
        ) : (
          <i className="fa-solid fa-arrow-up-from-bracket" aria-hidden="true" />
        )}
        {uploading ? 'Uploading…' : 'Upload image'}
      </label>
      <span className="admin-upload-hint">PNG, JPG, WebP, or GIF up to 5 MB.</span>
    </div>
  )
}

function NewProjectForm({
  onCreate,
}: {
  onCreate: (draft: Draft) => Promise<boolean>
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!draft.title.trim()) return
    setSaving(true)
    const ok = await onCreate(draft)
    setSaving(false)
    if (ok) setDraft(EMPTY_DRAFT)
  }

  return (
    <Card className="admin-card">
      <h2 className="admin-card-title">Add a project</h2>
      <form onSubmit={(e) => void submit(e)} noValidate>
        <DraftFields draft={draft} update={update} idPrefix="new">
          <ImageUpload onUploaded={(url) => update('imageUrl', url)} />
        </DraftFields>
        <div className="settings-actions">
          <Button type="submit" loading={saving} disabled={!draft.title.trim()}>
            Add project
          </Button>
        </div>
      </form>
    </Card>
  )
}

function ProjectRow({
  project,
  onSave,
  onDelete,
}: {
  project: ProjectEntry
  onSave: (id: string, draft: Draft) => Promise<boolean>
  onDelete: (id: string) => Promise<void>
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(project))
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    setDraft(toDraft(project))
  }, [project])

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave(project.id, draft)
    setSaving(false)
  }

  async function remove() {
    setDeleting(true)
    await onDelete(project.id)
    setDeleting(false)
    setConfirming(false)
  }

  return (
    <Card className="admin-card">
      <div className="admin-row-head">
        <h2 className="admin-card-title">{project.title}</h2>
        {!project.published ? (
          <span className="admin-draft-badge">draft</span>
        ) : null}
      </div>
      <form onSubmit={(e) => void submit(e)} noValidate>
        <DraftFields draft={draft} update={update} idPrefix={project.id}>
          <ImageUpload onUploaded={(url) => update('imageUrl', url)} />
        </DraftFields>
        <div className="settings-actions">
          <Button type="submit" loading={saving} disabled={!draft.title.trim()}>
            Save
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={saving || deleting}
            onClick={() => setDraft(toDraft(project))}
          >
            Reset
          </Button>
          {confirming ? (
            <>
              <span className="post-delete-warn">Delete?</span>
              <Button
                type="button"
                variant="danger"
                loading={deleting}
                onClick={() => void remove()}
              >
                Yes
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={deleting}
                onClick={() => setConfirming(false)}
              >
                No
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="ghost"
              disabled={saving}
              onClick={() => setConfirming(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}

function DraftFields({
  draft,
  update,
  idPrefix,
  children,
}: {
  draft: Draft
  update: <K extends keyof Draft>(key: K, value: Draft[K]) => void
  idPrefix: string
  children?: ReactNode
}) {
  return (
    <>
      <label className="field-label" htmlFor={`${idPrefix}-title`}>
        Title
      </label>
      <input
        id={`${idPrefix}-title`}
        className="text-input"
        type="text"
        maxLength={80}
        value={draft.title}
        onChange={(e) => update('title', e.target.value)}
      />

      <label className="field-label" htmlFor={`${idPrefix}-description`}>
        Description
      </label>
      <textarea
        id={`${idPrefix}-description`}
        className="field-textarea"
        maxLength={500}
        value={draft.description}
        onChange={(e) => update('description', e.target.value)}
      />

      <div className="admin-split">
        <div>
          <label className="field-label" htmlFor={`${idPrefix}-repo`}>
            Repository
          </label>
          <input
            id={`${idPrefix}-repo`}
            className="text-input"
            type="text"
            placeholder="owner/name"
            value={draft.repo}
            onChange={(e) => update('repo', e.target.value)}
          />
          <p className="field-hint">Drives the GitHub link and star count.</p>
        </div>
        <div>
          <label className="field-label" htmlFor={`${idPrefix}-sort`}>
            Sort order
          </label>
          <input
            id={`${idPrefix}-sort`}
            className="text-input"
            type="number"
            value={draft.sort}
            onChange={(e) => update('sort', e.target.value)}
          />
          <p className="field-hint">Lower numbers come first.</p>
        </div>
      </div>

      {children}

      <label className="field-label" htmlFor={`${idPrefix}-image`}>
        Image URL
      </label>
      <input
        id={`${idPrefix}-image`}
        className="text-input"
        type="url"
        placeholder="https://…"
        value={draft.imageUrl}
        onChange={(e) => update('imageUrl', e.target.value)}
      />
      <p className="field-hint">
        Filled in automatically when you upload, or paste any image link.
      </p>

      <div className="admin-split admin-split-tight">
        <div className="admin-preview">
          {draft.imageUrl ? (
            <img src={draft.imageUrl} alt="" />
          ) : (
            <i
              className="fa-regular fa-image repo-thumb-empty"
              aria-hidden="true"
            />
          )}
        </div>
        <label className="admin-toggle">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => update('published', e.target.checked)}
          />
          Published
        </label>
      </div>
    </>
  )
}
