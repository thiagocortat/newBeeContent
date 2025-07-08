'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, FileText, Eye } from 'lucide-react'

// Dados de exemplo para os gráficos
const monthlyData = [
  { name: 'Jan', posts: 12, views: 2400, users: 240 },
  { name: 'Fev', posts: 19, views: 1398, users: 221 },
  { name: 'Mar', posts: 15, views: 9800, users: 229 },
  { name: 'Abr', posts: 27, views: 3908, users: 200 },
  { name: 'Mai', posts: 18, views: 4800, users: 278 },
  { name: 'Jun', posts: 23, views: 3800, users: 189 },
]

const categoryData = [
  { name: 'Turismo', value: 400, color: '#0088FE' },
  { name: 'Gastronomia', value: 300, color: '#00C49F' },
  { name: 'Eventos', value: 200, color: '#FFBB28' },
  { name: 'Hospedagem', value: 100, color: '#FF8042' },
]

const statsCards = [
  {
    title: 'Total de Posts',
    value: '114',
    description: '+12% em relação ao mês passado',
    icon: FileText,
    trend: '+12%'
  },
  {
    title: 'Visualizações',
    value: '24.5K',
    description: '+8% em relação ao mês passado',
    icon: Eye,
    trend: '+8%'
  },
  {
    title: 'Usuários Ativos',
    value: '1.2K',
    description: '+15% em relação ao mês passado',
    icon: Users,
    trend: '+15%'
  },
  {
    title: 'Taxa de Crescimento',
    value: '23%',
    description: '+5% em relação ao mês passado',
    icon: TrendingUp,
    trend: '+5%'
  },
]

export default function Analytics() {
  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stat.trend}</span> {stat.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Gráfico de Barras - Posts por Mês */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Posts Publicados por Mês</CardTitle>
            <CardDescription>
              Acompanhe a produção de conteúdo ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="posts" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Categorias */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Posts por Categoria</CardTitle>
            <CardDescription>
              Distribuição de conteúdo por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linha - Visualizações */}
      <Card>
        <CardHeader>
          <CardTitle>Visualizações ao Longo do Tempo</CardTitle>
          <CardDescription>
            Acompanhe o engajamento dos seus posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}