import {
  ApolloClient,
  ApolloLink,
  gql,
  InMemoryCache,
  NormalizedCacheObject,
  Observable,
  split,
} from '@apollo/client';
import { loadDevMessages, loadErrorMessages } from '@apollo/client/dev';
import { onError } from '@apollo/client/link/error';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition } from '@apollo/client/utilities';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import Cookies from 'js-cookie';
import { useUserStore } from '../store/userStore';

loadErrorMessages();
loadDevMessages();

async function refreshToken(client: ApolloClient<NormalizedCacheObject>) {
  try {
    const { data } = await client.mutate({
      mutation: gql`
        mutation RefreshToken {
          refreshToken
        }
      `,
    });

    const newAccessToken = data?.refreshToken;
    if (!newAccessToken) throw new Error('New access token not received');

    // Сохраняем новый токен в zustand
    Cookies.set('access_token', newAccessToken, { secure: true, sameSite: 'strict' });
    return `Bearer ${newAccessToken}`;
  } catch (error) {
    throw new Error('Error getting new access token');
  }
}

let retryCount = 0;
const maxRetry = 3;

// WebSocketLink с динамическим получением токена
const wsLink = new WebSocketLink({
  uri: `ws://localhost:3000/graphql`,
  options: {
    reconnect: true,
    connectionParams: () => {
      const token = Cookies.get('access_token');
      return {
        Authorization: token ? `Bearer ${token}` : null,
      };
    },
  },
});

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  for (const err of graphQLErrors!) {
    if (err.extensions!.code === 'UNAUTHENTICATED' && retryCount < maxRetry) {
      retryCount++;
      return new Observable((observer) => {
        refreshToken(client)
          .then((token) => {
            console.log('token', token);
            operation.setContext((previousContext: any) => ({
              headers: {
                ...previousContext.headers,
                authorization: token,
              },
            }));
            const forward$ = forward(operation);
            forward$.subscribe(observer);
          })
          .catch((error) => observer.error(error));
      });
    }

    if (err.message === 'Refresh token not found') {
      console.log('refresh token not found');

      // Удаляем токен
      Cookies.remove('access_token');
      useUserStore.setState({
        id: undefined,
        fullname: '',
        email: '',
      });
    }
  }
});

const authMiddleware = new ApolloLink((operation, forward) => {
  const token = Cookies.get('access_token');
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : null,
    },
  }));
  return forward(operation);
});

const uploadLink = createUploadLink({
  uri: 'http://localhost:3000/graphql',
  credentials: 'include',
  headers: {
    'apollo-require-preflight': 'true',
  },
});

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  ApolloLink.from([authMiddleware, errorLink, uploadLink])
);

export const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: link,
});
