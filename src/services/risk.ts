// src/services/risk.ts (CommonJS + explicit types, fixed undefined errors)

export interface RiskOutput {
  sigma: number;
  VaR: number;
}

// --------------------
// pctReturns
// --------------------
function pctReturns(series: number[]): number[] {
  const out: number[] = [];
  if (series.length < 2) return out;

  for (let i: number = 1; i < series.length; i++) {
    const prev: number | undefined = series[i - 1];
    const curr: number | undefined = series[i];

    if (prev !== undefined && curr !== undefined && prev !== 0) {
      const r: number = (curr - prev) / prev;
      if (Number.isFinite(r)) out.push(r);
    }
  }
  return out;
}

// --------------------
// stdev
// --------------------
function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const mean: number = xs.reduce((a: number, b: number) => a + b, 0) / xs.length;
  const var_: number =
    xs.reduce((a: number, b: number) => a + (b - mean) ** 2, 0) /
    (xs.length - 1);
  return Math.sqrt(var_);
}

// --------------------
// parametricVaR
// --------------------
function parametricVaR(returns: number[], confidence: number = 0.95): number {
  if (returns.length === 0) return 0;
  const sigma: number = stdev(returns);
  const z: number = confidence === 0.99 ? 2.33 : 1.645;
  return z * sigma;
}

// --------------------
// portfolioVaR
// --------------------
function portfolioVaR(
  weights: number[],
  series: number[][],
  confidence: number = 0.95
): RiskOutput {
  if (weights.length === 0 || series.length === 0) {
    return { sigma: 0, VaR: 0 };
  }

  const retSeries: number[][] = series.map(pctReturns);
  const lengths: number[] = retSeries.map((r: number[]) => r.length);

  if (lengths.length === 0) {
    return { sigma: 0, VaR: 0 };
  }

  const len: number = Math.min(...lengths);
  if (!Number.isFinite(len) || len <= 0) {
    return { sigma: 0, VaR: 0 };
  }

  const port: number[] = [];
  for (let i: number = 0; i < len; i++) {
    let r: number = 0;
    for (let k: number = 0; k < weights.length; k++) {
      const seriesReturns: number[] | undefined = retSeries[k];
      if (seriesReturns && seriesReturns[i] !== undefined) {
        r += weights[k]! * seriesReturns[i]!;
      }
    }
    port.push(r);
  }

  const sigma: number = stdev(port);
  const VaR: number = parametricVaR(port, confidence);
  return { sigma, VaR };
}

// --------------------
// Exports
// --------------------
module.exports = {
  pctReturns,
  stdev,
  parametricVaR,
  portfolioVaR
};
