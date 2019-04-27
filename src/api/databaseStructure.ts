import { Server } from './server';

// TODO: rename getStructure to getDatabaseStructure

export async function getStructure(connectionUrl: string): Promise<StructureResponse.Type> {
  const request: RequestInit = {
    method: 'POST',
    body: JSON.stringify({ connectionUrl })
  }
  // TODO: use /database as endpoint
  const response = await Server.makeRequest('/jupyterlab-sql/structure', request);
  if (!response.ok) {
    return Private.createErrorResponse(response.status)
  }
  const data = await response.json()
  return data;
}

export namespace StructureResponse {
  export type Type = ErrorResponse | SuccessResponse;

  interface ErrorResponse {
    responseType: 'error';
    responseData: ErrorResponseData;
  }

  interface SuccessResponse {
    responseType: 'success';
    responseData: SuccessResponseData;
  }

  type SuccessResponseData = {
    tables: Array<string>;
  }

  type ErrorResponseData = {
    message: string;
  }

  export function createError(message: string): ErrorResponse {
    return {
      responseType: 'error',
      responseData: {
        message
      }
    };
  }

  export function createNotFoundError(): ErrorResponse {
    const errorMessage = (
      'Failed to reach server endpoints. ' +
      'Is the server extension installed correctly?'
    );
    return createError(errorMessage)
  }

  export function match<U>(
    response: Type,
    onSuccess: (tables: Array<string>) => U,
    onError: (_: ErrorResponseData) => U
  ) {
    if (response.responseType === 'error') {
      return onError(response.responseData);
    } else if (response.responseType === 'success') {
      const { tables } = response.responseData;
      return onSuccess(tables);
    }
  }
}

namespace Private {
  export function createErrorResponse(responseStatus: number): StructureResponse.Type {
    if (responseStatus === 404) {
      return StructureResponse.createNotFoundError()
    } else {
      const errorMessage = 'Unexpected response status from server'
      return StructureResponse.createError(errorMessage)
    }
  }
}
