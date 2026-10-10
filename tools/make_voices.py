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
         'talking to a 4-year-old boy named Michael (he is a boy, so use masculine Hebrew forms). Speak clearly and a little slowly, with a smile. '
         'Say only the sentence, exactly as written:\n')
# Flash-Lite reads a style note in the message aloud, so for it the note goes in the system instruction instead.
LITE = 'lite' in MODEL
SYSTEM = ('You read Hebrew sentences aloud for a 4-year-old boy named Michael: a warm, happy, gentle voice, '
          'like a kind kindergarten teacher, clear and a little slow, with a smile. Say only the sentence you are given.')
use_system = True  # turned off if the model refuses a system instruction
PACE = float(os.environ.get('GEMINI_PACE', '7'))  # seconds between requests, to stay under the per-minute limit

class QuotaError(Exception):
    def __init__(self, body):
        super().__init__(body[:600])
        self.daily = 'PerDay' in body or 'per_day' in body.lower()
        m = re.search(r'"retryDelay":\s*"(\d+)', body)
        self.wait = int(m.group(1)) + 2 if m else 30

def read_lines():
    src = open(os.path.join(ROOT, 'game.js'), encoding='utf-8').read()
    block = src[src.index('const VOICE_LINES = {'):]
    block = block[:block.index('\n};')]
    return dict(re.findall(r"^\s+(\w+): '([^']*)',", block, re.M))

def call(url, headers, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)

def synthesize(text, key, attempt=0):
    global use_system
    # Very short lines (one word) sometimes come back without audio, so later tries ask a little differently.
    prompt = STYLE + text if attempt < 2 else STYLE + 'Say it once, cheerfully: ' + text
    if LITE: prompt = text
    body = {
        'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
        'generationConfig': {
            'responseModalities': ['AUDIO'],
            'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': VOICE}}},
        },
    }
    if LITE and use_system:
        body['systemInstruction'] = {'parts': [{'text': SYSTEM}]}
    endpoints = [
        (f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent', {'x-goog-api-key': key}),
        (f'https://aiplatform.googleapis.com/v1/publishers/google/models/{MODEL}:generateContent?key={key}', {}),
    ]
    errors = []
    for url, extra in endpoints:
        try:
            data = call(url, {'Content-Type': 'application/json', **extra}, body)
            cand = data['candidates'][0]
            if 'content' not in cand:
                raise RuntimeError('no audio, finishReason=' + str(cand.get('finishReason')))
            part = cand['content']['parts'][0]['inlineData']
            return base64.b64decode(part['data']), part.get('mimeType', '')
        except urllib.error.HTTPError as e:
            if e.code == 429:
                raise QuotaError(e.read().decode(errors='replace'))
            if e.code == 400 and 'systemInstruction' in body:
                use_system = False  # try again without it
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
    failed = []
    for vid, text in lines.items():
        path = os.path.join(OUT, vid + '.mp3')
        if wanted and vid not in wanted: continue
        if not wanted and '--all' not in sys.argv and os.path.exists(path): continue
        for attempt in range(6):
            try:
                pcm, mime = synthesize(text, key, attempt)
                rate = int(re.search(r'rate=(\d+)', mime).group(1)) if 'rate=' in mime else 24000
                secs = len(pcm) / 2 / rate
                if secs > 2.5 + 0.15 * len(text):  # far longer than the sentence: it read something else aloud too
                    global use_system
                    use_system = False  # in case the style note was read aloud
                    raise RuntimeError(f'audio is {secs:.1f}s, too long for {len(text)} letters')
                if secs < 0.4:
                    raise RuntimeError(f'audio is only {secs:.1f}s')
                to_mp3(pcm, mime, path)
                print('ok  ', vid)
                time.sleep(PACE)
                break
            except QuotaError as e:
                if e.daily:
                    sys.exit('Stopped: the Gemini daily quota for ' + MODEL + ' is used up. Run again tomorrow.\n' + str(e))
                print('wait', vid, f'(quota per minute, waiting {e.wait}s)')
                time.sleep(e.wait)
            except Exception as e:
                print('fail', vid, f'(try {attempt + 1})\n ', e)
                time.sleep(5 * (attempt + 1))
        else:
            failed.append(vid)
    if failed:
        sys.exit('Could not make: ' + ' '.join(failed))

if __name__ == '__main__':
    main()
