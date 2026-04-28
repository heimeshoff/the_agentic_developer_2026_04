const _eurFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

export function formatEur(amount: number): string {
  return _eurFormatter.format(amount);
}

// Self-test — runs at module load time; throws loudly if the formatter breaks.
(function selfTest() {
  function assert(actual: string, expected: string): void {
    if (actual !== expected) {
      throw new Error(
        `formatEur assertion failed: expected "${expected}", got "${actual}"`,
      );
    }
  }

  assert(formatEur(0), '0,00 \u20AC');
  assert(formatEur(1234.56), '1.234,56 \u20AC');
  assert(formatEur(-99.9), '-99,90 \u20AC');
})();
