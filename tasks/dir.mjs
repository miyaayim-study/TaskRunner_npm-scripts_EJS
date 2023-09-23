import path from 'path';

const srcBase = './src/';
const distBase = './dist/';

const dir = {
  src: {
    root: srcBase,
    html: path.join(srcBase, 'html/'),
    ejs: path.join(srcBase, 'ejs/'),
    php: path.join(srcBase, 'php/'),
    css: path.join(srcBase, 'css/'),
    sass: path.join(srcBase, 'sass/'),
    js: path.join(srcBase, 'js/'),
    img: path.join(srcBase, 'img/'),
  },
  dist: {
    root: distBase,
    html: distBase,
    php: distBase,
    css: path.join(distBase, 'css/'),
    js: path.join(distBase, 'js/'),
    img: path.join(distBase, 'img/'),
  },
};

export default dir;
