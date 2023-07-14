export type Pipe<T> = {
  _: <const Out>(f: (a: T) => Out) => Pipe<Out>;
  done(): T;
};

export const pipe = <const T>(val: T): Pipe<T> => ({
  done: () => val,
  _: <const Out>(f: (a: T) => Out) => pipe(f(val)),
});
