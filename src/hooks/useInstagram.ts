"use client";

import { useApi } from "./useApi";
import { useCallback } from "react";

export function useInstagram() {
  const { data: media, loading: loadingMedia, request: fetchMedia } = useApi<unknown[]>();
  const { data: profile, loading: loadingProfile, request: fetchProfile } = useApi<unknown>();

  const getMedia = useCallback((igUserId: string) => {
    return fetchMedia(`/api/instagram/media?igUserId=${igUserId}`);
  }, [fetchMedia]);

  const getProfile = useCallback((igUserId: string) => {
    return fetchProfile(`/api/instagram/profile?igUserId=${igUserId}`);
  }, [fetchProfile]);

  return {
    media,
    profile,
    loading: loadingMedia || loadingProfile,
    getMedia,
    getProfile
  };
}
