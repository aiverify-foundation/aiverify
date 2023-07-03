import Head from 'next/head';
import { AppProps } from 'next/app';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider, EmotionCache } from '@emotion/react';
import theme from '../src/lib/theme';
import createEmotionCache from '../src/lib/createEmotionCache';
import Layout from 'src/modules/layout';
import 'src/styles/styles.css';
import 'src/styles/color-palette.css';
import 'src/modules/projectTemplate/styles/mui-overrides.css';
import 'src/modules/projectTemplate/styles/grid-overrides.css';
import { ApolloProvider } from '@apollo/client';
import graphqlClient from 'src/lib/graphqlClient';

import { config } from '@fortawesome/fontawesome-svg-core';
import { NotificationsProvider } from 'src/modules/notifications/providers/notificationsContext';
// import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false;

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const client = graphqlClient(false);

  return (
    <ApolloProvider client={client}>
      <CacheProvider value={emotionCache}>
        <NotificationsProvider>
          <Head>
            <meta
              name="viewport"
              content="initial-scale=1, width=device-width"
            />
            <title>AI Verify</title>
          </Head>
          <ThemeProvider theme={theme}>
            {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
            <CssBaseline />
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </ThemeProvider>
        </NotificationsProvider>
      </CacheProvider>
    </ApolloProvider>
  );
}
