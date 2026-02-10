"""
Единое API для всех операций: профиль, магазин, ежедневные награды
"""
import json
import os
import psycopg2
from datetime import datetime, date, timedelta

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    path = event.get('queryStringParameters', {}).get('action', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        if method == 'GET' and path == 'profile':
            user_id = event.get('queryStringParameters', {}).get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            conn = get_db()
            cur = conn.cursor()
            
            cur.execute("SELECT id, username, coins, is_admin, time_spent_minutes FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            if not user:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT t.id, t.name, t.price, t.color, t.is_limited, 
                       CASE WHEN ut.id IS NOT NULL THEN TRUE ELSE FALSE END as owned
                FROM titles t
                LEFT JOIN user_titles ut ON t.id = ut.title_id AND ut.user_id = %s
                ORDER BY t.display_order
            """, (user_id,))
            titles = [{'id': t[0], 'name': t[1], 'price': t[2], 'color': t[3], 'is_limited': t[4], 'owned': t[5]} for t in cur.fetchall()]
            
            cur.execute("""
                SELECT q.id, q.title, q.description, q.reward, q.quest_type, q.target_value,
                       COALESCE(uq.progress, 0) as progress, COALESCE(uq.completed, FALSE) as completed
                FROM quests q
                LEFT JOIN user_quests uq ON q.id = uq.quest_id AND uq.user_id = %s
                ORDER BY q.display_order
            """, (user_id,))
            quests = [{
                'id': q[0], 
                'title': q[1], 
                'description': q[2], 
                'reward': q[3], 
                'quest_type': q[4],
                'target_value': q[5],
                'progress': min(100, int((q[6] / q[5] * 100) if q[5] > 0 else 0)),
                'completed': q[7]
            } for q in cur.fetchall()]
            
            cur.execute("""
                SELECT day_streak, login_date, reward_claimed
                FROM daily_logins
                WHERE user_id = %s
                ORDER BY login_date DESC
                LIMIT 1
            """, (user_id,))
            daily_login = cur.fetchone()
            current_streak = 0
            can_claim_daily = False
            
            if daily_login:
                current_streak = daily_login[0]
                last_login_date = daily_login[1]
                today = date.today()
                
                if last_login_date < today:
                    if last_login_date == today - timedelta(days=1):
                        can_claim_daily = True
                    else:
                        current_streak = 0
                        can_claim_daily = True
            else:
                can_claim_daily = True
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'user': {
                        'id': user[0],
                        'username': user[1],
                        'coins': user[2],
                        'is_admin': user[3],
                        'time_spent_minutes': user[4]
                    },
                    'titles': titles,
                    'quests': quests,
                    'daily_streak': current_streak,
                    'can_claim_daily': can_claim_daily
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'buy_title':
                user_id = body.get('user_id')
                title_id = body.get('title_id')
                
                conn = get_db()
                cur = conn.cursor()
                
                cur.execute("SELECT coins FROM users WHERE id = %s", (user_id,))
                user = cur.fetchone()
                
                cur.execute("SELECT id, name, price FROM titles WHERE id = %s", (title_id,))
                title = cur.fetchone()
                
                cur.execute("SELECT id FROM user_titles WHERE user_id = %s AND title_id = %s", (user_id, title_id))
                if cur.fetchone():
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Титул уже куплен'}),
                        'isBase64Encoded': False
                    }
                
                if user[0] < title[2]:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Недостаточно ТитулКоинов'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("UPDATE users SET coins = coins - %s WHERE id = %s", (title[2], user_id))
                cur.execute("INSERT INTO user_titles (user_id, title_id) VALUES (%s, %s)", (user_id, title_id))
                cur.execute("""
                    UPDATE user_quests SET progress = progress + 1 
                    WHERE user_id = %s AND quest_id IN (SELECT id FROM quests WHERE quest_type = 'buy_title')
                """, (user_id,))
                
                conn.commit()
                cur.execute("SELECT coins FROM users WHERE id = %s", (user_id,))
                new_coins = cur.fetchone()[0]
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': f'Титул {title[1]} успешно куплен!', 'new_coins': new_coins}),
                    'isBase64Encoded': False
                }
            
            elif action == 'sell_title':
                user_id = body.get('user_id')
                title_id = body.get('title_id')
                
                conn = get_db()
                cur = conn.cursor()
                
                cur.execute("SELECT id FROM user_titles WHERE user_id = %s AND title_id = %s", (user_id, title_id))
                if not cur.fetchone():
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Титул не куплен'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("SELECT id, name, price FROM titles WHERE id = %s", (title_id,))
                title = cur.fetchone()
                
                if title[1] == '[NEWBIE]':
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Нельзя продать стартовый титул'}),
                        'isBase64Encoded': False
                    }
                
                sell_price = title[2] // 2
                
                cur.execute("DELETE FROM user_titles WHERE user_id = %s AND title_id = %s", (user_id, title_id))
                cur.execute("UPDATE users SET coins = coins + %s WHERE id = %s", (sell_price, user_id))
                cur.execute("""
                    UPDATE user_quests SET progress = progress + 1 
                    WHERE user_id = %s AND quest_id IN (SELECT id FROM quests WHERE quest_type = 'sell_title')
                """, (user_id,))
                
                conn.commit()
                cur.execute("SELECT coins FROM users WHERE id = %s", (user_id,))
                new_coins = cur.fetchone()[0]
                cur.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': f'Титул {title[1]} продан за {sell_price} ТитулКоинов!', 'new_coins': new_coins}),
                    'isBase64Encoded': False
                }
            
            elif action == 'claim_daily':
                user_id = body.get('user_id')
                
                conn = get_db()
                cur = conn.cursor()
                
                today = date.today()
                
                cur.execute("""
                    SELECT day_streak, login_date, reward_claimed
                    FROM daily_logins
                    WHERE user_id = %s
                    ORDER BY login_date DESC
                    LIMIT 1
                """, (user_id,))
                
                last_login = cur.fetchone()
                current_streak = 1
                
                if last_login:
                    last_date = last_login[1]
                    
                    if last_date == today:
                        if last_login[2]:
                            cur.close()
                            conn.close()
                            return {
                                'statusCode': 400,
                                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                                'body': json.dumps({'error': 'Награда уже получена сегодня'}),
                                'isBase64Encoded': False
                            }
                        current_streak = last_login[0]
                    elif last_date == today - timedelta(days=1):
                        current_streak = last_login[0] + 1
                
                rewards = {
                    1: {'coins': 50, 'title': None},
                    2: {'coins': 100, 'title': None},
                    3: {'coins': 0, 'title': '[Третий]'},
                    4: {'coins': 150, 'title': None},
                    5: {'coins': 500, 'title': None},
                    6: {'coins': 750, 'title': None},
                    7: {'coins': 0, 'title': '[Ежедневный]'}
                }
                
                reward = rewards.get(current_streak, {'coins': 0, 'title': None})
                
                if reward['coins'] > 0:
                    cur.execute("UPDATE users SET coins = coins + %s WHERE id = %s", (reward['coins'], user_id))
                
                if reward['title']:
                    cur.execute("SELECT id FROM titles WHERE name = %s", (reward['title'],))
                    title = cur.fetchone()
                    if title:
                        cur.execute(
                            "INSERT INTO user_titles (user_id, title_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                            (user_id, title[0])
                        )
                
                cur.execute(
                    "INSERT INTO daily_logins (user_id, login_date, day_streak, reward_claimed) VALUES (%s, %s, %s, TRUE) ON CONFLICT (user_id, login_date) DO UPDATE SET reward_claimed = TRUE",
                    (user_id, today, current_streak)
                )
                
                cur.execute("""
                    UPDATE user_quests SET progress = %s 
                    WHERE user_id = %s AND quest_id IN (SELECT id FROM quests WHERE quest_type = 'daily_streak')
                """, (current_streak, user_id))
                
                conn.commit()
                cur.execute("SELECT coins FROM users WHERE id = %s", (user_id,))
                new_coins = cur.fetchone()[0]
                cur.close()
                conn.close()
                
                message = f'День {current_streak}! '
                if reward['coins'] > 0:
                    message += f'Получено {reward["coins"]} ТитулКоинов!'
                if reward['title']:
                    message += f' Получен титул {reward["title"]}!'
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'message': message,
                        'day_streak': current_streak,
                        'coins_reward': reward['coins'],
                        'title_reward': reward['title'],
                        'new_coins': new_coins
                    }),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
