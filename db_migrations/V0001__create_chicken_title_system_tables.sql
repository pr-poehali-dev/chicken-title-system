-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    coins INTEGER DEFAULT 50,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    time_spent_minutes INTEGER DEFAULT 0
);

-- Таблица титулов
CREATE TABLE IF NOT EXISTS titles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    price INTEGER NOT NULL,
    color VARCHAR(50) NOT NULL,
    is_limited BOOLEAN DEFAULT FALSE,
    display_order INTEGER
);

-- Таблица купленных титулов пользователей
CREATE TABLE IF NOT EXISTS user_titles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title_id INTEGER REFERENCES titles(id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, title_id)
);

-- Таблица квестов
CREATE TABLE IF NOT EXISTS quests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    reward INTEGER NOT NULL,
    quest_type VARCHAR(50) NOT NULL,
    target_value INTEGER DEFAULT 0,
    display_order INTEGER
);

-- Таблица прогресса квестов пользователей
CREATE TABLE IF NOT EXISTS user_quests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    quest_id INTEGER REFERENCES quests(id),
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    UNIQUE(user_id, quest_id)
);

-- Таблица сообщений чата
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица ежедневных входов
CREATE TABLE IF NOT EXISTS daily_logins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    login_date DATE NOT NULL,
    day_streak INTEGER DEFAULT 1,
    reward_claimed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, login_date)
);

-- Вставка титулов
INSERT INTO titles (name, price, color, is_limited, display_order) VALUES
('[NEWBIE]', 0, 'text-gray-400', FALSE, 1),
('[VIP]', 100, 'text-yellow-400', FALSE, 2),
('[ADMIN]', 250, 'text-red-500', FALSE, 3),
('[SNIPER]', 150, 'text-green-400', FALSE, 4),
('[LEGEND]', 400, 'text-purple-500', FALSE, 5),
('[KING]', 600, 'text-yellow-300', FALSE, 6),
('[TASK-MASTER]', 300, 'text-blue-400', FALSE, 7),
('[CHEATER]', 200, 'text-red-400', FALSE, 8),
('[CREATOR]', 800, 'text-cyan-400', FALSE, 9),
('[COLLAB]', 180, 'text-pink-400', FALSE, 10),
('[SAF ADMIN]', 450, 'text-orange-400', FALSE, 11),
('[SAT ADMIN]', 450, 'text-indigo-400', FALSE, 12),
('[TROLLER]', 220, 'text-lime-400', FALSE, 13),
('[Третий]', 0, 'text-emerald-400', TRUE, 14),
('[Ежедневный]', 0, 'text-rose-400', TRUE, 15)
ON CONFLICT (name) DO NOTHING;

-- Вставка квестов
INSERT INTO quests (title, description, reward, quest_type, target_value, display_order) VALUES
('Первый визит', 'Зайдите на сайт', 10, 'login', 1, 1),
('Проведи 15 минут', 'Проведите на сайте 15 минут', 50, 'time_spent', 15, 2),
('Поболтай в чате', 'Отправьте 10 сообщений в чате', 30, 'chat_messages', 10, 3),
('Купи первый титул', 'Приобретите любой титул', 100, 'buy_title', 1, 4),
('Коллекционер', 'Купите 5 титулов', 250, 'buy_title', 5, 5),
('Активный участник', 'Отправьте 50 сообщений', 150, 'chat_messages', 50, 6),
('Ночной игрок', 'Зайдите на сайт в 3:00 ночи', 200, 'night_login', 1, 7),
('Недельная серия', 'Заходите 7 дней подряд', 300, 'daily_streak', 7, 8),
('Марафонец', 'Проведите на сайте 5 часов', 500, 'time_spent', 300, 9),
('Социальная бабочка', 'Напишите 100 сообщений', 400, 'chat_messages', 100, 10),
('Болтун', 'Отправьте 25 сообщений', 80, 'chat_messages', 25, 11),
('Часовой', 'Проведите на сайте 1 час', 100, 'time_spent', 60, 12),
('Покупатель', 'Купите 3 титула', 150, 'buy_title', 3, 13),
('Богач', 'Накопите 1000 коинов', 200, 'coins_earned', 1000, 14),
('Миллионер', 'Накопите 5000 коинов', 1000, 'coins_earned', 5000, 15),
('Продавец', 'Продайте 1 титул', 50, 'sell_title', 1, 16),
('Торговец', 'Продайте 5 титулов', 200, 'sell_title', 5, 17),
('Утренний визит', 'Зайдите на сайт утром (6:00-9:00)', 150, 'morning_login', 1, 18),
('Дневной игрок', 'Зайдите на сайт днем (12:00-15:00)', 100, 'day_login', 1, 19),
('Вечерний посетитель', 'Зайдите на сайт вечером (18:00-21:00)', 120, 'evening_login', 1, 20),
('Трудяга', 'Проведите на сайте 10 часов', 800, 'time_spent', 600, 21),
('Фанат', 'Проведите на сайте 24 часа', 1500, 'time_spent', 1440, 22),
('Чат-мастер', 'Отправьте 200 сообщений', 600, 'chat_messages', 200, 23),
('Гуру чата', 'Отправьте 500 сообщений', 1200, 'chat_messages', 500, 24),
('Коллекционер-профи', 'Купите 10 титулов', 500, 'buy_title', 10, 25),
('Владыка титулов', 'Купите все обычные титулы', 1000, 'buy_all_regular', 13, 26),
('Двухдневная серия', 'Заходите 2 дня подряд', 100, 'daily_streak', 2, 27),
('Трехдневная серия', 'Заходите 3 дня подряд', 150, 'daily_streak', 3, 28),
('Месячная преданность', 'Заходите 30 дней подряд', 2000, 'daily_streak', 30, 29),
('Быстрый старт', 'Наберите 100 коинов за первый час', 150, 'fast_coins', 100, 30),
('Спринтер', 'Выполните 5 квестов за день', 200, 'quests_per_day', 5, 31),
('Целеустремленный', 'Выполните 10 квестов', 300, 'total_quests', 10, 32),
('Герой квестов', 'Выполните 25 квестов', 800, 'total_quests', 25, 33),
('Легенда квестов', 'Выполните все квесты', 3000, 'all_quests', 45, 34),
('Первая покупка', 'Купите титул в первые 5 минут', 100, 'fast_purchase', 1, 35),
('Продажный', 'Продайте 10 титулов', 400, 'sell_title', 10, 36),
('Торговый магнат', 'Продайте 20 титулов', 1000, 'sell_title', 20, 37),
('Полуночник', 'Зайдите на сайт в полночь (00:00-01:00)', 250, 'midnight_login', 1, 38),
('Рассветный', 'Зайдите на сайт на рассвете (5:00-6:00)', 220, 'dawn_login', 1, 39),
('Чатохолик', 'Отправьте 1000 сообщений', 2000, 'chat_messages', 1000, 40),
('Новичок-исследователь', 'Посетите все разделы сайта', 80, 'visit_all_pages', 1, 41),
('Активист недели', 'Проведите на сайте 20 часов за неделю', 1000, 'weekly_time', 1200, 42),
('Щедрый', 'Получите 100 коинов от админа', 50, 'admin_coins', 100, 43),
('Избранный', 'Получите 500 коинов от админа', 200, 'admin_coins', 500, 44),
('Король общения', 'Будьте онлайн одновременно с 10+ игроками', 300, 'online_users', 10, 45)
ON CONFLICT DO NOTHING;

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_user_titles_user_id ON user_titles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_logins_user_id ON daily_logins(user_id);
