/**
 * Awaits a promise and then throws an AbortError if the token was aborted
 * during the await. Use between async steps in an abortable pipeline to
 * cancel superseded operations cleanly.
 *
 * @param promise  - The promise to await.
 * @param token    - The AbortController token for the current pipeline.
 * @param onAbort  - Optional cleanup to run before throwing if aborted.
 * @returns The resolved value of the promise.
 * @throws DOMException with name "AbortError" if the token was aborted.
 */
export async function guardedAwait<T>(
  promise: Promise<T>,
  token: AbortController,
  onAbort?: () => void,
): Promise<T> {
  const result = await promise;
  if (token.signal.aborted) {
    onAbort?.();
    throw new DOMException("Cancelled", "AbortError");
  }
  return result;
}
