"""
API для админ-панели: управление пользователями и выдача коинов
"""
import json
import os
import psycopg2
from datetime import datetime

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    method = event.get('httpMethod', 'GET')
    
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
        if method == 'GET':
            admin_id = event.get('queryStringParameters', {}).get('admin_id')
            
            if not admin_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'admin_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            conn = get_db()
            cur = conn.cursor()
            
            cur.execute("SELECT is_admin FROM users WHERE id = %s", (admin_id,))
            admin = cur.fetchone()
            
            if not admin or not admin[0]:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Доступ запрещен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT id, username, coins, last_login, time_spent_minutes,
                       CASE WHEN last_login > NOW() - INTERVAL '5 minutes' THEN TRUE ELSE FALSE END as is_online
                FROM users
                ORDER BY is_online DESC, last_login DESC
            """)
            
            users = [{
                'id': u[0],
                'username': u[1],
                'coins': u[2],
                'last_login': u[3].isoformat() if u[3] else None,
                'time_spent_minutes': u[4],
                'is_online': u[5]
            } for u in cur.fetchall()]
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': users}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            admin_id = body.get('admin_id')
            target_user_id = body.get('user_id')
            coins_amount = body.get('coins', 0)
            
            if not admin_id or not target_user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'admin_id и user_id обязательны'}),
                    'isBase64Encoded': False
                }
            
            conn = get_db()
            cur = conn.cursor()
            
            cur.execute("SELECT is_admin FROM users WHERE id = %s", (admin_id,))
            admin = cur.fetchone()
            
            if not admin or not admin[0]:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Доступ запрещен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("UPDATE users SET coins = coins + %s WHERE id = %s", (coins_amount, target_user_id))
            
            if coins_amount > 0:
                cur.execute("""
                    UPDATE user_quests SET progress = progress + %s 
                    WHERE user_id = %s AND quest_id IN (SELECT id FROM quests WHERE quest_type = 'admin_coins')
                """, (coins_amount, target_user_id))
            
            conn.commit()
            
            cur.execute("SELECT username, coins FROM users WHERE id = %s", (target_user_id,))
            user = cur.fetchone()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'message': f'Пользователю {user[0]} {"выдано" if coins_amount > 0 else "списано"} {abs(coins_amount)} ТитулКоинов',
                    'new_coins': user[1]
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
