// Lightweight tracing for AI calls - integrates with Vercel/OTel if available
export interface TraceSpan {
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, string | number | boolean>;
  status: "ok" | "error";
  error?: Error;
}

const spans: TraceSpan[] = [];
const MAX_SPANS = 1000;

export function startSpan(name: string, attributes: Record<string, string | number | boolean> = {}): TraceSpan {
  const span: TraceSpan = {
    name,
    startTime: Date.now(),
    attributes: {
      "service.name": "careerpilot-ai",
      ...attributes,
    },
    status: "ok",
  };
  spans.push(span);
  if (spans.length > MAX_SPANS) spans.shift();
  return span;
}

export function endSpan(span: TraceSpan, error?: Error): void {
  span.endTime = Date.now();
  if (error) {
    span.status = "error";
    span.error = error;
    span.attributes["error.message"] = error.message;
    span.attributes["error.name"] = error.name;
  }
  span.attributes["duration.ms"] = span.endTime - span.startTime;

  // Export to console in development, could be sent to OTel collector in production
  if (process.env.NODE_ENV === "development") {
    console.log(`[TRACE] ${span.name}`, {
      duration: span.attributes["duration.ms"],
      status: span.status,
      ...span.attributes,
    });
  }
}

export function traceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  attributes: Record<string, string | number | boolean> = {},
): Promise<T> {
  const span = startSpan(name, attributes);
  return fn()
    .then((result) => {
      endSpan(span);
      return result;
    })
    .catch((error) => {
      endSpan(span, error instanceof Error ? error : new Error(String(error)));
      throw error;
    });
}

export function getSpans(): TraceSpan[] {
  return [...spans];
}

export function clearSpans(): void {
  spans.length = 0;
}