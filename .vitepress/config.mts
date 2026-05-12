import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig } from 'vitepress'

const repoName = 'tech-tutorial-lab-template'
const base = process.env.BASE_PATH ?? `/${repoName}/`

type SidebarItem = {
  text: string
  link?: string
  collapsed?: boolean
  items?: SidebarItem[]
}

function buildTutorialSidebar(): SidebarItem[] {
  const tutorialsDir = join(process.cwd(), 'tutorials')

  if (!existsSync(tutorialsDir)) {
    return []
  }

  const tutorialNames = readdirSync(tutorialsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  const tutorialNameSet = new Set(tutorialNames)
  const groupedItems = buildTutorialSidebarFromRoadmap(tutorialsDir, tutorialNameSet)

  if (groupedItems.length > 0) {
    return groupedItems
  }

  return tutorialNames
    .map((name) => buildTutorialLink(tutorialsDir, name))
    .filter((item): item is SidebarItem => item !== null)
}

function buildTutorialSidebarFromRoadmap(
  tutorialsDir: string,
  tutorialNameSet: Set<string>
): SidebarItem[] {
  const roadmapPath = join(process.cwd(), 'docs', 'roadmap.md')

  if (!existsSync(roadmapPath)) {
    return []
  }

  const roadmap = readFileSync(roadmapPath, 'utf8')
  const usedTutorials = new Set<string>()
  const groups: SidebarItem[] = []

  for (const line of roadmap.split('\n')) {
    const cells = parseMarkdownTableRow(line)

    if (!cells || cells.length < 3 || cells[0] === 'Step' || /^-+$/.test(cells[0])) {
      continue
    }

    const tutorialNamesInRow = extractTutorialNames(cells[2])
      .filter((name) => tutorialNameSet.has(name))

    if (tutorialNamesInRow.length === 0) {
      continue
    }

    const items = tutorialNamesInRow
      .map((name) => buildTutorialLink(tutorialsDir, name))
      .filter((item): item is SidebarItem => item !== null)

    if (items.length === 0) {
      continue
    }

    tutorialNamesInRow.forEach((name) => usedTutorials.add(name))
    groups.push({
      text: cells[0],
      collapsed: false,
      items
    })
  }

  const ungroupedItems = [...tutorialNameSet]
    .filter((name) => !usedTutorials.has(name))
    .sort()
    .map((name) => buildTutorialLink(tutorialsDir, name))
    .filter((item): item is SidebarItem => item !== null)

  if (ungroupedItems.length > 0) {
    groups.push({
      text: '未分類',
      collapsed: false,
      items: ungroupedItems
    })
  }

  return groups
}

function parseMarkdownTableRow(line: string): string[] | null {
  const trimmed = line.trim()

  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return null
  }

  return trimmed
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim())
}

function extractTutorialNames(cell: string): string[] {
  return [...cell.matchAll(/`tutorials\/([^`/]+)\/?`/g)].map((match) => match[1])
}

function buildTutorialLink(tutorialsDir: string, name: string): SidebarItem | null {
  const readmePath = join(tutorialsDir, name, 'README.md')

  if (!existsSync(readmePath)) {
    return null
  }

  return {
    text: getTutorialTitle(readmePath) ?? name,
    link: `/tutorials/${name}/`
  }
}

function getTutorialTitle(readmePath: string): string | null {
  const content = readFileSync(readmePath, 'utf8')
  const heading = content.match(/^#\s+(.+)$/m)

  return heading?.[1]?.trim() ?? null
}

const docsSidebar: SidebarItem[] = [
  {
    text: 'ドキュメント',
    items: [
      { text: '概要', link: '/docs/overview' },
      { text: 'ロードマップ', link: '/docs/roadmap' },
      { text: '用語集', link: '/docs/glossary' }
    ]
  }
]

const tutorialsSidebar: SidebarItem[] = [
  {
    text: 'チュートリアル',
    items: buildTutorialSidebar()
  }
]

const sharedSidebar: SidebarItem[] = [
  {
    text: 'はじめに',
    items: [
      { text: 'トップ', link: '/' }
    ]
  },
  ...docsSidebar,
  ...tutorialsSidebar
]

export default defineConfig({
  lang: 'ja-JP',
  title: 'tech-tutorial-lab-template',
  description: 'ライブラリ・フレームワーク別のチュートリアルリポジトリ用テンプレート',
  base,
  outDir: 'site',
  cacheDir: '.vitepress/cache',
  rewrites: {
    'README.md': 'index.md',
    'tutorials/:name/README.md': 'tutorials/:name/index.md'
  },
  srcExclude: [
    'AGENTS.md',
    'templates/**',
    'examples/**',
    'site/**',
    'node_modules/**'
  ],
  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
      { text: '概要', link: '/docs/overview' },
      { text: 'ロードマップ', link: '/docs/roadmap' },
      { text: 'チュートリアル', link: '/tutorials/00-getting-started/' }
    ],
    sidebar: sharedSidebar,
    outline: {
      label: 'このページの内容'
    },
    docFooter: {
      prev: '前へ',
      next: '次へ'
    },
    lastUpdated: {
      text: '最終更新'
    },
    search: {
      provider: 'local'
    }
  },
  lastUpdated: true
})
