export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function checkDigit(digits: number[], length: number): number {
  const sum = digits
    .slice(0, length)
    .reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const digits = [...cpf].map(Number);
  return digits[9] === checkDigit(digits, 9) && digits[10] === checkDigit(digits, 10);
}
