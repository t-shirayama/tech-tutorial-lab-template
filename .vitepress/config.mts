import { existsSync, readdirSync } from 'node:fs'
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

  return readdirSync(tutorialsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => {
      const dir = join(tutorialsDir, name)
      const items: SidebarItem[] = []
      const readmePath = join(dir, 'README.md')
      const notesPath = join(dir, 'notes.md')

      if (existsSync(readmePath)) {
        items.push({
          text: '本文',
          link: `/tutorials/${name}/`
        })
      }

      if (existsSync(notesPath)) {
        items.push({
          text: '学習メモ',
          link: `/tutorials/${name}/notes`
        })
      }

      return {
        text: name,
        collapsed: false,
        items
      }
    })
    .filter((item) => item.items.length > 0)
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
