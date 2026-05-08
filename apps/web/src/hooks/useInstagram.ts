"use client";

import { useApi } from "./useApi";
import { useCallback } from "react";
import { useDashboardContext } from "@/components/dashboard/dashboard-context";

export function useInstagram() {
  const { userId } = useDashboardContext();

  const { data: media, loading: loadingMedia, request: fetchMedia } = useApi<unknown[]>();
  const { data: profile, loading: loadingProfile, request: fetchProfile } = useApi<unknown>();

  const getMedia = useCallback((externalId: string) => {
    return fetchMedia(`/api/instagram/media?externalId=${externalId}`, userId);
  }, [fetchMedia, userId]);

  const getProfile = useCallback((externalId: string) => {
    return fetchProfile(`/api/instagram/profile?externalId=${externalId}`, userId);
  }, [fetchProfile, userId]);

  return {
    media,
    profile,
    loading: loadingMedia || loadingProfile,
    getMedia,
    getProfile
  };
}
