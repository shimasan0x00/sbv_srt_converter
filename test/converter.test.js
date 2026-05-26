import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { sbvToSrt } from '../src/converter.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name) => readFileSync(join(here, 'fixtures', name), 'utf8');

describe('sbvToSrt', () => {
  it('単一キュー (1行本文) を SRT 形式に変換する', () => {
    const sbv = '0:00:01.000,0:00:03.500\nこんにちは\n';
    const expected = '1\n00:00:01,000 --> 00:00:03,500\nこんにちは\n';
    expect(sbvToSrt(sbv)).toBe(expected);
  });

  it('複数キューに 1 始まりの連番を振る', () => {
    const sbv = '0:00:01.000,0:00:02.000\nA\n\n0:00:03.000,0:00:04.000\nB\n';
    const out = sbvToSrt(sbv);
    expect(out).toContain('1\n00:00:01,000 --> 00:00:02,000\nA');
    expect(out).toContain('2\n00:00:03,000 --> 00:00:04,000\nB');
  });

  it('複数行本文の改行を保つ', () => {
    const sbv = '0:00:01.000,0:00:02.000\n1行目\n2行目\n';
    const out = sbvToSrt(sbv);
    expect(out).toContain('1行目\n2行目');
  });

  it('時のゼロパディングと ms 区切り (. → ,) を行う', () => {
    const sbv = '0:00:01.000,0:00:02.000\nx\n';
    const out = sbvToSrt(sbv);
    expect(out).toContain('00:00:01,000 --> 00:00:02,000');
    expect(out).not.toContain('0:00:01.000');
  });

  it('CRLF 入力でも正しくパースする', () => {
    const sbv = '0:00:01.000,0:00:02.000\r\nA\r\n\r\n0:00:03.000,0:00:04.000\r\nB\r\n';
    const out = sbvToSrt(sbv);
    expect(out).toContain('1\n00:00:01,000 --> 00:00:02,000\nA');
    expect(out).toContain('2\n00:00:03,000 --> 00:00:04,000\nB');
    expect(out).not.toContain('\r');
  });

  it('末尾改行の有無で出力が変わらない', () => {
    const a = '0:00:01.000,0:00:02.000\nA';
    const b = '0:00:01.000,0:00:02.000\nA\n';
    expect(sbvToSrt(a)).toBe(sbvToSrt(b));
  });

  it('キュー間の複数空行も 1 区切りとして扱う', () => {
    const sbv = '0:00:01.000,0:00:02.000\nA\n\n\n\n0:00:03.000,0:00:04.000\nB\n';
    const out = sbvToSrt(sbv);
    expect(out).toContain('1\n00:00:01,000 --> 00:00:02,000\nA');
    expect(out).toContain('2\n00:00:03,000 --> 00:00:04,000\nB');
  });

  it('空入力は空文字列を返す', () => {
    expect(sbvToSrt('')).toBe('');
    expect(sbvToSrt('   \n\n  \n')).toBe('');
  });

  it('不正タイムスタンプはキュー番号を含む Error をスローする', () => {
    const bad = '0:00:01.000,0:00:02.000\nA\n\nNOT_A_TIMESTAMP\nB\n';
    expect(() => sbvToSrt(bad)).toThrow(/cue 2/);
  });

  it('fixtures/basic.sbv が basic.srt と一致する', () => {
    expect(sbvToSrt(fixture('basic.sbv'))).toBe(fixture('basic.srt'));
  });

  it('fixtures/multiline.sbv が multiline.srt と一致する', () => {
    expect(sbvToSrt(fixture('multiline.sbv'))).toBe(fixture('multiline.srt'));
  });
});
