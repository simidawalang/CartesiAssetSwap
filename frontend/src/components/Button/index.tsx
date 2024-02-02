import React, { MouseEventHandler, ReactNode } from "react";
import styles from "./button.module.css";

interface IButtonProps {
  className?: string;
  onClick: MouseEventHandler;
  children?: ReactNode;
  disabled?: boolean;
}

const Button = ({ className, onClick, children, disabled }: IButtonProps) => {
  return (
    <button
      className={`${styles.button} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
