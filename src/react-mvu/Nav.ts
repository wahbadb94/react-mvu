import { Cmd, NavType } from "./Cmd";

export const Nav = {
  load: (href: string) => Cmd.nav(NavType("load")({ href })),
  push: (url: URL) => Cmd.nav(NavType("push")({ url })),
};
