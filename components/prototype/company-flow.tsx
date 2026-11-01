"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Field = {
  name: string
  label: string
  placeholder?: string
  kind?: "text" | "email" | "tel" | "textarea"
  required?: boolean
  pattern?: { re: RegExp; hint: string }
  hint?: string
}

type Step = {
  id: string
  title: string
  subtitle: string
  fields: Field[]
}

const STEPS: Step[] = [
  {
    id: "org",
    title: "Данные организации",
    subtitle: "Шаг 1 из 3 · реквизиты по выписке ЕГРЮЛ",
    fields: [
      { name: "name", label: "Полное наименование", placeholder: "ООО «Ромашка»", required: true },
      { name: "inn", label: "ИНН", placeholder: "10 цифр", required: true, pattern: { re: /^\d{10}$/, hint: "ИНН — ровно 10 цифр" } },
      { name: "kpp", label: "КПП", placeholder: "9 цифр", required: true, pattern: { re: /^\d{9}$/, hint: "КПП — ровно 9 цифр" } },
      { name: "ogrn", label: "ОГРН", placeholder: "13 цифр", required: true, pattern: { re: /^\d{13}$/, hint: "ОГРН — 13 цифр" } },
      { name: "activity", label: "Описание деятельности", placeholder: "Чем занимается компания", kind: "textarea" },
    ],
  },
  {
    id: "address",
    title: "Адреса",
    subtitle: "Шаг 2 из 3 · юридический и фактический адрес",
    fields: [
      { name: "legalAddress", label: "Юридический адрес", placeholder: "123456, Москва, ул. Ленина, д. 1", required: true },
      { name: "postalCode", label: "Индекс", placeholder: "123456", pattern: { re: /^\d{6}$/, hint: "Индекс — 6 цифр" } },
      { name: "deliveryAddress", label: "Адрес для корреспонденции", placeholder: "Если отличается от юридического" },
    ],
  },
  {
    id: "contact",
    title: "Руководитель и контакты",
    subtitle: "Шаг 3 из 3 · лицо, действующее от имени организации",
    fields: [
      { name: "ceo", label: "ФИО руководителя", placeholder: "Иванов Иван Иванович", required: true },
      { name: "position", label: "Должность", placeholder: "Генеральный директор", required: true },
      { name: "email", label: "Email", placeholder: "name@company.ru", kind: "email", required: true, pattern: { re: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, hint: "Похоже на неверный email" } },
      { name: "phone", label: "Телефон", placeholder: "+7 (999) 123-45-67", kind: "tel", required: true, pattern: { re: /^\+?[\d\s()-]{10,18}$/, hint: "Телефон — от 10 до 18 символов" } },
    ],
  },
]

export function CompanyFlowPrototype() {
  const [stepIndex, setStepIndex] = useState(0)
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sameAddress, setSameAddress] = useState(true)
  const [agree, setAgree] = useState(false)
  const [ownership, setOwnership] = useState("ooo")
  const [sent, setSent] = useState(false)

  const step = STEPS[stepIndex]
  const last = stepIndex === STEPS.length - 1

  const setValue = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const validate = () => {
    const next: Record<string, string> = {}
    for (const field of step.fields) {
      const value = (values[field.name] ?? "").trim()
      if (field.required && !value) next[field.name] = "Обязательное поле"
      else if (value && field.pattern && !field.pattern.re.test(value)) next[field.name] = field.pattern.hint
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const next = () => {
    if (!validate()) return
    if (last) {
      if (!agree) {
        setErrors({ agree: "Нужно согласие на обработку данных" })
        return
      }
      setSent(true)
      return
    }
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1))
  }

  const back = () => setStepIndex((i) => Math.max(0, i - 1))

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
        <Card className="w-[440px]">
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Готово
            </Badge>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="size-5" /> Заявка отправлена
            </CardTitle>
            <CardDescription>
              Данные компании {values.name || "—"} приняты. Проверка занимает до 15 минут, результат придёт на{" "}
              {values.email || "указанный email"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => { setSent(false); setStepIndex(0) }}>
              Заполнить ещё раз
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="mx-auto flex w-[480px] max-w-full flex-col gap-5 rounded-lg border bg-background p-6 shadow-sm">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <Badge key={s.id} variant={i === stepIndex ? "default" : i < stepIndex ? "secondary" : "outline"}>
              {i + 1}
            </Badge>
          ))}
          <span className="text-muted-foreground ml-1 text-xs">{step.subtitle}</span>
        </div>

        <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{step.title}</h1>
        <Separator />

        <div className="flex flex-col gap-4">
          {step.fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-1.5">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </Label>

              {field.kind === "textarea" ? (
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ""}
                  aria-invalid={Boolean(errors[field.name]) || undefined}
                  onChange={(e) => setValue(field.name, e.target.value)}
                />
              ) : (
                <Input
                  id={field.name}
                  type={field.kind ?? "text"}
                  placeholder={field.placeholder}
                  value={values[field.name] ?? ""}
                  aria-invalid={Boolean(errors[field.name]) || undefined}
                  onChange={(e) => setValue(field.name, e.target.value)}
                />
              )}

              {errors[field.name] && <p className="text-destructive text-xs">{errors[field.name]}</p>}
            </div>
          ))}

          {step.id === "address" && (
            <div className="flex items-center gap-2">
              <Switch id="same-address" checked={sameAddress} onCheckedChange={setSameAddress} />
              <Label htmlFor="same-address">Фактический адрес совпадает с юридическим</Label>
            </div>
          )}

          {step.id === "contact" && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Форма собственности</Label>
                <RadioGroup value={ownership} onValueChange={setOwnership} className="flex gap-4">
                  {[
                    { value: "ooo", label: "ООО" },
                    { value: "ao", label: "АО" },
                    { value: "ip", label: "ИП" },
                  ].map((item) => (
                    <div key={item.value} className="flex items-center gap-2">
                      <RadioGroupItem value={item.value} id={`own-${item.value}`} />
                      <Label htmlFor={`own-${item.value}`}>{item.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className={cn("flex items-start gap-2", errors.agree && "text-destructive")}>
                <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
                <div>
                  <Label htmlFor="agree">Согласен на обработку персональных данных</Label>
                  {errors.agree && <p className="text-xs">{errors.agree}</p>}
                </div>
              </div>
            </>
          )}
        </div>

        <Separator />

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={back} disabled={stepIndex === 0}>
            Назад
          </Button>
          <Button onClick={next}>{last ? "Отправить заявку" : "Далее"}</Button>
          <span className="text-muted-foreground ml-auto text-xs">
            {Object.keys(values).filter((k) => values[k]).length} заполнено
          </span>
        </div>
      </div>
    </div>
  )
}
