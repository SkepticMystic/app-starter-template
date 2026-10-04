/** Hex SHA-256 of a string. */
const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const HashUtil = {
  sha256,

  /**
   * A rate-limit key for an email address, hashed so the address never
   * reaches Redis — or Upstash's analytics — as plaintext.
   */
  email_key: (email: string) => sha256(email.trim().toLowerCase()),
};
