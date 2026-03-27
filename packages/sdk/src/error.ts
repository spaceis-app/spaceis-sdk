/**
 * SpaceIS API error with status code and optional field-level errors.
 *
 * @example
 * ```js
 * try {
 *   await client.cart.addItem({ variant_uuid: "..." });
 * } catch (err) {
 *   if (err instanceof SpaceISError) {
 *     console.log(err.status);              // 422
 *     console.log(err.message);             // "The given data was invalid."
 *     console.log(err.errors);              // { variant_uuid: ["Invalid UUID"] }
 *     console.log(err.fieldError("email")); // "The email field is required."
 *   }
 * }
 * ```
 */
export class SpaceISError extends Error {
  readonly status: number;
  readonly errors: Record<string, string[]> | null;

  constructor(message: string, status: number, errors?: Record<string, string[]> | null) {
    super(message);
    this.name = "SpaceISError";
    this.status = status;
    this.errors = errors ?? null;
  }

  /** True when the server returned 422 (validation error) */
  get isValidation(): boolean {
    return this.status === 422;
  }

  /** True when the server returned 404 */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** True when the server returned 429 (rate limited) */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  /** Return the first validation error for a given field, or undefined */
  fieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }

  /** Return all validation errors as a flat list of "field: message" strings */
  allFieldErrors(): string[] {
    if (!this.errors) return [];
    const result: string[] = [];
    for (const [field, messages] of Object.entries(this.errors)) {
      for (const msg of messages) {
        result.push(`${field}: ${msg}`);
      }
    }
    return result;
  }
}
