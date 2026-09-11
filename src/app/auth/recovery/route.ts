import { completeAuthRedirect } from "@/lib/auth/complete-auth-redirect";

export async function GET(request: Request) {
  return completeAuthRedirect(request, { forceRecovery: true });
}
