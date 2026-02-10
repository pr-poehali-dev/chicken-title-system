import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const API_URLS = {
  auth: 'https://functions.poehali.dev/3aa3a8d2-139f-41a8-9d22-1c3edb579cd5',
  api: 'https://functions.poehali.dev/62068459-9fcd-453d-bfbd-51a356676e22',
  chat: 'https://functions.poehali.dev/98ece30b-d459-480d-b5bb-3cbaf97a30e9',
  admin: 'https://functions.poehali.dev/b80bc515-7971-430e-8083-5237a4f474e1'
};

type Page = 'home' | 'titles' | 'quests' | 'chat' | 'profile' | 'admin';

interface User {
  id: number;
  username: string;
  coins: number;
  is_admin: boolean;
}

interface Title {
  id: number;
  name: string;
  price: number;
  color: string;
  is_limited: boolean;
  owned: boolean;
}

interface Quest {
  id: number;
  title: string;
  description: string;
  reward: number;
  progress: number;
  completed: boolean;
}

interface ChatMessage {
  id: number;
  message: string;
  username: string;
  user_id: number;
  created_at: string;
}

export default function Index() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [titles, setTitles] = useState<Title[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [coinsInput, setCoinsInput] = useState('');
  const [dailyStreak, setDailyStreak] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const FloatingEmoji = ({ emoji, delay }: { emoji: string; delay: number }) => (
    <div
      className="absolute text-6xl opacity-20 animate-float-slow pointer-events-none user-select-none"
      style={{
        top: `${Math.random() * 80}%`,
        left: `${Math.random() * 90}%`,
        animationDelay: `${delay}s`,
      }}
    >
      {emoji}
    </div>
  );

  useEffect(() => {
    const storedUser = localStorage.getItem('chicken_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setShowAuth(false);
      loadUserData(parsedUser.id);
    }
  }, []);

  useEffect(() => {
    if (currentPage === 'chat' && user) {
      loadChat();
      const interval = setInterval(loadChat, 3000);
      return () => clearInterval(interval);
    }
  }, [currentPage, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadUserData = async (userId: number) => {
    try {
      const response = await fetch(`${API_URLS.api}?action=profile&user_id=${userId}`);
      const data = await response.json();
      
      setUser(data.user);
      setTitles(data.titles);
      setQuests(data.quests);
      setDailyStreak(data.daily_streak);
      setCanClaimDaily(data.can_claim_daily);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          username,
          password
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('chicken_user', JSON.stringify(data.user));
        setShowAuth(false);
        loadUserData(data.user.id);
        toast({
          title: isLogin ? 'Вход выполнен!' : 'Регистрация успешна!',
          description: `Добро пожаловать, ${data.user.username}!`
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive'
      });
    }
  };

  const handleBuyTitle = async () => {
    if (!selectedTitle || !user) return;
    
    try {
      const response = await fetch(API_URLS.api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'buy_title',
          user_id: user.id,
          title_id: selectedTitle.id
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: data.message
        });
        setUser({ ...user, coins: data.new_coins });
        loadUserData(user.id);
        setShowBuyDialog(false);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось купить титул',
        variant: 'destructive'
      });
    }
  };

  const handleSellTitle = async () => {
    if (!selectedTitle || !user) return;
    
    try {
      const response = await fetch(API_URLS.api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sell_title',
          user_id: user.id,
          title_id: selectedTitle.id
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: data.message
        });
        setUser({ ...user, coins: data.new_coins });
        loadUserData(user.id);
        setShowSellDialog(false);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось продать титул',
        variant: 'destructive'
      });
    }
  };

  const handleClaimDaily = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(API_URLS.api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim_daily',
          user_id: user.id
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Ежедневная награда!',
          description: data.message
        });
        setUser({ ...user, coins: data.new_coins });
        loadUserData(user.id);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось получить награду',
        variant: 'destructive'
      });
    }
  };

  const loadChat = async () => {
    try {
      const response = await fetch(`${API_URLS.chat}?limit=50`);
      const data = await response.json();
      setChatMessages(data.messages);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !user) return;
    
    try {
      const response = await fetch(API_URLS.chat, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          message: chatInput
        })
      });
      
      if (response.ok) {
        setChatInput('');
        loadChat();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const loadAdminData = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URLS.admin}?admin_id=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setAdminUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleGiveCoins = async () => {
    if (!user || !selectedUser || !coinsInput) return;
    
    try {
      const response = await fetch(API_URLS.admin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_id: user.id,
          user_id: selectedUser.id,
          coins: parseInt(coinsInput)
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Успешно!',
          description: data.message
        });
        loadAdminData();
        setCoinsInput('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось выдать монеты',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (currentPage === 'admin' && user?.is_admin) {
      loadAdminData();
      const interval = setInterval(loadAdminData, 5000);
      return () => clearInterval(interval);
    }
  }, [currentPage, user]);

  if (showAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
        <FloatingEmoji emoji="👑" delay={0} />
        <FloatingEmoji emoji="⭐" delay={2} />
        <FloatingEmoji emoji="🏆" delay={4} />
        
        <Card className="glass border-primary/30 w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-3xl font-bold neon-text text-primary text-center">
              ЧикенТитул
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin ? 'Войдите в аккаунт' : 'Создайте аккаунт'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите имя"
                  required
                  minLength={3}
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  required
                  className="glass"
                />
              </div>
              <Button type="submit" className="w-full neon-border">
                {isLogin ? 'Войти' : 'Зарегистрироваться'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Есть аккаунт? Войдите'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) return null;

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
                <span className="font-bold text-xl text-primary">{user.coins}</span>
                <span className="text-sm text-muted-foreground">ТитулКоинов</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('chicken_user');
                  window.location.reload();
                }}
              >
                <Icon name="LogOut" className="h-4 w-4" />
              </Button>
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
            {user.is_admin && (
              <Button
                variant={currentPage === 'admin' ? 'default' : 'outline'}
                onClick={() => setCurrentPage('admin')}
                className="neon-border"
              >
                <Icon name="Shield" className="mr-2 h-4 w-4" />
                Админ
              </Button>
            )}
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

            {canClaimDaily && (
              <Card className="glass border-accent/50 max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <Icon name="Gift" className="h-6 w-6" />
                    Ежедневная награда!
                  </CardTitle>
                  <CardDescription>
                    День {dailyStreak + 1} подряд. Получите награду!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleClaimDaily} className="w-full neon-border">
                    <Icon name="Star" className="mr-2 h-4 w-4" />
                    Получить награду
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="glass border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Icon name="Trophy" className="h-6 w-6" />
                    Титулы
                  </CardTitle>
                  <CardDescription>15 уникальных титулов</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-center text-primary neon-text">
                    {titles.filter(t => t.owned).length}/{titles.length}
                  </p>
                  <p className="text-center text-muted-foreground mt-2">куплено</p>
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
                    {quests.filter(q => q.completed).length}/{quests.length}
                  </p>
                  <p className="text-center text-muted-foreground mt-2">выполнено</p>
                </CardContent>
              </Card>

              <Card className="glass border-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent">
                    <Icon name="Calendar" className="h-6 w-6" />
                    Серия дней
                  </CardTitle>
                  <CardDescription>Заходи каждый день</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-center text-accent neon-text">
                    {dailyStreak}
                  </p>
                  <p className="text-center text-muted-foreground mt-2">дней подряд</p>
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
                      {title.is_limited && (
                        <Badge variant="outline" className="border-accent text-accent ml-2">
                          Лимитированный
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {!title.owned && title.price > 0 && (
                      <Button
                        className="w-full neon-border"
                        variant="outline"
                        disabled={user.coins < title.price}
                        onClick={() => {
                          setSelectedTitle(title);
                          setShowBuyDialog(true);
                        }}
                      >
                        <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
                        Купить
                      </Button>
                    )}
                    {title.owned && title.name !== '[NEWBIE]' && (
                      <Button
                        className="w-full neon-border"
                        variant="outline"
                        onClick={() => {
                          setSelectedTitle(title);
                          setShowSellDialog(true);
                        }}
                      >
                        <Icon name="DollarSign" className="mr-2 h-4 w-4" />
                        Продать за {Math.floor(title.price / 2)}
                      </Button>
                    )}
                    {title.owned && (
                      <div className="text-center text-muted-foreground text-sm">
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
          <Card className="glass border-primary/30 h-[70vh] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Icon name="MessageCircle" className="h-6 w-6" />
                Чат
              </CardTitle>
              <CardDescription>Общайся с другими игроками</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`glass p-3 rounded-lg ${
                        msg.user_id === user.id ? 'ml-auto bg-primary/10' : 'mr-auto'
                      } max-w-[80%]`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-primary">
                          {msg.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="glass"
                  maxLength={500}
                />
                <Button type="submit" className="neon-border">
                  <Icon name="Send" className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {currentPage === 'profile' && (
          <Card className="glass border-primary/30 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Icon name="User" className="h-6 w-6" />
                Профиль
              </CardTitle>
              <CardDescription>Ваш игровой профиль</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Имя пользователя</Label>
                <div className="glass p-3 rounded-lg">
                  <p className="text-lg font-bold text-primary">{user.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ТитулКоины</Label>
                  <div className="glass p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-primary neon-text">{user.coins}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Серия дней</Label>
                  <div className="glass p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-accent neon-text">{dailyStreak}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Титулы ({titles.filter(t => t.owned).length}/{titles.length})</Label>
                <div className="glass p-4 rounded-lg flex flex-wrap gap-2">
                  {titles.filter(t => t.owned).map(title => (
                    <Badge key={title.id} variant="outline" className={`${title.color} border-current`}>
                      {title.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Прогресс квестов</Label>
                <div className="glass p-4 rounded-lg">
                  <p className="text-lg">
                    Выполнено: <span className="font-bold text-primary">{quests.filter(q => q.completed).length}</span> из {quests.length}
                  </p>
                  <Progress 
                    value={(quests.filter(q => q.completed).length / quests.length) * 100} 
                    className="mt-2 h-3"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentPage === 'admin' && user.is_admin && (
          <Card className="glass border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <Icon name="Shield" className="h-6 w-6" />
                Админ-панель
              </CardTitle>
              <CardDescription>Управление пользователями и монетами</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold mb-2">Онлайн пользователи</h3>
                  <div className="space-y-2">
                    {adminUsers.filter(u => u.is_online).map(u => (
                      <div key={u.id} className="glass p-3 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-bold">{u.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {u.coins} ТитулКоинов
                          </p>
                        </div>
                        <Badge variant="outline" className="border-green-500 text-green-500">
                          <Icon name="Circle" className="h-2 w-2 mr-1 fill-current" />
                          Онлайн
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-2">Все пользователи</h3>
                  <div className="space-y-2">
                    {adminUsers.map(u => (
                      <div key={u.id} className="glass p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold">{u.username}</p>
                            <p className="text-sm text-muted-foreground">
                              {u.coins} ТитулКоинов
                            </p>
                          </div>
                          {u.is_online && (
                            <Badge variant="outline" className="border-green-500 text-green-500">
                              Онлайн
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Количество монет"
                            value={selectedUser?.id === u.id ? coinsInput : ''}
                            onChange={(e) => {
                              setSelectedUser(u);
                              setCoinsInput(e.target.value);
                            }}
                            className="glass"
                          />
                          <Button
                            onClick={() => {
                              setSelectedUser(u);
                              handleGiveCoins();
                            }}
                            className="neon-border"
                            disabled={!coinsInput || selectedUser?.id !== u.id}
                          >
                            Выдать
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
        <DialogContent className="glass border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl neon-text text-primary">
              Покупка титула
            </DialogTitle>
            <DialogDescription className="user-select-none">
              Вы хотите приобрести этот титул?
            </DialogDescription>
          </DialogHeader>
          {selectedTitle && (
            <div className="space-y-4">
              <div className="glass p-4 rounded-lg text-center user-select-none">
                <p className={`text-3xl font-bold ${selectedTitle.color} neon-text mb-2`}>
                  ████████
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span className="text-xl font-bold">{selectedTitle.price} ТитулКоинов</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowBuyDialog(false)}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1 neon-border"
                  onClick={handleBuyTitle}
                  disabled={user.coins < selectedTitle.price}
                >
                  <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
                  Купить
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent className="glass border-primary/30">
          <DialogHeader>
            <DialogTitle className="text-2xl neon-text text-primary">
              Продажа титула
            </DialogTitle>
            <DialogDescription>
              Вы получите {selectedTitle && Math.floor(selectedTitle.price / 2)} ТитулКоинов
            </DialogDescription>
          </DialogHeader>
          {selectedTitle && (
            <div className="space-y-4">
              <div className="glass p-4 rounded-lg text-center">
                <p className={`text-3xl font-bold ${selectedTitle.color} neon-text mb-2`}>
                  {selectedTitle.name}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span className="text-xl font-bold">
                    +{Math.floor(selectedTitle.price / 2)} ТитулКоинов
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSellDialog(false)}
                >
                  Отмена
                </Button>
                <Button
                  className="flex-1 neon-border"
                  onClick={handleSellTitle}
                >
                  <Icon name="DollarSign" className="mr-2 h-4 w-4" />
                  Продать
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
