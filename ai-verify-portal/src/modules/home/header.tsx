import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import LogoImage from 'public/images/logo.png';
import MenuIcon from '@mui/icons-material/Menu';
import styles from './styles/home.module.css';
import { ListMenu, ListMenuItem } from 'src/components/listMenu';
import { Notifications } from '../notifications';

function MinimalHeader({ enableMenu = true }: { enableMenu?: boolean }) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const menuTimer = useRef<NodeJS.Timeout>(); // TODO - figure out type of window timer

  function delayHideMenu() {
    menuTimer.current = setTimeout(() => {
      setShowMenu(false);
    }, 1000);
  }

  function cancelMenuTimer() {
    if (menuTimer.current) {
      clearTimeout(menuTimer.current);
    }
  }

  function handleMenuIconMouseEnter() {
    cancelMenuTimer();
    setShowMenu(true);
  }

  function handleMenuIconMouseLeave() {
    delayHideMenu();
  }

  function handleMenuMouseEnter() {
    cancelMenuTimer();
  }

  function handleMenuMouseLeave() {
    delayHideMenu();
  }

  function navigateToHome() {
    router.push('/home');
  }

  function navigateToModelsData() {
    router.push('/assets');
  }

  function navigateToPlugins() {
    router.push('/plugins');
  }

  function navigateToTemplates() {
    router.push('/projectTemplates');
  }

  return (
    <div className={styles.header}>
      {enableMenu ? (
        <MenuIcon
          style={{ cursor: 'pointer' }}
          onMouseEnter={handleMenuIconMouseEnter}
          onMouseLeave={handleMenuIconMouseLeave}
        />
      ) : null}
      {showMenu ? (
        <ListMenu
          containerStyles={{
            position: 'absolute',
            top: '40px',
            left: '25px',
            zIndex: 1001,
          }}
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}>
          <ListMenuItem id="home" displayText="Home" onClick={navigateToHome} />
          <ListMenuItem
            id="saveAsTemplate"
            displayText="Models & Data"
            onClick={navigateToModelsData}
          />
          <ListMenuItem
            id="saveAsTemplate"
            displayText="Plugins"
            onClick={navigateToPlugins}
          />
          <ListMenuItem
            id="saveAsTemplate"
            displayText="Report Templates"
            onClick={navigateToTemplates}
          />
        </ListMenu>
      ) : null}
      <Image
        src={LogoImage}
        alt="AI Verify"
        width={240}
        className={styles.logo}
        onClick={navigateToHome}
      />
      <div style={{ position: 'absolute', right: '20px' }}>
        <Notifications />
      </div>
    </div>
  );
}

export { MinimalHeader };
