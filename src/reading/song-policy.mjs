const normalize=name=>String(name||'').normalize('NFKC').replace(/[\s·.]/g,'').toLowerCase();
export function isOriginalPerformer(song){return Boolean(song?.artist&&song?.playbackArtist&&normalize(song.artist)===normalize(song.playbackArtist));}
