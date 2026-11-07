// Preserve the original gallery and playback implementation. This static-only
// build has no /api/reading-audio resolver; fail quietly through its existing UI.
import {SongPlayback as OriginalPlayback} from './reading/playback.mjs';
import {zh} from './i18n/zh.js';
export class SongPlayback extends OriginalPlayback {
 start(song) {
  this.stop();
  if (this.disposed || !song) return;
  this.song = song;
  this.status = 'unavailable';
  this.message = zh.galleryMusicUnavailable;
  this.notify();
 }
}
