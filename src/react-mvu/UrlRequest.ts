import { Constructors, Tagged } from "../utilities/matcher";

export const UrlRequest = Constructors<UrlRequest>();
export type UrlRequest =
  | Tagged<"internal", { url: URL }>
  | Tagged<"external", { href: string }>;
