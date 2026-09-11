export const DASHBOARD_PATH = "/dashboard";
export const ONBOARDING_PATH = "/onboarding";

type ProfilesClient = {
  from: (relation: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string
      ) => {
        maybeSingle: () => PromiseLike<{
          data: { onboarding_complete?: boolean | null } | null;
          error: { message?: string } | null;
        }>;
      };
    };
  };
};

export async function getSignedInHomePath(
  supabase: ProfilesClient,
  userId: string | null | undefined
) {
  if (!userId) {
    return DASHBOARD_PATH;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return DASHBOARD_PATH;
  }

  return data?.onboarding_complete === true ? DASHBOARD_PATH : ONBOARDING_PATH;
}

export function asProfilesClient(supabase: unknown): ProfilesClient {
  return supabase as ProfilesClient;
}
