#!/usr/bin/env python3
"""Build static HTML for GitHub Pages deployment"""

import re
import os

BASE = os.path.dirname(os.path.abspath(__file__))
TEMPLATES = os.path.join(BASE, 'templates')

def read_template(path):
    full = os.path.join(TEMPLATES, path)
    with open(full, 'r', encoding='utf-8') as f:
        return f.read()

def inline_includes(content):
    pattern = r'{%\s*include\s*"([^"]+)"\s*%}'
    def replacer(match):
        tpl_path = match.group(1)
        return read_template(tpl_path)
    result = content
    # Keep replacing until no more includes (nested)
    while True:
        new_result, count = re.subn(pattern, replacer, result)
        if count == 0:
            break
        result = new_result
    return result

# Read app.html
app_html = read_template('app.html')

# Replace static paths for GitHub Pages (relative)
app_html = app_html.replace('href="/static/', 'href="static/')
app_html = app_html.replace('src="/static/', 'src="static/')

# Inline all includes
final_html = inline_includes(app_html)

# Embed static data for client-side operation (GitHub Pages has no backend)
static_data_block = """    <script>
        window.STATIC_DATA = {
            categories: [
                {"id":1,"name":"Овощи, фрукты","emoji":"🥦","count":234},
                {"id":2,"name":"Готовая еда","emoji":"🍱","count":89},
                {"id":3,"name":"Напитки","emoji":"🥤","count":456},
                {"id":4,"name":"Хлеб и выпечка","emoji":"🍞","count":123},
                {"id":5,"name":"Молочные продукты","emoji":"🥛","count":234},
                {"id":6,"name":"Сыры и яйца","emoji":"🧀","count":98},
                {"id":7,"name":"Мясная гастрономия","emoji":"🥩","count":167},
                {"id":8,"name":"Кондитерские изделия","emoji":"🎂","count":145},
            ],
            products: [
                {"id":1,"name":"Яблоки Гала, 1 кг","price":89,"old_price":109,"emoji":"🍎","discount":"-20%","category":"Фрукты"},
                {"id":2,"name":"Молоко Простоквашино 3,2%","price":79,"old_price":null,"emoji":"🥛","discount":null,"category":"Молочные"},
                {"id":3,"name":"Сыр Российский 50%, 200 г","price":149,"old_price":175,"emoji":"🧀","discount":"-15%","category":"Сыры"},
                {"id":4,"name":"Хлеб Дарницкий, 700 г","price":55,"old_price":null,"emoji":"🍞","discount":null,"category":"Хлеб"},
                {"id":5,"name":"Помидоры, 1 кг","price":99,"old_price":129,"emoji":"🍅","discount":"-23%","category":"Овощи"},
                {"id":6,"name":"Огурцы, 1 кг","price":69,"old_price":null,"emoji":"🥒","discount":null,"category":"Овощи"},
                {"id":7,"name":"Морковь, 1 кг","price":45,"old_price":65,"emoji":"🥕","discount":"-30%","category":"Овощи"},
                {"id":8,"name":"Банан, 1 кг","price":79,"old_price":null,"emoji":"🍌","discount":null,"category":"Фрукты"},
                {"id":9,"name":"Апельсины, 1 кг","price":84,"old_price":110,"emoji":"🍊","discount":"-23%","category":"Фрукты"},
                {"id":10,"name":"Йогурт Активиа 200г","price":55,"old_price":75,"emoji":"🥛","discount":"-26%","category":"Молочные"},
                {"id":11,"name":"Творог 9%, 200г","price":89,"old_price":null,"emoji":"🧈","discount":null,"category":"Молочные"},
                {"id":12,"name":"Булка с маком","price":38,"old_price":null,"emoji":"🥐","discount":null,"category":"Хлеб"},
                {"id":13,"name":"Колбаса вареная 300г","price":199,"old_price":249,"emoji":"🌭","discount":"-20%","category":"Мясо"},
                {"id":14,"name":"Куриное филе, 600г","price":269,"old_price":null,"emoji":"🍗","discount":null,"category":"Мясо"},
                {"id":15,"name":"Печенье 'Простое' 200г","price":45,"old_price":60,"emoji":"🍪","discount":"-25%","category":"Печенье"},
            ],
            promotions: [
                {"id":1,"title":"Акция на овощи","description":"Скидка до 30% на свежие овощи","emoji":"🥦","discount":"-30%"},
                {"id":2,"title":"Молочные продукты","description":"Выгодные комбо на 2+1","emoji":"🥛","discount":"Комбо"},
                {"id":3,"title":"Выпечка дня","description":"Скидка до 40% на хлеб и булки","emoji":"🍞","discount":"-40%"},
                {"id":4,"title":"Мясной день","description":"Лучшие цены на колбасы и мясо","emoji":"🥩","discount":"-25%"},
            ],
            profile: {"name":"Иванов Иван","email":"ivanov@dixy.ru","phone":"+7 (999) 123-45-67","status":"Клуб Друзей Дикси","loyalty_points":2340,"cashback_rate":"1,5%","avatar":"😊","member_since":"2022"}
        };
    </script>
"""
final_html = final_html.replace(
    '    <script src="static/js/app.js"></script>',
    static_data_block + '    <script src="static/js/app.js"></script>'
)

# Write output
output_path = os.path.join(BASE, 'docs', 'index.html')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

print(f"Built static site: {output_path}")
print(f"Size: {len(final_html)} chars")
