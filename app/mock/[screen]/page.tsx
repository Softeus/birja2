import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import { notFound } from "next/navigation"

import { AstRenderer, type AstDocument } from "@/components/ast-renderer"

export const instant = false

export async function generateStaticParams() {
  const dir = join(process.cwd(), "ds", "screens")
  const files = await readdir(dir).catch(() => [] as string[])
  return files
    .filter((f) => f.endsWith(".ast.json"))
    .map((f) => ({ screen: f.replace(/\.ast\.json$/, "") }))
}

async function loadScreen(screen: string): Promise<AstDocument | null> {
  if (!/^[a-z0-9-]+$/i.test(screen)) return null
  try {
    const raw = await readFile(join(process.cwd(), "ds", "screens", `${screen}.ast.json`), "utf8")
    return JSON.parse(raw) as AstDocument
  } catch {
    return null
  }
}

export default async function MockScreenPage({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = await params
  const ast = await loadScreen(screen)
  if (!ast) notFound()

  return (
    <main>
      <AstRenderer ast={ast} />
    </main>
  )
}
