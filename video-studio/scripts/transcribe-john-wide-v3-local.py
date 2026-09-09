"""Use segment timing for the mixed soundtrack; music-only tails can break word alignment."""
from pathlib import Path

source = Path(__file__).with_name('transcribe-john-wide-local.py')
code = source.read_text().replace('word_timestamps=True', 'word_timestamps=False')
exec(compile(code, str(source), 'exec'), {'__file__': str(source), '__name__': '__main__'})
