import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import contentBuild from './scripts/content-build-plugin.mjs';
import {fileURLToPath} from 'node:url';
export default defineConfig({plugins:[contentBuild(),{
 name:'static-gallery-audio',enforce:'pre',
 resolveId(source,importer){
  if(source==='./reading/playback.mjs'&&importer?.endsWith('/ReadingGallery.jsx')){
   return fileURLToPath(new URL('./src/gallery-playback-local.mjs',import.meta.url));
  }
 },
},react()],build:{rollupOptions:{output:{manualChunks(id){if(/node_modules\/(react|react-dom|scheduler)\//.test(id))return 'react';if(/node_modules\/(gsap|lenis)\//.test(id))return 'motion';}}}}});
