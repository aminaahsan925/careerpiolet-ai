import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  ...vi.requireActual("@tanstack/react-router"),
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
  Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock("@tanstack/react-query", () => ({
  ...vi.requireActual("@tanstack/react-query"),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getClaims: vi.fn().mockResolvedValue({ data: { claims: { sub: "test-user" } }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } }, error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        download: vi.fn().mockResolvedValue({ data: new Blob(["test"]), error: null }),
      })),
    },
  })),
}));

Object.defineProperty(global, "fetch", {
  value: vi.fn(),
  writable: true,
});