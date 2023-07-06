import { ErrorWithMessage, toErrorWithMessage } from 'src/lib/errorUtils';
import AIFPlugin from 'src/types/plugin.interface';
import PluginManagerType from 'src/types/pluginManager.interface';

export type ApiResult<T> = {
  status: number;
  data: T;
};

const path = '/api/plugins';
const listURL = `${path}/list`;
const uploadURL = `${path}/upload`;
const deleteURL = `${path}/delete`;

async function handleResponseBody<T>(
  response: Response
): Promise<ApiResult<T> | ErrorWithMessage> {
  let result;
  try {
    const data = await response.json();
    result = { status: response.status, data };
  } catch (err) {
    result = toErrorWithMessage(err);
    return result;
  }

  if (response.ok) {
    return result;
  } else {
    return toErrorWithMessage({
      status: response.status,
      statusText: response.statusText,
      error: result.data && result.data.error ? result.data.error : undefined,
    });
  }
}

async function fetchAllPlugins(): Promise<
  ApiResult<PluginManagerType> | ErrorWithMessage
> {
  const response = await fetch(listURL);
  const result = await handleResponseBody<PluginManagerType>(response);
  return result;
}

async function uploadPlugin(
  file: File
): Promise<ApiResult<AIFPlugin> | ErrorWithMessage> {
  const body = new FormData();
  body.append('myFile', file);
  const options = {
    method: 'POST',
    Headers: { 'Content-Type': 'multipart/form-data' },
    body,
  };
  const response = await fetch(uploadURL, options);
  const result = await handleResponseBody<AIFPlugin>(response);
  return result;
}

async function deletePlugin(
  pluginId: string
): Promise<ApiResult<string> | ErrorWithMessage> {
  const options = {
    method: 'DELETE',
  };
  const response = await fetch(`${deleteURL}/${pluginId}`, options);
  if (response.ok) {
    return { status: response.status, data: pluginId };
  }
  return toErrorWithMessage({ status: response.status });
}

export { fetchAllPlugins, uploadPlugin, deletePlugin };
