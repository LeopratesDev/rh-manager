import { describe, expect, it } from 'vitest';
import { isValidCpf, onlyDigits } from './cpf';

describe('isValidCpf', () => {
  it.each(['52601815906', '526.018.159-06', '03137215994'])('accepts %s', (cpf) => {
    expect(isValidCpf(cpf)).toBe(true);
  });

  it.each(['52601815907', '52601815916', '11111111111', '5260181590', ''])(
    'rejects "%s"',
    (cpf) => {
      expect(isValidCpf(cpf)).toBe(false);
    },
  );
});

describe('onlyDigits', () => {
  it('removes punctuation from a formatted CPF', () => {
    expect(onlyDigits('526.018.159-06')).toBe('52601815906');
  });
});
