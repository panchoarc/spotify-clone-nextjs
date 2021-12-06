import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import spotifyAPI from "../lib/spotify";

function useSpotify() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      if (session.error === "RefreshTokenError") {
        signIn();
      }
      spotifyAPI.setAccessToken(session.user.accessToken);
    }
  }, [session]);

  return spotifyAPI;
}

export default useSpotify;
