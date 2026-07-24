/* ============================================================
   The registry — the single list the gallery renders.

   Every plotted piece, in the order it appears on the page. To
   add a whole new section, create a file like collection.js,
   give its pieces a `section` tag, import it here and spread it
   in. The gallery routes each piece to its heading by that tag.
   ============================================================ */
import { COLLECTION } from './collection.js';
import { COMPOSITIONS } from './compositions.js';
import { EDITIONS } from './editions.js';

export const PIECES = [...COLLECTION, ...COMPOSITIONS, ...EDITIONS];

export { SHADERS, GL_HEADER } from './shaders.js';
