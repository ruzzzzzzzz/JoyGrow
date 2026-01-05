import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-pink-900 group-[.toaster]:border-pink-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-pink-700",
          actionButton: "group-[.toast]:bg-pink-400 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-pink-100 group-[.toast]:text-pink-900",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
