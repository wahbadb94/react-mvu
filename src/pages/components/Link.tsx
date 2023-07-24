<a href="/pokemon" className="underline text-blue-900">
  Pokemon Page
</a>;

type LinkProps = React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>;

export default function Link({
  className,
  children,
  ...anchorProps
}: LinkProps) {
  return (
    <a
      {...anchorProps}
      className={"text-blue-900 hover:underline " + (className ?? "")}
    >
      {children}
    </a>
  );
}
