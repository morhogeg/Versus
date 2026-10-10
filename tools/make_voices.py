#!/usr/bin/env python3
"""
Makes the Hebrew voice files (assets/voice/<id>.mp3) with a Gemini text-to-speech model.

    GEMINI_API_KEY=your-key python3 tools/make_voices.py            # make missing files
    GEMINI_API_KEY=your-key python3 tools/make_voices.py --all      # remake every file
    GEMINI_API_KEY=your-key python3 tools/make_voices.py menu_hello # remake just these

The sentences come from VOICE_LINES in game.js, so change the wording there and run this again.
The key is only read from the environment; it is never written into the game.
Needs: Python 3 and ffmpeg.
"""
import base64, json, os, re, subprocess, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'voice')
MODEL = os.environ.get('GEMINI_TTS_MODEL', 'gemini-2.5-flash-preview-tts')
VOICE = os.environ.get('GEMINI_TTS_VOICE', 'Leda')  # a warm, youthful voice
STYLE = ('Read this aloud in Hebrew, in a warm, happy, gentle voice, like a kind kindergarten teacher '
         'talking to a 4-year-old boy named Michael. Speak clearly and a little slowly, with a smile. '
         'Say only the sentence, exactly as written:\n')

def read_lines():
    src = open(os.path.join(ROOT, 'game.js'), encoding='utf-8').read()
    block = src[src.index('const VOICE_LINES = {'):]
    block = block[:block.index('\n};')]
    return dict(re.findall(r"^\s+(\w+): '([^']*)',", block, re.M))

def call(url, headers, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)

def synthesize(text, key):
    body = {
        'contents': [{'role': 'user', 'parts': [{'text': STYLE + text}]}],
        'generationConfig': {
            'responseModalities': ['AUDIO'],
            'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': VOICE}}},
        },
    }
    endpoints = [
        (f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent', {'x-goog-api-key': key}),
        (f'https://aiplatform.googleapis.com/v1/publishers/google/models/{MODEL}:generateContent?key={key}', {}),
    ]
    errors = []
    for url, extra in endpoints:
        try:
            data = call(url, {'Content-Type': 'application/json', **extra}, body)
            part = data['candidates'][0]['content']['parts'][0]['inlineData']
            return base64.b64decode(part['data']), part.get('mimeType', '')
        except urllib.error.HTTPError as e:
            errors.append(f'{url.split("/")[2]}: HTTP {e.code} {e.read()[:300].decode(errors="replace")}')
        except Exception as e:  # network blocked, unexpected answer...
            errors.append(f'{url.split("/")[2]}: {e}')
    raise RuntimeError('\n  '.join(errors))

def to_mp3(pcm, mime, path):
    rate = int(re.search(r'rate=(\d+)', mime).group(1)) if 'rate=' in mime else 24000
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(rate), '-ac', '1', '-i', '-',
                    '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse',
                    '-codec:a', 'libmp3lame', '-q:a', '4', path], input=pcm, check=True)

def main():
    key = os.environ.get('GEMINI_API_KEY')
    if not key: sys.exit('Set GEMINI_API_KEY first.')
    lines = read_lines()
    wanted = [a for a in sys.argv[1:] if not a.startswith('--')]
    os.makedirs(OUT, exist_ok=True)
    for vid, text in lines.items():
        path = os.path.join(OUT, vid + '.mp3')
        if wanted and vid not in wanted: continue
        if not wanted and '--all' not in sys.argv and os.path.exists(path): continue
        for attempt in range(4):
            try:
                pcm, mime = synthesize(text, key)
                to_mp3(pcm, mime, path)
                print('ok  ', vid)
                break
            except Exception as e:
                print('fail', vid, f'(try {attempt + 1})\n ', e)
                time.sleep(5 * (attempt + 1))
        else:
            sys.exit('Stopped: could not make ' + vid)

if __name__ == '__main__':
    main()
