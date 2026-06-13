/** Pull a useful message out of an axios error, falling back to a default. */
export function messageFrom(error: unknown, fallback: string): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object'
  ) {
    const resp = (error as { response?: { data?: { message?: unknown } } })
      .response;
    const msg = resp?.data?.message;
    if (typeof msg === 'string') return msg;
    if (Array.isArray(msg) && typeof msg[0] === 'string') return msg[0];
  }
  return fallback;
}
