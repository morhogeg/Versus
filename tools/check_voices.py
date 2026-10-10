#!/usr/bin/env python3
"""
Checks the voice files: a Gemini model writes down what it hears in each assets/voice/<id>.mp3,
and that is compared with the sentence in VOICE_LINES in game.js.

    GEMINI_API_KEY=your-key python3 tools/check_voices.py

Prints a line per file and, at the end, the ids that don't match (also written to bad_voices.txt).
"""
import base64, difflib, json, os, re, sys, time, urllib.request, urllib.error
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_voices import OUT, read_lines

API = 'https://generativelanguage.googleapis.com/v1beta/'

def get(url, key):
    req = urllib.request.Request(url, headers={'x-goog-api-key': key})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def pick_model(key):
    if os.environ.get('GEMINI_CHECK_MODEL'): return os.environ['GEMINI_CHECK_MODEL']
    names = [m['name'].split('/')[-1] for m in get(API + 'models?pageSize=1000', key).get('models', [])
             if 'generateContent' in m.get('supportedGenerationMethods', [])]
    flash = [n for n in names if re.fullmatch(r'gemini-\d+(\.\d+)?-flash', n)]
    return max(flash, key=lambda n: float(n.split('-')[1])) if flash else 'gemini-2.5-flash'

def transcribe(path, model, key):
    body = {'contents': [{'role': 'user', 'parts': [
        {'inlineData': {'mimeType': 'audio/mp3', 'data': base64.b64encode(open(path, 'rb').read()).decode()}},
        {'text': 'Write down exactly what is said in this recording, in the language it is spoken, '
                 'Hebrew in Hebrew letters without vowel marks. Write every word you hear, including any '
                 'English. Reply with the words only.'}]}]}
    req = urllib.request.Request(f'{API}models/{model}:generateContent', data=json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json', 'x-goog-api-key': key}, method='POST')
    with urllib.request.urlopen(req, timeout=120) as r:
        return ''.join(p.get('text', '') for p in json.load(r)['candidates'][0]['content']['parts'])

def plain(t):
    t = re.sub(r'[֑-ׇ]', '', t)          # vowel marks
    t = re.sub(r'[^\w\s]', ' ', t)
    return ' '.join(t.split())

def main():
    key = os.environ.get('GEMINI_API_KEY')
    if not key: sys.exit('Set GEMINI_API_KEY first.')
    model = pick_model(key)
    print('checking with', model)
    bad = []
    for vid, text in read_lines().items():
        path = os.path.join(OUT, vid + '.mp3')
        if not os.path.exists(path):
            print('MISSING', vid); bad.append(vid); continue
        heard = None
        for attempt in range(3):
            try:
                heard = transcribe(path, model, key); break
            except Exception as e:
                print('  retry', vid, e); time.sleep(5 * (attempt + 1))
        if heard is None:
            print('ERROR  ', vid); bad.append(vid); continue
        score = difflib.SequenceMatcher(None, plain(text), plain(heard)).ratio()
        ok = score >= 0.8
        print('ok     ' if ok else 'BAD    ', vid, f'{score:.2f}', '|', plain(heard))
        if not ok: bad.append(vid)
    open('bad_voices.txt', 'w').write(' '.join(bad))
    if bad: sys.exit('Not matching: ' + ' '.join(bad))
    print('All', len(read_lines()), 'files match.')

if __name__ == '__main__':
    main()
