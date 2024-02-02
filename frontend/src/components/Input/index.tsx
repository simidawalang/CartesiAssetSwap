import React, { ChangeEventHandler } from "react";
import styles from "./input.module.css";

interface IInputProps {
  name?: string;
  className?: string;
  label?: string;
  type?: "text" | "number" | "checkbox" | "date";
  value: string | number;
  onChange: ChangeEventHandler;
  placeholder?: string;
}

const CustomInput = ({
  name,
  className,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: IInputProps) => {
  return (
    <div className={`${styles.input} ${className}`}>
      {label && <label>{label}</label>}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
};

export default CustomInput;
