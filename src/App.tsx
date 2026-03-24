import { FormEvent, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Phrase = {
  id: string
  title: string
  content: string
  placeholders: string[]
}

type PhraseFormState = {
  id?: string
  title: string
  content: string
  placeholders: string
}

const initialPhrases: Phrase[] = [
  {
    id: "1",
    title: "客服跟进回复",
    content:
      "你好 {{name}}，关于你反馈的 {{issue}}，我们已在 {{time}} 完成处理，如有其他问题请继续联系。",
    placeholders: ["name", "issue", "time"],
  },
  {
    id: "2",
    title: "代码评审提醒",
    content:
      "Hi {{reviewer}}，请帮忙 review PR: {{prLink}}，目标合并时间是 {{deadline}}。",
    placeholders: ["reviewer", "prLink", "deadline"],
  },
  {
    id: "3",
    title: "会议纪要模板",
    content:
      "会议主题：{{topic}}\n参会人：{{members}}\n结论：{{summary}}\n下一步：{{nextAction}}",
    placeholders: ["topic", "members", "summary", "nextAction"],
  },
]

const emptyForm: PhraseFormState = {
  title: "",
  content: "",
  placeholders: "",
}

function parsePlaceholders(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toPlaceholderInput(placeholders: string[]) {
  return placeholders.join(", ")
}

function renderTemplate(content: string, values: Record<string, string>) {
  return content.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => {
    return values[key] ?? ""
  })
}

function App() {
  const [phrases, setPhrases] = useState<Phrase[]>(initialPhrases)
  const [keyword, setKeyword] = useState("")

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [formState, setFormState] = useState<PhraseFormState>(emptyForm)

  const [isUseOpen, setIsUseOpen] = useState(false)
  const [activePhrase, setActivePhrase] = useState<Phrase | null>(null)
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({})

  const filteredPhrases = useMemo(() => {
    const query = keyword.trim().toLowerCase()
    if (!query) return phrases

    return phrases.filter((phrase) => {
      const source = [phrase.title, phrase.content, phrase.placeholders.join(" ")]
        .join(" ")
        .toLowerCase()
      return source.includes(query)
    })
  }, [phrases, keyword])

  const renderedContent = useMemo(() => {
    if (!activePhrase) return ""
    return renderTemplate(activePhrase.content, placeholderValues)
  }, [activePhrase, placeholderValues])

  function openCreateDialog() {
    setFormState(emptyForm)
    setIsEditOpen(true)
  }

  function openEditDialog(phrase: Phrase) {
    setFormState({
      id: phrase.id,
      title: phrase.title,
      content: phrase.content,
      placeholders: toPlaceholderInput(phrase.placeholders),
    })
    setIsEditOpen(true)
  }

  function submitPhrase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = formState.title.trim()
    const content = formState.content.trim()
    const placeholders = parsePlaceholders(formState.placeholders)

    if (!title || !content) return

    if (formState.id) {
      setPhrases((prev) =>
        prev.map((item) =>
          item.id === formState.id
            ? { ...item, title, content, placeholders }
            : item,
        ),
      )
    } else {
      setPhrases((prev) => [
        {
          id: crypto.randomUUID(),
          title,
          content,
          placeholders,
        },
        ...prev,
      ])
    }

    setIsEditOpen(false)
    setFormState(emptyForm)
  }

  function openUseDialog(phrase: Phrase) {
    setActivePhrase(phrase)
    const initialValues = Object.fromEntries(
      phrase.placeholders.map((key) => [key, ""]),
    )
    setPlaceholderValues(initialValues)
    setIsUseOpen(true)
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10 md:px-6">
      <section className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">snipq 短语管理</h1>
          <p className="text-sm text-muted-foreground">
            管理可复用短语并通过占位符快速生成最终内容
          </p>
        </header>

        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            placeholder="搜索标题、内容或占位符"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="md:flex-1"
          />
          <Button onClick={openCreateDialog}>新增短语</Button>
        </div>

        <div className="grid gap-4">
          {filteredPhrases.map((phrase) => (
            <Card key={phrase.id}>
              <CardHeader>
                <CardTitle>{phrase.title}</CardTitle>
                <CardDescription className="line-clamp-3 whitespace-pre-wrap">
                  {phrase.content}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {phrase.placeholders.length > 0 ? (
                  phrase.placeholders.map((item) => (
                    <Badge key={item} variant="secondary">
                      {`{{${item}}}`}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">无占位符</span>
                )}
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" onClick={() => openEditDialog(phrase)}>
                  编辑
                </Button>
                <Button onClick={() => openUseDialog(phrase)}>使用模板</Button>
              </CardFooter>
            </Card>
          ))}

          {filteredPhrases.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                未找到匹配短语
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formState.id ? "编辑短语" : "新增短语"}</DialogTitle>
            <DialogDescription>
              占位符用逗号分隔，例如：name, issue, time
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitPhrase}>
            <div className="space-y-2">
              <Label htmlFor="phrase-title">标题</Label>
              <Input
                id="phrase-title"
                value={formState.title}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, title: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phrase-content">内容</Label>
              <Textarea
                id="phrase-content"
                value={formState.content}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, content: event.target.value }))
                }
                className="min-h-32"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phrase-placeholders">占位符</Label>
              <Input
                id="phrase-placeholders"
                value={formState.placeholders}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    placeholders: event.target.value,
                  }))
                }
                placeholder="name, issue, time"
              />
            </div>

            <DialogFooter>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUseOpen} onOpenChange={setIsUseOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>使用模板</DialogTitle>
            <DialogDescription>
              {activePhrase ? `正在使用：${activePhrase.title}` : ""}
            </DialogDescription>
          </DialogHeader>

          {activePhrase && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {activePhrase.placeholders.length > 0 ? (
                  activePhrase.placeholders.map((key) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={`placeholder-${key}`}>{key}</Label>
                      <Input
                        id={`placeholder-${key}`}
                        value={placeholderValues[key] ?? ""}
                        onChange={(event) =>
                          setPlaceholderValues((prev) => ({
                            ...prev,
                            [key]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">该模板无占位符</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>生成结果</Label>
                <Textarea readOnly value={renderedContent} className="min-h-40" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default App
