import React, { ReactNode } from "react";
import styles from "./card.module.css";

interface ICardProps {
  className?: string;
  children: ReactNode;
  title?: string;
}
const Card = ({ className, title, children }: ICardProps) => {
  return (
    <div className={`${styles.card} ${className ? className : ""}`}>
      {title && <h3 className={styles["card-title"]}>{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
