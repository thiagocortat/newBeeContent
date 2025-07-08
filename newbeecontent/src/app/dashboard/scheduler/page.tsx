import PostScheduler from '@/components/PostScheduler'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function SchedulerPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            Agendamento de Posts
          </h1>
          <p className="text-muted-foreground mt-2">
            Crie e agende posts para publicação automática
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Posts Agendados
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">12</div>
            <p className="text-xs text-muted-foreground">
              Para os próximos 7 dias
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Publicados Hoje
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">3</div>
            <p className="text-xs text-muted-foreground">
              Posts publicados automaticamente
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Próxima Publicação
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">2h</div>
            <p className="text-xs text-muted-foreground">
              "Novidades do Hotel Paradise"
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Componente de agendamento */}
      <PostScheduler />

      {/* Informações adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Como funciona o agendamento?</CardTitle>
          <CardDescription>
            Entenda como usar a funcionalidade de agendamento de posts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Agendamento Automático
              </h4>
              <p className="text-sm text-muted-foreground">
                Selecione data e horário para publicação automática. O sistema publicará seu post no momento exato.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                Publicação Imediata
              </h4>
              <p className="text-sm text-muted-foreground">
                Use a opção "Publicar Agora" para publicar o post imediatamente após a criação.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Dicas importantes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Posts agendados podem ser editados até 1 hora antes da publicação</li>
              <li>• O horário é baseado no fuso horário do sistema</li>
              <li>• Você receberá uma notificação quando o post for publicado</li>
              <li>• Posts agendados aparecem como "rascunho" até serem publicados</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}