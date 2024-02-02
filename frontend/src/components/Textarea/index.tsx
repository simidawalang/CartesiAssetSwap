import React, { ChangeEventHandler } from "react";
import styles from "./textarea.module.css";

interface ITextareaProps {
  name?: string;
  className?: string;
  label?: string;
  rows?: number;
  value: string | number;
  onChange: ChangeEventHandler;
  placeholder?: string;
}

const CustomTextarea = ({
  name,
  className,
  label,
  value,
  onChange,
  placeholder,
  rows
}: ITextareaProps) => {
  return (
    <div className={`${styles.textarea} ${className}`}>
      {label && <label>{label}</label>}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
};

export default CustomTextarea;
