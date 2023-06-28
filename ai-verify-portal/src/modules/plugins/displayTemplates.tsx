import AIFPlugin from 'src/types/plugin.interface';
import styles from './styles/plugins.module.css';
import clsx from 'clsx';

type Props = {
  plugin: AIFPlugin;
};

export default function DisplayTemplates({ plugin }: Props) {
  if (!plugin.templates) {
    return <div></div>;
  }
  return (
    <div className={styles.componentDetails}>
      <div>
        {plugin.templates.map((template) => (
          <div
            key={`tpl-${template.gid}`}
            className={clsx('pluginDetails-card', styles.componentCard)}>
            <h2 className={styles.detailsHeading}>
              {template.name} {template.version}
            </h2>
            <p>{template.description}</p>
            <div className={styles.valueDisplay}>
              <div className={styles.label}>CID:</div>
              <div className={styles.value}>{template.cid}</div>
            </div>
            <div className={styles.valueDisplay}>
              <div className={styles.label}>GID:</div>
              <div className={styles.value}>{template.gid}</div>
            </div>
            <div className={styles.valueDisplay}>
              <div className={styles.label}>Version:</div>
              <div className={styles.value}>{template.version}</div>
            </div>
            {template.tags ? (
              <div className={styles.valueDisplay}>
                <div className={styles.label}>Tags:</div>
                <div className={styles.value}>{template.tags.join(', ')}</div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
