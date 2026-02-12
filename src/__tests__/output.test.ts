import { describe, it, expect, vi } from 'vitest';
import { formatOutput, printOutput, printError } from '../lib/output.js';

describe('formatOutput', () => {
  const testData = [
    { id: '1', name: 'Test List', member_count: 100 },
    { id: '2', name: 'Another List', member_count: 50 },
  ];

  it('formats as JSON by default', () => {
    const result = formatOutput(testData, 'json');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(testData);
  });

  it('formats a single object as JSON', () => {
    const result = formatOutput(testData[0], 'json');
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(testData[0]);
  });

  it('formats as table', () => {
    const result = formatOutput(testData, 'table');
    expect(result).toContain('Test List');
    expect(result).toContain('Another List');
  });

  it('formats as CSV', () => {
    const result = formatOutput(testData, 'csv');
    expect(result).toContain('id');
    expect(result).toContain('name');
    expect(result).toContain('Test List');
  });

  it('handles empty array for table', () => {
    const result = formatOutput([], 'table');
    expect(result).toBe('No data');
  });

  it('handles empty array for CSV', () => {
    const result = formatOutput([], 'csv');
    expect(result).toBe('');
  });
});

describe('printOutput', () => {
  it('writes to stdout', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    printOutput({ id: '1' }, 'json');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('printError', () => {
  it('outputs JSON error format', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    printError({ code: 'TEST_ERROR', message: 'test message' }, 'json');
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed.error.code).toBe('TEST_ERROR');
    spy.mockRestore();
  });

  it('outputs human-friendly error in table mode', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    printError({ code: 'TEST_ERROR', message: 'test message', retry_after: 30 }, 'table');
    expect(spy).toHaveBeenCalled();
    const output = spy.mock.calls[0][0];
    expect(output).toContain('TEST_ERROR');
    expect(output).toContain('test message');
    expect(output).toContain('30');
    spy.mockRestore();
  });
});
