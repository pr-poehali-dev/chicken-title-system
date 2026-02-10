"""
API для регистрации, входа и управления пользователями
"""
import json
import os
import hashlib
import psycopg2
from datetime import datetime

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

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
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                username = body.get('username', '').strip()
                password = body.get('password', '')
                
                if not username or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Имя и пароль обязательны'}),
                        'isBase64Encoded': False
                    }
                
                if len(username) < 3:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Имя должно быть минимум 3 символа'}),
                        'isBase64Encoded': False
                    }
                
                conn = get_db()
                cur = conn.cursor()
                
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                if cur.fetchone():
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь уже существует'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(password)
                cur.execute(
                    "INSERT INTO users (username, password_hash, coins, last_login) VALUES (%s, %s, 50, %s) RETURNING id, username, coins, is_admin",
                    (username, password_hash, datetime.now())
                )
                user = cur.fetchone()
                
                cur.execute("SELECT id FROM titles WHERE name = '[NEWBIE]'")
                newbie_title = cur.fetchone()
                if newbie_title:
                    cur.execute("INSERT INTO user_titles (user_id, title_id) VALUES (%s, %s)", (user[0], newbie_title[0]))
                
                cur.execute(
                    "INSERT INTO user_quests (user_id, quest_id, progress, completed) SELECT %s, id, 1, TRUE FROM quests WHERE quest_type = 'login' LIMIT 1",
                    (user[0],)
                )
                
                conn.commit()
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
                            'is_admin': user[3]
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'login':
                username = body.get('username', '').strip()
                password = body.get('password', '')
                
                if not username or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Имя и пароль обязательны'}),
                        'isBase64Encoded': False
                    }
                
                conn = get_db()
                cur = conn.cursor()
                
                password_hash = hash_password(password)
                cur.execute(
                    "SELECT id, username, coins, is_admin FROM users WHERE username = %s AND password_hash = %s",
                    (username, password_hash)
                )
                user = cur.fetchone()
                
                if not user:
                    cur.close()
                    conn.close()
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверное имя или пароль'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("UPDATE users SET last_login = %s WHERE id = %s", (datetime.now(), user[0]))
                conn.commit()
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
                            'is_admin': user[3]
                        }
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
