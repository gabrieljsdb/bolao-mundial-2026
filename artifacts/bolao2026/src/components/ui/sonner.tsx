import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={{ "--normal-bg": "#0f2a0f", "--normal-border": "#1a4a1a", "--normal-text": "#86efac" } as React.CSSProperties}
      {...props}
    />
  );
};

export { Toaster };
