import matter from 'gray-matter'

export interface VaultFile {
  path: string           // url slug, e.g. "01-Topic1/note"
  globKey: string        // vault-relative path including extension, e.g. "01-Topic1/note.md"
  name: string           // filename without ext
  folder: string         // "01-Topic1" or "" for root
  title: string          // from frontmatter or first heading
  content: string        // raw markdown body
  frontmatter: Record<string, unknown>
  headings: { depth: number; text: string; id: string }[]
  isDashboard: boolean
}

export interface VaultTreeNode {
  name: string
  path: string
  type: 'folder' | 'file'
  children?: VaultTreeNode[]
  file?: VaultFile
}

// Glob is resolved relative to THIS file: src/lib/vault-index.ts
// → viewer/ is ../../ and `vault` is a symlink inside viewer/ pointing to the
//   user's StudyVault (created by the view skill entry script at runtime).
const mdModules = import.meta.glob('../../vault/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const imageModules = import.meta.glob(
  '../../vault/**/*.{png,jpg,jpeg,gif,svg,webp,avif}',
  { eager: true, import: 'default' },
) as Record<string, string>

const VAULT_PREFIX = '../../vault/'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function extractHeadings(md: string) {
  const lines = md.split('\n')
  const headings: { depth: number; text: string; id: string }[] = []
  let inCodeBlock = false
  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue
    }
    if (inCodeBlock) continue
    const m = line.match(/^(#{1,6})\s+(.+)$/)
    if (m) {
      const depth = m[1].length
      const text = m[2].trim()
      headings.push({ depth, text, id: slugify(text) })
    }
  }
  return headings
}

function relFromKey(key: string): string {
  return key.startsWith(VAULT_PREFIX) ? key.slice(VAULT_PREFIX.length) : key
}

function buildFiles(): VaultFile[] {
  const files: VaultFile[] = []
  for (const [fullPath, raw] of Object.entries(mdModules)) {
    const rel = relFromKey(fullPath)
    const parsed = matter(raw)
    const segments = rel.replace(/\.md$/, '').split('/')
    const name = segments[segments.length - 1]
    const folder = segments.slice(0, -1).join('/')
    const headings = extractHeadings(parsed.content)
    const firstH1 = headings.find((h) => h.depth === 1)
    const title =
      (parsed.data.title as string | undefined) ?? firstH1?.text ?? name

    const isDashboard =
      /dashboard/i.test(name) ||
      /dashboard/i.test(folder) ||
      /학습\s*대시보드|learning\s*dashboard/i.test(title)

    files.push({
      path: segments.join('/'),
      globKey: rel,
      name,
      folder,
      title,
      content: parsed.content,
      frontmatter: parsed.data,
      headings,
      isDashboard,
    })
  }
  return files.sort((a, b) => a.path.localeCompare(b.path))
}

export const vaultFiles: VaultFile[] = buildFiles()

export function buildTree(files: VaultFile[]): VaultTreeNode {
  const root: VaultTreeNode = { name: '', path: '', type: 'folder', children: [] }
  for (const file of files) {
    const segments = file.path.split('/')
    let cursor = root
    for (let i = 0; i < segments.length - 1; i++) {
      const folderName = segments[i]
      const folderPath = segments.slice(0, i + 1).join('/')
      let child = cursor.children!.find((c) => c.type === 'folder' && c.name === folderName)
      if (!child) {
        child = { name: folderName, path: folderPath, type: 'folder', children: [] }
        cursor.children!.push(child)
      }
      cursor = child
    }
    cursor.children!.push({
      name: file.name,
      path: file.path,
      type: 'file',
      file,
    })
  }
  const sortTree = (node: VaultTreeNode) => {
    if (!node.children) return
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    node.children.forEach(sortTree)
  }
  sortTree(root)
  return root
}

export const vaultTree = buildTree(vaultFiles)

export function findFile(path: string): VaultFile | undefined {
  return vaultFiles.find((f) => f.path === path)
}

export function findDashboard(): VaultFile | undefined {
  return vaultFiles.find((f) => f.isDashboard)
}

export interface AreaPrestige {
  area: string
  tier: number
}

/**
 * Parse the dashboard's Proficiency table for prestige tiers. Reads the `⭐×N`
 * suffix that the rebirth skill appends to each area's Level cell (see
 * progress-rules.md §8). Returns one entry per area reborn at least once.
 */
export function getPrestige(): { maxTier: number; areas: AreaPrestige[] } {
  const dash = findDashboard()
  if (!dash) return { maxTier: 0, areas: [] }
  const areas: AreaPrestige[] = []
  for (const line of dash.content.split('\n')) {
    const star = line.match(/⭐\s*×\s*(\d+)/)
    if (!star) continue
    const filled = line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
    if (filled.length < 2) continue
    const area = filled[0].replace(/\*\*/g, '')
    if (/^total$/i.test(area)) continue
    const tier = parseInt(star[1], 10)
    if (tier >= 1) areas.push({ area, tier })
  }
  const maxTier = areas.reduce((m, a) => Math.max(m, a.tier), 0)
  return { maxTier, areas }
}

export function getVaultName(): string {
  return 'StudyVault'
}

/**
 * Resolve an image reference from a note to a URL that Vite's dev server can serve.
 * src may be relative to the note (e.g. "images/foo.png") or vault-relative.
 */
export function resolveImageUrl(src: string, noteFolder: string): string | null {
  if (/^[a-z]+:\/\//i.test(src) || src.startsWith('data:')) return src
  const baseSegs = noteFolder ? noteFolder.split('/') : []
  const segs = src.split('/')
  const stack = [...baseSegs]
  for (const s of segs) {
    if (s === '..') stack.pop()
    else if (s !== '.' && s !== '') stack.push(s)
  }
  const vaultRel = stack.join('/')
  const key = VAULT_PREFIX + vaultRel
  return imageModules[key] ?? null
}
