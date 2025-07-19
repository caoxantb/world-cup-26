export const range = (start: number, end: number, step: number = 1) => {
  return Array.from(
    Array(Math.ceil((end - start) / step) + 1).keys(),
    (_, i) => Math.round((i * step + start) * 100) / 100
  );
};
