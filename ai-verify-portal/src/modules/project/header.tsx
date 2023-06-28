import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import LogoImage from 'public/images/logo.png';
import ArrowBackIos from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SaveIcon from '@mui/icons-material/Save';
import { ListMenu, ListMenuItem } from 'src/components/listMenu';
import ExportTemplateDialog from '../projectTemplate/exportTemplateDialog';
import ProjectTemplateInformationDialog from '../projectTemplate/projectTemplateInformationDialog';
import { ProjectTemplateStore } from './projectContext';
import styles from './styles/header.module.css';
import clsx from 'clsx';
import { StyledTooltip } from 'src/components/StyledMuiTooltip';
import { ProjectStep } from '.';
import { Notifications } from '../notifications';

type ReportsHeaderProps = {
  projectStore?: ProjectTemplateStore;
  lastSavedTime?: string;
  disableSaveBtn?: boolean;
  disableSaveMenu?: boolean;
  disableSaveMenuItem?: boolean;
  disableNextBtn?: boolean;
  isTemplate?: boolean;
  designStep: number;
  onNextBtnClick?: () => void;
  onBackBtnClick: () => void;
}

function ReportDesignerHeader(props: ReportsHeaderProps) {
  const {
    projectStore,
    lastSavedTime,
    disableSaveBtn = false,
    disableSaveMenu = false,
    disableSaveMenuItem,
    disableNextBtn = false,
    isTemplate = false,
    designStep,
    onNextBtnClick,
    onBackBtnClick
  } = props;
  const [showMenu, setShowMenu] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showManualSavedMsg, setShowManualSavedMsg] = useState(false);
  const [disableManualSaveBtn, setDisableManualSaveBtn] = useState(false);
  const menuTimer = useRef<NodeJS.Timeout>(); // TODO - figure out type of window timer
  const router = useRouter();

  function delayHideMenu() {
    menuTimer.current = setTimeout(() => {
      setShowMenu(false);
    }, 300);
  }

  function cancelMenuTimer() {
    if (menuTimer.current) {
      clearTimeout(menuTimer.current);
    }
  }

  function navigateToHome() {
    router.push('/home');
  }

  function backToTemplatesClick() {
    router.push('/projectTemplates');
  }
  
  function handleExportIconMouseEnter() {
    cancelMenuTimer();
    setShowMenu(true);
  }

  function handleExportIconMouseLeave() {
    delayHideMenu();
  }

  function handleMenuMouseEnter() {
    cancelMenuTimer();
  }

  function handleMenuMouseLeave() {
    delayHideMenu();
  }

  function handleSaveMenuItemClick() {
    setShowSaveDialog(true);
  }

  function handleExportMenuItemClick() {
    setShowExportDialog(true);
  }

  function handleSaveDialogClose() {
    setShowSaveDialog(false);
  }

  function handleExportDialogClose() {
    setShowExportDialog(false);
  }

  function handleExportActionClick() {
    setShowExportDialog(true);
  }

  function handleManualSaveClick() {
    if (disableManualSaveBtn) return;
    if (projectStore) {
      projectStore.flushAllUpdates();
    }
    setShowManualSavedMsg(true);
    setDisableManualSaveBtn(true);
    setTimeout(() => {
      setShowManualSavedMsg(false);
      setDisableManualSaveBtn(false);
    }, 2500);
  }

  return (
    <div>
      <div className={styles.header}>
        <div style={{ display: 'flex'}}>
        {isTemplate && designStep === 1 ? 
          <div className={styles.reportNavBtn} onClick={backToTemplatesClick}>
            <ArrowBackIos className={styles.navIcon} />
            <div>Templates</div>
          </div> : null
        }
        {isTemplate && designStep === 2 ? 
          <div className={styles.reportNavBtn} onClick={onBackBtnClick}>
            <ArrowBackIos className={styles.navIcon} />
            <div>Template Details</div>
          </div> : null
        }
        {!isTemplate && designStep === 2 ? 
          <div className={styles.reportNavBtn} onClick={onBackBtnClick}>
            <ArrowBackIos className={styles.navIcon} />
            <div>Project Details</div>
          </div> : null
        }
        {!isTemplate && designStep === 1 ? 
          <div className={styles.reportNavBtn} onClick={navigateToHome}>
            <ArrowBackIos className={styles.navIcon} />
            <div>Home</div>
          </div> : null
        }
        {!isTemplate && designStep === 3 ? 
          <div className={styles.reportNavBtn} onClick={onBackBtnClick}>
            <ArrowBackIos className={styles.navIcon} />
            <div>Project Details</div>
          </div> : null
        }
        {!isTemplate && designStep === 4 ? 
          <div className={styles.reportNavBtn} onClick={onBackBtnClick}>
            <ArrowBackIos className={styles.navIcon} />
            <div>Design Report</div>
          </div> : null
        }
        {!isTemplate && designStep > 4 ? 
          <div className={styles.reportNavBtn} onClick={onBackBtnClick}>
            <ArrowBackIos className={styles.navIcon} />
            <div>Back</div>
          </div> : null
        }
        </div>
        <div className={styles.menuIconsGroup}>
          {!disableSaveMenu ? <>
            <FileDownloadIcon
              className={styles.menuIcon}
              onMouseEnter={handleExportIconMouseEnter}
              onMouseLeave={handleExportIconMouseLeave}
            />
            {showMenu ? <ListMenu
              containerStyles={{
                position: 'absolute',
                top: '30px',
                left: '16px',
                zIndex: 1001 }}
              onMouseEnter={handleMenuMouseEnter}
              onMouseLeave={handleMenuMouseLeave}>
              <ListMenuItem 
                id='explortAsPlugin'
                displayText='Export as Plugin'
                onClick={handleExportMenuItemClick}/>
              {!disableSaveMenuItem ?
                <ListMenuItem
                  id='saveAsTemplate'
                  displayText='Save as Template'
                  onClick={handleSaveMenuItemClick} /> : null
              }
            </ListMenu> : null}
          </> : null}
          {!disableSaveBtn ? 
            <StyledTooltip
              title= { isTemplate ? 'Save Template' : 'Save Project' }
              placement="left">
              <SaveIcon
                className={clsx(
                  styles.menuIcon,
                  styles.menuSaveIcon,
                  disableManualSaveBtn ? styles.menuIcon__Disabled : null
                )}
                onClick={handleManualSaveClick} />
            </StyledTooltip> : null 
          }
          {showManualSavedMsg ? 
            <div className={styles.savedMsgDisplay}>Project saved</div> : null}
          {!showManualSavedMsg && lastSavedTime ? <div className={styles.savedTimeDisplay}>Autosaved at {lastSavedTime}</div> : null}
        </div>
        <Image
          src={LogoImage}
          alt="AI Verify"
          className={styles.logo}
          onClick={navigateToHome}
        />
        
        <div style={{ display: 'flex' }}>
          <Notifications />
          {isTemplate && designStep === 1 ? 
            <div className={
              clsx(styles.reportNavBtn, disableNextBtn ? styles.disableNavBtn : null)}
              style={!disableNextBtn ? {marginLeft: '20px'} : {}}
              onClick={disableNextBtn ? undefined: onNextBtnClick}>
              <div>Next</div>
              <ArrowForwardIos className={styles.navIcon} style={{ marginLeft: '5px'}} />
            </div> : null
          }
          {isTemplate && designStep === 2 ? 
            <div className={styles.reportNavBtn} onClick={handleExportActionClick}>
              <div>Export as Plugin</div>
              <ArrowForwardIos className={styles.navIcon} style={{ marginLeft: '5px'}} />
            </div> : null
          }
          {!isTemplate && (designStep > 0 && designStep < 10) && (designStep !== ProjectStep.SelectDataset) ? 
            <div className={
              clsx(styles.reportNavBtn, disableNextBtn ? styles.disableNavBtn : null)}
              style={!disableNextBtn ? {marginLeft: '20px'} : {}}
              onClick={disableNextBtn ? undefined: onNextBtnClick}>
              <div>Next</div>
              <ArrowForwardIos className={styles.navIcon} style={{ marginLeft: '5px'}} />
            </div> : null
          }
        </div>
      </div>
      {projectStore ? <>
        {showSaveDialog ? <ProjectTemplateInformationDialog
          projectStore={projectStore}
          onClose={handleSaveDialogClose}
        /> : null}
        {showExportDialog ? <ExportTemplateDialog
          projectStore={projectStore}
          onClose={handleExportDialogClose} 
        /> : null}
      </>: null}
    </div>
  )
}

export { ReportDesignerHeader };