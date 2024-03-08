import path from 'path';

const srcBase = 'src/assets/';
const distBase = 'dist/assets/';

const dir = {
  src: {
    root: path.join('src/'),
    html: path.join(srcBase, 'html/'),
    ejs: path.join(srcBase, 'ejs/'),
    php: path.join(srcBase, 'php/'),
    css: path.join(srcBase, 'css/'),
    sass: path.join(srcBase, 'sass/'),
    js: path.join(srcBase, 'js/'),
    img: path.join(srcBase, 'img/'),
    font: path.join(srcBase, 'font/'),
  },
  dist: {
    root: path.join('dist/'),
    html: path.join('dist/'),
    php: path.join('dist/'),
    css: path.join(distBase, 'css/'),
    js: path.join(distBase, 'js/'),
    img: path.join(distBase, 'img/'),
    font: path.join(distBase, 'font/'),
  },
};

export default dir;
