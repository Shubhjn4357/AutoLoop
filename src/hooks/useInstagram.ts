/**
 * Hook for Instagram-related API interactions
 */

import { useApi } from "./useApi";
import type { IGMedia, IGUserProfile } from "@/lib/instagram/graph";
import { useCallback } from "react";

export function useInstagram() {
  const { request: fetchMediaReq, loading: mediaLoading } = useApi<IGMedia[]>();
  const { request: fetchProfileReq, loading: profileLoading } = useApi<IGUserProfile>();
  const { request: searchReq, loading: searchLoading } = useApi<IGUserProfile & { media?: { data: IGMedia[] } }>();
  const { request: publishReq, loading: publishLoading } = useApi<{ success: boolean; postId: string }>();

  const getMedia = useCallback(async () => {
    return fetchMediaReq("/api/instagram/media");
  }, [fetchMediaReq]);

  const getProfile = useCallback(async () => {
    return fetchProfileReq("/api/instagram/profile");
  }, [fetchProfileReq]);

  const searchUser = useCallback(async (username: string) => {
    return searchReq(`/api/instagram/search?username=${username.replace("@", "")}`);
  }, [searchReq]);

  const publishPost = useCallback(async (imageUrl: string, caption: string) => {
    return publishReq("/api/instagram/publish", {
      method: "POST",
      body: JSON.stringify({ imageUrl, caption }),
    });
  }, [publishReq]);

  return {
    getMedia,
    getProfile,
    searchUser,
    publishPost,
    loading: mediaLoading || profileLoading || searchLoading || publishLoading,
    mediaLoading,
    profileLoading,
    searchLoading,
    publishLoading
  };
}
