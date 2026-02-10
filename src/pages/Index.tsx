import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

type Page = 'home' | 'titles' | 'quests' | 'chat' | 'profile' | 'admin';

const titles = [
  { id: 1, name: '[NEWBIE]', price: 0, color: 'text-gray-400', owned: true },
  { id: 2, name: '[VIP]', price: 500, color: 'text-yellow-400', owned: false },
  { id: 3, name: '[ADMIN]', price: 1000, color: 'text-red-500', owned: false },
  { id: 4, name: '[SNIPER]', price: 750, color: 'text-green-400', owned: false },
  { id: 5, name: '[LEGEND]', price: 1500, color: 'text-purple-500', owned: false },
  { id: 6, name: '[KING]', price: 2000, color: 'text-yellow-300', owned: false },
  { id: 7, name: '[TASK-MASTER]', price: 1200, color: 'text-blue-400', owned: false },
  { id: 8, name: '[CHEATER]', price: 666, color: 'text-red-400', owned: false },
  { id: 9, name: '[CREATOR]', price: 3000, color: 'text-cyan-400', owned: false },
  { id: 10, name: '[COLLAB]', price: 800, color: 'text-pink-400', owned: false },
  { id: 11, name: '[SAF ADMIN]', price: 1800, color: 'text-orange-400', owned: false },
  { id: 12, name: '[SAT ADMIN]', price: 1800, color: 'text-indigo-400', owned: false },
  { id: 13, name: '[TROLLER]', price: 900, color: 'text-lime-400', owned: false },
];

const quests = [
  { id: 1, title: 'Первый визит', description: 'Зайдите на сайт', reward: 10, completed: true, progress: 100 },
  { id: 2, title: 'Проведи 15 минут', description: 'Проведите на сайте 15 минут', reward: 50, completed: false, progress: 40 },
  { id: 3, title: 'Поболтай в чате', description: 'Отправьте 10 сообщений в чате', reward: 30, completed: false, progress: 0 },
  { id: 4, title: 'Купи первый титул', description: 'Приобретите любой титул', reward: 100, completed: false, progress: 0 },
  { id: 5, title: 'Коллекционер', description: 'Купите 5 титулов', reward: 250, completed: false, progress: 0 },
  { id: 6, title: 'Активный участник', description: 'Отправьте 50 сообщений', reward: 150, completed: false, progress: 0 },
  { id: 7, title: 'Ночной игрок', description: 'Зайдите на сайт в 3:00 ночи', reward: 200, completed: false, progress: 0 },
  { id: 8, title: 'Недельная серия', description: 'Заходите 7 дней подряд', reward: 300, completed: false, progress: 0 },
  { id: 9, title: 'Марафонец', description: 'Проведите на сайте 5 часов', reward: 500, completed: false, progress: 0 },
  { id: 10, title: 'Социальная бабочка', description: 'Напишите 100 сообщений', reward: 400, completed: false, progress: 0 },
];

export default function Index() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [coins, setCoins] = useState(10);

  const FloatingEmoji = ({ emoji, delay }: { emoji: string; delay: number }) => (
    <div
      className="absolute text-6xl opacity-20 animate-float-slow pointer-events-none"
      style={{
        top: `${Math.random() * 80}%`,
        left: `${Math.random() * 90}%`,
        animationDelay: `${delay}s`,
      }}
    >
      {emoji}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground relative overflow-hidden">
      <FloatingEmoji emoji="👑" delay={0} />
      <FloatingEmoji emoji="⭐" delay={2} />
      <FloatingEmoji emoji="🏆" delay={4} />
      <FloatingEmoji emoji="💎" delay={6} />
      <FloatingEmoji emoji="🎯" delay={8} />
      <FloatingEmoji emoji="🔥" delay={10} />

      <nav className="glass border-b border-primary/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold neon-text text-primary">ЧикенТитул</h1>
            <div className="flex items-center gap-4">
              <div className="glass px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <span className="font-bold text-xl text-primary">{coins}</span>
                <span className="text-sm text-muted-foreground">ТитулКоинов</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button
              variant={currentPage === 'home' ? 'default' : 'outline'}
              onClick={() => setCurrentPage('home')}
              className="neon-border"
            >
              <Icon name="Home" className="mr-2 h-4 w-4" />
              Главная
            </Button>
            <Button
              variant={currentPage === 'titles' ? 'default' : 'outline'}
              onClick={() => setCurrentPage('titles')}
              className="neon-border"
            >
              <Icon name="Crown" className="mr-2 h-4 w-4" />
              Титулы
            </Button>
            <Button
              variant={currentPage === 'quests' ? 'default' : 'outline'}
              onClick={() => setCurrentPage('quests')}
              className="neon-border"
            >
              <Icon name="Target" className="mr-2 h-4 w-4" />
              Квесты
            </Button>
            <Button
              variant={currentPage === 'chat' ? 'default' : 'outline'}
              onClick={() => setCurrentPage('chat')}
              className="neon-border"
            >
              <Icon name="MessageCircle" className="mr-2 h-4 w-4" />
              Чат
            </Button>
            <Button
              variant={currentPage === 'profile' ? 'default' : 'outline'}
              onClick={() => setCurrentPage('profile')}
              className="neon-border"
            >
              <Icon name="User" className="mr-2 h-4 w-4" />
              Профиль
            </Button>
            <Button
              variant={currentPage === 'admin' ? 'default' : 'outline'}
              onClick={() => setCurrentPage('admin')}
              className="neon-border"
            >
              <Icon name="Shield" className="mr-2 h-4 w-4" />
              Админ
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {currentPage === 'home' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-6xl font-black neon-text text-primary animate-pulse">
                ДОБРО ПОЖАЛОВАТЬ
              </h2>
              <p className="text-2xl text-secondary neon-text">
                В КИБЕРПРОСТРАНСТВО ТИТУЛОВ
              </p>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Выполняй квесты, зарабатывай ТитулКоины, покупай эксклюзивные титулы
                и становись легендой киберпространства! 🚀
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="glass border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Icon name="Trophy" className="h-6 w-6" />
                    Титулы
                  </CardTitle>
                  <CardDescription>13 уникальных титулов</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-center text-primary neon-text">13</p>
                  <p className="text-center text-muted-foreground mt-2">доступных титулов</p>
                </CardContent>
              </Card>

              <Card className="glass border-secondary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-secondary">
                    <Icon name="Target" className="h-6 w-6" />
                    Квесты
                  </CardTitle>
                  <CardDescription>Выполняй и зарабатывай</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-center text-secondary neon-text">
                    {quests.length}
                  </p>
                  <p className="text-center text-muted-foreground mt-2">активных квестов</p>
                </CardContent>
              </Card>

              <Card className="glass border-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <Icon name="Users" className="h-6 w-6" />
                    Сообщество
                  </CardTitle>
                  <CardDescription>Общайся в чате</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-center text-accent neon-text">∞</p>
                  <p className="text-center text-muted-foreground mt-2">игроков онлайн</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentPage === 'titles' && (
          <div className="space-y-6">
            <h2 className="text-4xl font-bold neon-text text-primary">Магазин Титулов</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {titles.map((title) => (
                <Card
                  key={title.id}
                  className={`glass border-2 ${
                    title.owned ? 'border-green-500/50' : 'border-primary/30'
                  } hover:scale-105 transition-transform`}
                >
                  <CardHeader>
                    <CardTitle className={`text-2xl ${title.color} neon-text user-select-none`}>
                      {title.owned ? title.name : '████████'}
                    </CardTitle>
                    <CardDescription>
                      {title.owned ? (
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          <Icon name="Check" className="h-3 w-3 mr-1" />
                          Куплено
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">💰</span>
                          <span className="font-bold text-xl">{title.price}</span>
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!title.owned && (
                      <Button
                        className="w-full neon-border"
                        variant="outline"
                        disabled={coins < title.price}
                      >
                        <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
                        Купить
                      </Button>
                    )}
                    {title.owned && (
                      <div className="text-center text-muted-foreground">
                        Можно копировать: <span className={title.color}>{title.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'quests' && (
          <div className="space-y-6">
            <h2 className="text-4xl font-bold neon-text text-primary">Квесты</h2>
            <div className="space-y-4">
              {quests.map((quest) => (
                <Card
                  key={quest.id}
                  className={`glass border-2 ${
                    quest.completed ? 'border-green-500/50' : 'border-secondary/30'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{quest.title}</CardTitle>
                        <CardDescription>{quest.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">💰</span>
                        <span className="font-bold text-xl text-primary neon-text">
                          +{quest.reward}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={quest.progress} className="h-3" />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Прогресс: {quest.progress}%
                      </span>
                      {quest.completed ? (
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          <Icon name="Check" className="h-3 w-3 mr-1" />
                          Выполнено
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                          <Icon name="Clock" className="h-3 w-3 mr-1" />
                          В процессе
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentPage === 'chat' && (
          <Card className="glass border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Icon name="MessageCircle" className="h-6 w-6" />
                Чат
              </CardTitle>
              <CardDescription>Общайся с другими игроками</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <Icon name="Construction" className="h-12 w-12 mx-auto mb-4" />
                <p>Чат в разработке</p>
                <p className="text-sm">Скоро здесь появится общение в реальном времени!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentPage === 'profile' && (
          <Card className="glass border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Icon name="User" className="h-6 w-6" />
                Профиль
              </CardTitle>
              <CardDescription>Ваш игровой профиль</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <Icon name="Construction" className="h-12 w-12 mx-auto mb-4" />
                <p>Система профилей в разработке</p>
                <p className="text-sm">Скоро здесь будут ваши статистика и достижения!</p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentPage === 'admin' && (
          <Card className="glass border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <Icon name="Shield" className="h-6 w-6" />
                Админ-панель
              </CardTitle>
              <CardDescription>Управление системой</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-12">
                <Icon name="Construction" className="h-12 w-12 mx-auto mb-4" />
                <p>Админ-панель в разработке</p>
                <p className="text-sm">Скоро здесь будет управление пользователями и монетами!</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
