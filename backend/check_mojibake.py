#!/usr/bin/env python3
"""
检查并修复Supabase中的乱码记录
"""
import os
import sys
import requests
from pathlib import Path
import re

# 读取环境变量
env_file = Path("D:/蜂群网站项目/蜂群任务市场/backend/.env")
env_vars = {}
with open(env_file, 'r', encoding='utf-8') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            key, value = line.strip().split('=', 1)
            env_vars[key] = value

url = env_vars.get('SUPABASE_URL')
service_key = env_vars.get('SUPABASE_SERVICE_ROLE_KEY')
anon_key = env_vars.get('SUPABASE_ANON_KEY')

if not url or not service_key:
    print("[ERROR] 缺少Supabase配置")
    sys.exit(1)

print(f"[INFO] Supabase URL: {url}")
print(f"[INFO] 使用Service Role Key连接")

# 设置请求头
headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def get_tables():
    """获取所有表"""
    print("\n[INFO] 获取数据库表...")
    try:
        response = requests.get(f'{url}/rest/v1/', headers=headers, timeout=30)
        if response.status_code == 200:
            # 尝试获取表列表
            response = requests.get(f'{url}/rest/v1/?', headers=headers, timeout=30)
            return []
        else:
            print(f"[ERROR] 无法获取表列表: {response.status_code}")
            return []
    except Exception as e:
        print(f"[ERROR] 获取表失败: {e}")
        return []

def search_mojibake(table_name, column_name='title'):
    """在指定表中搜索乱码记录"""
    print(f"\n[INFO] 在表 {table_name} 中搜索乱码记录...")
    
    # 搜索包含 '????' 或中文乱码的记录
    patterns = [
        "API????",  # 已知的乱码模式
        "api????",
        "%????%",
        "%?%?%?%?%",
        "%�%",      # 常见的乱码字符
    ]
    
    mojibake_records = []
    
    for pattern in patterns:
        try:
            # 构建查询参数
            params = {
                f'{column_name}': f'like.{pattern}',
                'select': '*'
            }
            
            response = requests.get(
                f'{url}/rest/v1/{table_name}',
                headers=headers,
                params=params,
                timeout=30
            )
            
            if response.status_code == 200:
                records = response.json()
                if records:
                    print(f"[FOUND] 找到 {len(records)} 条匹配模式 '{pattern}' 的记录")
                    for record in records:
                        record_id = record.get('id') or record.get(f'{table_name}_id') or record.get('task_id')
                        if record_id:
                            # 避免重复
                            if not any(r.get('id') == record_id for r in mojibake_records):
                                mojibake_records.append(record)
            elif response.status_code != 200 and response.status_code != 400:
                print(f"[WARN] 搜索表 {table_name} 时出错: {response.status_code}")
                
        except Exception as e:
            print(f"[ERROR] 搜索表 {table_name} 时出错: {e}")
    
    return mojibake_records

def analyze_mojibake(text):
    """分析乱码文本"""
    print(f"\n[ANALYSIS] 分析乱码文本: {text}")
    
    # 常见的乱码模式
    patterns = {
        'utf8_mojibake': r'[\x80-\xff]+',  # UTF-8解码错误
        'gbk_mojibake': r'[\uFFFD\uFFFE\uFFFF]+',  # 替换字符
        'question_marks': r'\?{2,}',  # 多个问号
        'api_question': r'API\?{2,}',  # API????
    }
    
    analysis = {
        'original_text': text,
        'suspected_encoding_issues': [],
        'possible_corrections': []
    }
    
    for pattern_name, pattern in patterns.items():
        if re.search(pattern, text):
            analysis['suspected_encoding_issues'].append(pattern_name)
    
    # 尝试猜测正确的文本
    if 'api_question' in analysis['suspected_encoding_issues']:
        # API???? 可能是 "API接口" 或 "API调用" 等
        possible_corrections = [
            "API接口",
            "API调用",
            "API设计",
            "API开发"
        ]
        analysis['possible_corrections'] = possible_corrections
    
    return analysis

def fix_mojibake_record(table_name, record_id, original_text, corrected_text):
    """修复乱码记录"""
    print(f"\n[FIX] 修复记录 {record_id}: '{original_text}' -> '{corrected_text}'")
    
    try:
        # 构建更新数据
        update_data = {}
        
        # 根据表结构猜测字段名
        if 'title' in record:
            update_data['title'] = corrected_text
        elif 'name' in record:
            update_data['name'] = corrected_text
        elif 'description' in record:
            update_data['description'] = corrected_text
        
        if not update_data:
            print(f"[WARN] 无法确定要更新的字段")
            return False
        
        # 发送更新请求
        response = requests.patch(
            f'{url}/rest/v1/{table_name}?id=eq.{record_id}',
            headers=headers,
            json=update_data,
            timeout=30
        )
        
        if response.status_code == 200 or response.status_code == 204:
            print(f"[SUCCESS] 记录 {record_id} 修复成功")
            return True
        else:
            print(f"[ERROR] 修复失败: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"[ERROR] 修复记录时出错: {e}")
        return False

def main():
    print("=" * 60)
    print("Supabase乱码记录检查和修复工具")
    print("=" * 60)
    
    # 已知的可能包含乱码的表
    tables_to_check = [
        'tasks',
        'task_submissions',
        'models',
        'model_performance',
        'users',
        'arbitration_votes'
    ]
    
    all_mojibake_records = []
    
    # 检查所有表
    for table in tables_to_check:
        records = search_mojibake(table, 'title')
        if not records:
            records = search_mojibake(table, 'name')
        if not records:
            records = search_mojibake(table, 'description')
        
        if records:
            print(f"[FOUND] 表 {table} 中有 {len(records)} 条疑似乱码记录")
            for record in records:
                record['table'] = table
                all_mojibake_records.append(record)
    
    if not all_mojibake_records:
        print("\n[INFO] 没有找到乱码记录")
        return
    
    print(f"\n[SUMMARY] 总共找到 {len(all_mojibake_records)} 条疑似乱码记录")
    
    # 分析和修复
    fixed_count = 0
    
    for record in all_mojibake_records:
        table_name = record['table']
        record_id = record.get('id') or record.get(f'{table_name}_id') or record.get('task_id')
        
        # 查找可能包含乱码的字段
        text_fields = ['title', 'name', 'description', 'requirement', 'task_type']
        
        for field in text_fields:
            if field in record and record[field]:
                text = record[field]
                
                # 检查是否是乱码
                analysis = analyze_mojibake(text)
                
                if analysis['suspected_encoding_issues']:
                    print(f"\n[MOJIBAKE] 表: {table_name}, 记录ID: {record_id}")
                    print(f"          字段: {field}")
                    print(f"          内容: {text}")
                    print(f"          问题: {analysis['suspected_encoding_issues']}")
                    
                    if analysis['possible_corrections']:
                        # 使用第一个可能的修正
                        corrected_text = analysis['possible_corrections'][0]
                        
                        # 询问是否修复
                        user_input = input(f"修复为 '{corrected_text}'? (y/n): ").strip().lower()
                        
                        if user_input == 'y':
                            if fix_mojibake_record(table_name, record_id, text, corrected_text):
                                fixed_count += 1
                        else:
                            print("[SKIP] 用户选择跳过修复")
                    else:
                        print("[WARN] 没有找到合适的修正建议")
    
    print(f"\n[FINAL] 修复完成，共修复 {fixed_count} 条记录")
    
    # 验证修复
    if fixed_count > 0:
        print("\n[VERIFICATION] 验证修复结果...")
        remaining_mojibake = []
        
        for table in tables_to_check:
            records = search_mojibake(table, 'title')
            if records:
                remaining_mojibake.extend(records)
        
        if remaining_mojibake:
            print(f"[WARN] 仍有 {len(remaining_mojibake)} 条乱码记录未修复")
        else:
            print("[SUCCESS] 所有乱码记录已成功修复")

if __name__ == '__main__':
    main()