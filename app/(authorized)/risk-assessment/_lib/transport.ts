export const readJsonResponse = async <T>(
  response: Response,
  fallbackMessage: string,
) => {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    void error;
    throw new Error(fallbackMessage);
  }

  if (!response.ok) {
    const errorPayload = payload as { error?: unknown };
    const errorMessage =
      errorPayload && typeof errorPayload.error === "string"
        ? errorPayload.error
        : fallbackMessage;
    throw new Error(errorMessage);
  }

  return payload as T;
};

export const toFriendlyFetchError = (label: string, error: unknown) => {
  if (error instanceof Error) {
    const message = error.message;
    if (
      /networkerror|failed to fetch|fetch failed|load failed/i.test(message)
    ) {
      return `${label} is unreachable right now.`;
    }

    return message;
  }

  return `${label} is unavailable right now.`;
};
