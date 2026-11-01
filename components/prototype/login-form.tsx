"use client"

import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type Errors = { email?: string; password?: string }

export function LoginPrototype() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")

  const submit = () => {
    const next: Errors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Введите рабочий email"
    if (password.length < 8) next.password = "Минимум 8 символов"
    setErrors(next)
    if (Object.keys(next).length) return

    setStatus("loading")
    setTimeout(() => setStatus("done"), 600)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="flex w-[400px] max-w-full flex-col gap-5 rounded-lg border bg-background p-6 shadow-sm">
        <Badge variant="outline" className="w-fit">
          Личный кабинет
        </Badge>
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight">Вход</h1>
        <p className="text-muted-foreground text-sm">
          Используйте рабочую почту и пароль, выданный администратором.
        </p>
        <Separator />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="name@company.ru"
              value={email}
              aria-invalid={Boolean(errors.email) || undefined}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors((p) => ({ ...p, email: undefined }))
              }}
            />
            {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-password">Пароль</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              aria-invalid={Boolean(errors.password) || undefined}
              onChange={(e) => {
                setPassword(e.target.value)
                setErrors((p) => ({ ...p, password: undefined }))
              }}
            />
            {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember" checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
            <Label htmlFor="remember">Запомнить устройство</Label>
          </div>
        </div>

        <Button onClick={submit} disabled={status === "loading"}>
          {status === "loading" ? "Проверяем…" : "Войти"}
        </Button>

        {status === "done" && (
          <p className={cn("text-sm", "text-emerald-600")}>
            Успешный вход: {email || "—"} {remember ? "(устройство запомнено)" : ""}
          </p>
        )}

        <Separator />

        <div className="flex items-center gap-3">
          <Button variant="link" className="px-0">
            Забыли пароль?
          </Button>
          <Button variant="ghost">Получить доступ</Button>
        </div>
      </div>
    </div>
  )
}
