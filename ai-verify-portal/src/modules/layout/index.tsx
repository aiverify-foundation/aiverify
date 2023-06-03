import React from 'react';
import { useRouter } from 'next/router';

import Image from 'next/image'
import LogoImage from 'public/images/logo.png';
import Box from '@mui/material/Box';
import MenuIcon from '@mui/icons-material/Menu';
import styles from './styles/layout.module.css';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';


type Props = {
  children: React.ReactNode,
}

/**
 * Layout component for all pages, with fixed top bar.
 */
export default function Layout({ children }: Props) {

  return (
    <div>
      {/* {!router.pathname.startsWith("/project/") && !router.pathname.startsWith("/reportStatus/") && !router.pathname.startsWith("/projectTemplate/") && ( */}
        {/* <div className={styles.topbar}>
          <ArrowBackIosIcon />
          <Image src={LogoImage} alt="Logo" width={240} className={styles.logo} onClick={() => router.push('/home')}/>
          <ArrowForwardIosIcon /> */}
          {/* <Box sx={{ display: 'flex', alignItems: 'center', ml:'10px', cursor: 'pointer'}} onClick={() => router.push('/home')}>
            <MenuIcon sx={{ fontSize:'30px' }} />
          </Box>
        </div>
      )} */}
        <div className={styles.layout}>
          {children}
        </div>
    </div>
  )
}