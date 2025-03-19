import React from 'react';
import styles from './Alert.module.css';

interface AlertProps {
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'default',
  children,
}) => <div className={`${styles.alert} ${styles[variant]}`}>{children}</div>;

export const AlertDescription: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className={styles.alertDescription}>{children}</div>;
