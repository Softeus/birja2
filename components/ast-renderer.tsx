import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export type AstComponent = {
  component: string
  props?: Record<string, string>
  slots?: Record<string, string>
  stretch?: boolean
}

export type AstStack = {
  type: "stack"
  direction?: "VERTICAL" | "HORIZONTAL"
  gap?: number
  padding?: number
  stretch?: boolean
  children: AstNode[]
}

export type AstNode = AstComponent | AstStack

export type AstDocument = {
  screen: string
  title?: string
  frame: { width: number; padding?: number; gap?: number; background?: string }
  elements: AstNode[]
}

const headingClass = {
  h1: "text-[28px] leading-tight font-semibold tracking-tight",
  h2: "text-[22px] leading-snug font-semibold tracking-tight",
  h3: "text-[18px] leading-snug font-semibold",
} as const

function renderComponent(node: AstComponent, key: string): ReactNode {
  const props = node.props ?? {}
  const slots = node.slots ?? {}

  switch (node.component) {
    case "Text":
      return (
        <p key={key} className={cn("text-sm leading-5", props.variant === "muted" && "text-muted-foreground")}>
          {slots.text}
        </p>
      )
    case "Heading": {
      const level = (props.level ?? "h1") as keyof typeof headingClass
      const Tag = level === "h1" ? "h1" : level === "h2" ? "h2" : "h3"
      return (
        <Tag key={key} className={headingClass[level]}>
          {slots.text}
        </Tag>
      )
    }
    case "Label":
      return (
        <Label key={key} htmlFor={slots.label}>
          {slots.label}
        </Label>
      )
    case "Input":
      return (
        <Input
          key={key}
          id={slots.placeholder}
          placeholder={slots.placeholder}
          aria-invalid={props.state === "error" || undefined}
          disabled={props.state === "disabled"}
        />
      )
    case "Checkbox":
      return (
        <div key={key} className="flex items-center gap-2">
          <Checkbox id={slots.label} defaultChecked={props.checked === "true"} />
        </div>
      )
    case "Separator":
      return <Separator key={key} orientation={(props.orientation as "horizontal" | "vertical") ?? "horizontal"} />
    case "Button":
      return (
        <Button
          key={key}
          variant={(props.variant as "default" | "secondary" | "outline" | "ghost" | "destructive" | "link") ?? "default"}
          size={(props.size as "sm" | "default" | "lg") ?? "default"}
        >
          {slots.label}
        </Button>
      )
    case "Badge":
      return (
        <Badge key={key} variant={(props.variant as "default" | "secondary" | "outline" | "destructive") ?? "default"}>
          {slots.label}
        </Badge>
      )
    case "Card":
      return (
        <Card key={key}>
          <CardHeader>
            <CardTitle>{slots.title}</CardTitle>
            <CardDescription>{slots.description}</CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )
    default:
      return (
        <div key={key} className="text-destructive text-xs">
          неизвестный компонент: {node.component}
        </div>
      )
  }
}

function isStack(node: AstNode): node is AstStack {
  return (node as AstStack).type === "stack"
}

function renderNode(node: AstNode, index: number): ReactNode {
  const key = `${index}-${isStack(node) ? "stack" : node.component}`

  if (isStack(node)) {
    const horizontal = node.direction === "HORIZONTAL"
    return (
      <div
        key={key}
        className={cn("flex w-full", horizontal ? "flex-row items-center" : "flex-col")}
        style={{ gap: node.gap ?? 12 }}
      >
        {node.children.map((child, i) => renderNode(child, i))}
      </div>
    )
  }

  return renderComponent(node, key)
}

export function AstRenderer({ ast }: { ast: AstDocument }) {
  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div
        className="mx-auto flex flex-col rounded-lg border bg-background shadow-sm"
        style={{
          width: ast.frame.width,
          maxWidth: "100%",
          padding: ast.frame.padding ?? 24,
          gap: ast.frame.gap ?? 16,
        }}
      >
        {ast.elements.map((el, i) => renderNode(el, i))}
      </div>
    </div>
  )
}
