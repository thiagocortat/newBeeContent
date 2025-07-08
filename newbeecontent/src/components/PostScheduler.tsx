'use client'

import { useState } from 'react'
import DatePicker from 'react-datepicker'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calendar, Clock, Send } from 'lucide-react'

interface PostSchedulerProps {
  onSchedule?: (data: {
    title: string
    content: string
    scheduledDate: Date | null
    publishNow: boolean
  }) => void
}

export default function PostScheduler({ onSchedule }: PostSchedulerProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null)
  const [publishNow, setPublishNow] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSchedule?.({
      title,
      content,
      scheduledDate: publishNow ? null : scheduledDate,
      publishNow
    })
  }

  const isFormValid = title.trim() && content.trim() && (publishNow || scheduledDate)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Agendar Post
        </CardTitle>
        <CardDescription>
          Crie e agende seus posts para publicação automática
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título do Post */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Título do Post
            </label>
            <Input
              id="title"
              placeholder="Digite o título do seu post..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Conteúdo do Post */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Conteúdo
            </label>
            <Textarea
              id="content"
              placeholder="Escreva o conteúdo do seu post..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              required
            />
          </div>

          {/* Opções de Publicação */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="text-sm font-medium">Publicar Agora</label>
                <p className="text-xs text-muted-foreground">
                  Publique imediatamente em vez de agendar
                </p>
              </div>
              <Switch
                checked={publishNow}
                onCheckedChange={setPublishNow}
              />
            </div>

            {/* Agendamento de Data */}
            {!publishNow && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data e Hora de Publicação
                </label>
                <div className="relative">
                  <DatePicker
                    selected={scheduledDate}
                    onChange={(date) => setScheduledDate(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="dd/MM/yyyy HH:mm"
                    placeholderText="Selecione data e hora..."
                    minDate={new Date()}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    wrapperClassName="w-full"
                    required={!publishNow}
                  />
                  <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                {scheduledDate && (
                  <p className="text-xs text-muted-foreground">
                    Post será publicado em: {scheduledDate.toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setTitle('')
                setContent('')
                setScheduledDate(null)
                setPublishNow(false)
              }}
            >
              Limpar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid}
              className="flex-1"
            >
              {publishNow ? 'Publicar Agora' : 'Agendar Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}