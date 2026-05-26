const SBV_TIMESTAMP_RE =
  /^(\d{1,2}):([0-5]?\d):([0-5]?\d)\.(\d{3}),(\d{1,2}):([0-5]?\d):([0-5]?\d)\.(\d{3})$/;

const pad2 = (n) => String(n).padStart(2, '0');

function formatSrtTimestamp(h, m, s, ms) {
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${ms}`;
}

function parseSbvTimestampLine(line) {
  const match = line.match(SBV_TIMESTAMP_RE);
  if (!match) return null;
  const [, h1, m1, s1, ms1, h2, m2, s2, ms2] = match;
  return {
    start: formatSrtTimestamp(Number(h1), Number(m1), Number(s1), ms1),
    end: formatSrtTimestamp(Number(h2), Number(m2), Number(s2), ms2),
  };
}

export function sbvToSrt(sbvText) {
  if (typeof sbvText !== 'string') {
    throw new TypeError('sbvToSrt expects a string');
  }

  const normalized = sbvText.replace(/\r\n?/g, '\n').trim();
  if (normalized === '') return '';

  const blocks = normalized
    .split(/\n{2,}/)
    .map((b) => b.split('\n').filter((line, idx, arr) => !(line.trim() === '' && idx === arr.length - 1)))
    .filter((lines) => lines.length > 0 && lines.some((l) => l.trim() !== ''));

  const srtCues = blocks.map((lines, i) => {
    const cueNumber = i + 1;
    const timestampLine = lines[0].trim();
    const parsed = parseSbvTimestampLine(timestampLine);
    if (!parsed) {
      throw new Error(
        `Invalid SBV timestamp at cue ${cueNumber}: ${JSON.stringify(timestampLine)}`,
      );
    }
    const body = lines.slice(1).join('\n').replace(/\n+$/, '');
    return `${cueNumber}\n${parsed.start} --> ${parsed.end}\n${body}\n`;
  });

  return srtCues.join('\n');
}
