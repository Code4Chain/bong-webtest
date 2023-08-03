import React, { useRef, useState } from "react";
import cn from "classnames";
import styles from "./Player.module.scss";
import Icon from "../../Icon";
import { ReactComponent as MuteIcon } from "../../../assets/images/content/muted.svg";

const Player = ({ className, src, controller }) => {

    const [playing, setPlaying] = useState(true);
    const [progress, setProgress] = useState("0%");
    const [muted, setMuted] = useState(true);
    const playerRef = useRef();

    function togglePlay() {
        if (playerRef.current.paused || playerRef.current.ended) {
            playerRef.current.play();
        } else {
            playerRef.current.pause();
        }

        setPlaying(!playerRef.current.paused);
    }

    function toggleMute() {
        playerRef.current.muted = !playerRef.current.muted;

        setMuted(playerRef.current.muted);
    }

    function handleProgress() {
        setProgress((playerRef.current.currentTime * 100 / playerRef.current.duration) + "%");
    }

    function getDuration() {
        if (!playerRef.current || !playerRef.current.duration) {
            return "00:00";
        }

        const duration = Math.round(playerRef.current.duration);
        const min = parseInt(duration / 60).toString();
        const sec = (duration % 60).toString();
        return min.padStart(2, '0') + ":" + sec.padStart(2, '0');
    }

    function onFullscreenClicked() {
        if (playerRef.current.requestFullscreen) {
            playerRef.current.requestFullscreen();
        } else if (playerRef.current.msRequestFullscreen) {
            playerRef.current.msRequestFullscreen();
        } else if (playerRef.current.mozRequestFullScreen) {
            playerRef.current.mozRequestFullScreen();
        } else if (playerRef.current.webkitRequestFullscreen) {
            playerRef.current.webkitRequestFullscreen();
        }
    }

    return (
        <div className={cn(styles.player, className)}>
            <div className={styles.preview}>
                <video
                    id="videoPlayer"
                    className={styles.video}
                    src={src}
                    autoPlay
                    muted
                    loop
                    onTimeUpdate={handleProgress}
                    alt="Video preview"
                    ref={playerRef}
                />
                {controller && playerRef.current &&
                    <div className={styles.control}>
                        <button className={cn(styles.button, styles.play)} onClick={togglePlay}>
                            {playing ?
                                <Icon name="stop" size="24" />
                                :
                                <Icon name="play" size="24" />
                            }
                        </button>
                        <div className={styles.line}>
                            <div className={styles.progress} style={{ width: progress }}></div>
                        </div>
                        <div className={styles.time}>{getDuration()}</div>
                        <button className={styles.button} onClick={toggleMute}>
                            {muted ?
                                <MuteIcon />
                                :
                                <Icon name="volume" size="24" />
                            }
                        </button>
                        <button className={styles.button} onClick={onFullscreenClicked}>
                            <Icon name="full-screen" size="24" />
                        </button>
                    </div>
                }
            </div>
        </div >
    );
};

export default Player;