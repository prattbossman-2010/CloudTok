import glob, os

for f in glob.glob('frontend/*.html'):
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    if 'favicon' not in content:
        content = content.replace('</head>', '<link rel="icon" type="image/x-icon" href="favicon.ico">\n</head>', 1)
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(content)
        print('Added favicon to: ' + os.path.basename(f))
