import {
  MouseEvent,
  MouseEventHandler,
  PropsWithChildren,
  useState,
} from 'react';
import AIFPlugin, { Algorithm } from 'src/types/plugin.interface';
import CodeBlockDialog from './codeBlockDialog';
import styles from './styles/plugins.module.css';
import clsx from 'clsx';

type DisplayAlgoritmsProps = {
  plugin: AIFPlugin;
};

export default function DisplayAlgorithms(
  props: PropsWithChildren<DisplayAlgoritmsProps>
) {
  const { plugin, children } = props;
  const [selectedInputSchema, setSelectedInputSchema] = useState<Algorithm>();
  const [selectedOuputSchema, setSelectedOutputSchema] = useState<Algorithm>();
  const [selectedRequirements, setSelectedRequirements] = useState<Algorithm>();
  const dateTimeDisplay = new Date(plugin.installedAt).toLocaleString('en-GB');

  function handleClickInputSchema(
    algo: Algorithm
  ): MouseEventHandler<HTMLButtonElement> {
    return (_e: MouseEvent) => setSelectedInputSchema(algo);
  }

  const handleCloseInputSchema = () => {
    setSelectedInputSchema(undefined);
  };

  function handleClickOutputSchema(
    algo: Algorithm
  ): MouseEventHandler<HTMLButtonElement> {
    return (_e: MouseEvent) => setSelectedOutputSchema(algo);
  }

  const handleCloseOutputSchema = () => {
    setSelectedOutputSchema(undefined);
  };

  const handleCloseRequirements = () => {
    setSelectedRequirements(undefined);
  };

  return (
    <div className={styles.componentDetails}>
      <div>
        {plugin.algorithms
          ? plugin.algorithms.map((algo) => (
              <div
                className={clsx('pluginDetails-card', styles.componentCard)}
                key={`algo-${algo.gid}`}>
                <h2 className={styles.detailsHeading}>{algo.name}</h2>
                <p className={styles.componentDesc}>{algo.description}</p>
                <div className={styles.valueDisplay}>
                  <div className={styles.label}>GID:</div>
                  <div className={styles.value} style={{ color: '#991E66' }}>
                    {algo.gid}
                  </div>
                </div>
                <div className={styles.valueDisplay}>
                  <div className={styles.label}>CID:</div>
                  <div className={styles.value}>{algo.cid}</div>
                </div>
                <div className={styles.valueDisplay}>
                  <div className={styles.label}>Version:</div>
                  <div className={styles.value}>{algo.version}</div>
                </div>
                <div className={styles.valueDisplay}>
                  <div className={styles.label}>Model Type:</div>
                  <div className={styles.value}>{algo.modelType}</div>
                </div>
                <div className={styles.valueDisplay}>
                  <div className={styles.label}>Installed on:</div>
                  <div className={styles.value}>{dateTimeDisplay}</div>
                </div>
                <div className={styles.valueDisplay}>
                  <div className={styles.label}>Author:</div>
                  <div className={styles.value}>{algo.author}</div>
                </div>
                <div className={styles.valueDisplay}>
                  <div className={styles.label}>Url:</div>
                  <div className={styles.value}>
                    <a href={plugin.url} target="_blank">
                      {plugin.url}
                    </a>
                  </div>
                </div>
                {algo.tags ? (
                  <div className={styles.valueDisplay}>
                    <div className={styles.label}>Tags:</div>
                    <div className={styles.value}>{algo.tags.join(', ')}</div>
                  </div>
                ) : null}
                <div style={{ margin: '15px' }}>{children}</div>
                <div className={styles.footerBtnGroup}>
                  <button
                    className="aivBase-button aivBase-button--outlined aivBase-button--small"
                    onClick={handleClickInputSchema(algo)}>
                    Input Schema
                  </button>
                  <button
                    className="aivBase-button aivBase-button--outlined aivBase-button--small"
                    onClick={handleClickOutputSchema(algo)}>
                    Output Schema
                  </button>
                </div>
              </div>
            ))
          : null}
      </div>
      {selectedInputSchema && (
        <CodeBlockDialog
          id="dialog-inputSchema"
          open={!!selectedInputSchema}
          onClose={handleCloseInputSchema}
          title={selectedInputSchema.name + ' Input Schema'}
          text={JSON.stringify(selectedInputSchema.inputSchema, null, 2)}
        />
      )}
      {selectedOuputSchema && (
        <CodeBlockDialog
          id="dialog-outputSchema"
          open={!!selectedOuputSchema}
          onClose={handleCloseOutputSchema}
          title={selectedOuputSchema.name + ' Output Schema'}
          text={JSON.stringify(selectedOuputSchema.outputSchema, null, 2)}
        />
      )}
      {selectedRequirements && (
        <CodeBlockDialog
          id="dialog-requirements"
          open={!!selectedRequirements}
          onClose={handleCloseRequirements}
          title={selectedRequirements.name + ' Requirements'}
          text={JSON.stringify(selectedRequirements.requirements, null, 2)}
        />
      )}
    </div>
  );
}
