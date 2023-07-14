import clsx from 'clsx';
import styles from './styles/plugins.module.css';
import AIFPlugin from 'src/types/plugin.interface';

type PluginListItemProps = {
  plugin: AIFPlugin;
  selected?: boolean;
  onClick?: (id: string) => void;
};

function PluginListItem(props: PluginListItemProps) {
  const { plugin, selected = false, onClick } = props;
  const tagsDisplay = plugin.tags ? plugin.tags.join(',') : undefined;
  const dateTimeDisplay = new Date(plugin.installedAt).toLocaleString('en-GB');
  const noOfWidgets = plugin.reportWidgets && plugin.reportWidgets.length;
  const noOfAlgos = plugin.algorithms && plugin.algorithms.length;
  const noOfIBlocks = plugin.inputBlocks && plugin.inputBlocks.length;
  const noOfTemplates = plugin.templates && plugin.templates.length;

  function handleCardClick() {
    if (onClick && typeof onClick === 'function') {
      onClick(plugin.gid);
    }
  }

  return (
    <div
      className={clsx(
        'pluginList-card',
        styles.listItem,
        selected ? styles.listItem__selected : null
      )}
      onClick={handleCardClick}>
      <h3 className={styles.value_name}>{plugin.name}</h3>
      <div className={styles.content}>
        <div style={{ minWidth: '240px' }}>
          <div className={styles.row}>
            <div className={styles.valueDisplay}>
              <div className={styles.label}>Version:</div>
              <div className={styles.value}>{plugin.version}</div>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.valueDisplay}>
              <div className={styles.label}>Installed on:</div>
              <div className={clsx(styles.value, 'listItem_installedDate')}>
                {dateTimeDisplay}
              </div>
            </div>
          </div>
          <div className={styles.row}>
            <div className={styles.valueDisplay}>
              <div className={styles.label}>Author:</div>
              <div className={styles.value}>{plugin.author}</div>
            </div>
          </div>
          {tagsDisplay ? (
            <div className={styles.valueDisplay}>
              <div className={styles.label}>Tags:</div>
              <div className={styles.value}>{tagsDisplay}</div>
            </div>
          ) : null}
        </div>
        <div>
          <div className={styles.componentCounts}>
            {noOfWidgets ? (
              <div>
                widgets: <span className={styles.count}>{noOfWidgets}</span>
              </div>
            ) : null}
            {noOfAlgos ? (
              <div>
                algorithms: <span className={styles.count}>{noOfAlgos}</span>
              </div>
            ) : null}
            {noOfIBlocks ? (
              <div>
                input blocks:{' '}
                <span className={styles.count}>{noOfIBlocks}</span>
              </div>
            ) : null}
            {noOfTemplates ? (
              <div>
                templates: <span className={styles.count}>{noOfTemplates}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
export { PluginListItem };
