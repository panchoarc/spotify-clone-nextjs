import {
  ForwardIcon,
  PauseIcon,
  PlayIcon,
  ArrowPathRoundedSquareIcon,
  BackwardIcon,
  ArrowsRightLeftIcon,
  SpeakerXMarkIcon,
} from '@heroicons/react/24/solid';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { currentTrackIdState, isPlayingState } from '../atoms/songAtom';
import useSongInfo from '../hooks/useSongInfo';
import useSpotify from '../hooks/useSpotify';
import { debounce } from 'lodash';

const repeatingStates = ['track', 'context', 'off'];
const repeatingStatesColors = ['green', 'yello', 'gray'];

function Player() {
  const spotifyAPI = useSpotify();
  const { data: session, status } = useSession();
  const [currentTrackId, setCurrentTrackId] =
    useRecoilState(currentTrackIdState);
  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [volume, setVolume] = useState(50);

  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatedState, setRepeatedState] = useState(
    repeatingStates[repeatingStates.length - 1]
  );

  const songInfo = useSongInfo();

  const fetchCurrentSong = async () => {
    if (!songInfo) {
      spotifyAPI.getMyCurrentPlayingTrack().then((data) => {
        console.log('Now Playing: ', data.body?.item);
        setCurrentTrackId(data.body?.item.id);

        spotifyAPI.getMyCurrentPlaybackState().then((data) => {
          console.log('Current Playback State: ', data.body);
          setIsPlaying(data.body?.is_playing);
        });
      });
    }
  };

  const handlePlayPause = async () => {
    spotifyAPI.getMyCurrentPlaybackState().then((data) => {
      if (data.body?.is_playing) {
        spotifyAPI.pause();
        setIsPlaying(false);
      } else {
        spotifyAPI.play();
        setIsPlaying(true);
      }
    });
  };

  const fetchUpdatedSong = async () => {
    spotifyAPI
      .getMyCurrentPlaybackState()
      .then((data) => {
        const { id } = data.body.item;
        setCurrentTrackId(id);
      })
      .catch((err) => {
        console.error('error en playback state', err);
      });
  };

  const handlePreviousSong = async () => {
    spotifyAPI
      .skipToPrevious()
      .then(() => {
        fetchUpdatedSong();
      })
      .catch((err) => {
        console.error('HandlePrevious Song error', err);
      });
  };

  const handleNextSong = async () => {
    spotifyAPI
      .skipToNext()
      .then(() => {
        fetchUpdatedSong();
      })
      .catch((err) => {
        console.error('HandlePrevious Song error', err);
      });
  };

  const handleShuffleSong = async () => {
    setIsShuffled(!isShuffled);
    spotifyAPI.setShuffle(isShuffled).catch((err) => {
      console.error('Error Shuffling Song', err);
    });
  };

  const handleRepeatSong = async () => {
    const findIndexRepeatedState = repeatingStates.indexOf(repeatedState);
    const newIndex = (findIndexRepeatedState + 1) % repeatingStates.length;
    spotifyAPI
      .setRepeat(repeatingStates[newIndex])
      .then(() => {
        setRepeatedState(repeatingStates[newIndex]);
      })
      .catch((err) => {
        console.error('Error Repeating Song', err);
      });
  };

  useEffect(() => {
    if (spotifyAPI.getAccessToken() && !currentTrackId) {
      fetchCurrentSong();
    }
  }, [currentTrackId, spotifyAPI, session]);

  useEffect(() => {
    if (volume > 0 && volume < 100) {
      debouncedAdjustVolume(volume);
    }
  }, [volume]);

  const debouncedAdjustVolume = useCallback(
    debounce((volume) => {
      spotifyAPI.setVolume(volume).catch((err) => {
        console.log(err);
      });
    }, 500),
    [volume]
  );

  return (
    <div className='h-24 bg-gradient-to-b from-black to-gray-900 text-white grid grid-cols-3 text-xs md:text-base px-2 md:px-8'>
      {/** Left */}
      <div className='flex items-center space-x-4 '>
        <img
          className='hidden md:inline h-10 w-10'
          src={songInfo?.album.images?.[0]?.url}
          alt='Album Photo'
        />

        <div>
          <h3>{songInfo?.name}</h3>
          <p>{songInfo?.artists?.[0]?.name}</p>
        </div>
      </div>
      {/** End of Left Section */}

      {/** Center */}
      <div className='flex items-center justify-evenly'>
        <ArrowsRightLeftIcon
          className={`button ${!isShuffled ? 'text-green-500' : ''}`}
          onClick={handleShuffleSong}
        />
        <BackwardIcon className='button' onClick={handlePreviousSong} />

        {isPlaying ? (
          <PauseIcon onClick={handlePlayPause} className='button w-10 h-10' />
        ) : (
          <PlayIcon onClick={handlePlayPause} className='button w-10 h-10' />
        )}

        <ForwardIcon className='button' onClick={handleNextSong} />

        <ArrowPathRoundedSquareIcon
          className={`button `}
          onClick={handleRepeatSong}
        />

        {/** End of Center Controls */}
      </div>
      {/** Right */}

      <div className='flex items-center space-x-3 md:space-x-4 justify-end pr-5'>
        <SpeakerXMarkIcon
          onClick={() => volume > 0 && setVolume(volume - 10)}
          className='button'
        />
        <input
          className='w-14 md:w-28'
          type='range'
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
        <SpeakerWaveIcon
          onClick={() => volume < 100 && setVolume(volume + 10)}
          className='button'
        />
      </div>

      {/** End of Right Controls */}
    </div>
  );
}

export default Player;
