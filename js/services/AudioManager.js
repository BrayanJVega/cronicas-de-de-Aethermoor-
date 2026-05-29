/**
 * AudioManager.js — Service managing game sound effects (SFX) and background music (BGM) utilizing Howler
 */

import { Howl, Howler } from 'howler';

class AudioManager {
  constructor() {
    this.musicVolume = 0.4;
    this.sfxVolume = 0.75;
    this.currentTrackKey = null;
    this.activeTracks = {};
    
    // Sound Assets Bank (Royalty-free public URLs)
    this.bgmUrls = {
      village: 'https://assets.codepen.io/4358584/An+amusing+experience.mp3', // Relaxing town
      forest: 'https://assets.codepen.io/4358584/Forest+Ambience.mp3',       // Forest wind
      cave: 'https://assets.codepen.io/4358584/dark-cave-ambience.mp3',       // Cave echoes
      mountain: 'https://assets.codepen.io/4358584/winter-wind.mp3',          // Storm wind
      castle: 'https://assets.codepen.io/4358584/epic-battle-preview.mp3',    // Castle organ
      combat: 'https://assets.codepen.io/4358584/combat-music.mp3'            // Battle theme
    };

    this.sfxUrls = {
      hover: 'https://assets.codepen.io/4358584/ui_click.mp3',
      click: 'https://assets.codepen.io/4358584/click_confirm.mp3',
      hit: 'https://assets.codepen.io/4358584/sword_slash.mp3',
      magic: 'https://assets.codepen.io/4358584/spell_cast.mp3',
      heal: 'https://assets.codepen.io/4358584/heal_sfx.mp3',
      hurt: 'https://assets.codepen.io/4358584/player_hurt.mp3',
      levelUp: 'https://assets.codepen.io/4358584/level_up.mp3',
      coin: 'https://assets.codepen.io/4358584/coins_shake.mp3',
      quest: 'https://assets.codepen.io/4358584/quest_accept.mp3',
      victory: 'https://assets.codepen.io/4358584/victory_fanfare.mp3',
      defeat: 'https://assets.codepen.io/4358584/game_over.mp3'
    };

    this.sfxCache = {};
  }

  /**
   * Pre-load basic critical UI sounds
   */
  init() {
    // Enable mobile audio unlock automatically
    Howler.unload(); 
    
    // Warm up standard clicks
    this.playSfx('hover', 0); // silent play to unlock Web Audio API
  }

  /**
   * Play background music for a specific region or context
   * @param {string} key
   */
  playBgm(key) {
    if (this.currentTrackKey === key) return;
    
    const url = this.bgmUrls[key];
    if (!url) return;

    // Fade out previous track
    if (this.currentTrackKey && this.activeTracks[this.currentTrackKey]) {
      const prevTrack = this.activeTracks[this.currentTrackKey];
      prevTrack.fade(prevTrack.volume(), 0, 1000);
      setTimeout(() => {
        if (this.currentTrackKey !== key) {
          prevTrack.stop();
        }
      }, 1000);
    }

    // Play or create new track
    this.currentTrackKey = key;
    let track = this.activeTracks[key];

    if (!track) {
      track = new Howl({
        src: [url],
        loop: true,
        html5: true, // Use streaming for larger BGM files
        volume: 0
      });
      this.activeTracks[key] = track;
    }

    track.play();
    track.fade(0, this.musicVolume, 1200);
  }

  /**
   * Stop all music tracks
   */
  stopBgm() {
    if (this.currentTrackKey && this.activeTracks[this.currentTrackKey]) {
      const track = this.activeTracks[this.currentTrackKey];
      track.fade(track.volume(), 0, 800);
      setTimeout(() => track.stop(), 800);
      this.currentTrackKey = null;
    }
  }

  /**
   * Play a sound effect
   * @param {string} key
   * @param {number} [customVolume]
   */
  playSfx(key, customVolume = null) {
    const url = this.sfxUrls[key];
    if (!url) return;

    let sound = this.sfxCache[key];
    if (!sound) {
      sound = new Howl({
        src: [url],
        volume: customVolume !== null ? customVolume : this.sfxVolume
      });
      this.sfxCache[key] = sound;
    } else if (customVolume !== null) {
      sound.volume(customVolume);
    } else {
      sound.volume(this.sfxVolume);
    }

    sound.play();
  }

  /**
   * Set music tracks volume dynamically
   * @param {number} val (0 to 1)
   */
  setMusicVolume(val) {
    this.musicVolume = val;
    if (this.currentTrackKey && this.activeTracks[this.currentTrackKey]) {
      this.activeTracks[this.currentTrackKey].volume(val);
    }
  }

  /**
   * Set SFX volume dynamically
   * @param {number} val (0 to 1)
   */
  setSfxVolume(val) {
    this.sfxVolume = val;
  }
}

export const audioManager = new AudioManager();
