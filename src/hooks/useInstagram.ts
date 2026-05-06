"use client";

import { useApi } from "./useApi";
import { useCallback } from "react";

export function useInstagram() {
  const { data: media, loading: loadingMedia, request: fetchMedia } = useApi<unknown[]>();
  const { data: profile, loading: loadingProfile, request: fetchProfile } = useApi<unknown>();

  const getMedia = useCallback((externalId: string) => {
    return fetchMedia(`/api/instagram/media?externalId=${externalId}`);
  }, [fetchMedia]);

  const getProfile = useCallback((externalId: string) => {
    return fetchProfile(`/api/instagram/profile?externalId=${externalId}`);
  }, [fetchProfile]);

  return {
    media,
    profile,
    loading: loadingMedia || loadingProfile,
    getMedia,
    getProfile
  };
}
