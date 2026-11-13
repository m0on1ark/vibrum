type ProblemDetail = {
  detail?: string;
  errors?: Record<string, string>;
};

const FALLBACK_MESSAGE = "Coś poszło nie tak. Spróbuj ponownie.";

export async function readApiError(response: Response) {
  try {
    const body = (await response.json()) as ProblemDetail;
    if (body.errors) {
      const messages = Object.values(body.errors).filter(Boolean);
      if (messages.length > 0) return messages.join(" ");
    }
    if (body.detail) return body.detail;
  } catch {
    return FALLBACK_MESSAGE;
  }

  return FALLBACK_MESSAGE;
}
