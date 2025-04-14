import React from 'react';
import styles from './Skeletion.module.css';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={`${styles.skeleton} ${className}`} />
);
