import { EmptyObject, Expand } from "../react-mvu/types";

export type UnionVariant = {
  tag: string;
};

type Tags<U extends UnionVariant> = U["tag"];

export type TagVariantMap<U extends UnionVariant> = {
  [T in Tags<U>]: U extends { tag: T } ? U : never;
};

type Handlers<U extends UnionVariant, TReturn> = {
  [T in keyof TagVariantMap<U>]:
    | TReturn
    | ((variant: TagVariantMap<U>[T]) => TReturn);
};

type HandlersPartial<U extends UnionVariant, TReturn> = {
  [T in keyof TagVariantMap<U>]?:
    | TReturn
    | ((variant: TagVariantMap<U>[T]) => TReturn);
} & {
  _: TReturn;
};

type LiteralHandlers<U extends string, TReturn> = {
  [T in U]: TReturn | ((variant: T) => TReturn);
};

const match = {
  tagged: <U extends UnionVariant>(variant: U) => ({
    on: <TReturn>(handlers: Handlers<U, TReturn>): TReturn => {
      const tag: Tags<U> = variant.tag;
      const handler = handlers[tag];
      return typeof handler === "function" ? handler(variant) : handler;
    },
    onPartial: <TReturn>(handlers: HandlersPartial<U, TReturn>): TReturn => {
      const tag: Tags<U> = variant.tag;
      const fallback = handlers._;
      const handler = handlers[tag];

      if (!handler) return fallback;

      return typeof handler === "function" ? handler(variant) : handler;
    },
  }),
  literal: <U extends string>(variant: U) => ({
    on: <TReturn>(handlers: LiteralHandlers<U, TReturn>): TReturn => {
      const handler = handlers[variant];
      return typeof handler === "function" ? handler(variant) : handler;
    },
  }),
};

export default match;

export type Tagged<
  T extends string,
  P extends Record<string, unknown> | null = null
> = null extends P ? { tag: T } : { tag: T } & P;

export const tagged =
  <T extends string>(tag: T) =>
  <P extends Record<string, unknown>>(data: P): Tagged<T, P> => ({
    tag,
    ...data,
  });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function unreachable(_: never): never {
  throw "this code should be unreachable.";
}

export type VariantFromTag<
  TUnion extends Tagged<string, Record<string, unknown>>,
  Tag extends TUnion["tag"]
> = {
  [T in TUnion["tag"]]: TUnion extends TUnion[Tag] ? TUnion : never;
}[TUnion["tag"]];

export const Constructors =
  <TUnion extends Tagged<string, Record<string, unknown>>>() =>
  <Tag extends TUnion["tag"]>(tag: Tag): Constructor<TUnion, Tag> => {
    const constructor = (data = {}) => ({
      tag,
      ...data,
    });

    return constructor as unknown as Constructor<TUnion, Tag>;
  };

type Constructor<
  TUnion extends Tagged<string, Record<string, unknown>>,
  Tag extends TUnion["tag"]
> = EmptyObject<ConstructorData<TUnion, Tag>> extends "true"
  ? () => TUnion
  : (data: Expand<ConstructorData<TUnion, Tag>>) => TUnion;

type ConstructorData<
  TUnion extends Tagged<string, Record<string, unknown>>,
  Tag extends TUnion["tag"]
> = Omit<TagVariantMap<TUnion>[Tag], "tag">;
