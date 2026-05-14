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

# Write output
output_path = os.path.join(BASE, 'docs', 'index.html')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

print(f"Built static site: {output_path}")
print(f"Size: {len(final_html)} chars")
