import { Link } from 'react-router-dom'
import { vaultFiles, findDashboard, getVaultName, vaultTree, getPrestige, type VaultTreeNode } from '@/lib/vault-index'

export function HomePage() {
  const vaultName = getVaultName()
  const dashboard = findDashboard()
  const prestige = getPrestige()
  const recent = vaultFiles.slice(0, 10)

  const topFolders = (vaultTree.children ?? []).filter((n) => n.type === 'folder')

  const practiceCount = vaultFiles.filter((f) =>
    /practice|문제|exam|시험|면접/i.test(f.title + ' ' + f.path),
  ).length

  return (
    <div>
      <div className="cover-zone" />

      {/* Eyebrow label */}
      <div
        className="text-micro uppercase mb-3 px-[2px]"
        style={{ color: 'var(--text-light)' }}
      >
        Workspace
      </div>

      {/* Title */}
      <h1
        className="text-display text-pretty px-[2px]"
        style={{
          marginTop: '0',
          marginBottom: '10px',
          color: 'var(--text-strong)',
        }}
      >
        {vaultName}
      </h1>

      {/* Subtitle */}
      <p
        className="text-h4 mb-7 px-[2px] text-pretty"
        style={{ color: 'var(--text-gray)', fontWeight: 400 }}
      >
        시스템 설계 학습 노트. 개념별 마스터리 추적과 실전 문제 풀이를 한곳에서.
      </p>

      {/* Meta strip */}
      <div
        className="flex items-center flex-wrap gap-x-6 gap-y-2 text-small mb-10 pb-5 px-[2px]"
        style={{ color: 'var(--text-gray)', borderBottom: '1px solid var(--divider)' }}
      >
        <MetaItem label="Pages" value={vaultFiles.length.toString()} />
        <MetaItem label="Sections" value={topFolders.length.toString()} />
        <MetaItem label="Practice sets" value={practiceCount.toString()} />
        <MetaItem label="Last opened" value="just now" />
      </div>

      {/* Dashboard callout */}
      {dashboard && (
        <Link
          to={`/note/${encodeURIComponent(dashboard.path)}`}
          className="group flex items-start gap-4 p-5 mb-10 rounded-[8px] transition-all"
          style={{
            background: 'var(--bg-callout)',
            textDecoration: 'none',
            color: 'inherit',
            border: '1px solid var(--divider)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-hover-strong)'
            e.currentTarget.style.borderColor = 'var(--divider-strong)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--bg-callout)'
            e.currentTarget.style.borderColor = 'var(--divider)'
          }}
        >
          <span
            className="flex items-center justify-center w-[36px] h-[36px] rounded-[6px] flex-shrink-0"
            style={{
              background: 'var(--bg-raised)',
              color: 'var(--accent)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 3v18h18" />
              <path d="M7 14l3-3 4 4 5-6" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-micro uppercase mb-1" style={{ color: 'var(--accent)' }}>
              Featured
            </div>
            <div
              className="text-h4 mb-1 flex items-center gap-2"
              style={{ color: 'var(--text-strong)' }}
            >
              <span>{dashboard.title}</span>
              {prestige.maxTier > 0 && (
                <span
                  className="inline-flex items-center"
                  title={`환생 — 최고 ⭐×${prestige.maxTier}, ${prestige.areas.length}개 영역`}
                  style={{
                    fontSize: 'var(--fs-small)',
                    fontWeight: 600,
                    color: 'var(--accent)',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--divider)',
                    borderRadius: '4px',
                    padding: '0 6px',
                    height: '20px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  ⭐×{prestige.maxTier}
                </span>
              )}
            </div>
            <div className="text-ui" style={{ color: 'var(--text-gray)' }}>
              {prestige.areas.length > 0
                ? `영역별 숙련도와 취약 영역, 그리고 환생한 ${prestige.areas.length}개 영역(최고 ⭐×${prestige.maxTier})을 한눈에.`
                : '영역별 숙련도, 개념 해결 현황, 취약 영역을 한눈에 파악하세요.'}
            </div>
          </div>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-[10px]"
            style={{ color: 'var(--text-gray)' }}
          >
            <path d="M7 17L17 7M8 7h9v9" />
          </svg>
        </Link>
      )}

      {/* Sections */}
      {topFolders.length > 0 && (
        <section className="mb-10">
          <SectionHeading
            title="Sections"
            hint={`${topFolders.length} areas`}
          />
          <div className="grid grid-cols-2 gap-2.5 max-[700px]:grid-cols-1">
            {topFolders.map((folder) => (
              <SectionCard key={folder.path} node={folder} />
            ))}
          </div>
        </section>
      )}

      {/* Recently viewed */}
      <section className="mb-6">
        <SectionHeading
          title="Recently viewed"
          hint={`${recent.length} of ${vaultFiles.length}`}
        />
        <div className="grid grid-cols-2 gap-2 max-[640px]:grid-cols-1">
          {recent.map((file) => (
            <Link
              key={file.path}
              to={`/note/${encodeURIComponent(file.path)}`}
              className="group flex items-center gap-3 px-3.5 py-2.5 rounded-[6px] transition-all"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: 'var(--bg-raised)',
                border: '1px solid var(--divider)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                e.currentTarget.style.borderColor = 'var(--divider-strong)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'var(--divider)'
              }}
            >
              <FileMark title={file.title} />
              <div className="flex-1 min-w-0">
                <div
                  className="text-ui font-medium truncate leading-tight"
                  style={{ color: 'var(--text-strong)' }}
                >
                  {file.title}
                </div>
                {file.folder && (
                  <div
                    className="text-small truncate mt-0.5"
                    style={{ color: 'var(--text-light)' }}
                  >
                    {file.folder.split('/').join(' › ')}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section
        className="mt-12 p-4 rounded-[6px] text-small"
        style={{
          background: 'var(--bg-callout)',
          color: 'var(--text-gray)',
          border: '1px solid var(--divider)',
        }}
      >
        <div className="text-micro uppercase mb-1.5" style={{ color: 'var(--text-light)' }}>
          Tips
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span>
            <Kbd>⌘</Kbd> <Kbd>K</Kbd> 로 즉시 검색
          </span>
          <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> 로 결과 이동
          </span>
          <span>
            헤딩마다 <Hash /> 앵커로 바로가기
          </span>
        </div>
      </section>
    </div>
  )
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-3 px-[2px]">
      <h2 className="text-h2" style={{ color: 'var(--text-strong)' }}>
        {title}
      </h2>
      {hint && (
        <span className="text-small" style={{ color: 'var(--text-light)' }}>
          {hint}
        </span>
      )}
    </div>
  )
}

function countFiles(node: VaultTreeNode): number {
  if (node.type === 'file') return 1
  return (node.children ?? []).reduce((sum, c) => sum + countFiles(c), 0)
}

const SECTION_HUES = [
  { bg: 'rgba(35, 131, 226, 0.14)', fg: 'rgb(35, 122, 216)' },
  { bg: 'rgba(46, 170, 112, 0.16)', fg: 'rgb(36, 140, 92)' },
  { bg: 'rgba(217, 145, 30, 0.18)', fg: 'rgb(171, 110, 20)' },
  { bg: 'rgba(204, 80, 138, 0.16)', fg: 'rgb(173, 64, 114)' },
  { bg: 'rgba(128, 90, 213, 0.16)', fg: 'rgb(109, 70, 198)' },
  { bg: 'rgba(217, 88, 73, 0.16)', fg: 'rgb(186, 67, 55)' },
]

function hueFor(name: string) {
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return SECTION_HUES[sum % SECTION_HUES.length]
}

function SectionCard({ node }: { node: VaultTreeNode }) {
  const name = node.name.replace(/^\d+[-_]?\s*/, '')
  const count = countFiles(node)
  const first = node.children?.find((c) => c.type === 'file')
  const target = first ? `/note/${encodeURIComponent(first.path)}` : '/'
  const hue = hueFor(name)
  const initial = name.trim().slice(0, 1).toUpperCase() || '·'

  return (
    <Link
      to={target}
      className="group flex items-center gap-3 px-4 py-3 rounded-[8px] transition-all"
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--divider)',
        textDecoration: 'none',
        color: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--divider-strong)'
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--divider)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <span
        className="flex items-center justify-center w-[34px] h-[34px] rounded-[6px] flex-shrink-0 text-h4"
        style={{ background: hue.bg, color: hue.fg, fontWeight: 700 }}
      >
        {initial}
      </span>
      <div className="flex-1 min-w-0">
        <div
          className="text-ui font-medium truncate"
          style={{ color: 'var(--text-strong)' }}
        >
          {name}
        </div>
        <div className="text-small truncate" style={{ color: 'var(--text-light)' }}>
          {count} page{count === 1 ? '' : 's'}
        </div>
      </div>
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        style={{ color: 'var(--text-gray)' }}
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  )
}

function FileMark({ title }: { title: string }) {
  const hue = hueFor(title)
  return (
    <span
      className="flex items-center justify-center w-[28px] h-[28px] rounded-[5px] flex-shrink-0"
      style={{ background: hue.bg, color: hue.fg }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </svg>
    </span>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-micro uppercase" style={{ color: 'var(--text-light)' }}>
        {label}
      </span>
      <span style={{ color: 'var(--text)' }}>{value}</span>
    </span>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="inline-block px-1.5 py-[1px] rounded text-micro font-sans align-[1px]"
      style={{
        background: 'var(--bg-raised)',
        color: 'var(--text-gray)',
        border: '1px solid var(--divider-strong)',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </kbd>
  )
}

function Hash() {
  return (
    <span
      className="inline-block px-1 rounded text-micro align-[1px]"
      style={{
        background: 'var(--bg-raised)',
        color: 'var(--text-gray)',
        border: '1px solid var(--divider-strong)',
      }}
    >
      #
    </span>
  )
}
