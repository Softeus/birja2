"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const variants = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const
const sizes = ["sm", "default", "lg", "icon"] as const

export default function DsPreviewPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Golden Eight · smoke</h1>
        <p className="text-muted-foreground text-sm">
          Проверка того, что компоненты ДС собраны и токены подключены.
        </p>
      </div>

      <section className="flex flex-wrap items-center gap-2">
        {variants.map((v) => (
          <Button key={v} variant={v}>
            {v}
          </Button>
        ))}
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {sizes.map((s) => (
          <Button key={s} size={s}>
            {s}
          </Button>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Card <Badge>badge</Badge> <Badge variant="outline">outline</Badge>
          </CardTitle>
          <CardDescription>Токены: bg-card, text-card-foreground, border-border.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="you@example.com" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="trust" defaultChecked />
            <Label htmlFor="trust">Доверять этому устройству</Label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="err">Состояние ошибки</Label>
            <Input id="err" aria-invalid defaultValue="неверный ввод" />
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="justify-end gap-2">
          <Button variant="ghost">Отмена</Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Подтвердить</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Готово</DialogTitle>
                <DialogDescription>Диалог собран из компонента ДС.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </main>
  )
}
