/** The sentence to show for any failure. An Error with no message still says what it is. */
export function errorText(err: unknown): string {
  if (err instanceof Error) return err.message || err.name;
  return String(err);
}
