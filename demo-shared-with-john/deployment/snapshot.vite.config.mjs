import { mergeConfig } from 'vite';
import original from './vite.public.config.ts';

// Deployment-only settings; the source branch remains an exact main snapshot.
const title = 'Demo Shared with John';
const namespace = 'demo-shared-with-john:';
const storageNames = [
  'slander-public-access-v1',
  'slander-role',
  'slander-public-preview-v1',
  'slander-public-viewers-v1',
  'slander-financial-samples-v1',
  'slander-financial-samples-changed',
  'ripple-leaderboard-history-v1',
  'slander-public-media-v1',
  'slander-public-workspace-v1',
];
export default mergeConfig(original, {
  base: '/slander/demo-shared-with-john/',
  plugins: [{
    name: 'frozen-john-demo-deployment',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replaceAll('\\', '/').includes('/src/')) return;
      for (const name of storageNames) {
        code = code.replaceAll(JSON.stringify(name), JSON.stringify(namespace + name));
      }
      code = code.replaceAll(
        'https://github.com/Cooper2Rich/slander/tree/main',
        'https://github.com/Cooper2Rich/slander/tree/codex/demo-shared-with-john',
      );
      code = code.replace(/document\.title\s*=\s*`[^`]*`;/g, 'document.title = ' + JSON.stringify(title) + ';' );
      return { code, map: null };
    },
    transformIndexHtml(html) {
      return html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
    },
  }],
});

