import type React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = (props: ButtonProps) => {
  const { type = "button", children = "Button", ...rest } = props;

  return (
    <button type={type} {...rest}>
      {children}
    </button>
  );
};