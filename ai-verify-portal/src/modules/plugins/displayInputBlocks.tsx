import clsx from 'clsx';
import styles from './styles/plugins.module.css';
import AIFPlugin from 'src/types/plugin.interface';

type Props = {
  plugin: AIFPlugin;
};

export default function DisplayInputBlocks({ plugin }: Props) {
  const dateTimeDisplay = new Date(plugin.installedAt).toLocaleString('en-GB');

  return (
    <div className={styles.componentDetails}>
      <div>
        {plugin.inputBlocks
          ? plugin.inputBlocks.map((ib) => (
              <div
                className={clsx('pluginDetails-card', styles.componentCard)}
                key={`algo-${ib.gid}`}>
                <h2 className={styles.detailsHeading}>
                  {ib.name} {ib.version}
                </h2>
                <p className={styles.componentDesc}>{ib.description}</p>
                <div className={styles.valueDisplay}>
                  <div className={styles.label}>GID:</div>
                  <div className={styles.value} style={{ color: '#991E66' }}>
                    {ib.gid}
                  </div>
                </div>
                <div className={styles.valueDisplay}>
                  <div className={styles.label}>CID:</div>
                  <div className={styles.value}>{ib.cid}</div>
                </div>
                <div className={styles.valueDisplay}>
                  <div className={styles.label}>Version:</div>
                  <div className={styles.value}>{ib.version}</div>
                </div>
                <div className={styles.valueDisplay}>
                  <div className={styles.label}>Installed on:</div>
                  <div className={styles.value}>{dateTimeDisplay}</div>
                </div>
                <div className={styles.valueDisplay}>
                  <div className={styles.label}>Author:</div>
                  <div className={styles.value}>{plugin.author}</div>
                </div>
                {plugin.url ? (
                  <div className={styles.valueDisplay}>
                    <div className={styles.label}>Url:</div>
                    <div className={styles.value}>
                      <a href={plugin.url} target="_blank">
                        {plugin.url}
                      </a>
                    </div>
                  </div>
                ) : null}
                {ib.tags ? (
                  <div className={styles.valueDisplay}>
                    <div className={styles.label}>Tags:</div>
                    <div className={styles.value}>{ib.tags.join(', ')}</div>
                  </div>
                ) : null}
              </div>
            ))
          : null}
      </div>
    </div>
  );
}
