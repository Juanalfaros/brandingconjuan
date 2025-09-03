// postcss.config.js (ESM)
import postcssImport from 'postcss-import';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const isProd = process.env.NODE_ENV === 'production';

export default {
  plugins: [
    postcssImport(),
    autoprefixer(),
    ...(isProd ? [cssnano({ preset: 'default' })] : [])
  ]
};
