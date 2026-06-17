/**
 * Awaits a promise, then checks the token. It throws an AbortError if it was
 * aborted during the await. Place between async steps in an abortable pipeline
 * so a superseded operation cancels cleanly rather than continuing past a stale checkpoint.
 *
 * @throws DOMException("AbortError") if the token was aborted.
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
