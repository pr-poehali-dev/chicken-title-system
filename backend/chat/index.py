"""
API для чата в реальном времени
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
            limit = int(event.get('queryStringParameters', {}).get('limit', 50))
            
            conn = get_db()
            cur = conn.cursor()
            
            cur.execute("""
                SELECT cm.id, cm.message, cm.created_at, u.username, u.id as user_id
                FROM chat_messages cm
                JOIN users u ON cm.user_id = u.id
                ORDER BY cm.created_at DESC
                LIMIT %s
            """, (limit,))
            
            messages = [{
                'id': m[0],
                'message': m[1],
                'created_at': m[2].isoformat(),
                'username': m[3],
                'user_id': m[4]
            } for m in cur.fetchall()]
            
            messages.reverse()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'messages': messages}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            message = body.get('message', '').strip()
            
            if not user_id or not message:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id и message обязательны'}),
                    'isBase64Encoded': False
                }
            
            if len(message) > 500:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Сообщение слишком длинное (макс. 500 символов)'}),
                    'isBase64Encoded': False
                }
            
            conn = get_db()
            cur = conn.cursor()
            
            cur.execute(
                "INSERT INTO chat_messages (user_id, message, created_at) VALUES (%s, %s, %s) RETURNING id, created_at",
                (user_id, message, datetime.now())
            )
            msg = cur.fetchone()
            
            cur.execute("""
                UPDATE user_quests SET progress = progress + 1 
                WHERE user_id = %s AND quest_id IN (SELECT id FROM quests WHERE quest_type = 'chat_messages')
            """, (user_id,))
            
            cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
            username = cur.fetchone()[0]
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'id': msg[0],
                    'message': message,
                    'created_at': msg[1].isoformat(),
                    'username': username,
                    'user_id': user_id
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
