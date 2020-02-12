export const arrDiff = <T>(
  minuend: T[],
  subtrahend: T[],
  compare?: (valM: T, valS: T) => boolean
): T[] =>
  subtrahend.reduce(
    (acc, valS) =>
      acc.filter(valM => (compare ? !compare(valM, valS) : valM !== valS)),
    minuend
  );

export const delay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));
