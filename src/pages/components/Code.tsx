import { FC, PropsWithChildren } from "react";

const Code: FC<PropsWithChildren> = ({ children }) => {
  return (
    <code
      className={
        "text-emerald-800 bg-slate-100 rounded-md border border-gray-300 px-1 py-0.5"
      }
    >
      {children}
    </code>
  );
};

export default Code;
