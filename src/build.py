import re, sys
src = open('index.html', encoding='utf-8').read()
head = '<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>\n'
import time
ts=str(int(time.time()))
dev=src.replace('<!--INLINE-CSS-->', '')
for f in ['style.css','data.js','engine.js','book.js','kitchen.js','mascot.js','process.js','app.js']: dev=dev.replace('"'+f+'"','"'+f+'?v='+ts+'"')
open('dev.html', 'w', encoding='utf-8').write(head + dev)
out = src.replace('<link rel="stylesheet" href="style.css">\n', '').replace('<!--INLINE-CSS-->', '<style>\n' + open('style.css', encoding='utf-8').read() + '\n</style>')
core = '\n'.join(open(f, encoding='utf-8').read() for f in ['data.js', 'engine.js', 'book.js'])
rest = '\n'.join(open(f, encoding='utf-8').read() for f in ['kitchen.js', 'mascot.js', 'process.js', 'app.js'])
out = re.sub(r'<script src="data.js"></script>\s*<script src="engine.js"></script>\s*<script src="book.js"></script>\s*<script src="kitchen.js"></script>\s*<script src="mascot.js"></script>\s*<script src="process.js"></script>\s*<script src="app.js"></script>', lambda m: '<script id="core">\n' + core.replace('</script', '<\\/script') + '\n</script>\n<script>\n' + rest.replace('</script', '<\\/script') + '\n</script>', out)
open('linas-recept.html', 'w', encoding='utf-8').write(out)
print(len(out))
