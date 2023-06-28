import { useState, useEffect } from 'react';

import { ProjectStore, MapActionTypes } from './projectContext';
import { TestInformation } from 'src/types/test.interface';
import { Algorithm } from 'src/types/plugin.interface';
import AlgorithmWidgetComponent from './algorithmWidget';
import {
  AlertBox,
  AlertBoxFixedPositions,
  AlertBoxSize,
} from 'src/components/alertBox';
import styles from './styles/inputs.module.css';

type AlgorithmListProps = {
  projectStore: ProjectStore;
};

export default function AlgorithmList(props: AlgorithmListProps) {
  const { projectStore } = props;
  const [currentState, setCurrentState] = useState<TestInformation | null>(
    null
  );
  const [open, setOpen] = useState<boolean>(false);
  const { algorithms } = projectStore.dependencies;

  const showDialog = (algo: Algorithm): void => {
    const gid = algo.gid;
    let testInfo = projectStore.testInformationData[gid];
    if (!testInfo) {
      testInfo = {
        algorithm: algo,
        algorithmGID: gid,
        testArguments: {},
        isTestArgumentsValid: projectStore.isAlgorithmValid(gid),
      };
    }
    setCurrentState(testInfo);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
  };

  function handleDataChange(gid: string) {
    return (data: object) => {
      const payload = {
        ...currentState,
        testArguments: data,
      } as TestInformation;
      projectStore.dispatchTestInformationData({
        type: MapActionTypes.SET,
        key: gid,
        payload,
      });
      setCurrentState(payload);
    };
  }

  function handleOpenBtnClick(algo: Algorithm) {
    return () => showDialog(algo);
  }

  useEffect(() => {
    if (!currentState) return;
  }, [currentState]);

  return (
    <div className={styles.inputSection}>
      <div className={styles.sectionHeading}>
        <h3 className="screenHeading">Provide Test Arguments</h3>
        <p className="headingDescription">
          Open each test argument to provide the arguments required to run the
          tests and generate the report
        </p>
      </div>
      {algorithms.map((algo) => {
        const hasInputProperties =
          algo.inputSchema.properties &&
          Object.keys(algo.inputSchema.properties).length;
        const isAlgoValid = projectStore.isAlgorithmValid(algo.gid);
        return (
          <div
            id={`algocard-${algo.gid}`}
            className={styles.inputCard}
            key={`algo-${algo.gid}`}>
            <div className={styles.inputDescription} style={{ width: '350px' }}>
              <h4>{algo.name}</h4>
            </div>
            <div className={styles.divider} />
            <div className={styles.inputMain}>
              <p>{algo.description}</p>
              {hasInputProperties ? (
                <div className={styles.buttonRow}>
                  <button
                    className="aivBase-button aivBase-button--primary aivBase-button--small"
                    onClick={handleOpenBtnClick(algo)}>
                    Open
                  </button>
                  {!isAlgoValid ? (
                    <div className={styles.errorMsg}>Invalid Arguments</div>
                  ) : null}
                </div>
              ) : (
                <div>This test does not require any arguments input.</div>
              )}
            </div>
          </div>
        );
      })}
      {currentState && currentState.algorithm && open ? (
        <AlertBox
          enableModalOverlay
          renderInPortal
          size={AlertBoxSize.MEDIUM}
          fixedPosition={AlertBoxFixedPositions.CENTER}
          onCloseIconClick={closeDialog}>
          <AlertBox.Header heading={currentState.algorithm.name} />
          <AlertBox.Body hasFooter>
            <div>
              <AlgorithmWidgetComponent
                testInfo={currentState}
                onChangeData={handleDataChange(currentState.algorithm.gid)}
                modelAndDatasets={projectStore.modelAndDatasets}
              />
            </div>
          </AlertBox.Body>
          <AlertBox.Footer>
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'flex-end',
              }}>
              <button
                className="aivBase-button aivBase-button--primary aivBase-button--small"
                onClick={closeDialog}>
                OK
              </button>
            </div>
          </AlertBox.Footer>
        </AlertBox>
      ) : null}
    </div>
  );
}
