'use client';

import React, { useEffect, useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import { client } from './apolloClient';

export default function ApolloWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
